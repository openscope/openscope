/* eslint-disable max-len */
/**
 * @property INVALID_ARG
 * @type {string}
 * @final
 */
const INVALID_ARG = 'Invalid argument';

/**
 * @property INVALID_ARG_LENGTH
 * @type {string}
 * @final
 */
const INVALID_ARG_LENGTH = `${INVALID_ARG} length`;

/**
 * Encapsulation of error messaging used with `argumentValidators` functions
 *
 * @property ERROR_MESSAGE
 * @type {Object}
 * @final
 */
export const ERROR_MESSAGE = {
    ZERO_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected exactly zero arguments`,
    SINGLE_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected exactly one argument`,
    TWO_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected exactly two arguments`,
    THREE_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected exactly three arguments`,
    ZERO_OR_ONE_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected zero or one argument`,
    ZERO_TO_THREE_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected zero to three arguments`,
    ONE_OR_MORE_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected one or more arguments`,
    ONE_OR_TWO_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected one or two arguments`,
    ONE_TO_THREE_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected one, two, or three arguments`,
    ONE_OR_THREE_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected one or three arguments`,
    ALTITUDE_MUST_BE_NUMBER: `${INVALID_ARG}. Altitude must be a number`,
    ALTITUDE_EXPEDITE_ARG: `${INVALID_ARG}. Altitude accepts only "expedite" or "x" as a second argument`,
    HEADING_MUST_BE_NUMBER: `${INVALID_ARG}. Heading must be a number`,
    MUST_BE_STRING: `${INVALID_ARG}. Must be a string`,
    INVALID_DIRECTION_STRING: `${INVALID_ARG}. Expected one of 'left / l / right / r' as the first argument when passed three arguments`,
    HEADING_ACCEPTS_BOOLEAN_AS_THIRD_ARG: `${INVALID_ARG}. Heading accepts a boolean for the third argument when passed three arguments`,
    INVALID_SQUAWK: `${INVALID_ARG}. Expected '0000'-'7777' for the transponder code.`
};
