import _get from 'lodash/get';
import _head from 'lodash/head';
import _forEach from 'lodash/forEach';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _map from 'lodash/map';
import _random from 'lodash/random';
import _uniq from 'lodash/uniq';
import BaseModel from '../base/BaseModel';

/**
 * An aircrcraft operating agency
 *
 * @class AirlineModel
 * @extends BaseModel
 */
export default class AirlineModel extends BaseModel {
    /**
     * Create new airline
     *
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

        /**
         *
         *
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
     * Returns a random aircraft type from any fleet that belongs to this airline
     *
     * Used when a new aircraft spwans with a defined airline, but no defined aircraft type
     *
     * @for AirlineCollection
     * @method getRandomAircraftTypeFromAllFleets
     * @return {AirlineModel}
     */
    getRandomAircraftTypeFromAllFleets() {
        const index = _random(0, this.aircraftList.length - 1);

        return this.aircraftList[index];
    }

    /**
     *
     *
     */
    generateFlightNumber() {

    }

    /**
     *
     *
     */
    _isFlightNumberInUse(flightNumber) {

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
