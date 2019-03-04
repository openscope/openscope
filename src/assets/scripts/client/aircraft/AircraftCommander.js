import _has from 'lodash/has';
import _isNil from 'lodash/isNil';
import _map from 'lodash/map';
import _round from 'lodash/round';
import AirportController from '../airport/AirportController';
import EventBus from '../lib/EventBus';
import GameController from '../game/GameController';
import NavigationLibrary from '../navigationLibrary/NavigationLibrary';
import UiController from '../ui/UiController';
import { MCP_MODE } from './ModeControl/modeControlConstants';
import {
    FLIGHT_PHASE
} from '../constants/aircraftConstants';
import { EVENT } from '../constants/eventNames';
import { round } from '../math/core';
import { AIRCRAFT_COMMAND_MAP } from '../parsers/aircraftCommandParser/aircraftCommandMap';
import { speech_say } from '../speech';
import {
    radio_runway,
    radio_spellOut,
    radio_heading,
    radio_altitude
} from '../utilities/radioUtilities';
import { radiansToDegrees } from '../utilities/unitConverters';

/**
 *
 *
 * @class AircraftCommander
 */
export default class AircraftCommander {
    constructor(aircraftController, onChangeTransponderCode) {
        this._eventBus = EventBus;
        this._aircraftController = aircraftController;
        this._onChangeTransponderCode = onChangeTransponderCode;
    }

    /**
     * @for AircraftCommander
     * @method runCommands
     * @param aircraft {AircraftModel}
     * @param commands {array<AircraftCommandParser>}
     */
    runCommands(aircraft, commands) {
        if (!aircraft.isControllable) {
            return true;
        }

        let response = [];
        let response_end = '';
        let redResponse = false;
        const deferred = [];

        for (let i = 0; i < commands.length; i++) {
            const command = commands[i][0];
            const args = commands[i].splice(1);

            if (command === FLIGHT_PHASE.TAKEOFF) {
                deferred.push([command, args]);

                continue;
            }

            let retval = this.run(aircraft, command, args);

            if (retval) {
                if (!retval[0]) {
                    redResponse = true;
                }

                if (!_has(retval[1], 'log') || !_has(retval[1], 'say')) {
                    // TODO: reassigning a value using itself is dangerous. this should be re-wroked
                    retval = [
                        retval[0],
                        {
                            log: retval[1],
                            say: retval[1]
                        }
                    ];
                }

                response.push(retval[1]);

                if (retval[2]) {
                    // eslint-disable-next-line prefer-destructuring
                    response_end = retval[2];
                }
            }
        }

        for (let i = 0; i < deferred.length; i += 1) {
            const command = deferred[i][0];
            const args = deferred[i][1];
            const retval = this.run(aircraft, command, args);

            if (retval) {
                if (!retval[0]) {
                    redResponse = true;
                }
                // TODO: fix the logic here this very purposly using `!=`. length is not an object and thus,
                // never null but by using coercion it evaluates to falsey if its not an array
                // true if array, and not log/say object
                if (retval[1].length != null) {
                    // make into log/say object
                    retval[1] = {
                        say: retval[1],
                        log: retval[1]
                    };
                }

                response.push(retval[1]);
            }
        }

        if (commands.length === 0) {
            response = [{
                say: 'say again',
                log: 'say again'
            }];
        }

        if (response.length >= 1) {
            if (response_end) {
                response_end = `, ${response_end}`;
            }

            const r_log = _map(response, (r) => r.log).join(', ');
            const r_say = _map(response, (r) => r.say).join(', ');

            UiController.ui_log(`${aircraft.callsign}, ${r_log} ${response_end}`, redResponse);
            speech_say(
                [
                    { type: 'callsign', content: aircraft },
                    { type: 'text', content: `${r_say} ${response_end}` }
                ],
                aircraft.pilotVoice
            );
        }

        return true;
    }

    /**
     * @for AircraftCommander
     * @method run
     * @param aircraft {AircraftModel}
     * @param command {string}
     * @param data {array}
     * @return {function}
     */
    run(aircraft, command, data) {
        const { functionName } = AIRCRAFT_COMMAND_MAP[command];

        if (typeof functionName === 'undefined') {
            return [false, 'say again?'];
        }

        return this[functionName](aircraft, data);
    }

    /**
     * Aborts an action. Deprecated.
     *
     * @for AircraftCommander
     * @method runAbort
     * @return {array} [success of operation, readback]
     */
    runAbort() {
        return [false, "the 'abort' command has been deprecated, please see documentation for help"];
    }

