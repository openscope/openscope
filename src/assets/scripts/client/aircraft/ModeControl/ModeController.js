import {
    MCP_MODE,
    MCP_MODE_NAME,
    MCP_FIELD_NAME,
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
        // Mode Selectors
        this.altitudeMode = MCP_MODE.ALTITUDE.OFF;
        this.autopilotMode = MCP_MODE.AUTOPILOT.OFF;
        this.headingMode = MCP_MODE.HEADING.OFF;
        this.speedMode = MCP_MODE.SPEED.OFF;

        // Fields
        this.altitude = -1;
        this.course = -1;
        this.heading = -1;
        this.speed = -1;

        // Other
        this.shouldExpediteAltitudeChange = false;
        this.nav1Datum = null;
        this.descentAngle = 0;

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

    /**
     * Set the MCP altitude mode to "VNAV"
     *
     * @for ModeController
     * @method setAltitudeVnav
     */
    setAltitudeVnav() {
        this.setModeSelectorMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.VNAV);
    }

    /**
     * Set the MCP altitude mode to "HOLD"
     *
     * @for ModeController
     * @method setAltitudeHoldWithValue
     * @param altitude {number}
     */
    setAltitudeHoldWithValue(altitude) {
        this.setModeSelectorModeAndFieldValue(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.HOLD, altitude);
    }

    /**
     * Set the MCP altitude mode to "APCH"
     *
     * @for ModeController
     * @method setAltitudeApproach
     */
    setAltitudeApproach() {
        this.setModeSelectorMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.APPROACH);
    }

    /**
     * Set the MCP altitude mode to "VNAV"
     *
     * @for ModeController
     * @method setAltitudeVnavWithValue
     * @param altitude {number}
     */
    setAltitudeVnavWithValue(altitude) {
        this.setModeSelectorModeAndFieldValue(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.VNAV, altitude);
    }

    /**
     * Set the value of the MCP's altitude "field" to a given value
     *
     * @for ModeController
     * @method setAltitudeFieldValue
     */
    setAltitudeFieldValue(altitude) {
        this.setFieldValue(MCP_FIELD_NAME.ALTITUDE, altitude);
    }

    /**
     * Set the value of the MCP's course "field" to a given value
     *
     * @for ModeController
     * @method setCourseFieldValue
     * @param {Number} course - magnetic course to set value to
     */
    setCourseFieldValue(course) {
        this.setFieldValue(MCP_FIELD_NAME.COURSE, course);
    }

    /**
     * Set the MCP heading mode to "HOLD"
     *
     * @for ModeController
     * @method setHeadingHold
     */
    setHeadingHold() {
        this.setModeSelectorMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.HOLD);
    }

    /**
     * Set the MCP heading mode to "LNAV"
     *
     * @for ModeController
     * @method setHeadingLnavWithValue
     * @param runwayHeading {number}
     */
    setHeadingLnavWithValue(runwayHeading) {
        this.setModeSelectorModeAndFieldValue(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.LNAV, runwayHeading);
    }

    /**
     * Set the MCP heading mode to "VOR_LOC"
     *
     * @for ModeController
     * @method setHeadingVorLoc
     */
    setHeadingVorLoc() {
        this.setModeSelectorMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.VOR_LOC);
    }

    /**
     * Set the value of the MCP's heading "field" to a given value
     *
     * @for ModeController
     * @method setHeadingFieldValue
     */
    setHeadingFieldValue(heading) {
        this.setFieldValue(MCP_FIELD_NAME.HEADING, heading);
    }

    /**
     * Set the MCP speed mode to "HOLD"
     *
     * @for ModeController
     * @method setSpeedHold
     */
    setSpeedHold() {
        this.setModeSelectorMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.HOLD);
    }

    /**
     * Set the MCP speed mode to "VNAV"
     *
     * @for ModeController
     * @method setSpeedVnav
     */
    setSpeedVnav() {
        this.setModeSelectorMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.VNAV);
    }

    /**
     * Set the MCP speed mode to "N1"
     *
     * @for ModeController
     * @method setSpeedN1WithValue
     * @param speed {number}
     */
    setSpeedN1WithValue(speed) {
        this.setModeSelectorModeAndFieldValue(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.N1, speed);
    }

    /**
     * Set the value of the MCP's speed "field" to a given value
     *
     * @for ModeController
     * @method setSpeedFieldValue
     * @param speed {number}
     */
    setSpeedFieldValue(speed) {
        this.setFieldValue(MCP_FIELD_NAME.SPEED, speed);
    }
}
