import _isNaN from 'lodash/isNaN';
import _isString from 'lodash/isString';
import _forEach from 'lodash/forEach';
import { convertStringToNumber } from '../../utilities/unitConverters';
import { EXPEDITE } from './aircraftCommandMap';
import { ERROR_MESSAGE } from './aircraftCommandParserMessages';
import {
    INVALID_INDEX,
    REGEX
} from '../../constants/globalConstants';

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

    const numberFromString = convertStringToNumber(args[0]);

    if (_isNaN(numberFromString)) {
        return ERROR_MESSAGE.ALTITUDE_MUST_BE_NUMBER;
    }

    if (args.length === 2 && EXPEDITE.indexOf(args[1]) === INVALID_INDEX) {
        return ERROR_MESSAGE.ALTITUDE_EXPEDITE_ARG;
    }
};

/**
 * Verifies a list of fix names are all strings and that there is at least one
 *
 * @function fixValidator
 * @param args {array}
 * @return {array<string>}
 */
export const fixValidator = (args = []) => {
    let hasTypeError;

    if (args.length < 1) {
        return ERROR_MESSAGE.ONE_OR_MORE_ARG_LENGTH;
    }

    _forEach(args, (arg) => {
        if (!_isString(arg) && !hasTypeError) {
            hasTypeError = ERROR_MESSAGE.MUST_BE_STRING;
        }
    });

    if (hasTypeError) {
        return hasTypeError;
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
};

/**
 * Checks that args is the required length and the data is of the correct type for the number of arguments
 *
 * ```
 * Allowed arguments shapes:
 * - ['180']
 * - ['left', '180']
 * - ['l', '180']
 * - ['left', '80']
 * - ['l', '80']
 * ```
 *
 * @function headingValidator
 * @param args {array}
 * @return {string|undefined}
 */
export const headingValidator = (args = []) => {
    const length = args.length;
    const hasLengthError = oneOrTwoArgumentValidator(args);
    let numberFromString;

    if (hasLengthError) {
        return hasLengthError;
    }

    switch (length) {
        case 1:
            numberFromString = convertStringToNumber(args[0]);

            if (_isNaN(numberFromString)) {
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
        // default case is included only for semtantics, this should not ever be reachable
        // istanbul ignore next
        default:
            throw new Error('An error ocurred parsing the Heading arguments');
    }
};

/**
 * Checks that args is the required length and the data is of the correct type
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
    if (args.length > 3) {
        return ERROR_MESSAGE.ZERO_TO_THREE_ARG_LENGTH;
    }

    for (let i = 0; i < args.length; i++) {
        if (!_isString(args[i])) {
            return ERROR_MESSAGE.MUST_BE_STRING;
        }
    }
};

/**
 * Checks that `args` has one value that corresponds to a valid squawk
 *
 * @function squawkValidator
 * @param args {array}
 * @return {string|undefined}
 */
export const squawkValidator = (args = []) => {
    if (args.length !== 1) {
        return ERROR_MESSAGE.SINGLE_ARG_LENGTH;
    }

    if (!REGEX.TRANSPONDER_CODE.test(args[0])) {
        return ERROR_MESSAGE.INVALID_SQUAWK;
    }
};
