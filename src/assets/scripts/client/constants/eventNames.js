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
     * An aircraft progress strip was clicked
     *
     * @memberof EVENT
     * @property STRIP_CLICK
     * @type {string}
     */
    STRIP_CLICK: 'string-click',

    /**
     * An aircraft progress strip was double clicked
     *
     * @memberof EVENT
     * @property STRIP_DOUBLE_CLICK
     * @type {string}
     */
    STRIP_DOUBLE_CLICK: 'string-double-click',

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
