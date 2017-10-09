/**
 * Context of commands entered into command bar
 *
 * @enum COMMAND_CONTEXT
 * @type {object}
 */
export const COMMAND_CONTEXT = {
    AIRCRAFT: 'aircraft',
    SCOPE: 'scope'
};

/**
 * Enumeration of key codes used for inputs.
 *
 * @property KEY_CODES
 * @type {Object}
 * @final
 */
export const KEY_CODES = {
    // +
    ADD: 107,
    // -
    DASH: 189,
    DASH_FIREFOX: 173,
    DIVIDE: 111,
    DOWN_ARROW: 40,
    ENTER: 13,
    // =
    EQUALS: 187,
    EQUALS_FIREFOX: 61,
    // esc
    ESCAPE: 27,
    LEFT_ARROW: 37,
    MULTIPLY: 106,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    RIGHT_ARROW: 39,
    SUBTRACT: 109,
    TAB: 9,
    UP_ARROW: 38,
    // `
    BAT_TICK: 192
};

/**
 * Enumeration of mouse events returned from $event.which
 *
 * These codes can only be used with jQuery event object.
 *
 * @property MOUSE_EVENT_CODE
 * @type {Object}
 * @final
 */
export const MOUSE_EVENT_CODE = {
    LEFT_PRESS: 1,
    MIDDLE_PRESS: 2,
    RIGHT_PRESS: 3
};

/**
 * Name of a command returned from the Parser
 *
 * @property PARSED_COMMAND_NAME
 * @type {Object}
 * @final
 */
export const PARSED_COMMAND_NAME = {
    TUTORIAL: 'tutorial',
    AUTO: 'auto',
    PAUSE: 'pause',
    TIMEWARP: 'timewarp',
    CLEAR: 'clear',
    AIRPORT: 'airport',
    RATE: 'rate',
    TRANSMIT: 'transmit'
};
