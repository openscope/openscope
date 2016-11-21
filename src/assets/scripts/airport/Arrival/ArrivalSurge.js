/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand */
import _random from 'lodash/random';
import ArrivalBase from './ArrivalBase';
import { round } from '../../math/core';
import { convertMinutesToSeconds } from '../../utilities/unitConverters';
import { TIME } from '../../constants/globalConstants';
import { LOG } from '../../constants/logLevel';

/**
 * Generate arrivals in a repeating surge
 *
 * Arrival rate goes from very low and steeply increases to a sustained arrival surge of densely packed aircraft.
 *
 * Example airport: `EDDT - Berlin Tegel Airport`
 *
 * o o o o o o o o o o - - - - - - - - - - - o o o o o o o o o o-----+ < - - - max arrival rate (*this.factor)
 * o                 o                       o                 o     |
 * o                 o                       o                 o     |   x(this.factor)
 * o                 o                       o                 o     |
 * o - - - - - - - - o o o o o o o o o o o o o - - - - - - - - o o o-+ < - - - min arrival rate (n)
 * |<--- up time --->|<----- down time ----->|<--- up time --->|
 *
 * @class ArrivalSurge
 * @extends ArrivalBase
 */
export default class ArrivalSurge extends ArrivalBase {
    /**
     * @for ArrivalBase
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
         * miles entrail during the surge [fast,slow]
         *
         * @property entrail
         * @type {number}
         * @default
         */
        this.entrail = [5.5, 10];

        // Calculated
        /**
         * time length of surge, in minutes
         *
         * @property uptime
         * @type {number}
         * @default 0
         */
        this.uptime = 0;

        /**
         * arrival rate when "in the surge"
         *
         * @property acph_up
         * @type {number}
         * @default 0
         */
        this.acph_up = 0;

        /**
         * arrival rate when not "in the surge"
         *
         * @property acph_dn
         * @type {number}
         * @default 0
         */
        this.acph_dn = 0;

        this.parse(options);
        this.shapeTheSurge();
    }

    /**
     * Arrival Stream Settings
     *
     * @for ArrivalSurge
     * @method parse
     * @param {integer} period - Optionally specify the length of a cycle in minutes
     * @param {integer} offset - Optionally specify the center of the wave in minutes
     * @param {array} entrail - 2-element array with [fast,slow] nm between each
     *                          successive arrival. Note that the entrail distance on
     *                          the larger gap ("slow") will be adjusted slightly in
     *                          order to maintain the requested frequency. This is
     *                          simply due to the fact that we can't divide perfectly
     *                          across each period, so we squish the gap a tiny bit to
     *                          help us hit the mark on the aircraft-per-hour rate.
     */
    parse(options) {
        super.parse(options);

        if (options.offset) {
            this.offset = convertMinutesToSeconds(options.offset);
        }

        if (options.period) {
            this.period = convertMinutesToSeconds(options.period);
        }

        if (options.entrail) {
            this.entrail = options.entrail;
        }
    }

    /**
     * Determines the time spent at elevated and slow spawn rates
     *
     * @for ArrivalSurge
     * @method shapeTheSurge
     */
    shapeTheSurge() {
        this.acph_up = this.speed / this.entrail[0];
        this.acph_dn = this.speed / this.entrail[1];  // to help the uptime calculation

        this.uptime = (this.period * this.frequency - this.period * this.acph_dn) / (this.acph_up - this.acph_dn);
        this.uptime -= this.uptime % (TIME.ONE_HOUR_IN_SECONDS / this.acph_up);
        // FIXME: This would better belong in a helper method and should be simplified
        // adjust to maintain correct acph rate
        this.acph_dn = Math.floor(
            this.frequency * this.period / TIME.ONE_HOUR_IN_SECONDS - Math.round(this.acph_up * this.uptime / TIME.ONE_HOUR_IN_SECONDS)) * TIME.ONE_HOUR_IN_SECONDS / (this.period - this.uptime);

        // TODO: abstract this if/else block
        // Verify we can comply with the requested arrival rate based on entrail spacing
        if (this.frequency > this.acph_up) {
            log(`${this.airport.icao}: TOO MANY ARRIVALS IN SURGE! Requested: ` +
                `${this.frequency} acph | Acceptable Range for requested entrail distance: ` +
                `${Math.ceil(this.acph_dn)} acph - ${Math.floor(this.acph_up)} acph`, LOG.WARNING);

            this.frequency = this.acph_up;
            this.acph_dn = this.acph_up;
        } else if (this.frequency < this.acph_dn) {
            log(`${this.airport.icao}: TOO FEW ARRIVALS IN SURGE! Requested: ` +
                `${this.frequency} acph | Acceptable Range for requested entrail distance: ` +
                `${Math.ceil(this.acph_dn)} acph - ${Math.floor(this.acph_up)} acph`, LOG.WARNING);

            this.frequency = this.acph_dn;
            this.acph_up = this.acph_dn;
        }
    }


    /**
     * @for ArrivalSurge
     * @method nextInterval
     * @return interval_up {number}
     */
    nextInterval() {
        const t = window.gameController.game.time - this.cycleStart;
        const done = t / this.period; // progress in period
        const interval_up = TIME.ONE_HOUR_IN_SECONDS / this.acph_up;
        const interval_dn = TIME.ONE_HOUR_IN_SECONDS / this.acph_dn;
        // reduced spawn rate
        const timeleft = this.period - t;

        if (done >= 1) {
            this.cycleStart += this.period;

            return interval_up;
        }

        // elevated spawn rate
        if (t <= this.uptime) {
            return interval_up;
        }

        if (timeleft > interval_dn + interval_up) {
            // plenty of time until new period
            return interval_dn;
        } else if (timeleft > interval_dn) {
            // next plane will delay the first arrival of the next period
            return interval_dn - (t + interval_dn + interval_up - this.period);
        }

        // next plane is first of elevated spawn rate
        this.cycleStart += this.period;

        return interval_up;
    }

    /**
     * @for ArrivalSurge
     * @method start
     */
    start() {
        const delay = _random(0, TIME.ONE_HOUR_IN_SECONDS / this.frequency);
        this.cycleStart = window.gameController.game.time - this.offset + delay;
        this.timeout = window.gameController.game_timeout(this.spawnAircraft, delay, this, [true, true]);
    }
}
