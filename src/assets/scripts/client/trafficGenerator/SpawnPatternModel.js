import _forEach from 'lodash/forEach';
import _map from 'lodash/map';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _random from 'lodash/random';
import BaseModel from '../base/BaseModel';
import RouteModel from '../airport/Route/RouteModel';
import { bearingToPoint } from '../math/flightMath';
import { AIRPORT_CONSTANTS } from '../constants/airportConstants';
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
     * @param navigationLibrary {NavigationLibrary}
     */
    /* istanbul ignore next */
    constructor(spawnPatternJson, navigationLibrary) {
        super(spawnPatternJson, navigationLibrary);

        if (!_isObject(spawnPatternJson) || _isEmpty(spawnPatternJson)) {
            // throw new TypeError('Invalid parameter passed to SpawnPatternModel');
            return;
        }

        if (!_isObject(navigationLibrary) || _isEmpty(navigationLibrary)) {
            throw new TypeError('Invalid NavigationLibrary passed to SpawnPatternModel');
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

        /**
         * Lowest altitude an aircraft can spawn at
         *
         * @property _minimumAltitude
         * @type {number}
         * @default -1
         * @private
         */
        this._minimumAltitude = -1;

        /**
         * Highest altitude an aircraft can spawn at
         *
         * @property _maximumAltitude
         * @type {number}
         * @default -1
         * @private
         */
        this._maximumAltitude = -1;

        /**
         * Speed of spawning aircraft
         *
         * @property speed
         * @type {number}
         * @default 0
         */
        this.speed = 0;

        /**
         * Heading of a spawnning aircraft
         *
         * @property heading
         * @type {number}
         * @default -1
         */
        this.heading = -1;

        /**
         *
         *
         * @property position
         * @type {array}
         * @default []
         */
        this.position = [];

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

        this.init(spawnPatternJson, navigationLibrary);
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
     * A number representing the initial altitude of a spawning aircraft
     *
     * @property altitude
     * @return {number}
     */
    get altitude() {
        // this might not need to be random within a range
        return _random(this._minimumAltitude, this._maximumAltitude);
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * Set up the instance properties
     *
     * @for SpawnPatternModel
     * @method init
     * @param spawnPatternJson {object}
     * @param navigationLibrary {NavigationLibrary}
     */
    init(spawnPatternJson, navigationLibrary) {
        this.origin = spawnPatternJson.origin;
        this.destination = spawnPatternJson.destination;
        this.category = spawnPatternJson.category;
        this.method = spawnPatternJson.method;
        this.rate = spawnPatternJson.rate;
        this.route = spawnPatternJson.route;
        this.speed = this._extractSpeedFromJson(spawnPatternJson);
        this._minimumDelay = this._calculateMinimumDelayFromSpeed();
        this._maximumDelay = this._calculateMaximumDelayFromRate();
        this.airlines = this._assembleAirlineNamesAndFrequencyForSpawn(spawnPatternJson.airlines);
        this._weightedAirlineList = this._buildWeightedAirlineList();

        this._calculatePositionAndHeadingForArrival(spawnPatternJson, navigationLibrary);
        this._setMinMaxAltitude(spawnPatternJson.altitude);
    }

    /**
     * Destroy the current instance properties
     *
     * Useful when changing airports
     *
     * @for SpawnPatternModel
     * @method destroy
     */
    destroy() {
        this.scheduleId = -1;
        this.category = '';
        this.method = '';
        this.origin = '';
        this.destination = '';
        this.route = '';
        this.rate = -1;
        this._maximumDelay = -1;
        this._minimumDelay = -1;
        this._minimumAltitude = -1;
        this._maximumAltitude = -1;
        this.speed = 0;
        this.heading = -1;
        this.position = [];
        this.airlines = [];
        this._weightedAirlineList = [];
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
        // TODO: make this method a fascade by implementing a switch to handle #method variations with other class methods
        let targetDelayPeriod = this._maximumDelay;

        if (targetDelayPeriod < this._minimumDelay) {
            targetDelayPeriod = this._minimumDelay;
        }

        const maxDelayPeriod = targetDelayPeriod + (targetDelayPeriod - this._minimumDelay);

        return _random(this._minimumDelay, maxDelayPeriod);
    }

    /**
     * Sets #_minimumAltitude and #_maximumAltitude from a provided altitude.
     *
     * Altitude may be a single number or a range, expressed as: `[min, max]`.
     * This method handles that variation and sets the class properties with
     * the correct values.
     *
     * @for SpawnPatternModel
     * @method _setMinMaxAltitude
     * @param altitude {array|number}
     */
    _setMinMaxAltitude(altitude) {
        if (_isArray(altitude)) {
            const [min, max] = altitude;

            this._minimumAltitude = min;
            this._maximumAltitude = max;

            return;
        }

        this._minimumAltitude = altitude;
        this._maximumAltitude = altitude;
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
     * @for SpawnPatternModel
     * @method _calculateMinimumDelayFromSpeed
     * @return {number}
     * @private
     */
    _calculateMinimumDelayFromSpeed() {
        if (this.speed === 0) {
            return 0;
        }

        return Math.floor(AIRPORT_CONSTANTS.MIN_ENTRAIL_DISTANCE_NM * (TIME.ONE_HOUR_IN_SECONDS / this.speed));
    }

    /**
     * Calculates the upper bound of the spawn delay value.
     *
     * @for SpawnPatternModel
     * @method _calculateMaximumDelayFromRate
     * @return {number}
     * @private
     */
    _calculateMaximumDelayFromRate() {
        return Math.floor(TIME.ONE_HOUR_IN_SECONDS / this.rate);
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
     * When `speed` is null, return 0 otherwise the specified speed setting
     *
     * @for SpawnPatternModel
     * @method _extractSpeedFromJson
     * @param spawnPatternJson {object}
     * @return {number}
     */
    _extractSpeedFromJson(spawnPatternJson) {
        if (!spawnPatternJson.speed) {
            return 0;
        }

        return spawnPatternJson.speed;
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

    /**
     * Calculate the initial heading and position for a spawning arrival.
     *
     * Sets `position` and `heading` properties.
     *
     * @for SpawnPatternModel
     * @method _calculatePositionAndHeadingForArrival
     * @param spawnPatternJson {SpawnPatternModel}
     * @param navigationLibrary {NavigationLibrary}
     * @private
     */
    _calculatePositionAndHeadingForArrival(spawnPatternJson, navigationLibrary) {
        if (spawnPatternJson.category === FLIGHT_CATEGORY.DEPARTURE) {
            return;
        }

        // TODO: this if black may not be needed if we will be requiring a route string for every spawn pattern
        // if (_get(spawnPatternJson, 'fixes', []).length > 1) {
        //     const initialPosition = navigationLibrary.getFixPositionCoordinates(spawnPatternJson.fixes[0]);
        //     const nextPosition = navigationLibrary.getFixPositionCoordinates(spawnPatternJson.fixes[1]);
        //     const heading = bearingToPoint(initialPosition, nextPosition);
        //
        //     this.position = initialPosition;
        //     this.heading = heading;
        //
        //     return;
        // }

        const routeModel = new RouteModel(spawnPatternJson.route);
        const waypointModelList = navigationLibrary.findEntryAndBodyFixesForRoute(
            routeModel.procedure,
            routeModel.entry
        );

        // grab position of first fix
        const initialPosition = waypointModelList[0].position;
        // calculate heading from first waypoint to second waypoint
        const heading = bearingToPoint(initialPosition, waypointModelList[1].position);

        this.position = initialPosition;
        this.heading = heading;
    }
}
