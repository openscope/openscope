import { extrapolate_range_clamp } from '../math/core';
import { TIME } from '../constants/globalConstants';

/**
 * @property TIME_SECONDS_OFFSET
 * @type {number}
 * @final
 */
const TIME_SECONDS_OFFSET = 0.001;

/**
 * Singleton used to manage game time and the advancement of animation frames
 *
 * You will notice a large number of the class properties are private with exposed getters.
 * This is done to ensure that other classes are not able to modify the property values
 * of this class. TimeKeeping is an integral part of the app and must be able to keep accurate,
 * consistent time. Other classes can use these values but should never, directly, edit them.
 *
 * @class TimeKeeper
 */
class TimeKeeper {
    /**
     * @constructor
     */
    constructor() {
        /**
         * Sum of `deltaTime` values
         *
         * Used an an incrementor, thus we default to `0` instead of `-1`
         *
         * @property _accumulatedDeltaTime
         * @type {number}
         * @default 0
         * @private
         */
        this._accumulatedDeltaTime = 0;

        /**
         * Timestamp for the start of rendering
         *
         * @property _startTimestamp
         * @type {number}
         * @private
         */
        this._startTimestamp = 0;

        /**
         * Timestamp for the current frame
         *
         * @property _frameStartTimestamp
         * @type {number}
         * @default -1
         * @private
         */
        this._frameStartTimestamp = 0;

        /**
         * Timestamp of the previous frame
         *
         * @property _previousFrameTimestamp
         * @type {number}
         */
        this._previousFrameTimestamp = 0;

        /**
         * Nubmer of frames rendered
         *
         * Used an an incrementor, thus we default to `0` instead of `-1`
         *
         * @property frames
         * @type {number}
         * @default 0
         * @private
         */
        this._elapsedFrameCount = 0;

        /**
         * Time difference in milliseconds between the `#lastFrame` and `#_frameStartTimestamp`
         *
         * **This is the most important value of this class.**
         * From this value, we calculate how far everything has moved within the sim
         * as defined by (in the simplest terms):
         *
         * ```
         * d = distance
         * r = rate
         * t = time
         *
         * d = r * t
         * ```
         *
         * @property _frameDeltaTime
         * @type {number}
         * @default -1
         * @private
         */
        this._frameDeltaTime = 0;

        /**
         * Previously known as `timewarp`, this value is used a time multiplier
         *
         * This value is changed via methods exposed here used within the
         * `GameController` and is used to effectively _speed up_ this sim
         *
         * This value is used as a multiplier when returning the current `#_frameDeltaTime`
         * which causes moving objects appear to have moved a farther distance than they
         * would have at normal speed
         *
         * It is possible to set any numeric value via system command, though the
         * UI enforces values of: `1`, `2` and `5` via the timewarp toggle button
         *
         * @property _timescale
         * @type {number}
         * @default 1
         * @private
         */
        this._timescale = 1;

        /**
         *
         *
         * @property _frameStep
         * @type {number}
         * @default 0
         * @private
         */
        this._frameStep = 0;

        /**
         * Flag used to determine if the sim has been paused
         *
         * This defaults to `true` because the sim is effectively paused
         * on initial load. This way the game loop doesn't run needlessly
         * as the sim is loading.
         *
         * @property _isPaused
         * @type {boolean}
         * @default false
         * @private
         */
        this._isPaused = true;

        /**
         * This property is used to hold the value of `#_frameDeltaTime` when
         * performing future path calculations.
         *
         * This value should never be modified externally and only modified internally via the
         * `.setDeltaTimeBeforeFutureTrackCalculation()' and `.setDeltaTimeAfterFutureTrackCalculation()`
         * methods.
         *
         * We modify `#_frameDeltaTime` like this so we can _fake_ a timewarp of 5 during future
         * track calculations.
         *
         * // TODO: this method of future track calculation should be looking into. it is non-performant
         * // and, frankly, quite messy.
         *
         * @property _futureTrackDeltaTimeCache
         * @type {number}
         * @default -1
         * @private
         */
        this._futureTrackDeltaTimeCache = -1;
    }

    /**
     * @property accumulatedDeltaTime
     * @type {number}
     */
    get accumulatedDeltaTime() {
        return this._accumulatedDeltaTime;
    }

    /**
     * Current timestamp in seconds
     *
     * @property gameTime
     * @return {number}
     */
    get gameTime() {
        return (new Date()).getTime() * TIME_SECONDS_OFFSET;
    }

    /**
     * Current timestamp in milliseconds
     *
     * This is the same value as `gameTime`.
     * We define this getter here simply for the added context
     * given in the name
     *
     * @property gameTimeMilliseconds
     * @return {number}
     */
    get gameTimeMilliseconds() {
        return (new Date()).getTime();
    }

