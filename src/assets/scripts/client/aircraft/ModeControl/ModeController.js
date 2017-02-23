import {
    MCP_MODE,
    MCP_MODE_NAME,
    MCP_MODE_TO_FIELD_MAP
} from './modeControlConstants';

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

        this.shouldExpediteAltitudeChange = false;

        this.init(isAircraftAirborne);
    }

    /**
     * Initialization tasks
     *
     * @for ModeController
     * @method init
     * @private
     */
    init(isAircraftAirborne) {
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
     * Set the mode of a given modeSelector
     *
     * @for ModeController
     * @method setModeSelectorMode
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

    /**
     * Convenience method that provides a way to set a mode
     * and its value at the same time.
     *
     * This method does not support `COURSE` and should be
     * used primarily for `#altitude`, `#heading` and `#speed`.
     *
     * @for ModeController
     * @method setModeSelectorModeAndFieldValue
     * @param modeSelector {string}
     * @param mode {string}
     * @param value {string}
     */
    setModeSelectorModeAndFieldValue(modeSelector, mode, value) {
        this.setModeSelectorMode(modeSelector, mode);
        this.setFieldValue(MCP_MODE_TO_FIELD_MAP[modeSelector], value);
    }
}
