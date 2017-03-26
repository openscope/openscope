/**
 * @property AIRPORT_CONSTANTS
 * @type {Object}
 * @final
 */
export const AIRPORT_CONSTANTS = {
    /**
     * @property DEFAULT_SPAWN_ALTITUDE_MIN
     * @type {number}
     * @final
     */
    DEFAULT_SPAWN_ALTITUDE_MIN: 10000,

    /**
     * @property DEFAULT_SPAWN_ALTITUDE_MAX
     * @type {number}
     * @final
     */
    DEFAULT_SPAWN_ALTITUDE_MAX: 10000,

    /**
     * @property DEFAULT_SPAWN_AIRCRAFT_SPEED_KTS
     * @type {number}
     * @final
     */
    DEFAULT_SPAWN_AIRCRAFT_SPEED_KTS: 250,

    /**
     * @property MIN_ENTRAIL_DISTANCE_NM
     * @type {number}
     * @final
     */
    MIN_ENTRAIL_DISTANCE_NM: 5.5
};

/**
 * List of control positions at the airport, used to differentiate which ATC callsign to used
 *
 * @property AIRPORT_CONTROL_POSITION_NAME
 * @type {object}
 * @final
 */
export const AIRPORT_CONTROL_POSITION_NAME = {
    /**
    * Provides approach control services
    *
    * @property APPROACH
    * @type {String}
    */
    APPROACH: 'app',

    /**
    * Provides departure control services
    *
    * @property TOWER
    * @type {String}
    */
    DEPARTURE: 'dep',

    /**
    * Provides Air Traffic Control Tower (ATCT) services for surface and runway movements
    *
    * @property TOWER
    * @type {String}
    */
    TOWER: 'twr'
};
