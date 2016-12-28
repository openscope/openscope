import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _map from 'lodash/map';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _random from 'lodash/random';
import BaseModel from '../base/BaseModel';
import { FLIGHT_CATEGORY } from '../constants/aircraftConstants';
import { TIME } from '../constants/globalConstants';

/**
 * Defines a spawn pattern for a specific route within the area
 *
 * This can be for departures or arrivals. Provides a starting point and definition
 * for all spawning aircraft
 *
 * @class SpawnPatternModel
 * @extends BaseModel
 */
export default class SpawnPatternModel extends BaseModel {
    /**
     * @constructor
     * @for SpawnPatternModel
     * @param category {string}  one of either 'arrival' or 'departure'
     * @param spawnPatternJson {object}
     */
    /* istanbul ignore next */
    constructor(category, spawnPatternJson) {
        super(category, spawnPatternJson);

        if (!this._isValidCategory(category) || !_isObject(spawnPatternJson) || _isEmpty(spawnPatternJson)) {
            throw new TypeError('Invalid parameter passed to SpawnPatternModel');
        }

        /**
         * Interval id
         *
         * Stored here so a specific interval can be associated with a
         * specfic `SpawnPatternModel` instance. An Interval may be reset
         * or changed during the life of the app.
         *
         * Provides easy access to a specif interval id
         *
         * @property scheduleId
         * @type {number}
         * @default -1
         */
        this.scheduleId = -1;

        /**
         * One of `FLIGHT_CATEGORY`
         *
         * @property category
         * @type {string}
         * @default category
         */
        this.category = category;

        /**
         * Type of arrival or departure pattern
         *
         * Could be `random`, `cyclic`. `surge` or `wave`
         *
         * @property type
         * @type {string}
         * @default ''
         */
        this.type = '';

        /**
         * String representation of a `StandardRoute`
         *
         * @property route
         * @type {string}
         * @default
         */
        this.route = '';

        /**
         * Rate at which to spawn new aircaft
         *
         * @property frequency
         * @type {number}
         * @default -1
         */
        this.frequency = -1;

        /**
         * Calculated milisecond delay from `frequency`.
         *
         * Is used as the upper bound when getting a random delay value.
         *
         * This value does not take game speed (timewarp) into effect, thus
         * this value may need to be translated by the class or method using it.
         *
         * @property _maximumDelay
         * @type {number}
         * @default -1
         * @private
         */
        this._maximumDelay = -1;

        // TODO: this is currently an internal property but could be defined in
        //       the `spawnPattern` section of airport.json
        /**
         * Minimum milisecond elay between spawn.
         *
         * Is used as the lower bound when getting a random delay value.
         *
         * @property _minimumDelay
         * @type {number}
         * @default -1
         * @private
         */
        this._minimumDelay = -1;

        // TODO: this will need to accept a [min, max] altitude
        /**
         * Altitude to spawn at
         *
         * Only aplicable to arrivals
         *
         * @property altitude
         * @type {number}
         * @default 0
         */
        this.altitude = 0;

        /**
         * Speed of spawning aircraft
         *
         * @property speed
         * @type {number}
         * @default 0
         */
        this.speed = 0;

        /**
         * List of possible destinations
         *
         * Used only for departures
         *
         * @property destinations
         * @type {array}
         * @default []
         */
        this.destinations = [];

        /**
         * List of possible airlines a spawning aircraft can belong to.
         *
         * @property airlines
         * @type {array}
         * @default []
         */
        this.airlines = [];

        /**
         * List of airlines enumerated by weight
         *
         * In english, if the value of `this.airlines` was:
         * ```
         * [
         *     ['aal', 5],
         *     ['ual', 2]
         * ]
         * ```
         * This property would have a length of 7, with 5 entires of `aal` and two entries of `ual`.
         * The reason for this is to provide an easy way to find a weighted value. Now all we need is
         * a random index and the value located at that index.
         *
         * @property _weightedAirlineList
         * @type {array}
         * @default []
         */
        this._weightedAirlineList = [];

        this.init(spawnPatternJson);
    }

