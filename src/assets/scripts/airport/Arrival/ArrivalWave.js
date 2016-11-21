/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand */
import $ from 'jquery';
import _random from 'lodash/random';
import ArrivalBase from './ArrivalBase';
import { sin } from '../../math/core';
import { tau } from '../../math/circle';
import { convertMinutesToSeconds } from '../../utilities/unitConverters';
import { TIME } from '../../constants/globalConstants';
import { LOG } from '../../constants/logLevel';

/** Generate arrivals in a repeating wave
  * Arrival rate varies as pictured below. Arrival rate will increase
  * and decrease faster when changing between the lower/higher rates.
  *
  * ------------o-o-o---------------------------------------+-----------o-o < - - - - - max arrival rate
  *        o             o                                  |      o      |       ^
  *    o                     o                              |  o          |  +variation
  *  o                         o                            |o            |       v
  * o-------------------------- o---------------------------o-------------+ < - - - - - avg arrival rate
  * |                            o                         o|             |       ^
  * |                              o                     o  |             |  -variation
  * |                                  o             o      |             |       v
  * +---------------------------------------o-o-o-----------+-------------+ < - - - - - min arrival rate
  * |                                                       |
  * |<  -  -  -  -  -  -  -  - period -  -  -  -  -  -  -  >|
  *
  * @class ArrivalWave
  * @extends ArrivalBase
 */
export default class ArrivalWave extends ArrivalBase {
    /**
     * @for ArrivalWave
     * @constructor
     * @param airport {AirportInstanceModel}
     * @param options {object}
     */
    constructor(airport, options) {
        super(airport, options);

        /**
         * game time
         *
         * @property cycleStart
         * @type {number}
         * @default 0
         */
        this.cycleStart = 0;

        /**
         * Start at the beginning of the surge
         *
         * @property offset
         * @type {number}
         * @default 0
         */
        this.offset = 0;

        /**
         * 30 minute cycle
         *
         * @property period
         * @type {number}
         * @default 1800
         */
        this.period = TIME.ONE_HOUR_IN_SECONDS / 2;

        /**
         * amount to deviate from the prescribed frequency
         *
         * @propery variation
         * @type {number}
         * @default 0
         */
        this.variation = 0;

        this.parse(options);
        this.clampSpawnRate(5.5); // minimum of 5.5nm entrail
    }

    /**
     * Arrival Stream Settings
     *
     * @for ArrivalWave
     * @method parse
     * @param {integer} period - (optional) length of a cycle, in minutes
     * @param {integer} offset - (optional) minutes to shift starting position in cycle
     */
    parse(options) {
        super.parse(options);

        if (options.offset) {
            this.offset = convertMinutesToSeconds(options.offset);
        }

        if (options.period) {
            this.period = convertMinutesToSeconds(options.period);
        }

        if (options.variation) {
            this.variation = options.variation;
        }
    }

    /**
     * Ensures the spawn rate will be at least the required entrail distance
     *
     * @for ArrivalWave
     * @method clampSpawnRate
     * @param {number} entrail_dist - minimum distance between successive arrivals, in nm
     */
    clampSpawnRate(entrail_dist) {
        const entrail_interval = entrail_dist * (TIME.ONE_HOUR_IN_SECONDS / this.speed);
        const min_interval = TIME.ONE_HOUR_IN_SECONDS / (this.frequency + this.variation);

        // TODO: return early here to avoid this wrapping if
        if (min_interval < entrail_interval) {
            const diff = entrail_interval - min_interval;

            // can reduce variation to achieve acceptable spawn rate
            if (diff <= (TIME.ONE_HOUR_IN_SECONDS / this.variation)) {
                log('Requested arrival rate variation of +/-' + this.variation + ' acph reduced to ' +
                    'maintain minimum of ' + entrail_dist + ' miles entrail on arrival stream following ' +
                    'route ' + $.map(this.fixes, (v) => v.fix).join('-'), LOG.WARNING);

                this.variation = this.variation - TIME.ONE_HOUR_IN_SECONDS / diff; // reduce the variation
            } else {
                // need to reduce frequency to achieve acceptable spawn rate
                log('Requested arrival rate of ' + this.frequency + ' acph overridden to ' +
                    'maintain minimum of ' + entrail_dist + ' miles entrail on arrival stream ' +
                    'following route ' + $.map(this.fixes, (v) => v.fix).join('-'), LOG.WARNING);

                // make spawn at constant interval
                this.variation = 0;
                // reduce the frequency
                this.frequency = TIME.ONE_HOUR_IN_SECONDS / entrail_interval;
            }
        }
    }

    /**
     * @for ArrivalWave
     * @method nextInterval
     * return {number}
     */
    nextInterval() {
        const t = window.gameController.game.time - this.cycleStart;
        const done = t / this.period; // progress in period

        if (done >= 1) {
            this.cycleStart += this.period;
        }

        const rate = this.frequency + this.variation * sin(done * tau());

        return TIME.ONE_HOUR_IN_SECONDS / rate;
    }

    /**
     * @for ArrivalWave
     * @method start
     */
    start() {
        const delay = _random(0, TIME.ONE_HOUR_IN_SECONDS / this.frequency);
        // TODO: this might not be available on `window.prop` update reference
        this.cycleStart = window.gameController.game.time - this.offset + delay;
        this.timeout = window.gameController.game_timeout(this.spawnAircraft, delay, this, [true, true]);
    }
}
