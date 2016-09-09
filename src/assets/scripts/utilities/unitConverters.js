/**
 * @property UNIT_CONVERSION_CONSTANTS
 * @type {Object}
 */
export const UNIT_CONVERSION_CONSTANTS = {
    /**
     * @property NM_KM
     * @type {number}
     * @final
     */
    NM_KM: 1.852,
    /**
     * @property KM_FT
     * @type {number}
     * @final
     */
    KM_FT: 0.0003048
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
