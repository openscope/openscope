import { tau } from '../math/circle';

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
 * @param nm {number}
 * @return {number}
 */
export const nm = (km = 0) => {
    return km / UNIT_CONVERSION_CONSTANTS.NM_KM;
};
/**
 * kilometers --> feet
 *
 * @function km_ft
 * @param km {number}
 * @return {number}
 */
export const km_ft = (km = 0) => {
    return km / UNIT_CONVERSION_CONSTANTS.KM_FT;
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
}

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
