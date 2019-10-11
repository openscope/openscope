/**
 * @enum ENVIRONMENT {object}
 * @type {object}
 * @final
 */
export const ENVIRONMENT = {
    /**
     * @memberof ENVIRONMENT
     * @property WIND_INCREASE_FACTOR_PER_FT
     * @type {number}
     * @final
     */
    WIND_INCREASE_FACTOR_PER_FT: 0.00002, // 2.00% per thousand feet

    /**
     * Factor at which density altitude increases per foot of altitude.
     * NOTE: At a higher density altitude, the same IAS will yield a higher TAS.
     *       Consider density altitude to be directly proportionate to the amount
     *       by which the TAS increases above the IAS. Therefore, this value also
     *       represents how much the TAS will increase per foot.
     *
     * @memberof ENVIRONMENT
     * @property DENSITY_ALT_INCREASE_FACTOR_PER_FT
     * @type {number}
     * @final
     */
    DENSITY_ALT_INCREASE_FACTOR_PER_FT: 0.000016 // 0.16% per thousand feet
};
