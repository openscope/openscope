import _floor from 'lodash/floor';
import _isNil from 'lodash/isNil';
import _isObject from 'lodash/isObject';
import _isEmpty from 'lodash/isEmpty';
import RouteModel from '../../navigationLibrary/Route/RouteModel';
import { clamp } from '../../math/core';
import { groupNumbers,
    radio_altitude,
    radio_heading,
    radio_runway,
    radio_spellOut,
    radio_trend
} from '../../utilities/radioUtilities';
import { FLIGHT_MODES } from '../../constants/aircraftConstants';
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
     * @for Pilot
     * @constructor
     * @param modeController {ModeController}
     * @param fms {Fms}
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

    /**
     * Apply the specified arrival procedure by adding it to the fms route
     * Note: SHOULD NOT change the heading mode
     *
     * @for Pilot
     * @method applyArrivalProcedure
     * @param {String} routeString - route string in the form of `entry.procedure.airport`
     * @return {Array} [success of operation, readback]
     */
    applyArrivalProcedure(routeString) {
        const routeModel = new RouteModel(routeString);
        const airport = this._airportController.airport_get();
        const starName = this._navigationLibrary.starCollection.findRouteByIcao(routeModel.procedure).name;

        // TODO: This length check might not be needed. this is covered via the CommandParser when
        // this method runs as the result of a command.
        if (routeString.length === 0 || !this._navigationLibrary.starCollection.hasRoute(routeModel.procedure)) {
            return [false, 'STAR name not understood'];
        }

        this._fms.followSTAR(routeModel.routeCode);

        // Build readback
        const readback = {};
        readback.log = `cleared to the ${airport.name} via the ${routeModel.procedure} arrival`;
        readback.say = `cleared to the ${airport.name} via the ${starName.toUpperCase()} arrival`;

        return [true, readback];
    }

    /**
     * Apply the specified departure procedure by adding it to the fms route
     * Note: SHOULD NOT change the heading mode
     *
     * @for Pilot
     * @method applyDepartureProcedure
     * @param procedureId {String}      the identifier for the procedure
     * @param departureRunway {String}  the identifier for the runway to use for departure
     * @param airportIcao {string}      airport icao identifier
     * @return {array}                  [success of operation, readback]
     */
    applyDepartureProcedure(procedureId, departureRunway, airportIcao) {
        const standardRouteModel = this._fms.findSidByProcedureId(procedureId);

        if (_isNil(standardRouteModel)) {
            return [false, 'SID name not understood'];
        }

        const exit = this._fms.findRandomExitPointForSidProcedureId(procedureId);
        const routeStr = `${airportIcao}.${procedureId}.${exit}`;

        // verify route here

        if (!departureRunway) {
            return [false, 'unsure if we can accept that procedure; we don\'t have a runway assignment'];
        }

        if (!standardRouteModel.hasFixName(departureRunway)) {
            return [false, `unable, the ${standardRouteModel.name.toUpperCase()} departure not valid from Runway ${departureRunway}`];
        }

        this._setAltitudeVnav();
        this._setSpeedVnav();
        this._fms.replaceDepartureProcedure(routeStr, departureRunway);

        const readback = {};
        readback.log = `cleared to destination via the ${procedureId} departure, then as filed`;
        readback.say = `cleared to destination via the ${standardRouteModel.name} departure, then as filed`;

        return [true, readback];
    }

    /**
     * Replace the entire route stored in the FMS with legs freshly generated based on the provided route string
     *
     * @for Pilot
     * @method applyNewRoute
     * @param {String} routeString - route string
     * @return {Array} [success of operation, readback]
     */
    applyNewRoute(routeString) {
        const route = this._fms.formatRoute(routeString);

        if (!this._fms.customRoute(route, true)) {
            const readback = {};
            readback.log = `requested route of "${route}" is invalid`;
            readback.say = 'that route is invalid';

            return [false, readback];
        }

        // TODO: what exactly are we checking here?
        // if (!route || !routeString || routeString.indexOf(' ') > -1) {
        //     return [false, 'unknown issues'];
        // }


        // Build readback
        const readback = {};
        readback.log = `rerouting to: ${this._fms.fp.route.join(' ')}`;
        readback.say = 'rerouting as requested';

        return [true, readback];
    }

    /**
     * Apply the specified route, and as applicable, merge it with the current route
     *
     * @for Pilot
     * @method applyPartialRouteAmendment
     * @param {String} routeString - route string in the form of `entry.procedure.airport`
     * @return {Array} [success of operation, readback]
     */
    applyPartialRouteAmendment(routeString) {
        // TODO: replace with routeStringFormatHelper
        const route = this._fms.formatRoute(routeString);

        if (_isNil(route)) {
            return [false, 'unable to amend route because no route was specified'];
        }

        if (!this._fms.customRoute(route, false)) {
            return [false, `requested route of "${route}" is invalid`];
        }

        // TODO: What is the purpose of this?
        // if (!route || !data || data.indexOf(' ') > -1) {
            // return [false, 'unknown issue'];
        // }

        // Build readback
        const readback = {};
        readback.log = `rerouting to :${this._fms.fp.route.join(' ')}`;
        readback.say = 'rerouting as requested';

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
     * Taxi the aircraft
     *
     * @for Pilot
     * @method taxi
     * @param {String} taxiDestination - currently expected to be a runway
     * @param {Boolean} isDeparture - whether the aircraft's flightPhase is "DEPARTURE"
     * @param {Boolean} isOnGround - whether the aircraft is on the ground
     * @param {String} flightPhase - the flight phase of the aircraft
     * @return {Array} [success of operation, readback]
     */
    taxi(taxiDestination, isDeparture, isOnGround, flightPhase) {
        // TODO: all this if logic should be simplified or abstracted
        // TODO: isDeparture and flightPhase can be combined
        if (!isDeparture) {
            return [false, 'unable to taxi, we are an arrival'];
        }

        if (flightPhase === FLIGHT_MODES.TAXI) {
            return [false, 'already taxiing'];
        }

        if (flightPhase === FLIGHT_MODES.WAITING) {
            return [false, 'already taxiied, and waiting in runway queue'];
        }

        if (flightPhase !== FLIGHT_MODES.APRON) {
            return [false, 'unable to taxi'];
        }

        // Set the runway to taxi to
        if (!taxiDestination) {
            // TODO: This method may not yet exist
            taxiDestination = window.airportController.airport_get().runway;
        }

        if (!this._airportController.airport_get().getRunway(taxiDestination)) {
            return [false, `no runway ${taxiDestination.toUpperCase()}`];
        }

        this._fms.setDepartureRunway(taxiDestination);

        // TODO: Figure out what to do with this
        // // Start the taxi
        // aircraft.taxi_start = this._gameController.game_time();
        const runway = this._airportController.airport_get().getRunway(taxiDestination);
        // runway.addAircraftToQueue(aircraft);
        // aircraft.mode = FLIGHT_MODES.TAXI;

        const readback = {};
        readback.log = `taxi to runway ${runway.name}`;
        readback.say = `taxi to runway ${radio_runway(runway.name)}`;

        return [true, readback];
    }

    /**
     * Set the MCP altitude mode to "VNAV"
     *
     * @for Pilot
     * @method _setAltitudeVnav
     * @private
     */
    _setAltitudeVnav() {
        this._mcp.setModeSelectorMode(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.VNAV);
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