    /**
     * Set the aircraft to maintain an assigned altitude, and provide a readback
     *
     * @for AircraftCommander
     * @method runAltitude
     * @param aircraft {AircraftModel}
     * @param data {array}
     * @return {array}  [success of operation, readback]
     */
    runAltitude(aircraft, data) {
        const altitudeRequested = data[0];
        const expediteRequested = data[1];
        const shouldUseSoftCeiling = GameController.game.option.getOptionByName('softCeiling') === 'yes';
        const airport = AirportController.airport_get();

        return aircraft.pilot.maintainAltitude(
            altitudeRequested,
            expediteRequested,
            shouldUseSoftCeiling,
            airport,
            aircraft
        );
    }

    /**
     * Direct an aircraft to fly and maintain a specific heading
     *
     * @for AircraftCommander
     * @method runHeading
     * @param aircraft {AircraftModel}
     * @param data {array}
     * @return {array} [success of operation, readback]
     */
    runHeading(aircraft, data) {
        let direction = data[0];
        const heading = data[1];
        const incremental = data[2];
        const readback = aircraft.pilot.maintainHeading(aircraft, heading, direction, incremental);

        if (!direction) {
            direction = '';
        }

        aircraft.target.turn = direction;

        if (aircraft.hasApproachClearance) {
            aircraft.pilot.cancelApproachClearance(aircraft);
        }

        return readback;
    }

    /**
     * Activate the flightplan stored in the FMS
     *
     * @for AircraftCommander
     * @method runClearedAsFiled
     * @param aircraft {AircraftModel}
     * @return {array} [success of operation, readback]
     */
    runClearedAsFiled(aircraft) {
        return aircraft.pilot.clearedAsFiled();
    }

    /**
     * @for AircraftCommander
     * @method runClimbViaSID
     * @param aircraft {AircraftModel}
     * @param data {array}
     * @return {array} [success of operation, readback]
     */
    runClimbViaSID(aircraft, data) {
        const altitude = data[0];

        return aircraft.pilot.climbViaSid(aircraft, altitude);
    }

    /**
     * @for AircraftCommander
     * @method runCross
     * @param aircraft {AircraftModel}
     * @param data {array}
     * @return {array} [success of operation, readback]
     */
    runCross(aircraft, data) {
        const fix = data[0].toUpperCase();
        const altitude = data[1];

        return aircraft.pilot.crossFix(aircraft, fix, altitude);
    }

    /**
     * @for AircraftCommander
     * @method runDescendViaStar
     * @param aircraft {AircraftModel}
     * @param data {array}
     * @return {array} [success of operation, readback]
     */
    runDescendViaStar(aircraft, data = []) {
        const altitude = data[0];

        return aircraft.pilot.descendViaStar(aircraft, altitude);
    }

    /**
     * @for AircraftCommander
     * @method runSpeed
     * @param aircraft {AircraftModel}
     * @param data {array}
     */
    runSpeed(aircraft, data) {
        const nextSpeed = data[0];

        return aircraft.pilot.maintainSpeed(nextSpeed, aircraft);
    }

    /**
     * Setup the Fms to enter a holding pattern,
     *
     * Can be used to hold at:
     * - A Waypoint in the current flight plan: which will be made the currentWaypoint via `fms.skipToWaypointName()`
     * - A Fix not in the flight plan: a new `LegModel` will be created and prepended thus making it the currentWaypoint
     * - The current position: a new `LegModel` will be created and prepended thus making it the currentWaypoint
     *
     * @for AircraftCommander
     * @method runHold
     * @param aircraft {AircraftModel}
     * @param data {array}
     * @return {array} [success of operation, readback]
     */
    runHold(aircraft, data) {
        const turnDirection = data[0];
        const legLength = data[1];
        const fixName = data[2];
        const fixModel = NavigationLibrary.findFixByName(fixName);

        if (!fixModel) {
            return [false, `unable to hold at unknown fix ${fixName}`];
        }

        const holdParameters = {
            turnDirection,
            legLength,
            inboundHeading: fixModel.positionModel.bearingFromPosition(aircraft.positionModel)
        };

        return aircraft.pilot.initiateHoldingPattern(fixName, holdParameters);
    }

    /**
     * Exit holding pattern and resume navigation
     *
     * @for AircraftCommander
     * @method runCancelHoldingPattern
     * @param aircraft {AircraftModel}
     * @param args {array}
     * @return {array} [success of operation, readback]
     */
    runCancelHoldingPattern(aircraft, args) {
        const fixName = args[0];

        return aircraft.pilot.cancelHoldingPattern(fixName);
    }

