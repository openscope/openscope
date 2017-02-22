import _isNil from 'lodash/isNil';
import { MCP_MODE, MCP_MODE_NAME, MCP_FIELD_NAME } from '../ModeControl/modeControlConstants';

/**
 * Executes control actions upon the aircraft by manipulating the MCP and FMS, and provides
 * readbacks to air traffic control instructions.
 *
 * @class Pilot
 */
export default class Pilot {
    /**
     * @constructor
     * @for Pilot
     */
    constructor(mcp, fms) {
        this._mcp = mcp;
        this._fms = fms;
    }

    /**
     * Maintain a given altitude
     *
     @for Pilot
     @method maintainAltitude
     */
    maintainAltitude(altitude) {
        if (_isNil(altitude)) {
            return;
        }

        this._setAltitudeFieldValue(altitude);
        this._setAltitudeHold();
    }

    /**
     * Maintain a given heading
     *
     @for Pilot
     @method maintainHeading
     */
    maintainHeading(heading) {
        if (_isNil(heading)) {
            return;
        }

        this._setHeadingFieldValue(heading);
        this._setHeadingHold();
    }

    /**
     * Maintain a given speed
     *
     @for Pilot
     @method maintainSpeed
     */
    maintainSpeed(speed) {
        if (_isNil(speed)) {
            return;
        }

        this._setSpeedFieldValue(speed);
        this._setSpeedHold();
    }

    /**
     * Return the altitude the aircraft is currently assigned. May be moving toward this altitude,
     * or already established at that altitude.
     *
     * @for Pilot
     * @method sayTargetedAltitude
     */
    sayTargetedAltitude() {
        return this._mcp.getFieldValue(MCP_FIELD_NAME.ALTITUDE);
    }

    /**
     * Return the heading the aircraft is currently targeting. May be moving toward this heading,
     * or already established at that heading.
     *
     * @for Pilot
     * @method sayTargetedHeading
     */
    sayTargetedHeading() {
        switch (this._mcp.headingMode) {
            case MCP_MODE.HEADING.HOLD:
                return this._mcp.getFieldValue(MCP_FIELD_NAME.HEADING);

            case MCP_MODE.HEADING.VOR_LOC:
                return this._mcp.getFieldValue(MCP_FIELD_NAME.COURSE);

            case MCP_MODE.HEADING.LNAV:
                return this._fms.currentWaypoint.heading;

            default:
                return;
        }
    }

    /**
     * Return the speed the aircraft is currently assigned. May be moving toward this speed, or
     * already established at this speed.
     *
     * @for Pilot
     * @method sayTargetedSpeed
     */
    sayTargetedSpeed() {
        if (this._mcp.getModeSelectorMode(MCP_MODE_NAME.SPEED) === MCP_MODE.SPEED.VNAV) {
            return this._fms.currentWaypoint.speed;
        }

        return this._mcp.getFieldValue(MCP_FIELD_NAME.SPEED);
    }

    /**
     * Set the MCP altitude mode to "HOLD"
     *
     * @for Pilot
     * @method _setAltitudeHold
     * @private
     */
    _setAltitudeHold() {
        this._mcp.setMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.HOLD);
    }

    /**
     * Set the MCP altitude mode to "APCH"
     *
     * @for Pilot
     * @method _setAltitudeApproach
     * @private
     */
    _setAltitudeApproach() {
        this._mcp.setMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.APPROACH);
    }

    /**
     * Set the MCP altitude mode to "VNAV"
     *
     * @for Pilot
     * @method _setAltitudeVnav
     * @private
     */
    _setAltitudeVnav() {
        this._mcp.setMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.VNAV);
    }

    /**
     * Set the value of the MCP's altitude "field" to a given value
     *
     * @for Pilot
     * @method _setAltitudeFieldValue
     * @private
     */
    _setAltitudeFieldValue(altitude) {
        this._mcp.setValue(MCP_MODE_NAME.ALTITUDE, altitude);
    }

    /**
     * Set the MCP heading mode to "HOLD"
     *
     * @for Pilot
     * @method _setHeadingHold
     * @private
     */
    _setHeadingHold() {
        this._mcp.setMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.HOLD);
    }

    /**
     * Set the MCP heading mode to "LNAV"
     *
     * @for Pilot
     * @method _setHeadingLnav
     * @private
     */
    _setHeadingLnav() {
        this._mcp.setMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.LNAV);
    }

    /**
     * Set the MCP heading mode to "VOR_LOC"
     *
     * @for Pilot
     * @method _setHeadingVorLoc
     * @private
     */
    _setHeadingVorLoc() {
        this._mcp.setMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.VOR_LOC);
    }

    /**
     * Set the value of the MCP's heading "field" to a given value
     *
     * @for Pilot
     * @method _setHeadingFieldValue
     * @private
     */
    _setHeadingFieldValue(heading) {
        this._mcp.setValue(MCP_FIELD_NAME.HEADING, heading);
    }

    /**
     * Set the MCP speed mode to "HOLD"
     *
     * @for Pilot
     * @method _setSpeedHold
     * @private
     */
    _setSpeedHold() {
        this._mcp.setMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.HOLD);
    }

    /**
     * Set the MCP speed mode to "VNAV"
     *
     * @for Pilot
     * @method _setSpeedVnav
     * @private
     */
    _setSpeedVnav() {
        this._mcp.setMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.VNAV);
    }

    /**
     * Set the MCP speed mode to "N1"
     *
     * @for Pilot
     * @method _setSpeedN1
     * @private
     */
    _setSpeedN1() {
        this._mcp.setMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.N1);
    }

    /**
     * Set the value of the MCP's speed "field" to a given value
     *
     * @for Pilot
     * @method _setSpeedFieldValue
     */
    _setSpeedFieldValue(speed) {
        this._mcp.setValue(MCP_FIELD_NAME.SPEED, speed);
    }
}
