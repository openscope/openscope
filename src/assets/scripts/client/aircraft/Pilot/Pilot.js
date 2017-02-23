import _floor from 'lodash/floor';
import _isNil from 'lodash/isNil';
import _isObject from 'lodash/isObject';
import _isEmpty from 'lodash/isEmpty';
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
    constructor(modeController, fms) {
        if (!_isObject(modeController) || _isEmpty(modeController)) {
            throw new TypeError('Invalid parameter. expected modeController to an instance of ModeController');
        }

        if (!_isObject(fms) || _isEmpty(fms)) {
            throw new TypeError('Invalid parameter. expected fms to an instance of Fms');
        }

        /**
         * @property _mcp
         * @type {ModeController}
         * @default modeController
         * @private
         */
        this._mcp = modeController;

        /**
         * @property _fms
         * @type {Fms}
         * @default fms
         * @private
         */
        this._fms = fms;
    }

    // Finish me!
    /**
     * Apply the specified departure procedure by adding it to the fms route
     * Note: SHOULD NOT change the heading mode
     *
     * @for Pilot
     * @method applyDepartureProcedure
     * @param {String} procedureId - the identifier for the procedure
     * @param {String} departureRunway - the identifier for the runway to use for departure
     * @return {Array} [success of operation, readback]
     */
    applyDepartureProcedure(procedureId, departureRunway) {
        const airport = this._airportController.airport_get();
        const standardRouteModel = this._navigationLibrary.sidCollection.findRouteByIcao(procedureId);
        const exit = this._navigationLibrary.sidCollection.findRandomExitPointForSIDIcao(procedureId);
        const route = `${airport.icao}.${procedureId}.${exit}`;

        if (_isNil(standardRouteModel)) {
            return [false, 'SID name not understood'];
        }

        // TODO: Make this ensure there is a runway
        if (!departureRunway) {
            return [false, 'unsure if we can accept that procedure; we don\'t have a runway assignment'];
        }

        // TODO: is this really the right method to use here? The name doesn't seem like it would be?
        if (!standardRouteModel.hasFixName(departureRunway)) {
            return [false, `unable, the ${standardRouteModel.name.toUpperCase()} departure not valid from Runway ${departureRunway}`];
        }

        // TODO: this is the wrong place for this `.toUpperCase()`
        this._fms.followSID(route.toUpperCase());

        const readback = {};
        readback.log = `cleared to destination via the ${procedureId} departure, then as filed`;
        readback.say = `cleared to destination via the ${standardRouteModel.name} departure, then as filed`;

        return [true, readback];
    }

    /**
     * Configure the aircraft to fly in accordance with the requested flightplan
     *
     * @for Pilot
     * @method clearedAsFiled
     * @param {Number} initialAltitude  the altitude aircraft can automatically climb to at this airport
     * @param {Number} runwayHeading    the magnetic heading of the runway, in radians
     * @param {Number} cruiseSpeed      the cruise speed of the aircraft, in knots
     * @return {Array}                  [success of operation, readback]
     */
    clearedAsFiled(initialAltitude, runwayHeading, cruiseSpeed) {
        // FIXME: this needs to be handled differently
        // if (!this._fms.replaceCurrentFlightPlan(this._fms.flightPlan.route)) {
        //     return [false, 'unable to clear as filed'];
        // }

        this._setAltitudeHoldWithValue(initialAltitude);
        this._setHeadingLnavWithValue(runwayHeading);
        this._setSpeedN1WithValue(cruiseSpeed);

        const readback = {};
        readback.log = `cleared to destination as filed. Climb and maintain ${initialAltitude}, expect ` +
                `${this._fms.flightPlan.altitude} 10 minutes after departure`;
        readback.say = `cleared to destination as filed. Climb and maintain ${radio_altitude(initialAltitude)}, ` +
                `expect ${radio_altitude(this._fms.flightPlan.altitude)}, ${radio_spellOut('10')} minutes ` +
                'after departure';

        return ['ok', readback];
    }

    /**
     * Climb in accordance with the altitude restrictions
     *
     * @for Pilot
     * @method climbViaSid
     * @param {Number} altitude  altitude at which the climb will end (regardless of fix restrictions)
     * @return {Array}           [success of operation, readback]
     */
    climbViaSid(altitude) {
        if (_isNil(altitude)) {
            altitude = this._fms.flightPlan.altitude;
        }

        this._setAltitudeVnavWithValue(altitude);

        const readback = {
            log: 'climb via SID',
            say: 'climb via SID'
        };

        return [true, readback];
    }

    /**
     * Descend in accordance with the altitude restrictions
     *
     * @for Pilot
     * @method descendViaSTAR
     * @param {Number} altitude - (optional) altitude at which the descent will end (regardless of fix restrictions)
     * @return {Array} [success of operation, readback]
     */
    descendViaSTAR(/* optional */ altitude) {
        if (_isNil(altitude)) {
            // TODO: This should be the altitude of the lowest fix restriction on the STAR
            altitude = 0;
        }

        this._setAltitudeFieldValue(altitude);
        this._setAltitudeVnav();
        this._setSpeedVnav();

        // Build readback
        const readback = {};
        readback.log = 'descend via the arrival';
        readback.say = 'descend via the arrival';

        return [true, readback];
    }

    /**
     * Expedite the climb or descent to the assigned altitude, to use maximum possible rate
     *
     * @for Pilot
     * @method shouldExpediteAltitudeChange
     */
    shouldExpediteAltitudeChange() {
        this._mcp.shouldExpediteAltitudeChange = true;

        return [true, 'expediting to assigned altitude'];
    }

    /**
     * Maintain a given altitude
     *
     * @for Pilot
     * @method maintainAltitude
     * @param {Number} altitude   the altitude to maintain, in feet
     * @param {Boolean} expedite  whether to use maximum possible climb/descent rate
     * @return {Array}            [success of operation, readback]
     */
    maintainAltitude(currentAltitude, altitude, expedite, shouldUseSoftCeiling, airportModel) {
        const { minAssignableAltitude, maxAssignableAltitude } = airportModel;
        // TODO: this could probably be done in the AirportModel
        // FIXME: we should set a new var here instead of reassigning to the param
        altitude = clamp(minAssignableAltitude, altitude, maxAssignableAltitude);

        if (shouldUseSoftCeiling && altitude === maxAssignableAltitude) {
            altitude += 1;  // causes aircraft to 'leave' airspace, and continue climb through ceiling
        }

        this._setAltitudeHoldWithValue(altitude);

        // TODO: this could be split to another method
        // Build readback
        altitude = _floor(altitude, -2);
        const altitudeInstruction = radio_trend('altitude', currentAltitude, altitude);
        const altitudeVerbal = radio_altitude(altitude);
        let expediteReadback = '';

        if (expedite) {
            // including space here so when expedite is false there isnt an extra space after altitude
            expediteReadback = ' and expedite';

            this.shouldExpediteAltitudeChange();
        }

        const readback = {};
        readback.log = `${altitudeInstruction} ${altitude}${expediteReadback}`;
        readback.say = `${altitudeInstruction} ${altitudeVerbal}${expediteReadback}`;

        return ['ok', readback];
    }

    /**
     * Maintain a given heading
     *
     * @for Pilot
     * @method maintainHeading
     * @param {Number} heading - the heading to maintain, in radians_normalize
     * @param {String} direction - (optional) the direction of turn; either 'left' or 'right'
     * @param {Boolean} incremental - (optional) whether the value is a numeric heading, or a number of degrees to turn
     * @return {Array} [success of operation, readback]
     */
    maintainHeading(heading, direction, incremental) {
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
     * Maintain the aircraft's present magnetic heading
     *
     * @for Pilot
     * @method maintainPresentHeading
     * @param {Number} heading - the heading the aircraft is facing at the time the command is given
     * @return {Array} [success of operation, readback]
     */
    maintainPresentHeading(heading) {
        this._setHeadingFieldValue(heading);
        this._setHeadingHold();

        const readback = {};
        readback.log = 'fly present heading';
        readback.say = 'fly present heading';

        return [true, readback];
    }

    /**
     * Maintain a given speed
     *
     * @for Pilot
     * @method maintainSpeed
     * @param {Number} speed - the speed to maintain, in knots
     * @return {Array} [success of operation, readback]
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
     * Skip ahead in the FMS to the waypoint for the specified fixName, and activate LNAV to fly to it
     *
     * @for Pilot
     * @method proceedDirect
     * @param {String} fixName - name of the fix we are flying direct to
     * @return {Array} [success of operation, readback]
     */
    proceedDirect(fixName) {
        // TODO: Update #skipToWaypoint so it tells us whether it found and skipped anything or not
        this._fms.skipToWaypoint(fixName);
        this._setHeadingLnav();

        return [true, `proceed direct ${fixName}`];
    }

    /**
     * Return the route of the aircraft
     *
     * @for AircraftCommander
     * @method sayRoute
     * @return {Array} [success of operation, readback]
     */
    sayRoute() {
        const readback = {};
        readback.log = `route: ${this._fms.currentRoute}`;
        readback.say = 'here\'s our route';

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
     * @method _setAltitudeHoldWithValue
     * @param altitude {number}
     * @private
     */
    _setAltitudeHoldWithValue(altitude) {
        this._mcp.setModeSelectorModeAndFieldValue(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.HOLD, altitude);
    }

    /**
     * Set the MCP altitude mode to "APCH"
     *
     * @for Pilot
     * @method _setAltitudeApproach
     * @private
     */
    _setAltitudeApproach() {
        this._mcp.setModeSelectorMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.APPROACH);
    }

    /**
     * Set the MCP altitude mode to "VNAV"
     *
     * @for Pilot
     * @method _setAltitudeVnavWithValue
     * @param altitude {number}
     * @private
     */
    _setAltitudeVnavWithValue(altitude) {
        this._mcp.setModeSelectorModeAndFieldValue(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.VNAV, altitude);
    }

    /**
     * Set the value of the MCP's altitude "field" to a given value
     *
     * @for Pilot
     * @method _setAltitudeFieldValue
     * @private
     */
    _setAltitudeFieldValue(altitude) {
        this._mcp.setFieldValue(MCP_FIELD_NAME.ALTITUDE, altitude);
    }

    /**
     * Set the MCP heading mode to "HOLD"
     *
     * @for Pilot
     * @method _setHeadingHold
     * @private
     */
    _setHeadingHold() {
        this._mcp.setModeSelectorMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.HOLD);
    }

    /**
     * Set the MCP heading mode to "LNAV"
     *
     * @for Pilot
     * @method _setHeadingLnavWithValue
     * @param runwayHeading {number}
     * @private
     */
    _setHeadingLnavWithValue(runwayHeading) {
        this._mcp.setModeSelectorModeAndFieldValue(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.LNAV, runwayHeading);
    }

    /**
     * Set the MCP heading mode to "VOR_LOC"
     *
     * @for Pilot
     * @method _setHeadingVorLoc
     * @private
     */
    _setHeadingVorLoc() {
        this._mcp.setModeSelectorMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.VOR_LOC);
    }

    /**
     * Set the value of the MCP's heading "field" to a given value
     *
     * @for Pilot
     * @method _setHeadingFieldValue
     * @private
     */
    _setHeadingFieldValue(heading) {
        this._mcp.setFieldValue(MCP_FIELD_NAME.HEADING, heading);
    }

    /**
     * Set the MCP speed mode to "HOLD"
     *
     * @for Pilot
     * @method _setSpeedHold
     * @private
     */
    _setSpeedHold() {
        this._mcp.setModeSelectorMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.HOLD);
    }

    /**
     * Set the MCP speed mode to "VNAV"
     *
     * @for Pilot
     * @method _setSpeedVnav
     * @private
     */
    _setSpeedVnav() {
        this._mcp.setModeSelectorMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.VNAV);
    }

    /**
     * Set the MCP speed mode to "N1"
     *
     * @for Pilot
     * @method _setSpeedN1WithValue
     * @param speed {number}
     * @private
     */
    _setSpeedN1WithValue(speed) {
        this._mcp.setModeSelectorModeAndFieldValue(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.N1, speed);
    }

    /**
     * Set the value of the MCP's speed "field" to a given value
     *
     * @for Pilot
     * @method _setSpeedFieldValue
     */
    _setSpeedFieldValue(speed) {
        this._mcp.setFieldValue(MCP_FIELD_NAME.SPEED, speed);
    }
}
