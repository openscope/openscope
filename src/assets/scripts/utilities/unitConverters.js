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
 */
export const km = (nm = 0) => {
    return nm * UNIT_CONVERSION_CONSTANTS.NM_KM;
};
/**
 * kilometers --> nautical miles
 */
export const nm = (km = 0) => {
    return km / UNIT_CONVERSION_CONSTANTS.NM_KM;
};
/**
 * kilometers --> feet
 */
export const km_ft = (km = 0) => {
    return km / UNIT_CONVERSION_CONSTANTS.KM_FT;
};
/**
 * feet --> kilometers
 */
export const ft_km = (ft = 0) => {
    return ft * UNIT_CONVERSION_CONSTANTS.KM_FT;
};
