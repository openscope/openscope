/**
 * @property EVENT
 * @type {Object}
 * @final
 */
export const EVENT = {
    /**
     * @memberof EVENT
     * @property AIRPORT_CHANGE
     * @type {string}
     */
    AIRPORT_CHANGE: 'airport-change',

    /**
     * Fired when the update loop should be either paused or resumed.
     *
     * Usually called when airport data is changing (ie, when a new airport
     * is being loaded).
     *
     * @memberof EVENT
     * @property SHOULD_PAUSE_UPDATE_LOOP
     * @type {string}
     */
    SHOULD_PAUSE_UPDATE_LOOP: 'should-pause-update-loop'
};
