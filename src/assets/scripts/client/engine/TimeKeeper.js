/**
 * @property TIME_SECONDS_OFFSET
 * @type {number}
 * @final
 */
const TIME_SECONDS_OFFSET = 0.001;

/**
 * Singleton used to manage game time
 *
 * @class TimeKeeper
 */
class TimeKeeper {
    /**
     * @constructor
     */
    constructor() {
        /**
         * Timestamp for the start of rendering
         *
         * @property start
         * @type {number}
         * @private
         */
        this._start = this.gameTime;

        /**
         * Timestamp for the current frame
         *
         * @property _frameStartTime
         * @type {number}
         * @private
         */
        this._frameStartTime = this.gameTime;

        /**
         * Timestamp for the last frame
         *
         * @property _lastFrameTime
         * @type {number}
         */
        this._lastFrameTime = this.gameTime;

        /**
         * Nubmer of frames rendered
         *
         * @property frames
         * @type {number}
         * @default 0
         * @private
         */
        this._elapsedFrameCount = 0;

        /**
         * Difference in time between the `#lastFrame` and the current frame
         *
         * @property _frameDeltaTime
         * @type {number}
         * @default 0
         * @private
         */
        this._frameDeltaTime = 0;
    }

    /**
     * Current timestamp in milliseconds
     *
     * @property gameTime
     * @return {number} current time in milliseconds
     */
    get gameTime() {
        return (new Date()).getTime() * TIME_SECONDS_OFFSET;
    }

    /**
     * @property deltaTime
     * @return {number} current delta time in milliseconds
     */
    get deltaTime() {
        return this._frameDeltaTime;
    }

    /**
     * Reset model properties
     *
     * @for TimeKeeper
     * @method reset
     */
    reset() {
        const currentTime = this.gameTime;

        this._start = currentTime;
        this._frameStartTime = currentTime;
        this._lastFrameTime = currentTime;
        this._elapsedFrameCount = 0;
        this._frameDeltaTime = 0;
    }

    /**
     *
     *
     * @for TimeKeeper
     * @method update
     */
    update() {
        const currentTime = this.gameTime;

        this._incrementFrame();
        this._calculateNextDeltaTime(currentTime);
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
     * and `#_lastFrameTime`.
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
        const elapsed = currentTime - this._frameStartTime;

        if (elapsed > frameDelay) {
            this._frameStartTime = currentTime;
        }

        this._frameDeltaTime = currentTime - this._lastFrameTime;
        this._lastFrameTime = currentTime;
    }
}

export default new TimeKeeper();
