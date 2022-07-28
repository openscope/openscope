import {
    MCP_MODE,
    MCP_MODE_NAME,
    MCP_FIELD_NAME
} from './modeControlConstants';
import { INVALID_NUMBER } from '../../constants/globalConstants';
import { radiansToDegrees } from '../../utilities/unitConverters';

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
    constructor() {
        /**
         * Flag used to determine if the controller is enabled
         *
         * @property isEnabled
         * @type {boolean}
         * @default flase
         * @private
         */
        this.isEnabled = false;

        // Mode Selectors
        /**
         * The current altitudeMode
         *
         * This mode informs what value to use for `aircraft.target.altitude`
         *
         * @property
         * @type
         * @default
         */
        this.altitudeMode = MCP_MODE.ALTITUDE.OFF;

        /**
         *
         *
         * @property autopilotMode
         * @type
         * @default MCP_MODE.AUTOPILOT.OFF
         */
        this.autopilotMode = MCP_MODE.AUTOPILOT.OFF;

        /**
         * The current headingeMode
         *
         * This mode informs what value to use for `aircraft.targetHeading`
         *
         *
         * @property headingMode
         * @type
         * @default MCP_MODE.HEADING.OFF
         */
        this.headingMode = MCP_MODE.HEADING.OFF;

        /**
         * The current speedMode
         *
         * This mode informs what value to use for `aircraft.target.speed`
         *
         * @property speedMode
         * @type
         * @default MCP_MODE.SPEED.OFF
         */
        this.speedMode = MCP_MODE.SPEED.OFF;

        // Fields

        /**
         * Altitude value
         *
         * Used when `altitudeMode` is 'HOLD'
         *
         * @property altitude
         * @type {number}
         * @default INVALID_NUMBER
         */
        this.altitude = INVALID_NUMBER;

        /**
         *
         *
         * @property course
         * @type {number}
         * @default INVALID_NUMBER
         */
        this.course = INVALID_NUMBER;

        /**
         * Heading value in radians
         *
         * Used when `headingMode` is `HOLD`
         *
         * Use `#headingInDegrees` when this value needs to
         * be shown to the user, like in the `AircraftStripView`
         *
         * @property heading
         * @type {number}
         * @default INVALID_NUMBER
         */
        this.heading = INVALID_NUMBER;

        /**
         * Speed value in knots
         *
         * Used when `speedMode` is `HOLD`
         *
         * @property speed
         * @type {number}
         * @default INVALID_NUMBER
         */
        this.speed = INVALID_NUMBER;

        // Other

        /**
         *
         *
         * @property shouldExpediteAltitudeChange
         * @type {boolean}
         * @default false
         */
        this.shouldExpediteAltitudeChange = false;

        /**
         *
         *
         * @property nav1Datum
         * @type
         * @default null
         */
        this.nav1Datum = null;

        /**
         *
         *
         * @property descentAngle
         * @type {number}
         * @default 0
         */
        this.descentAngle = 0;

        this.init();
    }

    /**
     * Current heading value expressed in degrees (0 - 359)
     *
     * @property headingInDegrees
     * @return {number}
     */
    get headingInDegrees() {
        return Math.floor(radiansToDegrees(this.heading));
    }

    /**
     * Initialize the instance
     *
     * @for ModeController
     * @method init
     */
    init() {
        return this;
    }

    /**
     * Sets `#isEnabled` flag to `true`
     *
     * @for ModeController
     * @method enable
     */
    enable() {
        if (this.isEnabled) {
            return;
        }

        this.isEnabled = true;

        this._setModeSelectorMode(MCP_MODE_NAME.AUTOPILOT, MCP_MODE.AUTOPILOT.ON);
    }

    /**
     * Sets `#isEnabled` flag to `false`
     *
     * @for ModeController
     * @method disable
     */
    disable() {
        if (!this.isEnabled) {
            return;
        }

        this.isEnabled = false;
        this._setModeSelectorMode(MCP_MODE_NAME.AUTOPILOT, MCP_MODE.AUTOPILOT.OFF);
    }

    /**
     *
     *
     * @for ModeController
     * @method setNav1Datum
     * @param nav1Datum {number}
     */
    setNav1Datum(datum) {
        this.nav1Datum = datum;
    }

    // TODO: the descentAngle is a part of the ILS system itself, and should not be owned by the MCP
    /**
     *
     *
     * @for ModeController
     * @method setDescentAngle
     * @param descentAngle {number}
     */
    setDescentAngle(descentAngle) {
        this.descentAngle = descentAngle;
    }

    /**
     * Set the MCP altitude mode to `APCH`
     *
     * @for ModeController
     * @method setAltitudeApproach
     */
    setAltitudeApproach() {
        this._setModeSelectorMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.APPROACH);
    }

    /**
     * Set the value of the MCP's altitude field to a given value
     *
     * @for ModeController
     * @method setAltitudeFieldValue
     * @param altitude {Number} value to set in the altitude field
     */
    setAltitudeFieldValue(altitude) {
        this._setFieldValue(MCP_FIELD_NAME.ALTITUDE, altitude);
    }

    /**
     * Set the MCP altitude mode to `HOLD`
     *
     * @for ModeController
     * @method setAltitudeHold
     */
    setAltitudeHold() {
        this._setModeSelectorMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.HOLD);
    }

    /**
     * Set the MCP altitude mode to `VNAV`
     *
     * @for ModeController
     * @method setAltitudeVnav
     */
    setAltitudeVnav() {
        this._setModeSelectorMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.VNAV);
    }

    /**
     * Set the value of the MCP's course field to a given value
     *
     * @for ModeController
     * @method setCourseFieldValue
     * @param course {number}  magnetic course (in radians)
     */
    setCourseFieldValue(course) {
        this._setFieldValue(MCP_FIELD_NAME.COURSE, course);
    }

    /**
     * Set the value of the MCP's heading field to a given value
     *
     * @for ModeController
     * @method setHeadingFieldValue
     * @param heading {number}  magnetic heading (in radians)
     */
    setHeadingFieldValue(heading) {
        this._setFieldValue(MCP_FIELD_NAME.HEADING, heading);
    }

    /**
     * Set the MCP heading mode to `HOLD`
     *
     * @for ModeController
     * @method setHeadingHold
     */
    setHeadingHold() {
        this._setModeSelectorMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.HOLD);
    }

    /**
     * Set the MCP heading mode to `LNAV`
     *
     * @for ModeController
     * @method setHeadingLnav
     */
    setHeadingLnav() {
        this._setModeSelectorMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.LNAV);
    }

    /**
     * Set the MCP heading mode to `VOR_LOC`
     *
     * @for ModeController
     * @method setHeadingVorLoc
     */
    setHeadingVorLoc() {
        this._setModeSelectorMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.VOR_LOC);
    }

    /**
     * Set the value of the MCP's speed field to a given value
     *
     * @for ModeController
     * @method setSpeedFieldValue
     * @param speed {Number}  speed to set value to
     */
    setSpeedFieldValue(speed) {
        this._setFieldValue(MCP_FIELD_NAME.SPEED, speed);
    }

    /**
     * Set the MCP speed mode to `HOLD`
     *
     * @for ModeController
     * @method setSpeedHold
     */
    setSpeedHold() {
        this._setModeSelectorMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.HOLD);
    }

    /**
     * Set the MCP speed mode to `N1`
     *
     * @for ModeController
     * @method setSpeedN1
     */
    setSpeedN1() {
        this._setModeSelectorMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.N1);
    }

    /**
     * Set the MCP speed mode to `VNAV`
     *
     * @for ModeController
     * @method setSpeedVnav
     */
    setSpeedVnav() {
        this._setModeSelectorMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.VNAV);
    }

    /**
     * Set the appropriate values in the MCP when spawning an aircraft already in flight
     *
     * @for ModeController
     * @method initializeForAirborneFlight
     * @param {number} bottomAltitude - the lowest altitude restriction in the FMS
     * @param {number} airspaceCeiling - maximum altitude belonging to the controller
     * @param {number} currentAltitude - aircraft's current altitude, in feet ASL
     * @param {number} currentHeading - aircraft's current heading, in radians
     * @param {number} currentSpeed - aircraft's current speed, in knots
     */
    initializeForAirborneFlight(bottomAltitude, airspaceCeiling, currentAltitude, currentHeading, currentSpeed) {
        // ensure aircraft will always descend at least to reach our airspace ceiling
        const descentAltitude = Math.min(bottomAltitude, airspaceCeiling, currentAltitude);

        this.setAltitudeFieldValue(descentAltitude);
        this.setAltitudeVnav();

        // if unable to descend via STAR, force a descent to the top of our airspace
        if (bottomAltitude === -1) {
            this.setAltitudeFieldValue(Math.min(airspaceCeiling, currentAltitude));
            this.setAltitudeHold();
        }

        this.setHeadingFieldValue(currentHeading);
        this.setHeadingLnav();
        this.setSpeedFieldValue(currentSpeed);
        this.setSpeedVnav();
        this.enable();
    }

    /**
    * Set the value of a given fieldName
    *
    * @for ModeController
    * @method _setFieldValue
    * @param fieldName {MCP_FIELD_NAME}
    * @param value {number}
    */
    _setFieldValue(fieldName, value) {
        this[fieldName] = value;
    }

    /**
     * Set the mode of a given modeSelector
     *
     * @for ModeController
     * @method _setModeSelectorMode
     * @param modeSelector {MCP_MODE_NAME}
     * @param mode {MCP_MODE}
     */
    _setModeSelectorMode(modeSelector, mode) {
        this[modeSelector] = mode;
    }
}
