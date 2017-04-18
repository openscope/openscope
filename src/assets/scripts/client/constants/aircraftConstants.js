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
    /**
     * initial status of a new departing aircraft. After the aircraft is issued the 'taxi' command,
     * the aircraft transitions to 'taxi' mode
     *
     * @memberof FLIGHT_PHASE
     * @property
     * @type {string}
     */
    APRON: 'APRON',
    /**
     * the process of getting ready for takeoff. After a delay, the aircraft becomes ready and
     * transitions into 'waiting' mode
     *
     * @memberof FLIGHT_PHASE
     * @property TAXI
     * @type {string}
     */
    TAXI: 'TAXI',
    /**
     * the aircraft is ready for takeoff and awaits clearence to take off
     *
     * @memberof FLIGHT_PHASE
     * @property WAITING
     * @type {string}
     */
    WAITING: 'WAITING',
    /**
     * is assigned to an aircraft in the process of taking off. The aircraft are still on the
     * ground or have not yet reached the minimum altitude
     *
     * @memberof FLIGHT_PHASE
     * @property TAKEOFF
     * @type {string}
     */
    TAKEOFF: 'TAKEOFF',
    /**
     * @memberof FLIGHT_PHASE
     * @property CLIMB
     * @type {string}
     */
    CLIMB: 'CLIMB',
    /**
     * describes an aircraft currently in flight and not following an ILS path. Aircraft entering
     * controlled airspace also have this state. If an ILS path is picked up, the aircraft
     * will transition to 'landing'
     *
     * @memberof FLIGHT_PHASE
     * @property CRUISE
     * @type {string}
     */
    CRUISE: 'CRUISE',
    /**
     * @memberof FLIGHT_PHASE
     * @property HOLD
     * @type {string}
     */
    HOLD: 'HOLD',
    /**
     * @memberof FLIGHT_PHASE
     * @property DESCENT
     * @type {string}
     */
    DESCENT: 'DESCENT',
    /**
     * @memberof FLIGHT_PHASE
     * @property APPROACH
     * @type {string}
     */
    APPROACH: 'APPROACH',
    /**
     * aircraft following an ILS path or is on the runway in the process of stopping.
     * If an ILS approach or a landing is aborted, the aircraft re-enters 'cruise' mode
     *
     * @memberof FLIGHT_PHASE
     * @property LANDING
     * @type {string}
     */
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
     * Factor by which to increase the speed of deceleration on the ground as opposed
     * to while in flight, due to the effects of reverse thrust and braking
     *
     * @property DECELERATION_FACTOR_DUE_TO_GROUND_BRAKING
     * @type {Number}
     * @final
     */
    DECELERATION_FACTOR_DUE_TO_GROUND_BRAKING: 3.5,

    /*
     * Distance from landing threshold at which to establish on final approach speed
     *
     * @property LANDING_FINAL_APPROACH_SPEED_DISTANCE_NM
     * @type {number}
     * @final
     */
    LANDING_FINAL_APPROACH_SPEED_DISTANCE_NM: 1,

    /**
     * Distance from landing threshold outside of which you must maintain assigned speed
     *
     * @property LANDING_ASSIGNED_SPEED_DISTANCE_NM
     * @type {number}
     * @final
     */
    LANDING_ASSIGNED_SPEED_DISTANCE_NM: 5,

    /**
    * Maximum distance from the current waypoint to allow us to proceed to the next waypoint
    * due to a tight turn, without requiring us to continue toward the current waypoint.
    *
    * @property MAXIMUM_DISTANCE_TO_FLY_BY_WAYPOINT_NM
    * @type {number}
    * @final
    */
    MAXIMUM_DISTANCE_TO_FLY_BY_WAYPOINT_NM: 5,

    /**
     * Maximum distance from the current waypoint to consider it to have been passed over,
     * allowing us to proceed to the next fix.
     *
     * @property MAXIMUM_DISTANCE_TO_PASS_WAYPOINT_NM
     * @type {number}
     * @final
     */
    MAXIMUM_DISTANCE_TO_PASS_WAYPOINT_NM: 0.5,

    /**
     * Maximum lateral offset from the approach course to consider the aircraft close enough
     * to be "established on the approach course", which is an important condition for applying
     * rules of separation.
     *
     * @property MAXIMUM_DISTANCE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE_NM
     * @type {number}
     * @final
     */
    MAXIMUM_DISTANCE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE_NM: 0.0822894,   // appx. 500 feet

    /**
     * Maximum angular differce from the approach course heading to consider the aircraft close
     * to be "established on the approach course", which is an important condition for applying
     * rules of separation.
     *
     * @property MAXIMUM_ANGLE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE
     * @type {number}
     * @final
     */
    MAXIMUM_ANGLE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE: 0.0872665, // appx. 5 degrees

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
