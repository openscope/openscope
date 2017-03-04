/**
 * Available values for `ModeController#altitudeMode`
 *
 * @memberof MCP_MODE
 * @property MCP_ALTITUDE_MODE
 * @type {Object}
 * @final
 */
export const MCP_ALTITUDE_MODE = {
    HOLD: 'HOLD',
    APPROACH: 'APPROACH',
    LEVEL_CHANGE: 'LEVEL_CHANGE',
    OFF: 'OFF',
    VERTICAL_SPEED: 'VERTICAL_SPEED',
    VNAV: 'VNAV'
};

/**
 * Available values for `ModeController#autopilotMode`
 *
 * @memberof MCP_MODE
 * @property MCP_AUTOPILOT_MODE
 * @type {Object}
 * @final
 */
export const MCP_AUTOPILOT_MODE = {
    ON: 'ON',
    OFF: 'OFF'
};

/**
 * Available values for `ModeController#headingMode`
 *
 * @memberof MCP_MODE
 * @property MCP_HEADING_MODE
 * @type {Object}
 * @final
 */
export const MCP_HEADING_MODE = {
    HOLD: 'HOLD',
    LNAV: 'LNAV',
    OFF: 'OFF',
    VOR_LOC: 'VOR_LOC'
};

/**
 * Available values for `ModeController#speedMode`
 *
 * @memberof MCP_MODE
 * @property MCP_SPEED_MODE
 * @type {Object}
 * @final
 */
export const MCP_SPEED_MODE = {
    LEVEL_CHANGE: 'LEVEL_CHANGE',
    N1: 'N1',
    OFF: 'OFF',
    HOLD: 'HOLD',
    VNAV: 'VNAV'
};

/**
 * Available modes for `ModeController`
 *
 * @property MCP_MODE
 * @type {Object}
 * @final
 */
export const MCP_MODE = {
    ALTITUDE: MCP_ALTITUDE_MODE,
    AUTOPILOT: MCP_AUTOPILOT_MODE,
    HEADING: MCP_HEADING_MODE,
    SPEED: MCP_SPEED_MODE
};

/**
 *
 *
 * @property MCP_MODE_NAME
 * @type {Object}
 * @final
 */
export const MCP_MODE_NAME = {
    ALTITUDE: 'altitudeMode',
    AUTOPILOT: 'autopilotMode',
    HEADING: 'headingMode',
    SPEED: 'speedMode'
};

/**
 * Representation of the numerical values of the various dials on the MCP
 *
 * @property MCP_FIELDS
 * @type {Object}
 * @final
 */
export const MCP_FIELD_NAME = {
    ALTITUDE: 'altitude',
    COURSE: 'course',
    HEADING: 'heading',
    SPEED: 'speed'
};
