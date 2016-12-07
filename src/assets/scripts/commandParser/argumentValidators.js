import _isBoolean from 'lodash/isBoolean';
import _isNan from 'lodash/isNaN';
import _isString from 'lodash/isString';
import { convertStringToNumber } from '../utilities/unitConverters';
import { EXPEDITE } from './commandMap';

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
 * @property ERROR_MESSAGE
 * @type {Object}
 * @final
 */
const ERROR_MESSAGE = {
    ZERO_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected exactly zero arguments`,
    SINGLE_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected exactly one argument`,
    ZERO_OR_ONE_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected zero or one argument`,
    ONE_OR_TWO_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected one or two arguments`,
    ONE_TO_THREE_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected one, two, or three arguments`,
    ONE_OR_THREE_ARG_LENGTH: `${INVALID_ARG_LENGTH}. Expected one or three arguments`,
    ALTITUDE_EXPEDITE_ARG: `${INVALID_ARG}. Altitude accepts only "expedite" or "x" as a second argument`,
    HEADING_MUST_BE_NUMBER: `${INVALID_ARG}. Heading must be a number`,
    MUST_BE_STRING: `${INVALID_ARG}. Must be a string`,
    INVALID_DIRECTION_STRING: `${INVALID_ARG}. Expected one of 'left / l / right / r' as the first argument when passed three arguments`,
    HEADING_ACCEPTS_BOOLEAN_AS_THIRD_ARG: `${INVALID_ARG}. Heading accepts a boolean for the third argument when passed three arguments`,
    INVALID_HOLD_DIRECTION: `${INVALID_ARG}. Hold direction must be either left or right`,
    INVALID_HOLD_LENGTH_UNIT: `${INVALID_ARG}. Hold length must be either min (minutes) or nm (nautical miles)`
};

/**
 * Check that `args` has exactly zero values
 *
 * @function zeroArgumentsValidator
 * @param args {array}
 * @return {string|undefined}
 */
export const zeroArgumentsValidator = (args = []) => {
    if (args.length !== 0) {
        return ERROR_MESSAGE.ZERO_ARG_LENGTH;
    }
};

/**
 * Checks that `args` has exactly one value
 *
 * @function singleArgumentValidator
 * @param args {array}
 * @return {string|undefined}
 */
export const singleArgumentValidator = (args = []) => {
    if (args.length !== 1) {
        return ERROR_MESSAGE.SINGLE_ARG_LENGTH;
    }
};

/**
 * Checks that `args` has exactly zero or one value
 *
 * @function zeroOrOneArgumentValidator
 * @param args {array}
 * @return {string|undefined}
 */
export const zeroOrOneArgumentValidator = (args = []) => {
    if (args.length > 1) {
        return ERROR_MESSAGE.ZERO_OR_ONE_ARG_LENGTH;
    }
};

/**
 * Checks that `args` has exactly one or two values
 *
 * @function oneOrTwoArgumentValidator
 * @param args {array}
 * @return {string|undefined}
 */
export const oneOrTwoArgumentValidator = (args = []) => {
    if (args.length < 1 || args.length > 2) {
        return ERROR_MESSAGE.ONE_OR_TWO_ARG_LENGTH;
    }
};

/**
 * Checks that `args` has exactly one, two or three values
 *
 * @function oneToThreeArgumentsValidator
 * @param args {array}
 * @return {string|undefined}
 */
export const oneToThreeArgumentsValidator = (args = []) => {
    if (args.length === 0 || args.length > 3) {
        return ERROR_MESSAGE.ONE_TO_THREE_ARG_LENGTH;
    }
};

/**
 * Checks that `args` has exactly one or three values
 *
 * @function oneOrThreeArgumentsValidator
 * @param args {array}
 * @return {string|undefined}
 */
export const oneOrThreeArgumentsValidator = (args = []) => {
    if (args.length !== 1 && args.length !== 3) {
        return ERROR_MESSAGE.ONE_OR_THREE_ARG_LENGTH;
    }
};

/**
 * Checks that args is the required length and the data is of the correct type
 *
 * ```
 * Allowed argument shapes:
 * - ['030']
 * - ['030', 'expedite']
 * - ['030', 'x']
 * ```
 *
 * @function altitudeValidator
 * @param args {array}
 * @return {string|undefined}
 */
export const altitudeValidator = (args = []) => {
    const hasLengthError = oneOrTwoArgumentValidator(args);

    if (hasLengthError) {
        return hasLengthError;
    }

    if (args.length === 2 && EXPEDITE.indexOf(args[1]) === -1) {
        return ERROR_MESSAGE.ALTITUDE_EXPEDITE_ARG;
    }
};

/**
 * Returns true if value is one of `left / l / right / r`
 *
 * @function isValidDirectionString
 * @param value {string}
 * @return {boolean}
 */
export const isValidDirectionString = (value) => {
    return value === 'left' ||
        value === 'l' ||
        value === 'right' ||
        value === 'r';
}

/**
 * Checks that args is the required length and the data is of the correct type for the number of arguments
 *
 * ```
 * Allowed arguments shapes:
 * - ['180']
 * - ['left', '180']
 * - ['l', '180']
 * - ['right', '180', true]
 * - ['r', '180', true]
 * ```
 *
 * @function headingValidator
 * @param args {array}
 * @return {string|undefined}
 */
export const headingValidator = (args = []) => {
    const length = args.length;
    const hasLengthError = oneToThreeArgumentsValidator(args);
    let numberFromString;

    if (hasLengthError) {
        return hasLengthError;
    }

    switch (length) {
        case 1:
            numberFromString = convertStringToNumber(args[0]);

            if (_isNan(numberFromString)) {
                return ERROR_MESSAGE.HEADING_MUST_BE_NUMBER;
            }

            break;
        case 2:
            numberFromString = convertStringToNumber(args[1]);

            if (!isValidDirectionString(args[0])) {
                return ERROR_MESSAGE.INVALID_DIRECTION_STRING;
            }

            if (isNaN(numberFromString)) {
                return ERROR_MESSAGE.HEADING_MUST_BE_NUMBER;
            }

            break;
        case 3:
            numberFromString = convertStringToNumber(args[1]);

            if (!isValidDirectionString(args[0])) {
                return ERROR_MESSAGE.INVALID_DIRECTION_STRING;
            }

            if (isNaN(numberFromString)) {
                return ERROR_MESSAGE.HEADING_MUST_BE_NUMBER;
            }

            if (!_isBoolean(args[2])) {
                return ERROR_MESSAGE.HEADING_ACCEPTS_BOOLEAN_AS_THIRD_ARG;
            }

            break;
        // default case is included only for semtantics, this should not ever be reachable
        // istanbul ignore next
        default:
            throw new Error('An error ocurred parsing the Heading arguments');
    }
};

/**
 * Checks that args is the required length and the data is of the correct type for the number of arguments
 *
 * ```
 * Allowed argument shapes:
 * - ['dumba']
 * - ['dumba', 'left', '2min']
 * - ['dumba', 'left', '2nm']
 * - ['dumba', 'right', '2min']
 * - ['dumba', 'right', '2nm']
 * ```
 *
 * @function holdValidator
 * @param args {array}
 * @return {array<string>}
 */
export const holdValidator = (args = []) => {
    const length = args.length;
    const hasLengthError = oneOrThreeArgumentsValidator(args);

    if (hasLengthError) {
        return hasLengthError;
    }

    switch (length) {
        case 1:
            if (!_isString(args[0])) {
                return ERROR_MESSAGE.MUST_BE_STRING;
            }

            break;
        case 3:
            if (!_isString(args[0]) || !_isString(args[1]) || !_isString(args[2])) {
                return ERROR_MESSAGE.MUST_BE_STRING;
            }

            if (args[1] !== 'left' && args[1] !== 'right') {
                return ERROR_MESSAGE.INVALID_HOLD_DIRECTION;
            }

            if (args[2].indexOf('min') === -1 && args[2].indexOf('nm') === -1) {
                return ERROR_MESSAGE.INVALID_HOLD_LENGTH_UNIT;
            }

            break;
        // default case is included only for semtantics, this should not ever be reachable
        // istanbul ignore next
        default:
            throw new Error('An error ocurred parsing the Hold arguments');
    }
};
