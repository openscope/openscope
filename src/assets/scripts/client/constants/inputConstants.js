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
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
 *
 * @property KEY_CODES
 * @type {Object}
 * @final
 */
export const KEY_CODES = {

    ENTER: 'Enter',
    // esc
    ESCAPE: 'Escape',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
    TAB: 'Tab',
    // numpad
    NUM_MULTIPLY: 'NumpadMultiply',
    NUM_ADD: 'NumpadAdd',
    NUM_SUBTRACT: 'NumpadSubtract',
    NUM_DIVIDE: 'NumpadDivide',
    // arrow keys
    LEFT_ARROW: 'ArrowLeft',
    UP_ARROW: 'ArrowUp',
    RIGHT_ARROW: 'ArrowRight',
    DOWN_ARROW: 'ArrowDown',
    // F-Keys
    F1: 'F1',
    F2: 'F2',
    F3: 'F3',
    F4: 'F4',
    F5: 'F5',
    F6: 'F6',
    F7: 'F7',
    F8: 'F8',
    F9: 'F9',
    F10: 'F10',
    F11: 'F11',
    F12: 'F12',
    // `
    BAT_TICK: 'Backquote'
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
