import _has from 'lodash/has';
import { EXPEDITE } from './commandMap';

/**
 *
 * @function zeroArgumentsValidator
 * @param args {array}
 * @return {string|undefined}
 */
export const zeroArgumentsValidator = (args = []) => {
    if (args.length !== 0) {
        return 'Invalid argument length. Expected exactly zero arguments';
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
        return 'Invalid argment length. Expected exactly one argument';
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
        return 'Invalid argument length. Expected zero or one argument';
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
        return 'Invalid argument length. Expected one or two arguments';
    }
};

/**
 *
 * @function altitudeArgumentValidator
 * @param args {array}
 * @return {string|undefined}
 */
export const altitudeArgumentValidator = (args = []) => {
    const hasError = oneOrTwoArgumentValidator(args);

    if (hasError) {
        return hasError;
    }

    if (args.length === 2 && EXPEDITE.indexOf(args[1]) === -1) {
        return 'Invalid argument. Altitude accepts only "expedite" or "x" as a second argument';
    }
};