    /**
     * Skip forward to a particular fix that already exists further along the aircraft's route
     *
     * @for AircraftCommander
     * @method runDirect
     * @param data
     */
    runDirect(aircraft, data) {
        // TODO: maybe handle with parser?
        const fixName = data[0].toUpperCase();

        aircraft.target.turn = null;

        return aircraft.pilot.proceedDirect(fixName);
    }

    /**
     * Set the arrival runway to expect for approach and landing
     *
     * @for AircraftCommander
     * @method runExpectArrivalRunway
     * @param aircraft {AircraftModel}
     * @param data {array}
     * @return {array} [success of operation, response]
     */
    runExpectArrivalRunway(aircraft, data) {
        const airportModel = AirportController.airport_get();
        const runwayName = data[0];
        const runwayModel = airportModel.getRunway(runwayName);

        if (_isNil(runwayModel)) {
            const previousRunwayModel = aircraft.fms.arrivalRunwayModel;
            const readback = {};
            readback.log = `unable to find Runway ${runwayName} on our charts, `
                + `expecting Runway ${previousRunwayModel.name} instead`;
            readback.say = `unable to find Runway ${radio_runway(runwayName)} on our `
                + `charts, expecting Runway ${previousRunwayModel.getRadioName()} instead`;

            return [false, readback];
        }

        return aircraft.pilot.updateStarLegForArrivalRunway(aircraft, runwayModel);
    }

    /**
     * @for AircraftCommander
     * @method runFlyPresentHeading
     * @param aircraft {AircraftModel}
     */
    runFlyPresentHeading(aircraft) {
        return aircraft.pilot.maintainPresentHeading(aircraft.heading);
    }

    /**
     * @for AircraftCommander
     * @method runSayRoute
     * @param aircraft {AircraftModel}
     * @return {array}   [success of operation, readback]
     */
    runSayRoute(aircraft) {
        return aircraft.pilot.sayRoute();
    }

    /**
     * @for AircraftCommander
     * @method runSID
     * @param aircraft {AircraftModel}
     * @param data {array<string>} a string representation of the SID (may also include exit, eg sid.exit)
     * @return {array}   [success of operation, readback]
     */
    runSID(aircraft, data) {
        const routeString = data[0];
        const airportModel = AirportController.airport_get();

        return aircraft.pilot.applyDepartureProcedure(routeString, airportModel.icao);
    }

    /**
     * @for AircraftCommander
     * @method runSTAR
     * @param data {array<string>} a string representation of the STAR, ex: `QUINN.BDEGA2.KSFO`
     * @return {array}   [success of operation, readback]
     */
    runSTAR(aircraft, data) {
        const routeString = data[0];
        const airportModel = AirportController.airport_get();

        return aircraft.pilot.applyArrivalProcedure(routeString, airportModel.name);
    }

    /**
     * @for AircraftCommander
     * @method runMoveDataBlock
     * @deprecated
     */
    runMoveDataBlock() {
        return [false, 'moving data blocks is now a scope command; see documentation for help'];
    }

    /**
     * Adds a new Leg to fms with a user specified route
     * Note: See notes on 'runReroute' for how to format input for this command
     *
     * @for AircraftCommander
     * @method runRoute
     * @param data
     * @return {array}   [success of operation, readback]
     */
    runRoute(aircraft, data) {
        // TODO: is this .toUpperCase() necessary??
        const routeString = data[0].toUpperCase();

        return aircraft.pilot.applyPartialRouteAmendment(routeString);
    }

    /**
      * Removes all legs, and replaces them with the specified route
      * Note: Input data needs to be provided with single dots connecting all
      * procedurally-linked points (eg KSFO.OFFSH9.SXC or SGD.V87.MOVER), and
      * all other points that will be simply a fix direct to another fix need
      * to be connected with double-dots (eg HLI..SQS..BERRA..JAN..KJAN)
      *
      * @for AircraftCommander
      * @method runReroute
      * @param data
      * @return {array}   [success of operation, readback]
      */
    runReroute(aircraft, data) {
        // TODO: is this .toUpperCase() necessary??
        const routeString = data[0].toUpperCase();
        const readback = aircraft.pilot.replaceFlightPlanWithNewRoute(routeString);

        // Only change to LNAV mode if the route was applied successfully, else
        // continue with the previous instructions (whether a heading, etc)
        if (readback[0]) {
            aircraft.mcp.setHeadingLnav();
        }

        return readback;
    }

