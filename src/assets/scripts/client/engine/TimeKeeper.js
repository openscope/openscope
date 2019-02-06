import { extrapolate_range_clamp } from '../math/core';
import { TIME } from '../constants/globalConstants';

/**
 * Value used as `#_frameDeltaTime` when performing future track
 * calculations for aircraft.
 *
 * @property SIMULATION_RATE_FOR_TRACK_PROJECTIONS
 * @type {number}
 * @final
 */
const SIMULATION_RATE_FOR_TRACK_PROJECTIONS = 5;

/**
 * Singleton used to manage game time and the advancement of animation frames
 *
 * You will notice a large number of the instance properties are private with exposed getters.
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
         * Time difference in seconds between the `#lastFrame` and `#_frameStartTimestamp`
         *
         * **This is the most important value of this class.**
         *
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
         * This property should only be used and accessed internally
         * All external methods should use public getter: `#deltaTime`
         *
         * This value is the single source of truth for true `deltaTime`, however,
         * we will only ever use this value locally. Every other external method needs
         * `deltaTime * simulationRate`, as provided by `#deltaTime`, to account for
         * any timewarp adjustments by the user
         *
         * @property _frameDeltaTime
         * @type {number}
         * @default -1
         * @private
         */
        this._frameDeltaTime = 0;

        /**
         * Timestamp for the current frame
         *
         * @property _frameStartTimestamp
         * @type {number}
         * @default -1
         * @private
         */
        this._frameStartTimestamp = 0;

        // TODO: not entirely sure what this is for
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
         * This property is used to hold the value of `#_frameDeltaTime` when
         * performing future path calculations.
         *
         * This value should never be modified externally and only modified internally via the
         * `.saveDeltaTimeBeforeFutureTrackCalculation()' and `.restoreDeltaTimeAfterFutureTrackCalculation()`
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
         * Timestamp of the previous frame
         *
         * @property _previousFrameTimestamp
         * @type {number}
         */
        this._previousFrameTimestamp = 0;

        /**
         * Timestamp for the start of rendering
         *
         * @property _startTimestamp
         * @type {number}
         * @private
         */
        this._startTimestamp = 0;

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
         * @property _simulationRate
         * @type {number}
         * @default 1
         * @private
         */
        this._simulationRate = 1;

        return this._init();
    }

    /**
     * Accumulated time since the start of the simulation in seconds
     *
     * @property accumulatedDeltaTime
     * @type {number}
     */
    get accumulatedDeltaTime() {
        return this._accumulatedDeltaTime;
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
     * @property gameTimeSeconds
     * @return {number}
     */
    get gameTimeSeconds() {
        return (new Date()).getTime() * TIME.ONE_MILLISECOND_IN_SECONDS;
    }

    /**
     * Current `#_frameDeltaTime` multiplied by the current `#_simulationRate`
     *
     * This is value any external method needs when calculating movement with
     * deltaTime. No external method should every access `#_frameDeltaTime`
     * because that value will not account for `#_simulationRate`.
     *
     * For more information on the concept of `deltaTime` see:
     * https://en.wikipedia.org/wiki/Delta_timing
     *
     * @property deltaTime
     * @return {number} current delta time in seconds
     */
    get deltaTime() {
        const deltaTimeOffsetBySimulationRate = this._frameDeltaTime * this._simulationRate;

        return Math.min(deltaTimeOffsetBySimulationRate, 100);
    }

    /**
     * @property isPaused
     * @type {boolean}
     */
    get isPaused() {
        return this._isPaused;
    }

    /**
     * The fast-forward value used to speed up animated distances
     *
     * Previously known as `timewarp`
     *
     * @property simulationRate
     * @type {number}
     */
    get simulationRate() {
        return this._simulationRate;
    }

    /**
     * Lifecycle method
     *
     * @for TimeKeeper
     * @method _init
     * @chainable
     */
    _init() {
        return this;
    }

    /**
     * Reset model properties
     *
     * @for TimeKeeper
     * @method reset
     */
    reset() {
        this._accumulatedDeltaTime = 0;
        this._elapsedFrameCount = 0;
        this._frameDeltaTime = 0;
        this._frameStartTimestamp = 0;
        this._frameStep = 0;
        this._futureTrackDeltaTimeCache = -1;
        this._isPaused = true;
        this._previousFrameTimestamp = 0;
        this._startTimestamp = 0;
        this._simulationRate = 1;
    }

    /**
     * Wrapper used to get current `#_frameDeltaTime` value or zero under certain conditions
     *
     * When the sim is 'paused' or un-focused, we do not want `#_frameDeltaTime` to be used
     * in position calculations. This causes movement at a time when there shouldn't be any.
     *
     * By supplying `0` in those cases, there is effectively no 'time' difference and thus no
     * change in position given a rate. This freezes objects at their current position until
     * such time we begin returning `#_frameDeltaTime` again.
     *
     * @for TimeKeeper
     * @method getDeltaTimeForGameStateAndTimewarp
     * @return {number} delta time in seconds
     */
    getDeltaTimeForGameStateAndTimewarp() {
        if (this.isPaused || this._isReturningFromPauseAndNotFutureTrack()) {
            return 0;
        }

        return this.deltaTime;
    }

    /**
     * Used to store the current `#_frameDeltaTime` and override the current delta
     * with a static value
     *
     * This method should be called immediately before performing calculations
     * for an aircraft's future path. Immediately after those calculations are
     * performed, `.restoreDeltaTimeAfterFutureTrackCalculation()` should be called
     * so position calculations can continue with the correct `#_frameDeltaTime`
     *
     * Modifying `#_frameDeltaTime` this way, though not ideal, is based on
     * the original implmenetation. This gives us a way to _fudge_ the
     * current deltTime and make it easy to draw out an aircraft's future path
     *
     * @for TimeKeeper
     * @method saveDeltaTimeBeforeFutureTrackCalculation
     */
    saveDeltaTimeBeforeFutureTrackCalculation() {
        this._futureTrackDeltaTimeCache = this._frameDeltaTime;
        this._frameDeltaTime = SIMULATION_RATE_FOR_TRACK_PROJECTIONS;
    }

    /**
     * Used to reset `#_futureTrackDeltaTimeCache` after future track
     * calculations have finished
     *
     * This method should be called immediately after performing calculations
     * for an aircraft's future path.
     *
     * @for TimeKeeper
     * @method restoreDeltaTimeAfterFutureTrackCalculation
     */
    restoreDeltaTimeAfterFutureTrackCalculation() {
        this._frameDeltaTime = this._futureTrackDeltaTimeCache;
        this._futureTrackDeltaTimeCache = -1;
    }

    /**
     * Updates the value of `#_isPaused`
     *
     * Calls to this method will happen externally as a result of a user
     * interaction with the controls bar
     *
     * This value is used in reference to `#_frameDeltaTime`. So `#_isPaused`
     * will be true if the app is _either_ paused or blurred. When this
     * value is true, `#_frameDeltaTime` value will be `0` so the position
     * of moving objects will not changes while `#_isPaused` is `true`
     *
     * @for TimeKeeper
     * @method setPause
     * @param nextPaus {boolean}
     */
    setPause(nextPause) {
        if (nextPause === this._isPaused) {
            return;
        }

        this._isPaused = nextPause;
    }

    /**
     * Helper method used by the `CanvasController` to determine whether or not we
     * should re-calculate and re-draw
     *
     * This returns `true` once every `#_frameStep` based on total `#_elapsedFrameCount`
     *
     * @for TimeKeeper
     * @method shouldUpdate
     * @return {boolean}
     */
    shouldUpdate() {
        return this._elapsedFrameCount % this._frameStep === 0;
    }

    /**
     * Update time and `#_frameDeltaTime` values
     *
     * Should be called at the end of each update cycle by the `AppController`
     * Calling this method signifies the end of a frame and the beginning of
     * a new frame
     *
     * @for TimeKeeper
     * @method update
     */
    update() {
        if (this._futureTrackDeltaTimeCache !== -1) {
            return;
        }

        const currentTime = this.gameTimeSeconds;

        this._incrementFrame();
        this._calculateNextDeltaTime(currentTime);
        this._calculateFrameStep();
    }

    /**
     * Update the value of `#_simulationRate`
     *
     * Calls to this method will happen externally as a result of a user interaction
     * with the controls bar or by issuing a system command.
     *
     * @for TimeKeeper
     * @method updateSimulationRate
     * @param nextTimewarp {number}  the next value for `#_simulationRate`
     */
    updateSimulationRate(nextTimewarp) {
        if (nextTimewarp < 0) {
            return;
        }

        this._simulationRate = nextTimewarp;
    }

    /**
     * Increments the `#_elapsedFrameCount` value by `1`
     *
     * Called every frame via `.update()`
     *
     * Calls to this method signal the start of a new frame
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
     * and `#_previousFrameTimestamp`
     *
     * Called every frame via `.update()`
     *
     * @for TimeKeeper
     * @method _calculateNextDelatTime
     * @param currentTime {number} current time in seconds
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
     * Updates the `#_frameStep` value based on the current `#_simulationRate`
     *
     * Called every frame via `.update()`
     *
     * @for CanvasController
     * @method _calculateFrameStep
     * @private
     */
    _calculateFrameStep() {
        // TODO: what do the magic numbers mean?
        this._frameStep = Math.round(extrapolate_range_clamp(1, this._simulationRate, 10, 30, 1));
    }


    /**
     * Boolean abstraction used to determine if this frame is being calculated after returning
     * from pause, which is assumed when `#_frameDeltaTime` is greater than `1` and
     * `#_simulationRate` is `1`. And this is not part of a future track calculation, when
     * `#_futureTrackDeltaTimeCache` is `-1`.
     *
     * @for TimeKeeper
     * @method _isReturningFromPauseAndNotFutureTrack
     * @return {boolean}
     */
    _isReturningFromPauseAndNotFutureTrack() {
        return this.deltaTime >= 1 && this._simulationRate === 1 && this._futureTrackDeltaTimeCache === -1;
    }
}

export default new TimeKeeper();
