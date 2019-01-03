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

    // -
    DASH: 189,
    DASH_FIREFOX: 173,
    ENTER: 13,
    // =
    EQUALS: 187,
    EQUALS_FIREFOX: 61,
    // esc
    ESCAPE: 27,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    TAB: 9,
    //
    MULTIPLY: 106,
    ADD: 107,
    SUBTRACT: 109,
    DIVIDE: 111,
    // arrow keys
    LEFT_ARROW: 37,
    UP_ARROW: 38,
    RIGHT_ARROW: 39,
    DOWN_ARROW: 40,
    // F-Keys
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
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
    AIRAC: 'airac',
    AIRPORT: 'airport',
    AUTO: 'auto',
    CLEAR: 'clear',
    PAUSE: 'pause',
    RATE: 'rate',
    TIMEWARP: 'timewarp',
    TRANSMIT: 'transmit',
    TUTORIAL: 'tutorial'
};
