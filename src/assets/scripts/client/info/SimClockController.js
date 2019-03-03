import TimeKeeper from '../engine/TimeKeeper';
import { digits_integer } from '../utilities/radioUtilities';
import { TIME } from '../constants/globalConstants';

/**
 * Manages a clock that stays in sync with the current game time
 * @class SimClockController
 */
export default class SimClockController {
    /**
     * @for SimClockController
     * @constructor
     */
    constructor() {
        /**
         * @for SimClockController
         * @property startTime
         * @type {Number}
         * @default 0
         */
        this.startTime = 0;

        return this._init();
    }

    /**
     * @for SimClockController
     * @method _init
     * @private
     */
    _init() {
        this.startTime = this.realWorldCurrentZuluTime;

        return this;
    }

    /**
     * Get current time in the user's time zone
     *
     *  @for SimClockController
     * @property realWorldCurrentLocalTime
     * @return {number} ms since 01/01/1970, 00:00:00 (user's time zone)
     */
    get realWorldCurrentLocalTime() {
        return new Date().getTime();
    }

    /**
     * Get current zulu time in milliseconds
     *
     * @for SimClockController
     * @property realWorldCurrentZuluTime
     * @return utc {number} ms since 01/01/1970, 00:00:00 UTC
     */
    get realWorldCurrentZuluTime() {
        const date = new Date();
        const utc = date.getTime() + (date.getTimezoneOffset() * TIME.ONE_MINUTE_IN_MILLISECONDS);

        return utc;
    }

    /**
     * @for SimClockController
     * @method reset
     * @chainable
     */
    reset() {
        this.startTime = 0;

        return this;
    }

    /**
     * Generates a string of the current game time in a human-readable format
     *
     * @for SimClockController
     * @method buildClockReadout
     * @return clockTime {string} current game time formatted like '03:44:17'
     */
    buildClockReadout() {
        const elapsedTimeInMilliseconds = TimeKeeper.accumulatedDeltaTime * TIME.ONE_SECOND_IN_MILLISECONDS;
        const clockDate = new Date(this.startTime + elapsedTimeInMilliseconds);
        const hours = digits_integer(clockDate.getHours(), 2);
        const minutes = digits_integer(clockDate.getMinutes(), 2);
        const seconds = digits_integer(clockDate.getSeconds(), 2);
        const clockTime = `${hours}${minutes}/${seconds}`;

        return clockTime;
    }
}
