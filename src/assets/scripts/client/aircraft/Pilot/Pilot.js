import { MCP_MODE, MCP_MODE_NAME, MCP_FIELDS } from '../ModeControl/modeControlConstants';

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

    _setAltitudeHold(altitude) {
        this._mcp.setMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.HOLD, altitude);
    }

    _setAltitudeApproach() {
        this._mcp.setMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.APPROACH);
    }

    _setAltitudeVnav() {
        this._mcp.setMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.VNAV);
    }

    _setAltitudeFieldValue(altitude) {
        this._mcp.setValue(MCP_MODE_NAME.ALTITUDE, altitude);
    }

    _setHeadingHold() {
        this._mcp.setMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.HOLD);
    }

    _setHeadingLnav() {
        this._mcp.setMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.LNAV);
    }

    _setHeadingVorLoc() {
        this._mcp.setMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.VOR_LOC);
    }

    _setHeadingFieldValue(heading) {
        this._mcp.setValue(MCP_FIELDS.HEADING, heading);
    }

    _setSpeedHold() {
        this._mcp.setMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.HOLD);
    }

    _setSpeedVnav() {
        this._mcp.setMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.VNAV);
    }

    _setSpeedN1() {
        this._mcp.setMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.N1);
    }

    _setSpeedFieldValue(speed) {
        this._mcp.setValue(MCP_FIELDS.SPEED, speed);
    }
}
