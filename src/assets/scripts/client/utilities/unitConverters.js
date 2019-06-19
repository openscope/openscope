import _includes from 'lodash/includes';
import _isNumber from 'lodash/isNumber';
import _startsWith from 'lodash/startsWith';
import { tau } from '../math/circle';
import { round, mod } from '../math/core';
import { TIME, REGEX } from '../constants/globalConstants';

/**
 * @property DECIMAL_RADIX
 * @type {number}
 * @final
 */
export const DECIMAL_RADIX = 10;

// TODO: This should be moved to its own file once it has been filled in a little more
/**
 * @property UNIT_CONVERSION_CONSTANTS
 * @type {Object}
 */
export const UNIT_CONVERSION_CONSTANTS = {
    /**
    * nautical miles to feet
    *
    * @property NM_FT
    * @type {Number}
    * @final
    */
    NM_FT: 6076.115485564,
    /**
     * nautical mile per kilometer ratio
     *
     * @property NM_KM
     * @type {number}
     * @final
     */
    NM_KM: 1.852,
    /**
     * Meters to feet ratio
     *
     * @property M_FT
     * @type {number}
     * @final
     */
    M_FT: 0.3048,
    /**
     * kilometer per foot ratio
     *
     * @property KM_FT
     * @type {number}
     * @final
     */
    KM_FT: 0.0003048,
    /**
     * knots per m/s ratio
     *
     * @property KN_MS
     * @type {number}
     * @final
     */
    KN_MS: 0.51444444,
    /**
     * Number used to obtain altitude in feet from flight level
     *
     * @property FL_FT
     * @type {number}
     * @final
     */
    FL_FT: 100,
    /**
     * Number used to obtain flight level from altitude in feet
     *
     * @property FT_FL
     * @type {number}
     * @final
     */
    FT_FL: 0.01
};

// TODO: This should be moved to its own file once it has been filled in a little more
/**
 * @property NUMBER_CONSTANTS
 * @type {Object}
 * @final
 */
export const NUMBER_CONSTANTS = {
    /**
     * Degrees in a circle
     *
     * @property FULL_CIRCLE_DEGREES
     * @type {number}
     * @final
     */
    FULL_CIRCLE_DEGREES: 360
};

/**
 * nautical miles --> kilometers
 *
 * @function km
 * @param nm {number}
 * @return {number}
 */
export const km = (nm = 0) => {
    return nm * UNIT_CONVERSION_CONSTANTS.NM_KM;
};

/**
 * kilometers --> nautical miles
 *
 * @function nm
 * @param kilometers {number}
 * @return {number}
 */
export const nm = (kilometers = 0) => {
    return kilometers / UNIT_CONVERSION_CONSTANTS.NM_KM;
};

/**
 * meters -> feet
 *
 * @function m_ft
 * @param {number} [meters=0]
 * @return {number}
 */
export const m_ft = (meters = 0) => {
    return meters / UNIT_CONVERSION_CONSTANTS.M_FT;
};

/**
 * kilometers --> feet
 *
 * @function km_ft
 * @param kilometers {number}
 * @return {number}
 */
export const km_ft = (kilometers = 0) => {
    return kilometers / UNIT_CONVERSION_CONSTANTS.KM_FT;
};

/**
 * feet --> kilometers
 *
 * @function ft_km
 * @param nm {number}
 * @return {number}
 */
export const ft_km = (ft = 0) => {
    return ft * UNIT_CONVERSION_CONSTANTS.KM_FT;
};

/**
 * knots to m/s
 *
 * @function kn_ms
 * @param kn {number}
 * @return {number}
 */
export const kn_ms = (kn = 0) => {
    return kn * UNIT_CONVERSION_CONSTANTS.KN_MS;
};

/**
 * nautical miles to feet
 *
 * @function nm_ft
 * @param nm {number}
 * @return {number}
 */
export const nm_ft = (nm) => {
    return nm * UNIT_CONVERSION_CONSTANTS.NM_FT;
};

/**
 * convert radians to degrees
 *
 * @function radiansToDegrees
 * @param radians {number}
 * @return {number}
 */
export const radiansToDegrees = (radians) => {
    return (radians / (tau())) * NUMBER_CONSTANTS.FULL_CIRCLE_DEGREES;
};

