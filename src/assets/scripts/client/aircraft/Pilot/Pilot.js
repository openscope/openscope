import _ceil from 'lodash/ceil';
import _floor from 'lodash/floor';
import _isNil from 'lodash/isNil';
import _isObject from 'lodash/isObject';
import _isEmpty from 'lodash/isEmpty';
import AirportController from '../../airport/AirportController';
import RouteModel from '../../navigationLibrary/Route/RouteModel';
import { MCP_MODE } from '../ModeControl/modeControlConstants';
import {
    FLIGHT_CATEGORY,
    FLIGHT_PHASE
} from '../../constants/aircraftConstants';
import { INVALID_NUMBER } from '../../constants/globalConstants';
import { radians_normalize } from '../../math/circle';
import { clamp } from '../../math/core';
import {
    groupNumbers,
    radio_altitude,
    radio_heading,
    radio_runway,
    radio_spellOut,
    radio_trend,
    getRadioCardinalDirectionNameForHeading
} from '../../utilities/radioUtilities';
import {
    degreesToRadians,
    heading_to_string
} from '../../utilities/unitConverters';

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

        /**
         * Whether the aircraft has received a clearance to conduct an approach to a runway
         *
         * @property hasApproachClearance
         * @type {boolean}
         * @default false
         */
        this.hasApproachClearance = false;

        /**
         * Whether the aircraft has received an IFR clearance to their destination
         *
         * @property hasDepartureClearance
         * @type {boolean}
         * @default false
         */
        this.hasDepartureClearance = false;
    }

    /**
     * @for Pilot
     * @method enable
     */
    enable() {
        return;
    }

    /**
     * @for Pilot
     * @method destroy
     */
    destroy() {
        this._mcp = null;
        this._fms = null;
        this.hasApproachClearance = false;
    }

    /**
     * Maintain a given altitude
     *
     * @for Pilot
     * @method maintainAltitude
     * @param altitude {number}   the altitude to maintain, in feet
     * @param expedite {boolean}  whether to use maximum possible climb/descent rate
     * @param shouldUseSoftCeiling {boolean}
     * @param airportModel {AirportModel}
     * @param aircraftModel {AircraftModel}
     * @return {array} [success of operation, readback]
     */
    maintainAltitude(altitude, expedite, shouldUseSoftCeiling, airportModel, aircraftModel) {
        if (!aircraftModel.model.isAbleToMaintainAltitude(altitude)) {
            const verbalRequestedAltitude = radio_altitude(altitude);
            const readback = {};
            readback.log = `unable to maintain ${altitude} due to performance`;
            readback.say = `unable to maintain ${verbalRequestedAltitude} due to performance`;

            this._mcp.setAltitudeFieldValue(aircraftModel.altitude);

            return [false, readback];
        }

        const currentAltitude = aircraftModel.altitude;
        const { minAssignableAltitude, maxAssignableAltitude } = airportModel;
        let clampedAltitude = clamp(minAssignableAltitude, altitude, maxAssignableAltitude);

        if (shouldUseSoftCeiling && clampedAltitude === maxAssignableAltitude) {
            // causes aircraft to 'leave' airspace, and continue climb through ceiling
            clampedAltitude += 1;
        }

        this.cancelApproachClearance(aircraftModel);
        this._mcp.setAltitudeFieldValue(clampedAltitude);
        this._mcp.setAltitudeHold();

        // Build readback
        const readbackAltitude = _floor(clampedAltitude, -2);
        const altitudeInstruction = radio_trend('altitude', currentAltitude, altitude);
        const altitudeVerbal = radio_altitude(readbackAltitude);
        let expediteReadback = '';

        if (expedite) {
            // including space here so when expedite is false there isnt an extra space after altitude
            expediteReadback = ' and expedite';

            this.shouldExpediteAltitudeChange();
        }

        const readback = {};
        readback.log = `${altitudeInstruction} ${readbackAltitude}${expediteReadback}`;
        readback.say = `${altitudeInstruction} ${altitudeVerbal}${expediteReadback}`;

        return [true, readback];
    }

    /**
     * Maintain a given heading
     *
     * @for Pilot
     * @method maintainHeading
     * @param aircraftModel {AircraftModel}
     * @param headingInDegrees {number}                 the heading to maintain, in degrees
     * @param direction      {string|null}  (optional)  the direction of turn; either 'left' or 'right'
     * @param incremental    {boolean}      (optional)  whether the value is a numeric heading, or a
     *                                                  number of degrees to turn
     * @return {array}                                  [success of operation, readback]
     */
    maintainHeading(aircraftModel, headingInDegrees, direction, incremental) {
        const nextHeadingInRadians = degreesToRadians(headingInDegrees);
        let correctedHeading = nextHeadingInRadians;

        if (incremental) {
            // if direction is left
            correctedHeading = radians_normalize(aircraftModel.heading - nextHeadingInRadians);

            if (direction === 'right') {
                correctedHeading = radians_normalize(aircraftModel.heading + nextHeadingInRadians);
            }
        }

        this.cancelApproachClearance(aircraftModel);
        this._fms.leaveHoldFlightPhase();
        this._mcp.setHeadingFieldValue(correctedHeading);
        this._mcp.setHeadingHold();

        const headingStr = heading_to_string(correctedHeading);
        const readback = {};
        readback.log = `fly heading ${headingStr}`;
        readback.say = `fly heading ${radio_heading(headingStr)}`;

        if (incremental) {
            readback.log = `turn ${headingInDegrees} degrees ${direction}`;
            readback.say = `turn ${groupNumbers(headingInDegrees)} degrees ${direction}`;
        } else if (direction) {
            readback.log = `turn ${direction} heading ${headingStr}`;
            readback.say = `turn ${direction} heading ${radio_heading(headingStr)}`;
        }

        return [true, readback];
    }

    /**
     * Maintain the aircraft's present magnetic heading
     *
     * @for Pilot
     * @method maintainPresentHeading
     * @param aircraftModel {AircraftModel} the heading the aircraft is facing at the time the command is given
     * @return {array} [success of operation, readback]
     */
    maintainPresentHeading(aircraftModel) {
        this.cancelApproachClearance(aircraftModel);
        this._mcp.setHeadingFieldValue(aircraftModel.heading);
        this._mcp.setHeadingHold();

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
     * @param speed {Number} - the speed to maintain, in knots
     * @param aircraftModel {AircraftModel}
     * @return {Array} [success of operation, readback]
     */
    maintainSpeed(speed, aircraftModel) {
        if (!aircraftModel.model.isAbleToMaintainSpeed(speed)) {
            const readback = {};
            readback.log = `unable to maintain ${speed} knots due to performance`;
            readback.say = `unable to maintain ${radio_spellOut(speed)} knots due to performance`;

            return [false, readback];
        }

        const currentSpeed = aircraftModel.speed;
        const instruction = radio_trend('speed', currentSpeed, speed);

        this._mcp.setSpeedFieldValue(speed);
        this._mcp.setSpeedHold();

        // Build the readback
        const readback = {};
        readback.log = `${instruction} ${speed}`;
        readback.say = `${instruction} ${radio_spellOut(speed)}`;

        return [true, readback];
    }

    /**
     * Apply the specified arrival procedure by adding it to the fms route
     * Note: SHOULD NOT change the heading mode
     *
     * @for Pilot
     * @method applyArrivalProcedure
     * @param routeString {string}       route string in the form of `entry.procedure.airport`
     * @param runwayModel {RunwayModel}
     * @param airportName {string}
     * @return {array}                   [success of operation, readback]
     */
    applyArrivalProcedure(routeString, runwayModel, airportName) {
        if (!this._fms.isValidProcedureRoute(routeString, runwayModel, FLIGHT_CATEGORY.ARRIVAL)) {
            // TODO: may need a better message here
            return [false, 'STAR name not understood'];
        }

        const routeStringModel = new RouteModel(routeString);
        const starModel = this._fms.findStarByProcedureId(routeStringModel.procedure);

        // TODO: set mcp modes here
        this._fms.replaceArrivalProcedure(routeStringModel.routeCode, runwayModel);

        // Build readback
        const readback = {};
        readback.log = `cleared to ${airportName} via the ${routeStringModel.procedure.toUpperCase()} arrival`;
        readback.say = `cleared to ${airportName} via the ${starModel.name.toUpperCase()} arrival`;

        return [true, readback];
    }

    /**
     * Apply the specified departure procedure by adding it to the fms route
     * Note: SHOULD NOT change the heading mode
     *
     * @for Pilot
     * @method applyDepartureProcedure
     * @param procedureId {String}          the identifier for the procedure
     * @param runwayModel {RunwayModel}     RunwayModel used for departure
     * @param airportIcao {string}          airport icao identifier
     * @return {array}                      [success of operation, readback]
     */
    applyDepartureProcedure(procedureId, runwayModel, airportIcao) {
        const standardRouteModel = this._fms.findSidByProcedureId(procedureId);

        if (_isNil(standardRouteModel)) {
            return [false, 'SID name not understood'];
        }

        if (!runwayModel) {
            return [false, 'unsure if we can accept that procedure; we don\'t have a runway assignment'];
        }

        // TODO: this should not be randomized
        const exit = this._fms.findRandomExitPointForSidProcedureId(procedureId);
        const routeStr = `${airportIcao}.${procedureId}.${exit}`;

        if (!standardRouteModel.hasFixName(runwayModel.name)) {
            return [
                false,
                `unable, the ${standardRouteModel.name.toUpperCase()} departure not valid ` +
                `from Runway ${runwayModel.name.toUpperCase()}`
            ];
        }

        this.hasDepartureClearance = true;

        this._mcp.setAltitudeVnav();
        this._mcp.setSpeedVnav();
        this._fms.replaceDepartureProcedure(routeStr, runwayModel);

        const readback = {};
        readback.log = `cleared to destination via the ${procedureId} departure, then as filed`;
        readback.say = `cleared to destination via the ${standardRouteModel.name} departure, then as filed`;

        return [true, readback];
    }

    /**
     * Replace the entire route stored in the FMS with legs freshly generated
     * based on the provided route string
     *
     * @for Pilot
     * @method applyNewRoute
     * @param routeString {string}  routeString defining the new route to use
     * @return {array}              [success of operation, readback]
     */
    applyNewRoute(routeString, runway) {
        this.hasDepartureClearance = true;

        const isValid = this._fms.isValidRoute(routeString, runway);

        if (!isValid) {
            const readback = {};
            readback.log = `requested route of "${routeString}" is invalid`;
            readback.say = 'that route is invalid';

            return [false, readback];
        }

        this._fms.replaceFlightPlanWithNewRoute(routeString, runway);

        // Build readback
        const readback = {};
        readback.log = `rerouting to: ${this._fms.currentRoute}`;
        readback.say = 'rerouting as requested';

        return [true, readback];
    }

    /**
     * Apply the specified route, and as applicable, merge it with the current route
     *
     * @for Pilot
     * @method applyPartialRouteAmendment
     * @param routeString {tring}  route string in the form of `entry.procedure.airport`
     * @return {array}             [success of operation, readback]
     */
    applyPartialRouteAmendment(routeString) {
        const isValid = this._fms.isValidRoute(routeString);

        if (!isValid) {
            return [false, `requested route of "${routeString.toUpperCase()}" is invalid`];
        }

        if (!this._fms.isValidRouteAmendment(routeString)) {
            return [
                false,
                `requested route of "${routeString.toUpperCase()}" is invalid, it ` +
                    'must contain a Waypoint in the current route'
            ];
        }

        this._fms.replaceRouteUpToSharedRouteSegment(routeString);
        this._fms.leaveHoldFlightPhase();

        // Build readback
        const readback = {};
        readback.log = `rerouting to: ${this._fms.currentRoute.toUpperCase()}`;
        readback.say = 'rerouting as requested';

        return [true, readback];
    }

    /**
     * Stop conducting the instrument approach, and maintain:
     * - current or last assigned altitude (whichever is lower)
     * - current heading
     * - last assigned speed
     *
     * @for Pilot
     * @method cancelApproachClearance
     * @param aircraftModel {AircraftModel}
     * @return {array} [success of operation, readback]
     */
    cancelApproachClearance(aircraftModel) {
        if (!this.hasApproachClearance) {
            return [false, 'we have no approach clearance to cancel!'];
        }

        const airport = AirportController.airport_get();
        const descentAltitude = Math.min(aircraftModel.altitude, this._mcp.altitude);
        const altitudeToMaintain = Math.max(descentAltitude, airport.minAssignableAltitude);

        this._mcp.setAltitudeFieldValue(altitudeToMaintain);
        this._mcp.setAltitudeHold();
        this._mcp.setHeadingFieldValue(aircraftModel.heading);
        this._mcp.setHeadingHold();
        this._mcp.setSpeedHold();

        this.hasApproachClearance = false;

        const readback = 'cancel approach clearance, fly present heading, ' +
            'maintain last assigned altitude and speed';

        return [true, readback];
    }

    /**
     * Configure the aircraft to fly in accordance with the requested flightplan
     *
     * @for Pilot
     * @method clearedAsFiled
     * @param {Number} initialAltitude  the altitude aircraft can automatically climb to at this airport
     * @return {Array}                  [success of operation, readback]
     */
    clearedAsFiled() {
        this.hasDepartureClearance = true;

        const readback = {};
        readback.log = 'cleared to destination as filed';
        readback.say = 'cleared to destination as filed';

        return [true, readback];
    }

    /**
     * Climb in accordance with the altitude restrictions, and sets
     * altitude at which the climb will end regardless of fix restrictions.
     *
     * @for Pilot
     * @method climbViaSid
     * @return {array}           [success of operation, readback]
     */
    climbViaSid() {
        if (this._fms.flightPlanAltitude === INVALID_NUMBER) {
            const readback = {};
            readback.log = 'unable to climb via SID, no altitude assigned';
            readback.say = 'unable to climb via SID, no altitude assigned';

            return [false, readback];
        }

        this._mcp.setAltitudeFieldValue(this._fms.flightPlanAltitude);
        this._mcp.setAltitudeVnav();

        const readback = {};
        readback.log = 'climb via SID';
        readback.say = 'climb via SID';

        return [true, readback];
    }

    /**
     * Descend in accordance with the altitude restrictions
     *
     * @for Pilot
     * @method descendViaStar
     * @param bottomAltitude {number} (optional) altitude at which the descent will end (regardless of fix restrictions)
     * @return {array}                [success of operation, readback]
     */
    descendViaStar(bottomAltitude) {
        let nextAltitude = bottomAltitude;

        if (typeof nextAltitude === 'undefined') {
            nextAltitude = this._fms.getBottomAltitude();
        }

        if (isNaN(nextAltitude) || nextAltitude === Infinity) {
            return [false, 'unable to descend via STAR'];
        }

        this._mcp.setAltitudeFieldValue(nextAltitude);
        this._mcp.setAltitudeVnav();
        this._mcp.setSpeedVnav();

        return [true, 'descend via STAR'];
    }

    /**
     * Abort the landing attempt; maintain present heading/speed, and climb to a reasonable altitude
     *
     * @for Pilot
     * @method goAround
     * @param heading {number}           the aircraft's current heading
     * @param speed {number}             the aircraft's current speed
     * @param airportElevation {number}  the elevation of the airport, in feet MSL
     * @return {array}                   [success of operation, readback]
     */
    goAround(heading, speed, airportElevation) {
        const altitudeToMaintain = _ceil(airportElevation, -2) + 1000;

        this._mcp.setHeadingFieldValue(heading);
        this._mcp.setHeadingHold();
        this._mcp.setAltitudeFieldValue(altitudeToMaintain);
        this._mcp.setAltitudeHold();
        this._mcp.setSpeedFieldValue(speed);
        this._mcp.setSpeedHold();

        const readback = {};
        readback.log = `go around, fly present heading, maintain ${altitudeToMaintain}`;
        readback.say = `go around, fly present heading, maintain ${radio_altitude(altitudeToMaintain)}`;

        return [true, readback];
    }

    /**
     * Intercept a radial course or localizer (horizontal guidance)
     *
     * @for Pilot
     * @method _interceptCourse
     * @param datum {StaticPositionModel}  the position the course is based upon
     * @param course {number}              the heading inbound to the datum
     * @return {array}                     [success of operation, readback]
     * @private
     */
    _interceptCourse(datum, course) {
        this._mcp.setNav1Datum(datum);
        this._mcp.setCourseFieldValue(course);
        this._mcp.setHeadingVorLoc();

        const readback = {};
        readback.log = 'intercept localizer';
        readback.say = 'intercept localizer';

        return [true, readback];
    }

    /**
     * Intercept a glidepath or glideslop (vertical guidance)
     *
     * @for Pilot
     * @method _interceptGlidepath
     * @param datum {StaticPositionModel}  the position the glidepath is projected from
     * @param course {number}              the heading inbound to the datum
     * @param descentAngle {number}        the angle of descent along the glidepath
     * @return {array}                     [success of operation, readback]
     * @private
     */
    _interceptGlidepath(datum, course, descentAngle) {
        // TODO: I feel like our description of lateral/vertical guidance should be done with its
        // own class rather than like this by storing all sorts of irrelevant stuff in the pilot/MCP.
        if (this._mcp.nav1Datum !== datum) {
            return [false, 'cannot follow glidepath because we are using lateral navigation from a different origin'];
        }

        if (this._mcp.course !== course) {
            return [
                false,
                'cannot follow glidepath because its course differs from that specified for lateral guidance'
            ];
        }

        // TODO: the descentAngle is a part of the ILS system itself, and should not be owned by the MCP
        this._mcp.setDescentAngle(descentAngle);

        // TODO: Though not realistic, to emulate the refusal to descend below MCP altitude
        // until established on the localizer, we should not be setting the altitude mode to
        // 'APP' until established on the localizer. This will prevent improper descent behaviors.
        this._mcp.setAltitudeApproach();

        const readback = {};
        readback.log = 'intercept glidepath';
        readback.log = 'intercept glidepath';

        return [true, readback];
    }

    /**
     * Conduct the specified instrument approachType
     * Note: Currently only supports ILS approaches
     * Note: Approach variants cannot yet be specified (eg RNAV-Y)
     *
     * @for pilot
     * @method conductInstrumentApproach
     * @param approachType {string}       the type of instrument approach (eg 'ILS', 'RNAV', 'VOR', etc)
     * @param runwayModel {RunwayModel}   the runway the approach ends at
     * @return {array}                    [success of operation, readback]
     */
    conductInstrumentApproach(approachType, runwayModel) {
        if (_isNil(runwayModel)) {
            return [false, 'the specified runway does not exist'];
        }

        // TODO: split these two method calls and the corresponding ifs to a new method
        const datum = runwayModel.positionModel;
        const course = runwayModel.angle;
        const descentAngle = runwayModel.ils.glideslopeGradient;
        const lateralGuidance = this._interceptCourse(datum, course);
        const verticalGuidance = this._interceptGlidepath(datum, course, descentAngle);

        // TODO: As written, `._interceptCourse()` will always return true.
        if (!lateralGuidance[0]) {
            return lateralGuidance;
        }

        if (!verticalGuidance[0]) {
            return verticalGuidance;
        }

        this._fms.leaveHoldFlightPhase();
        this._fms.setArrivalRunway(runwayModel);
        this.hasApproachClearance = true;

        const readback = {};
        readback.log = `cleared ${approachType.toUpperCase()} runway ${runwayModel.name} approach`;
        readback.say = `cleared ${approachType.toUpperCase()} runway ${radio_runway(runwayModel.name)} approach`;

        return [true, readback];
    }

    /**
     * Conduct a holding pattern at a specific Fix/Waypoint/Position
     *
     * @for Fms
     * @method initiateHoldingPattern
     * @param inboundHeading {number}
     * @param turnDirection {string}                     direction to turn once established in a holding pattern
     * @param legLength {string}                         in either `min` or `nm` length of each side of the
     *                                                   holding pattern.
     * @param fixName {string|null}                      name of the fix to hold at, only `null` if holding at
     *                                                   current position
     * @param holdPosition {StaticPositionModel}         StaticPositionModel of the position to hold over
     * @return {array} [success of operation, readback]
     */
    initiateHoldingPattern(
        inboundHeading,
        turnDirection,
        legLength,
        fixName = null,
        holdPosition = null
    ) {
        let holdRouteSegment = `@${fixName}`;
        const inboundDirection = getRadioCardinalDirectionNameForHeading(inboundHeading);
        let successMessage = `proceed direct ${fixName} and hold inbound, ${turnDirection} turns, ${legLength} legs`;

        if (!holdPosition) {
            return [false, `unable to find fix ${fixName}`];
        }

        if (!fixName) {
            holdRouteSegment = 'GPS';
            successMessage = `hold ${inboundDirection} of present position, ${turnDirection} turns, ${legLength} legs`;
        }

        // TODO: there are probably some `_mcp` updates that should happen here too.

        this._fms.createLegWithHoldingPattern(inboundHeading, turnDirection, legLength, holdRouteSegment, holdPosition);

        return [true, successMessage];
    }

    /**
     * Initialize all autopilot systems after being given an IFR clearance to destination
     *
     * @for Pilot
     * @method configureForTakeoff
     * @param initialAltitude {number} the altitude aircraft can automatically climb to at this airport
     * @param runway {RunwayModel} the runway taking off on
     * @param cruiseSpeed {number} the cruise speed of the aircraft, in knots
     */
    configureForTakeoff(initialAltitude, runway, cruiseSpeed) {
        if (this._mcp.altitude === INVALID_NUMBER) {
            this._mcp.setAltitudeFieldValue(initialAltitude);
        }

        if (this._mcp.altitudeMode === MCP_MODE.ALTITUDE.OFF) {
            this._mcp.setAltitudeHold();
        }

        if (this._mcp.heading === INVALID_NUMBER) {
            this._mcp.setHeadingFieldValue(runway.angle);
        }

        if (this._mcp.headingMode === MCP_MODE.HEADING.OFF) {
            this._mcp.setHeadingLnav();
        }

        if (this._mcp.speed === INVALID_NUMBER) {
            this._mcp.setSpeedFieldValue(cruiseSpeed);
        }

        if (this._mcp.speedMode === MCP_MODE.SPEED.OFF) {
            this._mcp.setSpeedN1();
        }
    }

    /**
     * Expedite the climb or descent to the assigned altitude, to use maximum possible rate
     *
     * @for Pilot
     * @method shouldExpediteAltitudeChange
     * @return {Array} [success of operation, readback]
     */
    shouldExpediteAltitudeChange() {
        this._mcp.shouldExpediteAltitudeChange = true;

        return [true, 'expediting to assigned altitude'];
    }

    /**
     * Skip ahead in the FMS to the waypoint for the specified waypointName, and activate LNAV to fly to it
     *
     * @for Pilot
     * @method proceedDirect
     * @param waypointName {string}  name of the fix we are flying direct to
     * @return {array}               [success of operation, readback]
     */
    proceedDirect(waypointName) {
        if (!this._fms.hasWaypoint(waypointName)) {
            return [false, `cannot proceed direct to ${waypointName}, it does not exist in our flight plan`];
        }

        this._fms.skipToWaypoint(waypointName);
        this._fms.leaveHoldFlightPhase();
        this._mcp.setHeadingLnav();

        return [true, `proceed direct ${waypointName}`];
    }

    /**
     * End of takeoff, stop hand flying, and give the autopilot control of the aircraft
     *
     * Note: This should be done when the phase changes from takeoff to climb
     * Note: The 'raise landing gear' portion has no relevance, and exists solely for specificity of context
     *
     * @for Pilot
     * @method raiseLandingGearAndActivateAutopilot
     */
    raiseLandingGearAndActivateAutopilot() {
        this._mcp.enable();
    }

    /**
     * Return the altitude the aircraft is currently assigned. May be moving toward this altitude,
     * or already established at that altitude.
     *
     * @for Pilot
     * @method sayTargetedAltitude
     * @return {Array} [success of operation, readback]
     */
    sayTargetedAltitude() {
        const readback = {};
        readback.log = `we're assigned ${this._mcp.altitude}`;
        readback.say = `we're assigned ${radio_altitude(this._mcp.altitude)}`;

        return [true, readback];
    }

    /**
     * Return the heading the aircraft is currently targeting. May be moving toward this heading,
     * or already established at that heading.
     *
     * @for Pilot
     * @method sayTargetHeading
     * @return {array} [success of operation, readback]
     */
    sayTargetHeading() {
        const readback = {};

        switch (this._mcp.headingMode) {
            case MCP_MODE.HEADING.HOLD:
                readback.log = `we're assigned heading ${this._mcp.headingInDegrees}`;
                readback.say = `we're assigned heading ${radio_heading(this._mcp.headingInDegrees)}`;

                return [true, readback];

            case MCP_MODE.HEADING.VOR_LOC:
                readback.log = `we're joining a course of ${this._mcp.course}`;
                readback.say = `we're joining a course of ${radio_heading(this._mcp.course)}`;

                return [true, readback];

            case MCP_MODE.HEADING.LNAV: {
                // the currentWaypoint does not contain any heading information, that can only be calculated
                // from two waypoints.
                // TODO: this block needs some work.
                const heading = this._fms.currentWaypoint.heading;
                const fixName = this._fms.currentWaypoint.name;

                readback.log = `we're heading ${heading} toward ${fixName}`;
                readback.say = `we're heading ${radio_heading(heading)} toward ${fixName}`;

                return [true, readback];
            }

            default:
                readback.log = 'we haven\'t been assigned a heading';
                readback.say = 'we haven\'t been assigned a heading';

                return [true, readback];
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
        // TODO: How do we handle the cases where aircraft are using VNAV speed?
        return [true, this._mcp.speed];
    }

    /**
     * Stop taxiing to the runway and return to the gate
     *
     * @for Pilot
     * @method stopOutboundTaxiAndReturnToGate
     * @return {Array} [success of operation, readback]
     */
    stopOutboundTaxiAndReturnToGate() {
        this._fms.flightPhase = FLIGHT_PHASE.APRON;
        // TODO: What to do with this little number....?
        // aircraft.taxi_start = 0;

        return [true, 'taxiing back to the gate'];
    }

    /**
     * Leave the departure line and return to the gate
     *
     * @for Pilot
     * @method stopWaitingInRunwayQueueAndReturnToGate
     * @return {Array} [success of operation, readback]
     */
    stopWaitingInRunwayQueueAndReturnToGate() {
        // TODO: this will likely need to be called from somewhere other than the `AircraftCommander`
        // TODO: remove aircraft from the runway queue (`Runway.removeAircraftFromQueue()`)
        this._fms.flightPhase = FLIGHT_PHASE.APRON;

        return [true, 'taxiing back to the gate'];
    }

    /**
     * Taxi the aircraft
     *
     * @for Pilot
     * @method taxiToRunway
     * @param taxiDestination {RunwayModel}  runway has already been verified by the
     *                                       time it is sent to this method
     * @param isDeparture {boolean}         whether the aircraft's flightPhase is DEPARTURE
     * @param flightPhase {string}          the flight phase of the aircraft
     * @return {array}                      [success of operation, readback]
     */
    taxiToRunway(taxiDestination, isDeparture, flightPhase) {
        if (flightPhase === FLIGHT_PHASE.TAXI) {
            return [false, 'already taxiing'];
        }

        if (flightPhase === FLIGHT_PHASE.WAITING) {
            return [false, 'already taxiied and waiting in runway queue'];
        }

        if (!isDeparture || flightPhase !== FLIGHT_PHASE.APRON) {
            return [false, 'unable to taxi'];
        }

        this._fms.setDepartureRunway(taxiDestination);

        const readback = {};
        readback.log = `taxi to runway ${taxiDestination.name}`;
        readback.say = `taxi to runway ${radio_runway(taxiDestination.name)}`;

        return [true, readback];
    }
}
