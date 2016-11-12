/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand */
import _random from 'lodash/random';
import ArrivalBase from './ArrivalBase';
import { round } from '../../math/core';
import { LOG } from '../../constants/logLevel';

/**
 * Generate arrivals in a repeating surge
 * Arrival rate goes from very low and steeply increases to a
 * sustained "arrival surge" of densely packed aircraft.
 * o o o o o o o o o o - - - - - - - - - - - o o o o o o o o o o-----+ < - - - max arrival rate (*this.factor)
 * o                 o                       o                 o     |
 * o                 o                       o                 o     |   x(this.factor)
 * o                 o                       o                 o     |
 * o - - - - - - - - o o o o o o o o o o o o o - - - - - - - - o o o-+ < - - - min arrival rate (n)
 * |<--- up time --->|<----- down time ----->|<--- up time --->|
 *
 * @class ArrivalSurge
 */
export default class ArrivalSurge extends ArrivalBase {
    constructor(airport, options) {
        super(airport, options);

        this.cycleStart = 0;      // game time
        this.offset = 0;          // Start at the beginning of the surge
        this.period = 1800;       // 30 minute cycle
        this.entrail = [5.5, 10]; // miles entrail during the surge [fast,slow]

        // Calculated
        this.uptime = 0;      // time length of surge, in minutes
        this.acph_up = 0;     // arrival rate when "in the surge"
        this.acph_dn = 0;     // arrival rate when not "in the surge"

        super.parse(options);
        this.parse(options);
        this.shapeTheSurge();
    }

    /**
     * Arrival Stream Settings
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
        if (options.offset) {
            this.offset = options.offset * 60; // min --> sec
        }

        if (options.period) {
            this.period = options.period * 60; // min --> sec
        }

        if (options.entrail) {
            this.entrail = options.entrail;
        }
    }

    /**
     * Determines the time spent at elevated and slow spawn rates
     */
    shapeTheSurge() {
        this.acph_up = this.speed / this.entrail[0];
        this.acph_dn = this.speed / this.entrail[1];  // to help the uptime calculation
        this.uptime = (this.period * this.frequency - this.period * this.acph_dn) / (this.acph_up - this.acph_dn);
        this.uptime -= this.uptime % (3600 / this.acph_up);
        // FIXME: This would better belong in a helper method and should be simplified
        // adjust to maintain correct acph rate
        this.acph_dn = Math.floor(
            this.frequency * this.period / 3600 - Math.round(this.acph_up * this.uptime / 3600)) * 3600 / (this.period - this.uptime);

        // Verify we can comply with the requested arrival rate based on entrail spacing
        if (this.frequency > this.acph_up) {
            log(this.airport.icao + ': TOO MANY ARRIVALS IN SURGE! Requested: '
                + this.frequency + 'acph | Acceptable Range for requested entrail distance: '
                + Math.ceil(this.acph_dn) + 'acph - ' + Math.floor(this.acph_up) + 'acph', LOG.WARNING);

            this.frequency = this.acph_up;
            this.acph_dn = this.acph_up;
        } else if (this.frequency < this.acph_dn) {
            log(this.airport.icao + ': TOO FEW ARRIVALS IN SURGE! Requested: '
                + this.frequency + 'acph | Acceptable Range for requested entrail distance: '
                + Math.ceil(this.acph_dn) + 'acph - ' + Math.floor(this.acph_up) + 'acph', LOG.WARNING);

            this.frequency = this.acph_dn;
            this.acph_up = this.acph_dn;
        }
    }

    nextInterval() {
        const t = prop.game.time - this.cycleStart;
        const done = t / this.period; // progress in period
        const interval_up = 3600 / this.acph_up;
        const interval_dn = 3600 / this.acph_dn;
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

    start() {
        const delay = _random(0, 3600 / this.frequency);
        this.cycleStart = prop.game.time - this.offset + delay;
        this.timeout = window.gameController.game_timeout(this.spawnAircraft, delay, this, [true, true]);
    }
}
