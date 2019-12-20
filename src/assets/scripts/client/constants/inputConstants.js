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

    CONTROL_LEFT: 'ControlLeft',
    CONTROL_RIGHT: 'ControlRight',
    SHIFT_LEFT: 'ShiftLeft',
    SHIFT_RIGHT: 'ShiftRight',
    ENTER: 'Enter',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
    // numpad
    NUM_MULTIPLY: 'NumpadMultiply',
    NUM_ADD: 'NumpadAdd',
    NUM_SUBTRACT: 'NumpadSubtract',
    NUM_DIVIDE: 'NumpadDivide',
    NUM_ENTER: 'NumpadEnter',
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
 * Enumeration of key codes used for inputs (for older browsers like IE)
 *
 * @property LEGACY_KEY_CODES
 * @type {Object}
 * @final
 */
export const LEGACY_KEY_CODES = {

    ENTER: 13,
    ESCAPE: 27,
    TAB: 9,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    // numpad
    NUM_MULTIPLY: 106,
    NUM_ADD: 107,
    NUM_SUBTRACT: 109,
    NUM_DIVIDE: 111,
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
    BAT_TICK: 220
};

/**
 * Enumeration of the render styles used by `MeasureTool`
 */
export const MEASURE_TOOL_STYLE = {
    STRAIGHT: 'straight',
    ARC_TO_NEXT: 'initial_turn',
    ALL_ARCED: 'arced'
};

/**
 * Enumeration of the mouse button names
 *
 * @property MOUSE_BUTTON_NAMES
 * @type {Object}
 * @final
 */
export const MOUSE_BUTTON_NAMES = {
    LEFT: 'left',
    MIDDLE: 'middle',
    RIGHT: 'right'
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
