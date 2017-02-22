import _ceil from 'lodash/ceil';
import _floor from 'lodash/floor';
import _isNil from 'lodash/isNil';
import { clamp } from '../../math/core';
import { groupNumbers,
    radio_altitude,
    radio_heading,
    radio_spellOut,
    radio_trend
} from '../../utilities/radioUtilities';
import { degreesToRadians, heading_to_string } from '../../utilities/unitConverters';
import { radians_normalize } from '../../math/circle';
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
     * Configure the aircraft to fly in accordance with the requested flightplan
     *
     * @for Pilot
     * @method clearedAsFiled
     * @return {Array} [success of operation, readback]
     */
    clearedAsFiled(initialAltitude, runwayHeading, cruiseSpeed) {
        if (!this._fms.replaceCurrentFlightPlan(this._fms.flightPlan.route)) {
            return [false, 'unable to clear as filed'];
        }

        this._setAltitudeFieldValue(initialAltitude);
        this._setAltitudeHold();
        this._setHeadingFieldValue(runwayHeading);
        this._setHeadingLnav();
        this._setSpeedFieldValue(cruiseSpeed);
        this._setSpeedN1();

        const readback = {};
        readback.log = `cleared to destination as filed. Climb and maintain ${initialAltitude}, expect ` +
                `${this._fms.flightPlan.altitude} 10 minutes after departure`;
        readback.say = `cleared to destination as filed. Climb and maintain ${radio_altitude(initialAltitude)}, ` +
                `expect ${radio_altitude(this._fms.flightPlan.altitude)}, ${radio_spellOut('10')} minutes ` +
                'after departure';

        return ['ok', readback];
    }

    /**
     * Expedite the climb or descent to the assigned altitude, to use maximum possible rate
     *
     * @for Pilot
     * @method expediteAltitudeChange
     */
    expediteAltitudeChange() {
        this._mcp.expediteAltitudeChange = true;
    }

    /**
     * Maintain a given altitude
     *
     * @for Pilot
     * @method maintainAltitude
     */
    maintainAltitude(altitude, expedite) {
        if (_isNil(altitude)) {
            return;
        }

        const airport = this._airportController.airport_get();
        const minimumAssignableAltitude = _ceil(airport.elevation + 1000, -2);
        const maximumAssignableAltitude = airport.ctr_ceiling;
        altitude = clamp(minimumAssignableAltitude, altitude, maximumAssignableAltitude);
        const softCeiling = this._gameController.game.option.get('softCeiling') === 'yes';

        if (softCeiling && altitude === maximumAssignableAltitude) {
            altitude += 1;  // causes aircraft to 'leave' airspace, and continue climb through ceiling
        }

        this._setAltitudeFieldValue(altitude);
        this._setAltitudeHold();

        // Build readback
        altitude = _floor(altitude, -2);
        const aircraft = { altitude: 0 };   // FIXME: How can the Pilot get the aircraft's current altitude?
        const altitudeInstruction = radio_trend('altitude', aircraft.altitude, altitude);
        const altitude_verbal = radio_altitude(altitude);
        let expediteReadback = '';

        if (expedite) {
            expediteReadback = ' and expedite';
            this.expediteAltitudeChange();
        }

        const readback = {};
        readback.log = `${altitudeInstruction} ${altitude}${expediteReadback}`;
        readback.say = `${altitudeInstruction} ${altitude_verbal}${expediteReadback}`;

        return ['ok', readback];
    }

    /**
     * Maintain a given heading
     *
     * @for Pilot
     * @method maintainHeading
     @
     */
    maintainHeading(heading, direction, incremental) {
        if (_isNil(heading)) {
            return;
        }

        let degrees;

        if (incremental) {
            degrees = heading;
            const aircraft = { heading: 0 };    // FIXME: How can the Pilot access the current heading?

            if (direction === 'left') {
                heading = radians_normalize(aircraft.heading - degreesToRadians(degrees));
            } else if (direction === 'right') {
                heading = radians_normalize(aircraft.heading + degreesToRadians(degrees));
            }
        }

        this._setHeadingFieldValue(heading);
        this._setHeadingHold();

        // Build readback
        const heading_string = heading_to_string(heading);
        const readback = {};
        readback.log = `fly heading ${heading_string}`;
        readback.say = `fly heading ${radio_heading(heading_string)}`;

        if (incremental) {
            readback.log = `turn ${degrees} degrees ${direction}`;
            readback.say = `turn ${groupNumbers(degrees)} degrees ${direction}`;
        } else if (direction) {
            readback.log = `turn ${direction} heading ${heading_string}`;
            readback.say = `turn ${direction} heading ${radio_heading(heading_string)}`;
        }

        return [true, readback];
    }

    /**
     * Maintain a given speed
     *
     * @for Pilot
     * @method maintainSpeed
     */
    maintainSpeed(speed) {
        const aircraft = { speed: 0 };  // FIXME: How can the pilot access the aircraft's current speed?
        const instruction = radio_trend('speed', aircraft.speed, speed);

        this._setSpeedFieldValue(speed);
        this._setSpeedHold();

        // Build the readback
        const readback = {};
        readback.log = `${instruction} ${speed}`;
        readback.say = `${instruction} ${radio_spellOut(speed)}`;

        return [true, readback];
    }

    /**
     * Return the altitude the aircraft is currently assigned. May be moving toward this altitude,
     * or already established at that altitude.
     *
     * @for Pilot
     * @method sayTargetedAltitude
     */
    sayTargetedAltitude() {
        return this._mcp.altitude;
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
                return this._mcp.heading;

            case MCP_MODE.HEADING.VOR_LOC:
                return this._mcp.course;

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
        if (this._mcp.speed === MCP_MODE.SPEED.VNAV) {
            return this._fms.currentWaypoint.speed;
        }

        return this._mcp.speed;
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
