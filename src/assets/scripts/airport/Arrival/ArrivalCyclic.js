import $ from 'jquery';
import Fiber from 'fiber';

import ArrivalBase from './ArrivalBase';
import { km, nm, degreesToRadians } from '../../utilities/unitConverters';
import { distance2d } from '../../math/distance';
import { vlen, vradial, vsub } from '../../math/vector';

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
 * @extends Fiber
 */
const ArrivalCyclic = ArrivalBase.extend(function(base) {
    return {
        init: function(airport, options) {
            this.cycleStart = 0;  // game time
            this.offset = 0;      // Start at the average, and increasing
            this.period = 1800;   // 30 minute cycle
            this.variation = 0;   // amount to deviate from the prescribed frequency

            base.init.call(this, airport, options);
            base.parse.call(this, options);
            this.parse(options);
        },

        /**
         * Arrival Stream Settings
         *
         * @param {integer} period - (optional) length of a cycle, in minutes
         * @param {integer} offset - (optional) minutes to shift starting position in cycle
         */
        parse: function(options) {
            if (options.offset) {
                this.offset = options.offset * 60; // min --> sec
            }

            if (options.period) {
                this.period = options.period * 60; // min --> sec
            }

            if (options.variation) {
                this.variation = options.variation;
            }
        },

        start: function() {
            this.cycleStart = prop.game.time - this.offset;
            const delay = random(0, 3600 / this.frequency);
            this.timeout = game_timeout(this.spawnAircraft, delay, this, [true, true]);
        },

        nextInterval: function() {
            // TODO: what do all these magic numbers mean? enumerate the magic numbers.
            var t = prop.game.time - this.cycleStart;
            var done = t / (this.period / 4); // progress in current quarter-period

            if (done >= 4) {
                this.cycleStart += this.period;

                return 3600 / (this.frequency + (done - 4) * this.variation);
            } else if (done <= 1) {
                return 3600 / (this.frequency + done * this.variation);
            } else if (done <= 2) {
                return 3600 / (this.frequency + (2 * (this.period - 2 * t) / this.period) * this.variation);
            } else if (done <= 3) {
                return 3600 / (this.frequency - (done - 2) * this.variation);
            } else if (done <  4) {
                return 3600 / (this.frequency - (4 * (this.period - t) / this.period) * this.variation);
            }
        }
    };
});

export default ArrivalCyclic;
