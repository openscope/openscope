/**
 * @property FLIGHT_CATEGORY
 * @type {Object}
 * @final
 */
export const FLIGHT_CATEGORY = {
    ARRIVAL: 'arrival',
    DEPARTURE: 'departure',
    OVERFLIGHT: 'overflight'
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
     * Not yet reached requested cruise altitude
     *
     * Aircraft remain in this phase until reaching their requested cruise altitude (CRUISE)
     *
     * @memberof FLIGHT_PHASE
     * @property CLIMB
     * @type {string}
     */
    CLIMB: 'CLIMB',
    /**
     * Not yet cleared to descend below requested cruise altitude
     *
     * Aircraft remain in this phase until cleared to descend (DESCENT)
     *
     * @memberof FLIGHT_PHASE
     * @property CRUISE
     * @type {string}
     */
    CRUISE: 'CRUISE',
    /**
     * Instructed to enter (or already in) airborne holding pattern
     *
     * Aircraft remain in this phase until cleared out of the hold (CLIMB/CRUISE/DESCENT)
     *
     * @memberof FLIGHT_PHASE
     * @property HOLD
     * @type {string}
     */
    HOLD: 'HOLD',
    /**
     * Configured for (or already in) descent out of requested cruise altitude
     *
     * Aircraft remain in this phase until fully established on an approach (APPROACH)
     *
     * @memberof FLIGHT_PHASE
     * @property DESCENT
     * @type {string}
     */
    DESCENT: 'DESCENT',
    /**
     * Fully established on the approach, outside of the final approach fix
     *
     * Aircraft remain in this phase until within the final approach fix (LANDING)
     *
     * @memberof FLIGHT_PHASE
     * @property APPROACH
     * @type {string}
     */
    APPROACH: 'APPROACH',
    /**
     * Fully established on the approach, within the final approach fix
     *
     * Aircraft remain in this phase until instructed to go around (DESCENT)
     *   - If landing successful, they will remain in this phase until deletion
     *
     * @memberof FLIGHT_PHASE
     * @property LANDING
     * @type {string}
     */
    LANDING: 'LANDING'
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

    /**
     * Maximum vertical distance between the aircraft and the glidepath to
     * consider the aircraft to be "established on the glidepath"
     *
     * @property MAXIMUM_ALTITUDE_DIFFERENCE_CONSIDERED_ESTABLISHED_ON_GLIDEPATH
     * @type {number}
     * @final
     */
    MAXIMUM_ALTITUDE_DIFFERENCE_CONSIDERED_ESTABLISHED_ON_GLIDEPATH: 100,

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
    MAXIMUM_DISTANCE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE_NM: 0.0822894, // appx. 500 feet

    /**
     * Maximum angular difference from the approach course heading to consider the aircraft close
     * to be "established on the approach course", which is an important condition for applying
     * rules of separation.
     *
     * @property MAXIMUM_ANGLE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE
     * @type {number}
     * @final
     */
    MAXIMUM_ANGLE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE: 0.0872665, // appx. 5 degrees

    /**
     * Maximum angular difference from the hold outbound heading to consider the aircraft close
     * to be "established on the hold course".
     *
     * @property MAXIMUM_ANGLE_CONSIDERED_ESTABLISHED_ON_HOLD_COURSE
     * @type {number}
     * @final
     */
    MAXIMUM_ANGLE_CONSIDERED_ESTABLISHED_ON_HOLD_COURSE: 0.0017453, // appx. 0.1 degrees

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
     * Length of time individual aircraft will require themselves to be established at Vref
     * (their landing speed) before landing. If they cannot reach that speed by that time, they
     * will not consider themselves on a "stable approach", and will likely go around.
     *
     * @memberof PERFORMANCE
     * @property STABLE_APPROACH_TIME_SECONDS
     * @type {number}
     * @final
     */
    STABLE_APPROACH_TIME_SECONDS: 60,

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
    TURN_RATE: 0.0523598776, // 3 degrees

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
    TYPICAL_CLIMB_FACTOR: 0.7,

    /**
     * Standard pressure, the baseline used universally, is 1013.25 hPa, which is equivalent to 1013.25 mb or 29.92 inHg
     *
     * @property DEFAULT_ALTIMETER_IN_INHG
     * @type {number}
     * @final
     */
    DEFAULT_ALTIMETER_IN_INHG: 29.92
};

/**
 * Separation distances between aircraft
 *
 * @property SEPARATION
 * @type {Object}
 * @final
 */
export const SEPARATION = {
    /**
     * 14.816km = 8nm (max possible sep minmum)
     *
     * @memberof SEPARATION
     * @property MAX_KM
     * @type {number}
     * @final
     */
    MAX_KM: 14.816,
    /**
     * Standard Basic Lateral Separation Minimum
     *
     * @memberof SEPARATION
     * @property STANDARD_LATERAL_KM
     * @type {number}
     * @final
     */
    STANDARD_LATERAL_KM: 5.556, // 3nm
    /**
     * Minimum vertical separation in feet
     *
     * @memberof SEPARATION
     * @property VERTICAL_FT
     * @type {number}
     * @final
     */
    VERTICAL_FT: 1000
};
