/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand */
import _random from 'lodash/random';
import ArrivalBase from './ArrivalBase';
import { convertMinutesToSeconds } from '../../utilities/unitConverters';
import { TIME } from '../../constants/globalConstants';

/**
 * Generate arrivals in cyclic pattern
 * Arrival rate varies as pictured below. Rate at which the arrival rate
 * increases or decreases remains constant throughout the cycle.

 * |---o---------------o---------------o---------------o-----------| < - - - - - - max arrival rate
 * | o   o           o   o           o   o           o   o         |   +variation
 * o-------o-------o-------o-------o-------o-------o-------o-------o < - - - - - - avg arrival rate
 * |         o   o |         o   o           o   o           o   o |   -variation
 * |-----------o---|-----------o---------------o---------------o---| < - - - - - - min arrival rate
 * |<---period---->|           |<---period---->|
 *
 * @class ArrivalCyclic
 * @extends ArrivalBase
 */
export default class ArrivalCyclic extends ArrivalBase {
    /**
     * @for ArrivalCyclic
     * @constructor
     * @param airport {AirportInstanceModel}
     * @param options {object}
     */
    constructor(airport, options) {
        super(airport, options);

        /**
         * amount to deviate from the prescribed frequency
         *
         * @property variation
         * @type {number}
         * @default 0
         */
        this.variation = 0;

        this.parse(options);
    }

    /**
     * Arrival Stream Settings
     *
     * @param {integer} period - (optional) length of a cycle, in minutes
     * @param {integer} offset - (optional) minutes to shift starting position in cycle
     */
    parse(options) {
        super.parse(options);

        if (options.offset) {
            this.offset = convertMinutesToSeconds(options.offset)
        }

        if (options.period) {
            this.period = convertMinutesToSeconds(options.period);
        }

        if (options.variation) {
            this.variation = options.variation;
        }
    }

    start() {
        this.cycleStart = window.gameController.game.time - this.offset;
        const delay = _random(0, TIME.ONE_HOUR_IN_SECONDS / this.frequency);
        this.timeout = window.gameController.game_timeout(this.spawnAircraft, delay, this, [true, true]);
    }

    nextInterval() {
        // TODO: what do all these magic numbers mean? enumerate the magic numbers.
        const t = window.gameController.game.time - this.cycleStart;
        const done = t / (this.period / 4); // progress in current quarter-period

        if (done >= 4) {
            this.cycleStart += this.period;

            return TIME.ONE_HOUR_IN_SECONDS / (this.frequency + (done - 4) * this.variation);
        } else if (done <= 1) {
            return TIME.ONE_HOUR_IN_SECONDS / (this.frequency + done * this.variation);
        } else if (done <= 2) {
            return TIME.ONE_HOUR_IN_SECONDS / (this.frequency + (2 * (this.period - 2 * t) / this.period) * this.variation);
        } else if (done <= 3) {
            return TIME.ONE_HOUR_IN_SECONDS / (this.frequency - (done - 2) * this.variation);
        } else if (done < 4) {
            return TIME.ONE_HOUR_IN_SECONDS / (this.frequency - (4 * (this.period - t) / this.period) * this.variation);
        }
    }
}
