/**
 * Screen position to default to if the actual position cannot be calculated, in shape of [x,y]
 *
 * @property DEFAULT_SCREEN_POSITION
 * @type {Array}
 * @final
 */
export const DEFAULT_SCREEN_POSITION = [0, 0];

/**
 * Map of the content of all indices of the array parsed into the position model
 *
 * @property GPS_COORDINATE_INDEX
 * @type {Object}
 * @final
 */
export const GPS_COORDINATE_INDEX = {
    /**
     * @property LATITUDE
     * @type {number}
     * @final
     */
    LATITUDE: 0,

    /**
     * @property LONGITUDE
     * @type {number}
     * @final
     */
    LONGITUDE: 1,

    /**
     * @property ELEVATION
     * @type {number}
     * @final
     */
    ELEVATION: 2
};

/**
 * Map of the content of all the indices of the relativePosition array
 *
 * @property RELATIVE_POSITION_OFFSET_INDEX
 * @type {Object}
 * @final
 */
export const RELATIVE_POSITION_OFFSET_INDEX = {
    /**
     * @property LATITUDINAL
     * @type {number}
     * @final
     */
    LATITUDINAL: 0,

    /**
     * @property LONGITUDINAL
     * @type {number}
     * @final
     */
    LONGITUDINAL: 1
};
