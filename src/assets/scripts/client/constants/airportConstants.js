/**
 * @enum AIRPORT_CONSTANTS {object}
 * @type {object}
 * @final
 */
export const AIRPORT_CONSTANTS = {
    /**
     * @memberof AIRPORT_CONSTANTS
     * @property DEFAULT_SPAWN_ALTITUDE_MIN
     * @type {number}
     * @final
     */
    DEFAULT_SPAWN_ALTITUDE_MIN: 10000,

    /**
     * @memberof AIRPORT_CONSTANTS
     * @property DEFAULT_SPAWN_ALTITUDE_MAX
     * @type {number}
     * @final
     */
    DEFAULT_SPAWN_ALTITUDE_MAX: 10000,

    /**
     * @memberof AIRPORT_CONSTANTS
     * @property DEFAULT_SPAWN_AIRCRAFT_SPEED_KTS
     * @type {number}
     * @final
     */
    DEFAULT_SPAWN_AIRCRAFT_SPEED_KTS: 250,

    /**
     * Distance out along final approach course where the FAF is located
     *
     * @memberof AIRPORT_CONSTANTS
     * @property FINAL_APPROACH_FIX_DISTANCE_NM
     * @type {number}
     * @final
     */
    FINAL_APPROACH_FIX_DISTANCE_NM: 5,

    /**
     * Maximum allowable indicated airspeed for aircraft below 10,000 feet MSL
     *
     * @memberof AIRPORT_CONSTANTS
     * @property MAX_SPEED_BELOW_10K_FEET
     * @type {number}
     * @final
     */
    MAX_SPEED_BELOW_10K_FEET: 250,

    /**
     * @memberof AIRPORT_CONSTANTS
     * @property MIN_ENTRAIL_DISTANCE_NM
     * @type {number}
     * @final
     */
    MIN_ENTRAIL_DISTANCE_NM: 5.5,

    SRS_REDUCED_MINIMA_FEET: {
        CAT1: 3000,
        CAT2: 4500,
        CAT3: 6000
    }
};

/**
 * List of control positions at the airport, used to differentiate which ATC callsign to used
 *
 * @enum AIRPORT_CONTROL_POSITION_NAME
 * @type {object}
 * @final
 */
export const AIRPORT_CONTROL_POSITION_NAME = {
    /**
    * Provides approach control services
    *
    * @memberof AIRPORT_CONTROL_POSITION_NAME
    * @property APPROACH
    * @type {string}
    * @final
    */
    APPROACH: 'app',

    /**
    * Provides departure control services
    *
    * @memberof AIRPORT_CONTROL_POSITION_NAME
    * @property TOWER
    * @type {string}
    * @final
    */
    DEPARTURE: 'dep',

    /**
    * Provides Air Traffic Control Tower (ATCT) services for surface and runway movements
    *
    * @memberof AIRPORT_CONTROL_POSITION_NAME
    * @property TOWER
    * @type {string}
    * @final
    */
    TOWER: 'twr'
};

/**
 * ICAO identifier of the airport to show after initial load
 *
 * @enum DEFAULT_AIRPORT_ICAO
 * @type {string}
 * @final
 */
export const DEFAULT_AIRPORT_ICAO = 'ksea';
