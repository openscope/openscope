import { tau } from '../math/circle';
import { round, mod } from '../math/core';

// TODO: This should be moved to its own file once it has been filled in a little more
/**
 * @property UNIT_CONVERSION_CONSTANTS
 * @type {Object}
 */
export const UNIT_CONVERSION_CONSTANTS = {
    /**
     * nautical mile per kilometer ratio
     *
     * @property NM_KM
     * @type {number}
     * @final
     */
    NM_KM: 1.852,
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
    KN_MS: 0.51444444
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
 * NOT IN USE
 * convert pixels to kilometers at the current scale
 *
 * @function px_to_km
 * @param  {number} pixels
 * @param  {number} scale
 * @return {number}
 */
export const px_to_km = (pixels, scale) => {
    return pixels / scale;
};

/**
 * NOT IN USE
 * convert kilometers to pixels at the current scale
 *
 * @function km_to_px
 * @param  {number} kilometers
 * @return {number}
 */
export const km_to_px = (kilometers, scale) => {
    return kilometers * scale;
};

/**
 *
 * @function heading_to_string
 * @param heading {string}
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

// TODO: this function could be simlified.
// It appears to accept an elevation with units, ex: 13.7ft or 5.5m
// and then returns that number, less the units, in feet. So this function is doing two things: trimming units
// and converting the elevation to feet.
/**
 * @function parseElevation
 * @param elevation {string}    ex: 13.4ft, 3m, 5ft
 * @return {number}             elevation in feet
 */
export const parseElevation = (elevation) => {
    const VALUE_UNITS_INDEX = 4;
    const altitude = /^(Infinity|(\d+(\.\d+)?)(m|ft))$/.exec(elevation);

    if (!altitude) {
        log(`Unable to parse elevation ${elevation}`);
        return;
    }

    if (altitude[1] === 'Infinity') {
        return Infinity;
    }

    const metersOrFeetCoversionValue = altitude[VALUE_UNITS_INDEX] === 'm'
        ? 0.3048
        : 1;

    return parseFloat(altitude[2]) / metersOrFeetCoversionValue;
};
