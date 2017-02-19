export const MCP_ALTITUDE_MODES = {
    HOLD: 'HOLD',
    APPROACH: 'APPROACH',
    LEVEL_CHANGE: 'LEVEL_CHANGE',
    OFF: 'OFF',
    VERTICAL_SPEED: 'VERTICAL_SPEED',
    VNAV: 'VNAV'
};

export const MCP_SPEED_MODES = {
    LEVEL_CHANGE: 'LEVEL_CHANGE',
    N1: 'N1',
    OFF: 'OFF',
    HOLD: 'HOLD',
    VNAV: 'VNAV'
};

export const MCP_HEADING_MODES = {
    HOLD: 'HOLD',
    LNAV: 'LNAV',
    OFF: 'OFF',
    VOR_LOC: 'VOR_LOC'
};

export const MCP_AUTOPILOT_MODES = {
    ON: 'ON',
    OFF: 'OFF'
};

export const MCP_MODE = {
    ALTITUDE: MCP_ALTITUDE_MODES,
    AUTOPILOT: MCP_AUTOPILOT_MODES,
    HEADING: MCP_HEADING_MODES,
    SPEED: MCP_SPEED_MODES
};

export const MCP_MODE_NAME = {
    ALTITUDE: 'altitudeMode',
    AUTOPILOT: 'autopilotMode',
    HEADING: 'headingMode',
    SPEED: 'speedMode'
};

export const MCP_PROPERTY_MAP = {
    altitudeMode: 'altitude',
    autopilotMode: 'autopilot',
    headingMode: 'heading',
    speedMode: 'speed'
};
