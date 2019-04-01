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
    AIRCRAFT: 'aircraft',
    AIRPORT_LIST_ITEM_IS_ACTIVE: 'mix-airport-list-item_isActive',
    AIRPORT_LIST_ITEM: 'airport-list-item',
    AIRPORT_LIST: 'airport-list',
    ALL_SET: 'allSet',
    ALTITUDE: 'altitude',
    ARRIVAL: 'arrival',
    BLACKBOX: 'blackBox',
    CALLSIGN: 'callsign',
    CHANGELOG_CONTAINER: 'js-changelogContainer',
    CHANGELOG_CONTENT: 'js-changelog',
    CHANGELOG_DISMISS: 'js-dismissChangelog',
    CHANGELOG_VERSION: 'changelog-version',
    CHANGELOG_VISIBLE: 'changelog-container_isOpen',
    CHANGELOG_TOGGLE: 'js-changelogToggle',
    CONTROL: 'control',
    DEPARTURE: 'departure',
    DESTINATION: 'destination',
    DIALOG: 'dialog',
    DIALOG_BODY: 'dialog-body',
    FAST_FORWARDS: 'fast-forwards',
    FOLLOWING_STAR: 'followingSTAR',
    FORM_VALUE: 'form-value',
    HEADING: 'heading',
    HIDDEN: 'hidden',
    HOLD: 'hold',
    LEFT: 'left',
    LOADING_VIEW: 'js-loadingView',
    LOOKING_GOOD: 'lookingGood',
    MESSAGE: 'message',
    NEGATIVE: 'negative',
    NEXT: 'next',
    NOT_SELECTABLE: 'notSelectable',
    OPEN: 'open',
    OPTIONS_DIALOG: 'option-dialog',
    TRAFFIC_DIALOG: 'traffic-dialog',
    OVERFLIGHT: 'overflight',
    PAUSE_TOGGLE: 'pause-toggle',
    PAUSED: 'paused',
    PREV: 'prev',
    RIGHT: 'right',
    RUNWAY: 'runway',
    SPEED_2: 'speed-2',
    SPEED_5: 'speed-5',
    SPEED: 'speed',
    STRIP_VIEW_AIRCRAFT_TYPE: '.js-stripView-aircraftModel',
    STRIP_VIEW_ALTERNATE_AIRPORT_ID: '.js-stripView-alternateAirportId',
    STRIP_VIEW_ARRIVAL_AIRPORT_ID: '.js-stripView-arrivalAirportId',
    STRIP_VIEW_ARRIVALS_LIST: 'js-stripViewArrivals-list',
    STRIP_VIEW_ASSIGNED_ALTITUDE: '.js-stripView-assignedAltitude',
    STRIP_VIEW_CALLSIGN: '.js-stripView-callsign',
    STRIP_VIEW_CID: '.js-stripView-cid',
    STRIP_VIEW_DEPARTURE_AIRPORT_ID: '.js-stripView-departureAirportId',
    STRIP_VIEW_DEPARTURES_LIST: 'js-stripViewDepartures-list',
    STRIP_VIEW_FLIGHT_PLAN_ALTITUDE: '.js-stripView-flightPlanAltitude',
    STRIP_VIEW_FLIGHT_PLAN: '.js-stripView-flightPlan',
    STRIP_VIEW_IS_HIDDEN: 'mix-stripView_isHidden',
    STRIP_VIEW_PREPLANNING: 'stripView-preplanning',
    STRIP_VIEW_REMARKS: '.js-stripView-remarks',
    STRIP_VIEW_RUNWAY: '.js-stripView-runway',
    STRIP_VIEW_TRANSPONDER: '.js-stripView-transponder',
    STRIP_VIEW_TRIGGER: 'js-stripView-trigger',
    STRIP_VIEW: 'js-stripView',
    STRIP: 'strip',
    SWITCH_AIRPORT: 'switch-airport',
    TOGGLE_LABELS: 'toggle-labels',
    TOGGLE_RESTRICTED_AREAS: 'toggle-restricted-areas',
    TOGGLE_SIDS: 'toggle-sids',
    TOGGLE_STARS: 'toggle-stars',
    TOGGLE_TERRAIN: 'toggle-terrain',
    TOGGLE_TUTORIAL: 'toggle-tutorial',
    TOGGLE_VIDEO_MAP: 'toggle-video-map',
    TOGGLE_TRAFFIC: 'toggle-traffic',
    TOGGLE_SPEECH: 'toggle-speech',
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
    AIRPORT_SWITCH: 'airport-switch',
    CANVASES: 'canvases',
    CLOCK: 'clock',
    COMMAND: 'command',
    LOADING: 'loading',
    LOG: 'log',
    NAVAIDS_CANVAS: 'navaids-canvas',
    PAUSED: 'paused',
    TOGGLE_OPTIONS: 'toggle-options',
    TUTORIAL: 'tutorial',
    GITHUB_EXTERNAL_LINK: 'js-github-external-link',
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
