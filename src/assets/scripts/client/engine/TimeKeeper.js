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
         */
        this.start = this.gameTime;

        /**
         * Nubmer of frames rendered
         *
         * @property frames
         * @type {number}
         * @default 0
         */
        this.frames = 0;

        /**
         * Timestamp for the current frame
         *
         * @property frameStartTime
         * @type {number}
         */
        this.frameStartTime = this.gameTime;

        /**
         * Timestamp for the last frame
         *
         * @property lastFrameTime
         * @type {number}
         */
        this.lastFrameTime = this.gameTime;

        /**
         * Difference in time between the `#lastFrame` and the current frame
         *
         * @property frameDeltaTime
         * @type {number}
         * @default 0
         */
        this.frameDeltaTime = 0;
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
        return this.frameDeltaTime;
    }

    /**
     * Reset model properties
     *
     * @for TimeKeeper
     * @method reset
     */
    reset() {
        const currentTime = this.gameTime;

        this.time = {};
        this.start = currentTime;
        this.frames = 0;
        this.frameStartTime = currentTime;
        this.lastFrameTime = currentTime;
        this.frameDeltaTime = 0;
    }

    /**
     * Move to the next frame
     *
     * @for TimeKeeper
     * @method incrementFram
     */
    incrementFrame() {
        const frameDelay = 1;
        const currentTime = this.gameTime;
        const elapsed = currentTime - this.frameStartTime;

        this.frames += 1;

        if (elapsed > frameDelay) {
            this.frameStartTime = currentTime;
        }

        this.frameDeltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
    }
}

export default new TimeKeeper();
