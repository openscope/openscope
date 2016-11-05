/**
 * @property FLIGHT_MODES
 * @type {Object}
 * @final
 */
export const FLIGHT_MODES = {
    APRON: 'apron',
    TAXI: 'taxi',
    WAITING: 'waiting',
    TAKEOFF: 'takeoff',
    CRUISE: 'cruise',
    LANDING: 'landing'
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
