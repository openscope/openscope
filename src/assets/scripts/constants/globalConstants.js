export const TIME = {
    /**
     * @property ONE_HOUR_IN_SECONDS
     * @type {number}
     * @final
     */
    ONE_HOUR_IN_SECONDS: 3600
};

/**
 * Regular expressions
 *
 * @property REGEX
 * @type {Object}
 * @final
 */
export const REGEX = {
    COMPASS_DIRECTION: /^[NESW]/,
    SW: /[SW]/,
    LAT_LONG: /^([NESW])(\d+(\.\d+)?)([d °](\d+(\.\d+)?))?([m '](\d+(\.\d+)?))?$/
};