    /**
     * List of airline icaos for this spawnPattern
     *
     * @property airlineList
     * @return {array<string>}
     */
    get airlineList() {
        return _map(this.airlines, (airline) => airline.name);
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * Set up the instance properties
     *
     * @for SpawnPatternModel
     * @method init
     * @param spawnPatternJson {object}
     */
    init(spawnPatternJson) {
        this.type = _get(spawnPatternJson, 'type', this.type);
        this.route = _get(spawnPatternJson, 'route', this.route);
        this.frequency = _get(spawnPatternJson, 'frequency', this.frequency);
        this.altitude = _get(spawnPatternJson, 'altitude', this.altitude);
        this.speed = _get(spawnPatternJson, 'speed', this.speed);
        this.destinations = _get(spawnPatternJson, 'destinations', this.destinations);
        this._maximumDelay = this._calculateMaximumMsDelayFromFrequency();
        this._minimumDelay = TIME.ONE_SECOND_IN_MILLISECONDS * 3
        this.delay = this.getRandomDelayValue();
        this.airlines = this._assembleAirlineNamesAndFrequencyForSpawn(spawnPatternJson.airlines);
        this._weightedAirlineList = this._buildWeightedAirlineList();
    }

    /**
     * Return a random value from `_weightedAirlineList`
     *
     * Used for spawning arrival aircraft that do not yet have an assigned airline
     *
     * @for SpawnPatternModel
     * @method getRandomAirlineForSpawn
     * @return {string}
     */
    getRandomAirlineForSpawn() {
        const index = this._findRandomIndexForList(this.airlines);
        const airlineId = this._weightedAirlineList[index];

        return airlineId;
    }

    /**
     * Return a random destination from `destinations`
     *
     * Used for spawning departure aircraft that do not yet have an assigned destination
     *
     * @for SpawnPatternModel
     * @method getRandomDestinationForDeparture
     * @return {string}
     */
    getRandomDestinationForDeparture() {
        const index = this._findRandomIndexForList(this.destinations);
        const destination = this.destinations[index];

        return destination;
    }

    /**
     * Returns a random whole number between the allowed min and max delay.
     *
     * This is the value that will be used by the `SpawnScheduler` when
     * when creating a new spawn interval.
     *
     * @for SpawnPatternModel
     * @method getRandomDelayValue
     * @return randomDelayValue {number}
     */
    getRandomDelayValue() {
        const randomDelayValue = _random(this._minimumDelay, this._maximumDelay);

        // we round down because math may result in fractional numbers
        return Math.floor(randomDelayValue);
    }

    /**
     * Abstracted boolean logic used to determine if a category is valid.
     *
     * @for SpawnPatternModel
     * @method _isValidCategory
     * @param _isValidCategory {string}
     * @return {boolean}
     * @private
     */
    _isValidCategory(category) {
        return category === FLIGHT_CATEGORY.DEPARTURE || category === FLIGHT_CATEGORY.ARRIVAL;
    }

    /**
     * Calculates the upper bound of the spawn delay value.
     *
     * @for SpawnPatternModel
     * @method _calculateMaximumMsDelayFromFrequency
     * @return {number}
     * @private
     */
    _calculateMaximumMsDelayFromFrequency() {
        return TIME.ONE_HOUR_IN_MILLISECONDS / this.frequency;
    }

    /**
     * Returns a random index number for an array
     *
     * @for SpawnPatternModel
     * @method _findRandomIndexForList
     * @param list {array}
     * @return {number}
     * @private
     */
    _findRandomIndexForList(list) {
        return _random(0, list.length);
    }

    /**
     * Loops through defined airlines for the spawn pattern and transforms them from array values
     * to an object with meaningful keys.
     *
     * The result is used internally to build the `weightedAirlineList`.
     *
     * In the future the assebmled object could, itself, be a defined model object
     *
     * @for SpawnPatternModel
     * @method _assembleAirlineNamesAndFrequencyForSpawn
     * @param spawnPatternAirlines {array<array>}
     * @return {array<object>}
     * @private
     */
    _assembleAirlineNamesAndFrequencyForSpawn(spawnPatternAirlines) {
        const spawnPatternAirlineModels = _map(spawnPatternAirlines, (spawnPatternAirline) => ({
            name: spawnPatternAirline[0],
            frequency: spawnPatternAirline[1]
        }));

        return spawnPatternAirlineModels;
    }

    /**
     * Build the values for `_weightedAirlineList`
     *
     * see doc block for `_weightedAirlineList` property for more information
     * about what this method produces and why
     *
     * @for SpawnPatternModel
     * @method _buildWeightedAirlineList
     * @return {array<string>}
     * @private
     */
    _buildWeightedAirlineList() {
        const weightedAirlineList = [];

        _forEach(this.airlines, (airline) => {
            for (let i = 0; i < airline.frequency; i++) {
                weightedAirlineList.push(airline.name);
            }
        });

        return weightedAirlineList;
    }
}