/**
 * convert degrees to radians
 *
 * @function degreesToRadians
 * @param degrees {number}
 * @return {number}
 */
export const degreesToRadians = (degrees) => {
    return (degrees / NUMBER_CONSTANTS.FULL_CIRCLE_DEGREES) * (tau());
};

/**
 * @function convertMinutesToSeconds
 * @param minutes {number}
 * @return {number}
 */
export const convertMinutesToSeconds = (minutes) => minutes * 60;

/**
 * Utility function to convert a number to thousands.
 *
 * Given a flightlevel FL180, this function outputs 18,000
 *
 * @function covertToThousands
 * @param  {number} value
 * @return {number}
 */
export const convertToThousands = (value) => parseInt(value, DECIMAL_RADIX) * UNIT_CONVERSION_CONSTANTS.FL_FT;

/**
 * Attempt to convert a string to a number
 *
 * The implementor will have to handle the case where `parseInt` returns `NaN`
 *
 * @function convertStringToNumber
 * @param  value {string|*}
 * @return {number|NaN}
 */
export const convertStringToNumber = (value) => parseInt(value, DECIMAL_RADIX);

/**
 * Convert a heading in radians to a 360 degree string
 *
 * @function heading_to_string
 * @param heading {string}  heading in radians
 * @return {string}
 */
export const heading_to_string = (heading) => {
    heading = round(mod(radiansToDegrees(heading), 360)).toString();

    if (heading === '0') {
        heading = '360';
    }

    if (heading.length === 1) {
        heading = `00${heading}`;
    }

    if (heading.length === 2) {
        heading = `0${heading}`;
    }

    return heading;
};

/**
 * Accept a lat/long coordinate and return a value in decimal notation
 *
 * Latitude and Longitude numbers may be one of the following forms:
 *   Decimal degrees - 'N47.112388112'
 *   Decimal minutes - 'N38d38.109808'
 *   Decimal seconds - 'N58d27m12.138'
 *
 * @function parseCoordinate
 * @param coordinate {string}
 * @return transformedCoordinate {number}
 */
export const parseCoordinate = (coordinate) => {
    const match = REGEX.LAT_LONG.exec(coordinate);

    // If coordinate already in WGS84 ESPG:4326 form ('39.427618, -75.296011'), just return it as-is
    if (match == null) {
        return coordinate;
    }

    const degrees = parseFloat(match[2]);
    let minutes = 0;
    let seconds = 0;

    // Gather minutes/seconds as decimal of a degree, if available
    if (match[5] != null) {
        minutes = (parseFloat(match[5]) * TIME.ONE_MINUTE_IN_HOURS);

        if (match[8] != null) {
            seconds = (parseFloat(match[8]) * TIME.ONE_SECOND_IN_HOURS);
        }
    }

    let decimalDegrees = degrees + minutes + seconds;

    // Apply negative to value if coordinate is "South" or "West"
    if (REGEX.SW.test(match[1])) {
        decimalDegrees *= -1;
    }

    return decimalDegrees;
};

/**
 * Accept a string elevation and return a number representing elevation in ft.
 *
 * @function parseElevation
 * @param elevation {string}    ex: 13.4ft, 3m, 5ft
 * @return {number}             elevation in feet
 */
export const parseElevation = (elevation) => {
    // TODO: move to master REGEX constant
    // this regex will catch the following: `-`, `m`, `ft`, `Infinity`, and is used to extract a number
    // from a string containing these symbols.
    const REGEX = /(-)|(m|ft|Infinity)/gi;

    // if its a number, we're done here.
    // This will catch whole numbers, floats, Infinity and -Infinity.
    // This checks if strings are given will skip the regex and exit early
    // Also stops the function from returning NaN
    if (_isNumber(elevation) || elevation === 'Infinity' || elevation === '-Infinity') {
        return parseFloat(elevation);
    }

    let parsedElevation = elevation.replace(REGEX, '');
    const elevationUnit = elevation.match(REGEX);

    // if its in meters, convert it to feet
    if (_includes(elevationUnit, 'm')) {
        parsedElevation = m_ft(parsedElevation);
    }

    // if it came in as a negative number,return it as a negative number
    if (_startsWith(elevation, '-')) {
        parsedElevation *= -1;
    }

    return parseFloat(parsedElevation);
};
