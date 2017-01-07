import _get from 'lodash/get';
import _has from 'lodash/has';
import _head from 'lodash/head';
import _forEach from 'lodash/forEach';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _map from 'lodash/map';
import _random from 'lodash/random';
import _uniq from 'lodash/uniq';
import _without from 'lodash/without';
import BaseModel from '../base/BaseModel';
import { choose } from '../utilities/generalUtilities';

/**
 * An aircraft operating agency
 *
 * Defines aircraft and fleets used by an airline along with methods
 * and rules for flightNumberGeneration.
 *
 * @class AirlineModel
 * @extends BaseModel
 */
export default class AirlineModel extends BaseModel {
    /**
     * @constructor
     * @for AirlineModel
     * @param airlineDefinition {object}
     */
    /* istanbul ignore next */
    constructor(airlineDefinition) {
        super(airlineDefinition);

        if (!_isObject(airlineDefinition) || _isArray(airlineDefinition) || _isEmpty(airlineDefinition)) {
            // eslint-disable-next-line max-len
            throw new TypeError(`Invalid airlineDefinition received by AirlineModel. Expected an object but received ${typeof airlineDefinition}`);
        }

        /**
         * ICAO airline designation
         *
         * @property icao
         * @type {string}
         */
        this.icao = airlineDefinition.icao;

        /**
         * Agency name
         *
         * @property name
         * @type {string}
         */
        this.name = _get(airlineDefinition, 'name', 'Default airline');

        /**
         * Radio callsign
         *
         * @property callsign
         * @type {string}
         * @default 'Default'
         */
        this.callsign = 'Default';

        /**
         * Parameters for flight number generation
         *
         * @property flightNumberGeneration
         * @type {Object}
         */
        this.flightNumberGeneration = {
            /**
             * Length of callsign
             *
             * @memberof flightNumberGeneration
             * @property length
             * @type {number}
             * @default 3
             */
            length: 3,

            /**
             * Whether to use alphabetical characters
             *
             * @memberof flightNumberGeneration
             * @property alpha
             * @type {boolean}
             * @default false
             */
            alpha: false
        };

        /**
         * Named weighted sets of aircraft
         *
         * @property fleets
         * @type {Object}
         */
        this.fleets = {
            /**
             * @property default
             * @type {array}
             * @default []
             */
            default: []
        };

        // TODO: need better name
        /**
         * List of all flight numbers in use in the app
         *
         * @property flightNumbersInUse
         * @type {array}
         * @default []
         */
        this.flightNumbersInUse = [];

        this.init(airlineDefinition);
    }

    /**
     * A unique list of all aircraft in all fleets belonging to this airline
     *
     * @property aircraftList
     * @return {array<string>}
     */
    get aircraftList() {
        const aircraft = [];

        _forEach(this.fleets, (fleet) => {
            const fleetAircraft = _map(fleet, (aircraft) => _head(aircraft));

            aircraft.push(...fleetAircraft);
        });

        return _uniq(aircraft);
    }

    /**
     * List of all `flightNumbersInUse`
     *
     * Used when generating new flightNumbers to verify a new
     * number isn't already in use
     *
     * @property flightNumbers
     * @return {array<string>}
     */
    get flightNumbers() {
        return this.flightNumbersInUse;
    }

    /**
     * Lifecycle method
     *
     * Should run only once on instantiation
     *
     * @for AirlineModel
     * @method init
     * @param airlineDefinition {object}
     */
    init(airlineDefinition) {
        this.icao = _get(airlineDefinition, 'icao', this.icao);
        this.callsign = _get(airlineDefinition, 'callsign.name', this.callsign);
        this.flightNumberGeneration.length = _get(airlineDefinition, 'callsign.length');
        this.flightNumberGeneration.alpha = _get(airlineDefinition, 'callsign.alpha', false);
        this.fleets = _get(airlineDefinition, 'fleets');

        // This may not be needed
        // if (airlineDefinition.aircraft) {
        //     this.fleets.default = airlineDefinition.aircraft;
        // }

        this._transformFleetNamesToLowerCase();
    }

    /**
     * Remove a given flight number from the `flightNumbersInUse` list
     *
     * @for AirlineModel
     * @method removeFlightNumber
     * @param flightNumber {string}
     */
    removeFlightNumber(flightNumber) {
        this._removeFlightNumberFromUse(flightNumber);
    }

    /**
     * Resets the current list of `flightNumbersInUse`.
     *
     * This can be used when changing airports and all existing
     * aircraft are removed.
     *
     * @for AirlineModel
     * @method reset
     */
    reset() {
        this.flightNumbersInUse = [];
    }

