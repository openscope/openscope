import { MCP_MODE, MCP_PROPERTY_MAP } from './modeControlConstants';

/**
 *
 *
 * @class ModeController
 */
export default class ModeController {
    /**
     * @constructor
     * @for ModeController
     */
    constructor() {
        this.altitudeMode = MCP_MODE.ALTITUDE.OFF;
        this.autopilotMode = MCP_MODE.AUTOPILOT.OFF;
        this.headingMode = MCP_MODE.HEADING.OFF;
        this.speedMode = MCP_MODE.SPEED.OFF;

        this.altitude = -1;
        this.course = -1;
        this.heading = -1;
        this.speed = -1;
    }

    /**
     *
     *
     */
    setModesForArrival() {
        this.altitudeMode = MCP_MODE.ALTITUDE.VNAV;
        this.headingMode = MCP_MODE.HEADING.LNAV;
        this.speedMode = MCP_MODE.SPEED.VNAV;
    }

    /**
     *
     *
     */
    setModesForDeparture() {
        this.altitudeMode = MCP_MODE.ALTITUDE.VNAV;
        this.headingMode = MCP_MODE.HEADING.LNAV;
        this.speedMode = MCP_MODE.SPEED.VNAV;
    }

    /**
     *
     *
     */
    setModeAndValue(modeSelector, mode, fieldValue) {
        this._setModeControllerMode(modeSelector, mode);
        this._setModeControllerValue(MCP_PROPERTY_MAP[modeSelector], fieldValue);
    }

    /**
     *
     *
     */
    _setModeControllerMode(modeSelector, mode) {
        this[modeSelector] = mode;
    }

    /**
     *
     *
     */
    _setModeControllerValue(fieldName, value) {
        this[fieldName] = value;
    }
}