    /**
     * @for AircraftCommander
     * @method runSayAltitude
     * @param aircraft
     * @return {array} [success of operation, readback]
     */
    runSayAltitude(aircraft) {
        const altitude = _round(aircraft.altitude, -2);
        const isClimbingOrDescending = aircraft.trend !== 0;
        const readback = {};
        let altitudeChangeString = 'at ';

        if (isClimbingOrDescending) {
            altitudeChangeString = 'leaving ';
        }

        readback.log = `${altitudeChangeString}${altitude}`;
        readback.say = `${altitudeChangeString}${radio_altitude(altitude)}`;

        return [true, readback];
    }

    /**
     * @for AircraftCommander
     * @method runSayAssignedAltitude
     * @param aircraft
     * @return {array} [success of operation, readback]
     */
    runSayAssignedAltitude(aircraft) {
        const altitude = _round(aircraft.mcp.altitude, -2);
        const readback = {};

        if (altitude === 0) {
            return [false, 'we haven\'t been assigned an altitude'];
        }

        readback.log = `assigned ${altitude}`;
        readback.say = `assigned ${radio_altitude(altitude)}`;

        return [true, readback];
    }

    /**
     * @for AircraftCommander
     * @method runSayHeading
     * @param aircraft
     * @return {array} [success of operation, readback]
     */
    runSayHeading(aircraft) {
        const heading = _round(radiansToDegrees(aircraft.heading));
        const readback = {};

        readback.log = `heading ${heading}`;
        readback.say = `heading ${radio_heading(heading)}`;

        return [true, readback];
    }

    /**
     * @for AircraftCommander
     * @method runSayAssignedHeading
     * @param aircraft
     * @return {array} [success of operation, readback]
     */
    runSayAssignedHeading(aircraft) {
        if (aircraft.mcp.headingMode !== MCP_MODE.HEADING.HOLD) {
            return [false, 'we haven\'t been assigned a heading'];
        }

        const heading = _round(radiansToDegrees(aircraft.mcp.heading));
        const readback = {};

        readback.log = `assigned heading ${heading}`;
        readback.say = `assigned heading ${radio_heading(heading)}`;

        return [true, readback];
    }

    /**
     * @for AircraftCommander
     * @method runSaySpeed
     * @param aircraft
     * @return {array} [success of operation, readback]
     */
    runSayIndicatedAirspeed(aircraft) {
        const speed = _round(aircraft.speed);
        const readback = {};

        readback.log = `indicating ${speed} knots`;
        readback.say = `indicating ${radio_spellOut(speed)} knots`;

        return [true, readback];
    }

    /**
     * @for AircraftCommander
     * @method runSayAssignedSpeed
     * @param aircraft
     * @return {array} [success of operation, readback]
     */
    runSayAssignedSpeed(aircraft) {
        if (aircraft.mcp.speedMode !== MCP_MODE.SPEED.HOLD) {
            return [false, 'we haven\'t been assigned a speed'];
        }

        const speed = _round(aircraft.mcp.speed);
        const readback = {};

        readback.log = `assigned ${speed} knots`;
        readback.say = `assigned ${radio_spellOut(speed)} knots}`;

        return [true, readback];
    }

    /**
     * Taxi to the specified destination. Currently only supports taxiing to runways.
     *
     * If a runway is requested but doesn't exist, an error is returned.
     *
     * @for AircraftCommander
     * @method runTaxi
     * @param {AircraftModel} aircraftModel
     * @param {array<string>} data
     * @return {array} [success of operation, readback]
     */
    runTaxi(aircraftModel, data) {
        const airportModel = AirportController.airport_get();
        const requestedRunwayName = data[0];

        if (!requestedRunwayName) {
            const readback = 'we don\'t know which runway to taxi to';

            return [false, readback];
        }

        const runwayModel = airportModel.getRunway(requestedRunwayName.toUpperCase());

        if (!runwayModel) {
            const readback = {};
            readback.log = `unable to find Runway ${requestedRunwayName.toUpperCase()} on our charts`;
            readback.say = `unable to find Runway ${radio_runway(requestedRunwayName)} on our charts`;

            return [false, readback];
        }

        return aircraftModel.taxiToRunway(runwayModel);
    }

