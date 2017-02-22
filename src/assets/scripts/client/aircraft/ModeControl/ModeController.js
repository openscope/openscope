import { MCP_MODE, MCP_MODE_NAME } from './modeControlConstants';

/**
 * Part of the autopilot system that determines the source from which to derive the aircraft's targeted telemetry
 *
 * @class ModeController
 */
export default class ModeController {
    /**
     * @constructor
     * @for ModeController
     */
    constructor(isAircraftAirborne) {
        this.altitudeMode = MCP_MODE.ALTITUDE.OFF;
        this.autopilotMode = MCP_MODE.AUTOPILOT.OFF;
        this.headingMode = MCP_MODE.HEADING.OFF;
        this.speedMode = MCP_MODE.SPEED.OFF;

        this.altitude = -1;
        this.course = -1;
        this.heading = -1;
        this.speed = -1;

        this.expediteAltitudeChange = false;

        this._init(isAircraftAirborne);
    }

    /**
     * Initialization tasks
     *
     * @for ModeController
     * @method _init
     * @private
     */
    _init(isAircraftAirborne) {
        if (!isAircraftAirborne) {
            return;
        }

        this._initializeForAirborneFlight();
    }

    /**
     * Set the appropriate values in the MCP when spawning an aircraft that's already in flight
     *
     * @for ModeController
     * @method _initializeForAirborneFlight
     * @private
     */
    _initializeForAirborneFlight() {
        this.setModeSelectorMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.VNAV);
        this.setModeSelectorMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.LNAV);
        this.setModeSelectorMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.VNAV);
    }

    /**
     * Return the current mode of a given mode selector
     *
     * @for ModeController
     * @method getModeSelectorMode
     */
    getModeSelectorMode(modeSelector) {
        return this[modeSelector];
    }

    /**
     * Return the current value of a given field
     *
     * @for ModeController
     * @method getFieldValue
     */
    getFieldValue(fieldName) {
        return this[fieldName];
    }

    /**
     * Set the mode of a given modeSelector
     *
     * @for ModeController
     * @method setMode
     */
    setModeSelectorMode(modeSelector, mode) {
        this[modeSelector] = mode;
    }

    /**
     * Set the value of a given fieldName
     *
     * @for ModeController
     * @method setFieldValue
     */
    setFieldValue(fieldName, value) {
        this[fieldName] = value;
    }


}
