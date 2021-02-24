/**
* @property AUTOCOMPLETE_COMMAND_TYPE
* @type {Object}
* @final
*/
export const AUTOCOMPLETE_COMMAND_TYPE = {
    TRANSMIT: 'transmit',
    SYSTEM: 'system'
};

/**
* @property AUTOCOMPLETE_STATE
* @type {Object}
* @final
*/
export const AUTOCOMPLETE_STATE = {
    COMMANDS: {
        NO_MATCHES: 'autocomplete_commands_no_matches',
        MATCHES: 'autocomplete_commands_matches',
        HIGHLIGHT: 'autocomplete_commands_highlight'
    },
    PARAMS: {
        INVALID: 'autocomplete_params_invalid',
        VALID: 'autocomplete_params_valid'
    }
};

/**
* @property AUTOCOMPLETE_COMMAND_STATES
* @type {Array}
* @final
*/
export const AUTOCOMPLETE_COMMAND_STATES = Object.values(AUTOCOMPLETE_STATE.COMMANDS);

/**
* @property AUTOCOMPLETE_INPUT_PLACEHOLDER
* @type {Object}
* @final
*/
export const AUTOCOMPLETE_INPUT_PLACEHOLDER = {
    COMMAND: 'search commands',
    PARAM: 'input arguments'
};

/**
* @property AUTOCOMPLETE_PARAMS_VALIDITY
* @type {Object}
* @final
*/
export const AUTOCOMPLETE_PARAMS_VALIDITY = {
    INVALID: 'invalid',
    CANDIDATE: 'candidate',
    VALID: 'valid'
};

/**
* @property AUTOCOMPLETE_REGEXP
* @type {Object}
* @final
*/
export const AUTOCOMPLETE_REGEXP = {
    WHITESPACE: /\s+/,
    FIRST_TOKEN: /(\S+)/,
    TOKEN_MID: /\S\S/,
    TOKEN_END: /\S\s|\S$/
};
