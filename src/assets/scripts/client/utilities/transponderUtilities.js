import { leftPad } from './generalUtilities';
import { randint } from '../math/core';
import { REGEX } from '../constants/globalConstants';

/**
 * The highest decimal value allowed for a 4-digit
 * octal transponder code
 *
 * @property MAX_TRANSPONDER_CODE
 * @type {number}
 * @final
 */
const MAX_TRANSPONDER_CODE = 4095;

/**
 * List of transponder codes that are reserved
 *
 * This enum should be used only during the generation of
 * `AircraftModel` objects.
 *
 * The codes listed should still be assignable at the
 * controler's discretion
 *
 * @property TRANSPONDER_CODES
 * @type {array<object>}
 * @final
 */
const TRANSPONDER_CODES = [
    {
        // ICAO
        prefix: null,
        reserved: [
            // Use in Mode S environment
            '1000',
            // When entering SSR area from non-SSR as uncontrolled IFR
            '2000',
            // VFR when no other code has been assigned (eg 1200 is used in the USA)
            '7000',
            // hijack
            '7500',
            // communication failure
            '7600',
            // emergency
            '7700'
        ]
    },
    {
        // Europe
        prefix: /^([elb])/,
        reserved: [
            '0000'
        ]
    },
    {
        // Canda
        prefix: /^c/,
        reserved: [
            // VFR
            '1200'
        ]
    },
    {
        // Belgium
        prefix: /^eb/,
        reserved: [
            /^00(4[1-6]|5[0-7])$/,
            // For testing stations
            '7777'
        ]
    },
    {
        // Germany
        prefix: /^e[dt]/,
        reserved: [
            // Parachute dropping
            '0025',
            // For testing stations
            '7777'
        ]
    },
    {
        // Netherlands
        prefix: /^eh/,
        reserved: [
            // For testing stations
            '7777'
        ]
    },
    {
        // UK
        prefix: /^eg/,
        reserved: [
            // Parachute drop
            '0033'
        ]
    },
    {
        // USA
        prefix: /^k/,
        reserved: [
            // Military intercept
            '0000',
            // VFR - 12xx
            /^12[0-7][0-7]$/,
            // Military & for testing stations
            '7777'
        ]
    },
    {
        // Australia
        prefix: /^y/,
        reserved: [
            // Flights operating at aerodromes (in lieu of codes 1200, 2000 or 3000 when assigned
            // by ATC or noted in the Enroute Supplement)
            '0100'
        ]
    }
];

/**
 * Gets the array of squawk code objects that match the specifed ICAO airport code
 *
 * @method _getCodes
 * @param icao {string}
 * @returns {array}
 * @private
 */
function _getCodes(icao) {
    return TRANSPONDER_CODES.filter((item) => {
        return item.prefix === null || item.prefix.test(icao);
    });
}

/**
 * Helper used to test if the `transponderCode` matches the
 * String or RegExp in `against`
 *
 * @param transponderCode {string}
 * @param testAgainst {string|RegExp}
 * @private
 */
function _isMatch(transponderCode, testAgainst) {
    if (testAgainst instanceof RegExp) {
        return testAgainst.test(transponderCode);
    } else if (typeof testAgainst === 'string') {
        return transponderCode === testAgainst;
    }

    throw new TypeError(
        `Invalid parameter for testAgainst, expected string or RegExp, but got ${typeof testAgainst}`
    );
}

/**
 * Helper used to determine if a given `transponderCode` is reserved
 * in the country or region of the specified `icao` airport code
 *
 * @method _isReserved
 * @param icao {string}
 * @param transponderCode {string}
 * @returns {boolean}
 * @private
 */
function _isReserved(icao, transponderCode) {
    return _getCodes(icao).some((item) => {
        return item.reserved.some((test) => _isMatch(transponderCode, test));
    });
}

/**
 * Helper used to generate a new 4 digit octal transponder code
 *
 * @returns {string}
 */
export const generateTransponderCode = () => {
    const code = randint(0, MAX_TRANSPONDER_CODE).toString(8);
    return leftPad(code, 4);
};

/**
 * Boolean helper used to determine if a given `transponderCode` is both
 * the correct length and an octal number.
 *
 * @method isValidTransponderCode
 * @param transponderCode {string}
 * @return {boolean}
 */
export const isValidTransponderCode = (transponderCode) => {
    return REGEX.TRANSPONDER_CODE.test(transponderCode);
};

/**
 * Helper used to determine if a given `transponderCode` is both
 * valid and not reserved in the country or region of the
 * specified `icao` airport code
 *
 * @method isDiscreteTransponderCode
 * @param icao {string}
 * @param transponderCode {string}
 * @return {boolean}
 */
export const isDiscreteTransponderCode = (icao, transponderCode) => {
    if (!isValidTransponderCode(transponderCode)) {
        return false;
    }

    if (transponderCode.endsWith('00')) {
        return false;
    }

    return !_isReserved(icao, transponderCode);
};
