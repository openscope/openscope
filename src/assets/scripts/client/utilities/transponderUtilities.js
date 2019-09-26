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
 * Source: https://en.wikipedia.org/wiki/List_of_transponder_codes
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
        ]
    },
    {
        // Europe
        prefix: /^([elb])/,
        reserved: [
        ]
    },
    {
        // Canda
        prefix: /^c/,
        reserved: [
        ]
    },
    {
        // Belgium
        prefix: /^eb/,
        reserved: [
            // Assigned for VFR traffic under Flight Information Services (BXL FIC)
            // 0041–0057
            /^00(4[1-7]|5[0-7])$/,
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
            '0033',
            // Sudden military climb out from low-level operations
            '7001',
            // Aerobatic & displays
            '7004'
        ]
    },
    {
        // USA
        prefix: /^k/,
        reserved: [
            // VFR - 12xx
            /^12[0-7][0-7]$/,
            // Reserved for use by SR-71, YF-12, U-2 and B-57, pressure suit flights,
            // and aircraft operations above FL600. And many others
            // 4400–4477
            /^44[0-7]{2}$/,
            // Reserved for use by Continental NORAD Region (CONR)
            // 7501–7577
            /^75(0[1-7]|[1-7][0-7])$/,
            // Reserved for special use by FAA
            // 7601–7607, 7701–7707
            /^7[67]0[1-7]$/,
            // External ARTCC subsets (Discrete codes of blocks only except for first primary
            // block, which is used as the ARTCC's non-discrete code if all discrete codes are assigned)
            // Not reserved as it implies they are useable
            // 7610–7676, 7710–7776
            // /^7[67]([1-6][0-7]|7[1-6])$/,
            // Military & for testing stations
            '7777'
        ]
    },
    // {
    //     // Washington DC
    //     prefix: /^k/,
    //     reserved: [
    //         // Reserved for special use by Potomac TRACON
    //         // 5061–5062
    //         /^506[12]$/
    //     ]
    // },
    {
        // France
        prefix: /^lf/,
        reserved: [
            // VFR
            '7001'
        ]
    },
    {
        // Australia
        prefix: /^y/,
        reserved: [
            // Civil flights engaged in littoral surveillance
            '7615'
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
        return (item.prefix === null || item.prefix.test(icao)) &&
            item.reserved.length !== 0;
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