    /**
     * Current timestamp in seconds
     *
     * @property gameTimeMilliseconds
     * @return {number}
     */
    get gameTimeSeconds() {
        return (new Date()).getTime() * TIME.ONE_MILLISECOND_IN_SECONDS;
    }

    /**
     * Current `#_frameDetaTime` multiplied by the current `#_timescale`.
     *
     * This value is capped at `100`
     *
     * @property deltaTime
     * @return {number} current delta time in milliseconds
     */
    get deltaTime() {
        return Math.min(this._frameDeltaTime * this._timescale, 100);
    }

    /**
     * @property isPaused
     * @type {boolean}
     */
    get isPaused() {
        return this._isPaused;
    }

    /**
     *
     *
     * @property timescale
     * @type {number}
     */
    get timescale() {
        return this._timescale;
    }

    /**
     * Reset model properties
     *
     * @for TimeKeeper
     * @method reset
     */
    reset() {
        const currentTime = this.gameTime;

        this._startTimestamp = currentTime;
        this._frameStartTimestamp = currentTime;
        this._previousFrameTimestamp = currentTime;
        this._elapsedFrameCount = 0;
        this._frameDeltaTime = 0;
    }

    /**
     *
     *
     */
    getDeltaTimeForGameStateAndTimewarp() {
        // FIXME: ick!
        if (this.isPaused || this.deltaTime >= 1 && this._timescale === 1 && this._futureTrackDeltaTimeCache === -1) {
            return 0;
        }

        return this.deltaTime;
    }

    /**
     *
     *
     * @for TimeKeeper
     * @method updateTimescale
     * @param nextTimewarp {number}  the next value for #_timescale
     */
    updateTimescale(nextTimewarp) {
        if (nextTimewarp < 0) {
            return;
        }

        this._timescale = nextTimewarp;
    }

    /**
     *
     *
     */
    setDeltaTimeBeforeFutureTrackCalculation() {
        this._futureTrackDeltaTimeCache = this._frameDeltaTime;
        this._frameDeltaTime = 5;
    }

    /**
     *
     *
     */
    setDeltaTimeAfterFutureTrackCalculation() {
        this._frameDeltaTime = this._futureTrackDeltaTimeCache;
        this._futureTrackDeltaTimeCache = -1;
    }

    /**
     *
     *
     * @for TimeKeeper
     * @method shouldUpdate
     */
    shouldUpdate() {
        return this._elapsedFrameCount % this._frameStep === 0;
    }

    /**
     *
     *
     */
    togglePause() {
        this._isPaused = !this._isPaused;
    }

    /**
     *
     *
     * Should be called at the end of each update cycle by the `AppController`
     * Calling this method signifies the end of a frame
     *
     * @for TimeKeeper
     * @method update
     */
    update() {
        if (this._futureTrackDeltaTimeCache !== -1) {
            return;
        }

        const currentTime = this.gameTime;

        this._incrementFrame();
        this._calculateNextDeltaTime(currentTime);
        this._calculateFrameStep();
    }

    /**
     * Move to the next frame
     *
     * @for TimeKeeper
     * @method incrementFrame
     * @private
     */
    _incrementFrame() {
        this._elapsedFrameCount += 1;
    }

    /**
     * Caclulate the difference (delta) between the `#currentTime`
     * and `#_previousFrameTimestamp`.
     *
     * This value will be used throughout to app to determine how
     * much time has passed, thus allowing us to know how much to
     * move elements.
     *
     * @for TimeKeeper
     * @method _calculateNextDelatTime
     * @param currentTime {Date}  current date string (in ms)
     * @private
     */
    _calculateNextDeltaTime(currentTime) {
        const frameDelay = 1;
        const elapsed = currentTime - this._frameStartTimestamp;

        if (elapsed > frameDelay) {
            this._frameStartTimestamp = currentTime;
        }

        this._frameDeltaTime = currentTime - this._previousFrameTimestamp;
        this._previousFrameTimestamp = currentTime;
        this._accumulatedDeltaTime += this.getDeltaTimeForGameStateAndTimewarp();
    }

    /**
     *
     *
     * @for CanvasController
     * @method _calculateFrameStep
     * @private
     */
    _calculateFrameStep() {
        // TODO: is this even correct? the order of range2 values looks backwards
        // FIXME: what do the magic numbers mean?
        this._frameStep = Math.round(extrapolate_range_clamp(1, this._timescale, 10, 30, 1));
    }
}

export default new TimeKeeper();
