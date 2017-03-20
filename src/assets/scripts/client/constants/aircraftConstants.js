/**
 * @property FLIGHT_MODES
 * @type {Object}
 * @final
 */
export const FLIGHT_MODES = {
    // - 'apron' is the initial status of a new departing plane. After
    //   the plane is issued the 'taxi' command, the plane transitions to
    //   'taxi' mode
    // - 'taxi' describes the process of getting ready for takeoff. After
    //   a delay, the plane becomes ready and transitions into 'waiting' mode
    // - 'waiting': the plane is ready for takeoff and awaits clearence to
    //   take off
    // - 'takeoff' is assigned to planes in the process of taking off. These
    //   planes are still on the ground or have not yet reached the minimum
    //   altitude
    // - 'cruse' describes, that a plane is currently in flight and
    //   not following an ILS path. Planes of category 'arrival' entering the
    //   playing field also have this state. If an ILS path is picked up, the
    //   plane transitions to 'landing'
    // - 'landing' the plane is following an ILS path or is on the runway in
    //   the process of stopping. If an ILS approach or a landing is aborted,
    //   the plane reenters 'cruise' mode
    APRON: 'APRON',
    TAXI: 'TAXI',
    WAITING: 'WAITING',
    TAKEOFF: 'TAKEOFF',
    CRUISE: 'CRUISE',
    LANDING: 'LANDING'
};

/**
 * @property FLIGHT_CATEGORY
 * @type {Object}
 * @final
 */
export const FLIGHT_CATEGORY = {
    ARRIVAL: 'arrival',
    DEPARTURE: 'departure'
};

/**
 * Enumeration for the phases of flight
 *
 * @property FLIGHT_PHASE
 * @type {object}
 * @final
 */
export const FLIGHT_PHASE = {
    APRON: 'APRON',
    TAXI: 'TAXI',
    WAITING: 'WAITING',
    TAKEOFF: 'TAKEOFF',
    CLIMB: 'CLIMB',
    CRUISE: 'CRUISE',
    DESCENT: 'DESCENT',
    APPROACH: 'APPROACH',
    LANDING: 'LANDING'
};

/**
 * @property WAYPOINT_NAV_MODE
 * @type {Object}
 * @final
 */
export const WAYPOINT_NAV_MODE = {
    FIX: 'fix',
    HEADING: 'heading',
    HOLD: 'hold',
    RWY: 'rwy'
};

/**
 * Enumeration of possible FLight Plan Leg types.
 *
 * @property FP_LEG_TYPE
 * @type {Object}
 * @final
 */
export const FP_LEG_TYPE = {
    SID: 'sid',
    STAR: 'star',
    IAP: 'iap',
    AWY: 'awy',
    FIX: 'fix',
    MANUAL: '[manual]'
};

export const PROCEDURE_TYPE = {
    SID: 'SID',
    STAR: 'STAR'
};

/**
 * Enumerations for various performance constants
 *
 * @property PERFORMANCE
 * @type {Object}
 * @final
 */
export const PERFORMANCE = {
    /**
     * Altitude above the runway to which aircraft may descend on an instrument approach.
     * Note: Below this altitude, the aircraft is in landing mode
     *
     * @property INSTRUMENT_APPROACH_MINIMUM_DESCENT_ALTITUDE
     * @type {number}
     * @final
     */
    INSTRUMENT_APPROACH_MINIMUM_DESCENT_ALTITUDE: 200,
    /**
     * Altitude above the runway at which aircraft begin their on-course turn, in feet
     *
     * @property TAKEOFF_TURN_ALTITUDE
     * @type {number}
     * @final
     */
    TAKEOFF_TURN_ALTITUDE: 400,

    /**
     * Rate of turn, in radians per second
     *
     * @property TURN_RATE
     * @type {number}
     * @final
     */
    TURN_RATE: 0.0523598776,    // 3 degrees

    /**
     * Proportion of the maximum capable descent rate that aircraft will use by default
     *
     * @property TYPICAL_DESCENT_FACTOR
     * @type {number}
     * @final
     */
    TYPICAL_DESCENT_FACTOR: 0.7,

    /**
     * Proportion of the maximum capable climb rate that aircraft will use by default
     *
     * @property TYPICAL_CLIMB_FACTOR
     * @type {number}
     * @final
     */
    TYPICAL_CLIMB_FACTOR: 0.7
};