    /**
     * @method getRandomAircraftType
     * @param fleet {string}
     * @return {string}
     */
    getRandomAircraftType(fleet = '') {
        if (fleet === '') {
            return this._getRandomAircraftTypeFromAllFleets();
        }

        return this._getRandomAircraftTypeFromFleet(fleet);
    }

    // TODO: the logic here can be simplified.
    /**
     * Create a flight number/identifier
     *
     * This method should only be called from the `AircraftController` so the controller
     * can gurantee unique `flightNumbers` across all `AirlineModels`.
     *
     * @for AirlineModel
     * @method generateFlightNumber
     * @return flightNumber {string}
     */
    generateFlightNumber() {
        let flightNumber = '';
        let list = '0123456789';

        // Start with a number other than zero
        flightNumber += choose(list.substr(1));

        if (this.flightNumberGeneration.alpha) {
            // TODO: why `this.flightNumberGeneration.length - 3`?  enumerate the magic number.
            for (let i = 0; i < this.flightNumberGeneration.length - 3; i++) {
                flightNumber += choose(list);
            }

            list = 'abcdefghijklmnopqrstuvwxyz';

            for (let i = 0; i < 2; i++) {
                flightNumber += choose(list);
            }
        } else {
            for (let i = 1; i < this.flightNumberGeneration.length; i++) {
                flightNumber += choose(list);
            }
        }

        return flightNumber;
    }

    /**
     * Returns a random aircraft type from any fleet that belongs to this airline
     *
     * Used when a new aircraft spwans with a defined airline, but no defined aircraft type
     *
     * @for AirlineCollection
     * @method _getRandomAircraftTypeFromAllFleets
     * @return {AirlineModel}
     */
    _getRandomAircraftTypeFromAllFleets() {
        const index = _random(0, this.aircraftList.length - 1);

        return this.aircraftList[index];
    }

    // TODO: this returns a random, and not weighted, result
    /**
     * Return a random aircraft type from within a specific fleet
     *
     * @for AirlineModel
     * @method _getRandomAircraftTypeFromFleet
     * @param fleetName {string}
     * @return {string}
     */
    _getRandomAircraftTypeFromFleet(fleetName) {
        // if we want to be uber defensive here we would lowercase the `fleetName` param
        if (!this._hasFleet(fleetName)) {
            // eslint-disable-next-line max-len
            throw new Error(`Invalid fleetName passed to AirlineModel. ${fleetName} is not a fleet defined in ${this.icao}`);
        }

        const fleet = this.fleets[fleetName];
        const index = _random(0, fleet.length - 1);

        // entries in `fleets[fleetName]` are of the shape `[TYPE, WEIGHT]` we only need the type here
        return _head(fleet[index]);
    }

    // TODO: need better name
    /**
     *
     *
     */
    addFlightNumberToInUse(flightNumber) {
        this.flightNumbersInUse.push(flightNumber);
    }

    // TODO: need better name
    /**
     *
     *
     */
    _removeFlightNumberFromUse(flightNumber) {
        if (!this._hasFlightNumber(flightNumber)) {
            // TODO: check that the number is there first
            // throw or console.error?
            return;
        }

        this.flightNumbersInUse = _without(this.flightNumbersInUse, flightNumber);
    }

    /**
     * Boolean abstraction used to determine if a fleetName is present within
     * this instances `fleets` object.
     *
     * @for AirlineModel
     * @method _hasFleet
     * @param fleetName {string}
     * @return {boolean}
     */
    _hasFleet(fleetName) {
        return _has(this.fleets, fleetName);
    }

    /**
     *
     *
     * @for AirlineModel
     * @method _hasFlightNumber
     * @param flightNumber {number|string}
     * @return {boolean}
     */
    _hasFlightNumber(flightNumber) {
        const invalidIndex = -1;

        return this.flightNumbersInUse.indexOf(flightNumber) !== invalidIndex;
    }

    /**
     * Loop through each aircraft in each fleet defined in the airline and make sure it is defined in lowercase
     *
     * @for AirlineCollection
     * @method _transformFleetNamesToLowerCase
     * @private
     */
    _transformFleetNamesToLowerCase() {
        _forEach(this.fleets, (fleet) => {
            _forEach(fleet, (aircraftInFleet) => {
                const NAME_INDEX = 0;
                aircraftInFleet[NAME_INDEX] = aircraftInFleet[NAME_INDEX].toLowerCase();
            });
        });
    }
}
