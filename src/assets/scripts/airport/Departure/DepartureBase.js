/* eslint-disable no-underscore-dangle, no-mixed-operators, func-names, object-shorthand, no-undef */
import $ from 'jquery';
import _random from 'lodash/random';
import { choose, choose_weight } from '../../utilities/generalUtilities';

/**
 * Generate departures at random, averaging the specified spawn rate
 *
 * @class DepartureBase
 */
export default class DepartureBase {
    /**
     * Initialize member variables with default values
     */
    constructor(airport, options) {
        this.airlines = [];
        this.airport = airport;
        this.destinations = [0];
        this.frequency = 0;
        this.timeout = null;

        this.parse(options);
    }

    /**
     * Departure Stream Settings
     *
     * @param {array of array} airlines - List of airlines with weight for each
     * @param {integer} frequency - Spawn rate, in aircraft per hour (acph)
     * @param {array of string} destinations - List of SIDs or departure fixes for departures
     */
    parse(options) {
        const params = ['airlines', 'destinations', 'frequency'];

        for (const i in params) {
            if (options[params[i]]) {
                this[params[i]] = options[params[i]];
            }
        }

        // TODO: the airlineController should be able to supply the airline name without having the caller do
        // the splitting. any splits should happen in the airlineController or the data should be stored in a way
        // that doesn't require splitting.
        // Pre-load the airlines
        $.each(this.airlines, (i, data) => {
            window.airlineController.airline_get(data[0].split('/')[0]);
        });
    }

    /**
     * Stop this departure stream
     */
    stop() {
        if (this.timeout) {
            window.gameController.game_clear_timeout(this.timeout);
        }
    }

    /**
     * Start this departure stream
     */
    start() {
        const r = Math.floor(_random(2, 5.99));

        for (let i = 1; i <= r; i++) {
            // spawn 2-5 departures to start with
            this.spawnAircraft(false);
        }

        const minFrequency = this.frequency * 0.5;
        const maxFrequency = this.frequency * 1.5;
        const randomNumberForTimeout = _random(minFrequency, maxFrequency);

        // start spawning loop
        this.timeout = window.gameController.game_timeout(this.spawnAircraft, randomNumberForTimeout, this, true);
    }

    /**
     * Spawn a new aircraft
     */
    spawnAircraft(timeout) {
        let fleet;
        const message = (window.gameController.game_time() - this.start >= 2);
        let airline = choose_weight(this.airlines);

        if (airline.indexOf('/') > -1) {
            // TODO: enumerate the magic numbers
            // TODO: I see a lot of splitting on '/', why? this should be a helper function since its used so much.
            fleet = airline.split('/', 2)[1];
            airline = airline.split('/', 2)[0];
        }

        window.aircraftController.aircraft_new({
            airline,
            fleet,
            message,
            category: 'departure',
            destination: choose(this.destinations)
        });

        if (timeout) {
            this.timeout = window.gameController.game_timeout(this.spawnAircraft,
            this.nextInterval(), this, true);
        }
    }

    /**
     * Determine delay until next spawn
     */
    nextInterval() {
        // fastest possible between back-to-back departures, in seconds
        const min_interval = 5;
        const tgt_interval = 3600 / this.frequency;
        const max_interval = tgt_interval + (tgt_interval - min_interval);

        return _random(min_interval, max_interval);
    }
}
