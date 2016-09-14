/**
 * @property CLASSNAMES
 * @type {Object}
 * @final
 */
export const CLASSNAMES = {
    // for game interactions
    ACTIVE: 'active',
    PAUSED: 'paused',
    FAST_FORWARDS: 'fast-forwards',
    PAUSE_TOGGLE: 'pause-toggle',
    SPEED_2: 'speed-2',
    SPEED_5: 'speed-5',
    NAGATIVE: 'negative',

    // AircraftInstanceModel
    ALL_SET: 'allSet',
    FOLLOWING_STAR: 'followingSTAR',
    HOLD: 'hold',
    RUNWAY: 'runway',
    LOOKING_GOOD: 'lookingGood',

    // : 'fast-forwards',
    // : 'speech-toggle',
    // : 'switch-airport',
    // : 'toggle-tutorial',
    // : 'pause-toggle',
    // : 'toggle-labels'
    // : 'toggle-restricted-areas'
    // : 'toggle-sids'
    // : 'toggle-terrain'
    // : 'airport'
    // : 'switch-airport'
    // : 'control'
};

/**
 * @property SELECTOR_IDS
 * @type {Object}
 * @final
 */
export const IDS = {
    SCORE: '#score',

    // #paused img,
    // #toggle-options
    // #airport-list
    // #log
    // #airport-switch
    // #options-dialog
};

/**
 * Combinator constant.
 *
 * Allows for a single import that has access to both CLASSNAMES and SELECTOR_IDS
 *
 * @property SELECTORS
 * @type {Object}
 * @final
 */
export const SELECTORS = {
    CLASSNAMES,
    IDS
};
