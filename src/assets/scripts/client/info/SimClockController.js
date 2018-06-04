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

        /**
         * @for SimClockController
         * @property time
         * @type {Number}
         * @default 0
         */
        this.time = 0;

        return this._init();
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
     * @method destroy
     * @chainable
     */
    destroy() {
        this.startTime = 0;
        this.time = 0;

        return this;
    }

    /**
     * Generates a string of the current game time in a human-readable format
     *
     * @for SimClockController
     * @method generateCurrentTimeValue
     * @return clockTime {string}   current game time formatted like '03:44:17'
     */
    generateCurrentTimeValue() {
        const gameTimeInMilliseconds = TimeKeeper.accumulatedDeltaTime * TIME.ONE_SECOND_IN_MILLISECONDS;
        const clockDate = new Date(this.startTime + gameTimeInMilliseconds);
        const hours = digits_integer(clockDate.getHours(), 2);
        const minutes = digits_integer(clockDate.getMinutes(), 2);
        const seconds = digits_integer(clockDate.getSeconds(), 2);
        const clockTime = `${hours}${minutes}/${seconds}`;

        return clockTime;
    }

    /**
     * Re-calculates elapsed time and re-renders the view
     *
     * @for SimClockController
     * @method update
     */
    update() {
        this._recalculate();

        return this._render();
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
     * Updates the time stored in the clock
     * @for SimClockController
     * @method _tick
     * @private
     */
    _recalculate() {
        const elapsedTime = TimeKeeper.accumulatedDeltaTime * TIME.ONE_SECOND_IN_MILLISECONDS;
        this.time = this.startTime + elapsedTime;
    }

    /**
     * Updates the DOM with the new game time
     * @for SimClockController
     * @method _render
     * @private
     */
    _render() {
        const currentTimeValue = this.generateCurrentTimeValue();

        return currentTimeValue;
    }
}
