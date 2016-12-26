import _get from 'lodash/get';
import _head from 'lodash/head';
import _forEach from 'lodash/forEach';
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
    constructor(airlineDefinition) {
        super(airlineDefinition);

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
             * @property length
             * @type {number}
             * @default 3
             */
            length: 3,

            /**
             * Whether to use alphabetical characters
             *
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

        this.init(airlineDefinition);
    }

    /**
     *
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
     * Initialize object from data
     *
     * This method will be called twice at minimum; once on instantiation and again once
     * `onLoadSuccess`. Most of the properties below will only be available `onLoadSuccess`
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

        if (airlineDefinition.aircraft) {
            this.fleets.default = airlineDefinition.aircraft;
        }

        this._transformFleetNamesToLowerCase();
    }

    /**
     *
     *
     * @for AirlineCollection
     * @method getRandomAircraftTypeFromFleet
     * @return {AirlineModel}
     */
    getRandomAircraftTypeFromFleet() {
        const index = _random(0, this.aircraftList.length - 1);

        return this.aircraftList[index];
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
