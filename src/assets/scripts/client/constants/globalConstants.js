/**
 * Commonly used time conversion rates
 *
 * @property TIME
 * @type {Object}
 * @final
 */
export const TIME = {
    ONE_HOUR_IN_SECONDS: 3600,
    ONE_HOUR_IN_MINUTES: 60,
    ONE_HOUR_IN_MILLISECONDS: 3600000,
    ONE_MINUTE_IN_HOURS: 1 / 60,
    ONE_MINUTE_IN_SECONDS: 60,
    ONE_MINUTE_IN_MILLISECONDS: 60000,
    ONE_SECOND_IN_HOURS: 1 / 3600,
    ONE_SECOND_IN_MINUTES: 1 / 60,
    ONE_SECOND_IN_MILLISECONDS: 1000,
    ONE_MILLISECOND_IN_HOURS: 1 / 3600000,
    ONE_MILLISECOND_IN_MINUTES: 1 / 60000,
    ONE_MILLISECOND_IN_SECONDS: 1 / 1000
};

/**
 * Regular expressions
 *
 * @property REGEX
 * @type {Object}
 * @final
 */
export const REGEX = {
    ALT_SPEED_RESTRICTION: /[a,s,\-,+]/gi,
    COMPASS_DIRECTION: /^[NESW]/,
    LAT_LONG: /^([NESW])(\d+(\.\d+)?)([d °](\d+(\.\d+)?))?([m '](\d+(\.\d+)?))?$/,
    SW: /[SW]/,
    UNICODE: /[^\u0000-\u00ff]/,
    WHITESPACE: /\s/g
};

/**
 * @property PHYSICS_CONSTANTS
 * @type {Object}
 * @final
 */
export const PHYSICS_CONSTANTS = {
    /**
     * @property
     * @type {number}
     * @final
     */
    GRAVITATIONAL_MAGNITUDE: 9.81,

    /**
     * @property EARTH_RADIUS_NM
     * @type {number}
     * @final
     */
    EARTH_RADIUS_NM: 3440
};
