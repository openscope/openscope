import _mapValues from 'lodash/mapValues';

/**
 * CSS classnames used throught the app.
 *
 * @property CLASSNAMES
 * @type {Object}
 * @final
 */
export const CLASSNAMES = {
    ACTIVE: 'active',
    ALL_SET: 'allSet',
    CONTROL: 'control',
    FAST_FORWARDS: 'fast-forwards',
    FOLLOWING_STAR: 'followingSTAR',
    HIDDEN: 'hidden',
    HOLD: 'hold',
    LEFT: 'left',
    LOOKING_GOOD: 'lookingGood',
    NEGATIVE: 'negative',
    NEXT: 'next',
    OPEN: 'open',
    PAUSED: 'paused',
    PAUSE_TOGGLE: 'pause-toggle',
    PREV: 'prev',
    RIGHT: 'right',
    RUNWAY: 'runway',
    SPEED_2: 'speed-2',
    SPEED_5: 'speed-5',
    STRIP: 'strip',
    SWITCH_AIRPORT: 'switch-airport',
    TOGGLE_LABELS: 'toggle-labels',
    TOGGLE_RESTRICTED_AREAS: 'toggle-restricted-areas',
    TOGGLE_TERRAIN: 'toggle-terrain',
    TOGGLE_TUTORIAL: 'toggle-tutorial',
    TOGGLE_SIDS: 'toggle-sids',
    WARN: 'warn',
    WARNING_BUTTON: 'warning-button'
};

/**
 * CSS IDs used throughout the app.
 *
 * @property SELECTOR_IDS
 * @type {Object}
 * @final
 */
export const IDS = {
    AIRPORT: 'airport',
    AIRPORT_LIST: 'airport-list',
    AIRPORT_LIST_NOTES: 'airport-list-notes',
    AIRPORT_SWITCH: 'airport-switch',
    CANVASES: 'canvases',
    COMMAND: 'command',
    LOG: 'log',
    OPTIONS_DIALOG: 'options-dialog',
    TOGGLE_OPTIONS: 'toggle-options',
    TUTORIAL: 'tutorial',
    SCORE: 'score',
    SIDEBAR: 'sidebar'
};

/**
 * Take a classname string and return a classname selector that can be used by jQuery to find an HTML Element.
 *
 * @function buildSelectorsFromClassnames
 * @return {object}
 */
const buildSelectorsFromClassnames = () => {
    const classnameSelectors = _mapValues(CLASSNAMES, (value) => {
        return `.${value}`;
    });

    return classnameSelectors;
};

/**
 *
 * @function buildSelectorsFromIds
 * @return {object}
 */
const buildSelectorsFromIds = () => {
    const idSelectors = _mapValues(IDS, (value) => {
        return `#${value}`;
    });

    return idSelectors;
};

/**
 * @property DOM_SELECTORS
 * @type {Object}
 * @final
 */
const DOM_SELECTORS = {
    ...buildSelectorsFromClassnames(),
    ...buildSelectorsFromIds()
};

/**
 * Combinator constant.
 *
 * Allows for a single import that has access to both CLASSNAMES, IDS and DOM_SELECTORS
 *
 * @property SELECTORS
 * @type {Object}
 * @final
 */
export const SELECTORS = {
    CLASSNAMES,
    IDS,
    DOM_SELECTORS
};
