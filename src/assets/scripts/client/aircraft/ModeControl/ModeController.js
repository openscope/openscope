import { radiansToDegrees } from '../../utilities/unitConverters';
import {
    MCP_MODE,
    MCP_MODE_NAME,
    MCP_FIELD_NAME
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
     *
     *
     * @property headingInDegrees
     * @return {number}
     */
    get headingInDegrees() {
        return radiansToDegrees(this.heading);
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
     * Set the MCP altitude mode to "APCH"
     *
     * @for ModeController
     * @method setAltitudeApproach
     */
    setAltitudeApproach() {
        this._setModeSelectorMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.APPROACH);
    }

    /**
     * Set the value of the MCP's altitude "field" to a given value
     *
     * @for ModeController
     * @method setAltitudeFieldValue
     * @param altitude {Number} value to set in the altitude field
     */
    setAltitudeFieldValue(altitude) {
        this._setFieldValue(MCP_FIELD_NAME.ALTITUDE, altitude);
    }

    /**
     * Set the MCP altitude mode to "HOLD"
     *
     * @for ModeController
     * @method setAltitudeHold
     */
    setAltitudeHold() {
        this._setModeSelectorMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.HOLD);
    }

    /**
     * Set the MCP altitude mode to "VNAV"
     *
     * @for ModeController
     * @method setAltitudeVnav
     */
    setAltitudeVnav() {
        this._setModeSelectorMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.VNAV);
    }

    /**
     * Set the value of the MCP's course "field" to a given value
     *
     * @for ModeController
     * @method setCourseFieldValue
     * @param course {Number} magnetic course to set value to
     */
    setCourseFieldValue(course) {
        this._setFieldValue(MCP_FIELD_NAME.COURSE, course);
    }

    /**
     * Set the value of the MCP's heading "field" to a given value
     *
     * @for ModeController
     * @method setHeadingFieldValue
     * @param heading {Number} magnetic heading to set value to
     */
    setHeadingFieldValue(heading) {
        this._setFieldValue(MCP_FIELD_NAME.HEADING, heading);
    }

    /**
     * Set the MCP heading mode to "HOLD"
     *
     * @for ModeController
     * @method setHeadingHold
     */
    setHeadingHold() {
        this._setModeSelectorMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.HOLD);
    }

    /**
     * Set the MCP heading mode to "LNAV"
     *
     * @for ModeController
     * @method setHeadingLnav
     */
    setHeadingLnav() {
        this._setModeSelectorMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.LNAV);
    }

    /**
     * Set the MCP heading mode to "VOR_LOC"
     *
     * @for ModeController
     * @method setHeadingVorLoc
     */
    setHeadingVorLoc() {
        this._setModeSelectorMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.VOR_LOC);
    }

    /**
     * Set the value of the MCP's speed "field" to a given value
     *
     * @for ModeController
     * @method setSpeedFieldValue
     * @param speed {Number} speed to set value to
     */
    setSpeedFieldValue(speed) {
        this._setFieldValue(MCP_FIELD_NAME.SPEED, speed);
    }

    /**
     * Set the MCP speed mode to "HOLD"
     *
     * @for ModeController
     * @method setSpeedHold
     */
    setSpeedHold() {
        this._setModeSelectorMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.HOLD);
    }

    /**
     * Set the MCP speed mode to "N1"
     *
     * @for ModeController
     * @method setSpeedN1
     */
    setSpeedN1() {
        this._setModeSelectorMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.N1);
    }

    /**
     * Set the MCP speed mode to "VNAV"
     *
     * @for ModeController
     * @method setSpeedVnav
     */
    setSpeedVnav() {
        this._setModeSelectorMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.VNAV);
    }

    /**
     * Set the appropriate values in the MCP when spawning an aircraft that's already in flight
     *
     * @for ModeController
     * @method _initializeForAirborneFlight
     * @private
     */
    _initializeForAirborneFlight() {
        // TODO: We will need to set the altitude field to the lowest restriction on the STAR,
        // if applicable, or otherwise to the spawn altitude.
        this.setAltitudeVnav();
        this.setHeadingLnav();
        this.setSpeedVnav();
    }

    /**
    * Set the value of a given fieldName
    *
    * @for ModeController
    * @method _setFieldValue
    */
    _setFieldValue(fieldName, value) {
        this[fieldName] = value;
    }

    /**
     * Set the mode of a given modeSelector
     *
     * @for ModeController
     * @method _setModeSelectorMode
     */
    _setModeSelectorMode(modeSelector, mode) {
        this[modeSelector] = mode;
    }
}
