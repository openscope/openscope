import _isNan from 'lodash/isNaN';
import { convertStringToNumber } from '../utilities/unitConverters';
import { EXPEDITE } from './commandMap';

/**
 * @property INVALID_ARG_LENGTH
 * @type {string}
 * @final
 */
const INVALID_ARG_LENGTH = 'Invalid argument length';

/**
 * @property ERROR_MESSAGE
 * @type {Object}
 * @final
 */
const ERROR_MESSAGE = {
    ZERO_ARG_LENGTH: 'Invalid argument length. Expected exactly zero arguments',
    SINGLE_ARG_LENGTH: 'Invalid argment length. Expected exactly one argument',
    ZERO_OR_ONE_ARG_LENGTH: 'Invalid argument length. Expected zero or one argument',
    ONE_OR_TWO_ARG_LENGTH: 'Invalid argument length. Expected one or two arguments',
    ONE_TO_THREE_ARG_LENGTH: 'Invalid argument length. Expected one, two, or three arguments'
};

/**
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
 *
 * @function altitudeValidator
 * @param args {array}
 * @return {string|undefined}
 */
export const altitudeValidator = (args = []) => {
    const hasError = oneOrTwoArgumentValidator(args);

    if (hasError) {
        return hasError;
    }

    if (args.length === 2 && EXPEDITE.indexOf(args[1]) === -1) {
        return 'Invalid argument. Altitude accepts only "expedite" or "x" as a second argument';
    }
};

/**
 * @function isValidDirectionString
 * @param value {string}
 * @return {boolean}
 */
const isValidDirectionString = (value) => {
    return value === 'left' ||
        value === 'l' ||
        value === 'right' ||
        value === 'r';
}

/**
 *
 * @function headingValidator
 * @param args {array}
 * @return {string|undefined}
 */
export const headingValidator = (args) => {
    const length = args.length;
    const hasError = oneToThreeArgumentsValidator(args);
    let numberFromString;

    if (hasError) {
        return hasError;
    }

    switch (length) {
        case 1:
            numberFromString = convertStringToNumber(args[0]);

            if (_isNan(numberFromString)) {
                return 'Invalid argument. Heading accepts a number as the first argument';
            }

            break;
        case 2:
            // console.log('two', args);
            numberFromString = convertStringToNumber(args[1]);

            if (!isValidDirectionString(args[0])) {
                return 'Invalid argument. Expected one of "left / l / right / r" as the first argument when passed two arguments';
            }

            if (isNaN(numberFromString)) {
                return 'Invalid argument. Heading accepts a number for the second argument when passed two arguments';
            }

            break;
        case 3:
            // console.log('three', args);
            break;
        default:
            break;
    }
};
