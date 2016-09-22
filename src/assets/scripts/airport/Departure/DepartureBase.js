/* eslint-disable no-underscore-dangle, no-mixed-operators, func-names, object-shorthand */
import $ from 'jquery';

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

        // Pre-load the airlines
        $.each(this.airlines, (i, data) => {
            airline_get(data[0].split('/')[0]);
        });
    }

    /**
     * Stop this departure stream
     */
    stop() {
        if (this.timeout) {
            game_clear_timeout(this.timeout);
        }
    }

    /**
     * Start this departure stream
     */
    start() {
        const r = Math.floor(random(2, 5.99));

        for (let i = 1; i <= r; i++) {
            // spawn 2-5 departures to start with
            this.spawnAircraft(false);
        }

        // TODO: enumerate the magic numbers
        // start spawning loop
        this.timeout = game_timeout(this.spawnAircraft, random(this.frequency * 0.5, this.frequency * 1.5), this, true);
    }

    /**
     * Spawn a new aircraft
     */
    spawnAircraft(timeout) {
        const message = (game_time() - this.start >= 2);
        let airline = choose_weight(this.airlines);
        let fleet;

        if (airline.indexOf('/') > -1) {
            // TODO: enumerate the magic numbers
            // TODO: I see a lot of splitting on '/', why? this should be a helper function since its used so much.
            fleet = airline.split('/', 2)[1];
            airline = airline.split('/', 2)[0];
        }

        aircraft_new({
            airline,
            fleet,
            message,
            category: 'departure',
            destination: choose(this.destinations)
        });

        if (timeout) {
            this.timeout = game_timeout(this.spawnAircraft,
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

        return random(min_interval, max_interval);
    }
}