    /**
     * @for AircraftCommander
     * @method runTakeoff
     * @param aircraft {AircraftModel}
     * @return {array}   [success of operation, readback]
     */
    runTakeoff(aircraft) {
        // TODO: update some of this queue logic to live in the RunwayModel
        const airport = AirportController.airport_get();
        const runway = aircraft.fms.departureRunwayModel;
        const spotInQueue = runway.getAircraftQueuePosition(aircraft.id);
        const isInQueue = spotInQueue > -1;
        const aircraftAhead = this._aircraftController.findAircraftById(runway.queue[spotInQueue - 1]);
        const wind = airport.getWind();
        const roundedWindAngleInDegrees = round(radiansToDegrees(wind.angle) / 10) * 10;
        const roundedWindSpeed = round(wind.speed);
        const readback = {};

        if (!isInQueue) {
            return [false, 'unable to take off, we\'re not at any runway'];
        }

        if (aircraft.isAirborne()) {
            return [false, 'unable to take off, we\'re already airborne'];
        }

        if (aircraft.flightPhase === FLIGHT_PHASE.APRON) {
            return [false, 'unable to take off, we\'re still at the gate'];
        }

        if (aircraft.flightPhase === FLIGHT_PHASE.TAXI) {
            readback.log = `unable to take off, we're still taxiing to Runway ${runway.name}`;
            readback.say = `unable to take off, we're still taxiing to Runway ${radio_runway(runway.name)}`;

            return [false, readback];
        }

        if (aircraft.flightPhase === FLIGHT_PHASE.TAKEOFF) {
            return [false, 'already taking off'];
        }

        if (spotInQueue > 0) {
            readback.log = `number ${spotInQueue} behind ${aircraftAhead.callsign}`;
            readback.say = `number ${spotInQueue} behind ${aircraftAhead.getRadioCallsign()}`;

            return [false, readback];
        }

        if (!aircraft.pilot.hasDepartureClearance) {
            return [false, 'unable to take off, we never received an IFR clearance'];
        }

        // see #1154, we may have been rerouted since we started taxiing.
        if (!aircraft.fms.isRunwayModelValidForSid(runway)) {
            readback.log = `according to our charts, Runway ${runway.name} `
                + `is not valid for the ${aircraft.fms.getSidIcao()} departure`;
            readback.say = `according to our charts, Runway ${runway.getRadioName()} `
                + `is not valid for the ${aircraft.fms.getSidName()} departure`;

            return [false, readback];
        }

        runway.removeAircraftFromQueue(aircraft.id);
        aircraft.takeoff(runway);

        readback.log = `wind ${roundedWindAngleInDegrees} at ${roundedWindSpeed}, `
            + `Runway ${runway.name}, cleared for takeoff`;

        // We have to make it say winned to make it sound like "Wind" and not "Whined"
        readback.say = `winned ${radio_spellOut(roundedWindAngleInDegrees)} at `
            + `${radio_spellOut(roundedWindSpeed)}, Runway ${radio_runway(runway.name)}, `
            + 'cleared for takeoff';

        return [true, readback];
    }

    /**
     * @for AircraftCommander
     * @method runIls
     * @param aircraft {AircraftModel}
     * @param data {array}
     */
    runIls(aircraft, data) {
        const approachType = 'ils';
        const runwayName = data[1].toUpperCase();
        const runwayModel = AirportController.airport_get().getRunway(runwayName);

        return aircraft.pilot.conductInstrumentApproach(aircraft, approachType, runwayModel);
    }

    /**
     * @for AircraftCommander
     * @method runLand
     * @param aircraft {AircraftModel}
     * @param data {array}
     */
    runLand() {
        return [false, 'the "land" command has been deprecated, please use "i" / "ils" instead'];
    }

    /**
     * @for AircraftCommander
     * @method runSquawk
     * @param aircraft {AircraftModel}
     * @param data {array<string>}
     * @return {array}   [success of operation, readback]
     */
    runSquawk(aircraft, data) {
        const squawk = data[0];
        const result = this._onChangeTransponderCode(squawk, aircraft);
        let message = `squawking ${squawk}`;

        if (!result) {
            message = `unable to squawk ${squawk}`;
        }

        return [result, message];
    }

    /**
     * @for AircraftCommander
     * @method runDelete
     * @param aircraft {AircraftModel}
     */
    runDelete(aircraft) {
        this._eventBus.trigger(EVENT.REMOVE_AIRCRAFT, aircraft);
    }

    /**
     * This command has been deprecated and this method is used only to display a warning to users
     *
     * @deprecated
     * @for AircraftCommander
     * @method runFix
     * @return {array}   [success of operation, readback]
     */
    runFix() {
        const isWarning = true;

        UiController.ui_log(
            'The fix command has been deprecated. Please use rr, pd or fh instead of fix',
            isWarning
        );
    }
}
