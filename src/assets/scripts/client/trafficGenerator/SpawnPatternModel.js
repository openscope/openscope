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
     * @param spawnPatternJson {object}
     */
    /* istanbul ignore next */
    constructor(spawnPatternJson) {
        super(spawnPatternJson);

        if (!_isObject(spawnPatternJson) || _isEmpty(spawnPatternJson)) {
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
         * @default ''
         */
        this.category = '';

        /**
         * Type of arrival or departure pattern
         *
         * Could be `random`, `cyclic`. `surge` or `wave`
         *
         * @property type
         * @type {string}
         * @default ''
         */
        this.method = '';

        /**
         *
         *
         * @property origin
         * @type {string}
         * @default ''
         */
        this.origin = '';

        /**
         *
         *
         * @property destination
         * @type {string}
         * @default ''
         */
        this.destination = '';

        /**
         * String representation of a `StandardRoute`
         *
         * @property route
         * @type {string}
         * @default
         */
        this.route = '';

        /**
         * Rate at which aircaft spawn, express in aircraft per hour
         *
         * @property rate
         * @type {number}
         * @default -1
         */
        this.rate = -1;

        /**
         * Calculated milisecond delay from `rate`.
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
         *
         *
         * @property radial
         * @type {number}
         * @default -1
         */
        this.radial = -1;

        /**
         *
         *
         * @property heading
         * @type {number}
         * @default -1
         */
        this.heading = -1;

        /**
         * List of possible airlines a spawning aircraft can belong to.
         *
         * @property airlines
         * @type {array<string>}
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
        this.origin = spawnPatternJson.origin;
        this.destination = spawnPatternJson.destination;
        this.category = spawnPatternJson.category;
        this.method = spawnPatternJson.method;
        this.rate = spawnPatternJson.rate;
        this.route = spawnPatternJson.route;
        this.speed = parseInt(spawnPatternJson.speed, 10);

        this._minimumDelay = TIME.ONE_SECOND_IN_MILLISECONDS * 3;
        this._maximumDelay = this._calculateMaximumMsDelayFromFrequency();
        this.delay = this.getRandomDelayValue();
        // TODO: this may need to be a method that randomizes altitude within a range
        this.altitude = _get(spawnPatternJson, 'altitude', this.altitude);
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
        return TIME.ONE_HOUR_IN_MILLISECONDS / this.rate;
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
        return _random(0, list.length - 1);
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
            rate: spawnPatternAirline[1]
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
            for (let i = 0; i < airline.rate; i++) {
                weightedAirlineList.push(airline.name);
            }
        });

        return weightedAirlineList;
    }
}
