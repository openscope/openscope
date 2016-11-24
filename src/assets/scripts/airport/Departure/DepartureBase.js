import _get from 'lodash/get';
import _random from 'lodash/random';
import RouteModel from '../Route/RouteModel';
import {
    airlineNameAndFleetHelper,
    randomAirlineSelectionHelper
} from '../../airline/randomAirlineSelectionHelper';
import { choose } from '../../utilities/generalUtilities';
import { FLIGHT_CATEGORY } from '../../constants/aircraftConstants';
import { TIME } from '../../constants/globalConstants';

/**
 * Generate departures at random, averaging the specified spawn rate
 *
 * @class DepartureBase
 */
export default class DepartureBase {
    /**
     * @for DepartureBase
     * @constructor
     * @param airport {AirportInstanceModel}
     * @param options {object}
     */
    constructor(airport, options) {
        /**
         * List of airlines with weight for each
         *
         * @property airlines
         * @type {array}
         * @default []
         */
        this.airlines = [];

        /**
         * @property airport
         * @type {AirportInstanceModel}
         */
        this.airport = airport;

        // TODO: are we initializing an array with a value here?
        /**
         * List of SIDs or departure fix names
         *
         * @property destinations
         * @type {array}
         * @default [0]
         */
        this.destinations = [0];

        /**
         * Spawn rate, in aircraft per hour (acph)
         *
         * @property frequency
         * @type {number}
         * @default 0
         */
        this.frequency = 0;

        /**
         * @property timeout
         * @type {function}
         * @default null
         */
        this.timeout = null;

        /**
         * @property activeRouteModel
         * @type {RouteModel}
         * @default null
         */
        this.activeRouteModel = null;

        this.parse(options);
    }

    /**
     * Departure Stream Settings
     *
     * @for DepartureBase
     * @method parse
     */
    parse(options) {
        this.airlines = _get(options, 'airlines', this.airlines);
        this.destinations = _get(options, 'destinations', this.destinations);
        this.frequency = _get(options, 'frequency', this.frequency);

        for (let i = 0; i < this.airlines.lenth; i++) {
            const airline = this.airlines[i];
            // reassigns `airline.name` to `airlineName` for readability
            const { name: airlineName } = airlineNameAndFleetHelper(airline);

            window.airlineController.airline_get(airlineName);
        }
    }

    /**
     * Stop this departure stream
     *
     * @for DepartureBase
     * @method stop
     */
    stop() {
        if (this.timeout) {
            window.gameController.game_clear_timeout(this.timeout);
        }
    }

    /**
     * Start this departure stream
     *
     * @for DepartureBase
     * @method start
     */
    start() {
        const randomSpawnCount = Math.floor(_random(2, 5.99));

        for (let i = 1; i <= randomSpawnCount; i++) {
            // spawn 2-5 departures to start with
            this.spawnAircraft(false);
        }

        this.initiateSpawningLoop();
    }

    /**
     * @for DepartureBase
     * @method initiateSpawningLoop
     */
    initiateSpawningLoop() {
        const minFrequency = this.frequency * 0.5;
        const maxFrequency = this.frequency * 1.5;
        const randomNumberForTimeout = _random(minFrequency, maxFrequency);

        // start spawning loop
        this.timeout = window.gameController.game_timeout(this.spawnAircraft, randomNumberForTimeout, this, true);
    }

    /**
     * Spawn a new aircraft
     *
     * @for DepartureBase
     * @method spawnAircraft
     */
    spawnAircraft(timeout) {
        const message = (window.gameController.game_time() - this.start >= 2);
        const airline = randomAirlineSelectionHelper(this.airlines);
        const aircraftToAdd = {
            message,
            airline: airline.name,
            fleet: airline.fleet,
            category: FLIGHT_CATEGORY.DEPARTURE,
            destination: choose(this.destinations)
        };

        window.aircraftController.aircraft_new(aircraftToAdd);

        if (timeout) {
            this.timeout = window.gameController.game_timeout(
                this.spawnAircraft,
                this.nextInterval(),
                this,
                true
            );
        }
    }

    /**
     * Determine delay until next spawn
     *
     * @for DepartureBase
     * @method nextInterval
     * @return {number}
     */
    nextInterval() {
        // fastest possible between back-to-back departures, in seconds
        const min_interval = 5;
        const tgt_interval = TIME.ONE_HOUR_IN_SECONDS / this.frequency;
        const max_interval = tgt_interval + (tgt_interval - min_interval);

        return _random(min_interval, max_interval);
    }
}
