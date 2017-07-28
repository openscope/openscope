import _has from 'lodash/has';
import _map from 'lodash/map';
import AirportController from '../airport/AirportController';
import EventBus from '../lib/EventBus';
import UiController from '../UiController';
import RouteModel from '../navigationLibrary/Route/RouteModel';
import GameController from '../game/GameController';
import { speech_say } from '../speech';
import { radiansToDegrees } from '../utilities/unitConverters';
import { round } from '../math/core';
import {
    radio_runway,
    radio_spellOut
} from '../utilities/radioUtilities';
import {
    FLIGHT_PHASE,
    FLIGHT_CATEGORY,
    PROCEDURE_TYPE
} from '../constants/aircraftConstants';
import { EVENT } from '../constants/eventNames';

/**
 * Enum of commands and thier corresponding function.
 *
 * Used to build a call to the correct function when a UI command, or commands,
 * for an aircraft have been issued.
 *
 * @property COMMANDS
 * @type {Object}
 * @final
 */
const COMMANDS = {
    abort: 'runAbort',
    altitude: 'runAltitude',
    clearedAsFiled: 'runClearedAsFiled',
    climbViaSID: 'runClimbViaSID',
    debug: 'runDebug',
    delete: 'runDelete',
    descendViaStar: 'runDescendViaStar',
    direct: 'runDirect',
    fix: 'runFix',
    flyPresentHeading: 'runFlyPresentHeading',
    heading: 'runHeading',
    hold: 'runHold',
    land: 'runLanding',
    moveDataBlock: 'runMoveDataBlock',
    route: 'runRoute',
    reroute: 'runReroute',
    sayRoute: 'runSayRoute',
    sid: 'runSID',
    speed: 'runSpeed',
    squawk: 'runSquawk',
    star: 'runSTAR',
    takeoff: 'runTakeoff',
    taxi: 'runTaxi'
};

/**
 *
 *
 * @class AircraftCommander
 */
export default class AircraftCommander {
    constructor(navigationLibrary, onChangeTransponderCode) {
        this._eventBus = EventBus;
        this._navigationLibrary = navigationLibrary;
        this._onChangeTransponderCode = onChangeTransponderCode;
    }

    /**
     * @for AircraftCommander
     * @method runCommands
     * @param aircraft {AircraftModel}
     * @param commands {CommandParser}
     */
    runCommands(aircraft, commands) {
        if (!aircraft.inside_ctr) {
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
            response_end = 'say again';
        }

        if (response.length >= 1) {
            if (response_end) {
                response_end = `, ${response_end}`;
            }

            const r_log = _map(response, (r) => r.log).join(', ');
            const r_say = _map(response, (r) => r.say).join(', ');

            UiController.ui_log(`${aircraft.callsign}, ${r_log} ${response_end}`, redResponse);
            speech_say([
                { type: 'callsign', content: aircraft },
                { type: 'text', content: `${r_say} ${response_end}` }
            ]);
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
        let call_func;

        if (COMMANDS[command]) {
            call_func = COMMANDS[command];
        }

        if (!call_func) {
            return [false, 'say again?'];
        }

        return this[call_func](aircraft, data);
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
            aircraft.altitude,
            altitudeRequested,
            expediteRequested,
            shouldUseSoftCeiling,
            airport
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
        const readback = aircraft.pilot.maintainHeading(aircraft.heading, heading, direction, incremental);

        if (direction === null) {
            direction = '';
        }

        aircraft.target.turn = direction;

        if (aircraft.hasApproachClearance) {
            aircraft.cancelApproachClearance(aircraft.altitude, aircraft.heading);
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
     * @return {array} [success of operation, readback]
     */
    runClimbViaSID(aircraft) {
        return aircraft.pilot.climbViaSid();
    }

    /**
     * @for AircraftCommander
     * @method runDescendViaStar
     * @param aircraft {AircraftModel}
     * @param data {array}
     * @return {array} [success of operation, readback]
     */
    runDescendViaStar(aircraft, data = []) {
        // TODO: add altitude param to descendViaStar command
        const altitude = data[0];// NOT IN USE

        return aircraft.pilot.descendViaStar(altitude);
    }

    /**
     * @for AircraftCommander
     * @method runSpeed
     * @param aircraft {AircraftModel}
     * @param data {array}
     */
    runSpeed(aircraft, data) {
        const speed = data[0];

        return aircraft.pilot.maintainSpeed(aircraft.speed, speed);
    }

    /**
     * Setup the Fms to enter a holding pattern,
     *
     * Can be used to hold at:
     * - A Waypoint in the current flight plan: which will be made the currentWaypoint via `fms.skipToWaypoint()`
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
        const holdFix = data[2];
        const fixModel = this._navigationLibrary.findFixByName(holdFix);
        let holdPosition = aircraft.positionModel;
        let inboundHeading = aircraft.heading;

        if (fixModel) {
            holdPosition = fixModel.relativePosition;
            inboundHeading = fixModel.positionModel.bearingFromPosition(aircraft.positionModel);
        }

        return aircraft.pilot.initiateHoldingPattern(inboundHeading, turnDirection, legLength, holdFix, holdPosition);
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
     * @param data {array}
     * @return {array}   [success of operation, readback]
     */
    runSID(aircraft, data) {
        const sidId = data[0];
        const runwayModel = aircraft.fms.departureRunwayModel;
        const airportModel = AirportController.airport_get();

        if (this._navigationLibrary.isSuffixRoute(sidId, PROCEDURE_TYPE.SID)) {
            return this._runSIDforSuffix(aircraft, airportModel, sidId);
        }

        const response = aircraft.pilot.applyDepartureProcedure(sidId, runwayModel, airportModel.icao);

        if (!response[0]) {
            return response;
        }

        // TODO: toUpperCase might be overly defensive here
        // update the aircraft destination so the strip display reflects the change of procedure
        aircraft.destination = sidId.toUpperCase();

        return response;
    }

    /**
     * Used only for suffix routes.
     *
     * Suffix routes apply to a specific runway.
     * This method will find and pass on the correct `RunwayModel`
     * to the `Pilot`.
     *
     * @for AircraftCommander
     * @method _runSIDforSuffix
     * @param  aircraft {AircraftModel}
     * @param airportModel {AirportModel}
     * @param sidId {strig}
     * @return {array}  [success of operation, readback]
     */
    _runSIDforSuffix(aircraft, airportModel, sidId) {
        const routeModel = this._navigationLibrary.sidCollection.findRouteByIcao(sidId);
        const runwayName = routeModel.getSuffixSegmentName(PROCEDURE_TYPE.SID);
        const runwayModel = airportModel.getRunway(runwayName);

        return aircraft.pilot.applyDepartureProcedure(sidId, runwayModel, airportModel.icao);
    }

    /**
     * @for AircraftCommander
     * @method runSTAR
     * @param data {array<string>} a string representation of the STAR, ex: `QUINN.BDEGA2.KSFO`
     * @return {array}   [success of operation, readback]
     */
    runSTAR(aircraft, data) {
        const routeString = data[0];
        // TODO: why are we passing this if we already have it?
        const runwayModel = aircraft.fms.arrivalRunwayModel;
        const airportModel = AirportController.airport_get();

        if (this._navigationLibrary.isSuffixRoute(routeString, PROCEDURE_TYPE.STAR)) {
            return this._runSTARforSuffix(aircraft, airportModel, routeString);
        }

        return aircraft.pilot.applyArrivalProcedure(routeString, runwayModel, airportModel.name);
    }

    /**
     * Used only for suffix routes.
     *
     * Suffix routes apply to a specific runway.
     * This method will find and pass on the correct `RunwayModel`
     * to the `Pilot`.
     *
     * @for AircraftCommander
     * @method _runSTARforSuffix
     * @param aircraft {AircraftModel}
     * @param airportModel {AirportModel}
     * @param routeString {string}
     * @return {array}  [success of operation, readback]
     */
    _runSTARforSuffix(aircraft, airportModel, routeString) {
        const routeStringModel = new RouteModel(routeString);
        const routeModel = this._navigationLibrary.starCollection.findRouteByIcao(routeStringModel.procedure);
        const runwayName = routeModel.getSuffixSegmentName(PROCEDURE_TYPE.STAR);
        const runwayModel = airportModel.getRunway(runwayName);

        return aircraft.pilot.applyArrivalProcedure(routeString, runwayModel, airportModel.name);
    }

    /**
     * @for AircraftCommander
     * @method runMoveDataBlock
     * @param data
     */
    runMoveDataBlock(aircraft, dir) {
        // TODO: what do all these numbers mean?
        const positions = { 8: 360, 9: 45, 6: 90, 3: 135, 2: 180, 1: 225, 4: 270, 7: 315, 5: 'ctr' };

        if (!_has(positions, dir[0])) {
            return;
        }

        aircraft.datablockDir = positions[dir[0]];
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
        const readback = aircraft.pilot.applyNewRoute(routeString, aircraft.initialRunwayAssignment);

        // Only change to LNAV mode if the route was applied successfully, else
        // continue with the previous instructions (whether a heading, etc)
        if (readback[0]) {
            aircraft.mcp.setHeadingLnav();
        }

        return readback;
    }

    /**
     * @for AircraftCommander
     * @method runTaxi
     * @param data
     * @return {array}   [success of operation, readback]
     */
    runTaxi(aircraft, data) {
        if (aircraft.isAirborne()) {
            return [false, 'unable to taxi, we\'re already airborne'];
        }
        let taxiDestination = data[0];
        const isDeparture = aircraft.category === FLIGHT_CATEGORY.DEPARTURE;
        const flightPhase = aircraft.flightPhase;

        // Set the runway to taxi to
        if (!taxiDestination) {
            const airport = AirportController.airport_get();
            taxiDestination = airport.departureRunwayModel.name;
        }

        const runway = AirportController.airport_get().getRunway(taxiDestination.toUpperCase());

        if (!runway) {
            return [false, `no runway ${taxiDestination.toUpperCase()}`];
        }

        const readback = aircraft.pilot.taxiToRunway(runway, isDeparture, flightPhase);

        // TODO: this may need to live in a method on the aircraft somewhere
        aircraft.fms.departureRunwayModel = runway;
        aircraft.taxi_start = GameController.game_time();

        runway.addAircraftToQueue(aircraft.id);
        aircraft.setFlightPhase(FLIGHT_PHASE.TAXI);

        GameController.game_timeout(
            this._changeFromTaxiToWaiting,
            aircraft.taxi_time,
            null,
            [aircraft]
        );

        return readback;
    }

    /**
     * @for AircraftCommander
     * @method _changeFromTaxiToWaiting
     * @param args {array}
     */
    _changeFromTaxiToWaiting(args) {
        const aircraft = args[0];

        aircraft.setFlightPhase(FLIGHT_PHASE.WAITING);
    }

    /**
     * @for AircraftCommander
     * @method runTakeoff
     * @param aircraft {AircraftModel}
     * @return {array}   [success of operation, readback]
     */
    runTakeoff(aircraft) {
        // FIXME: update some of this queue logic to live in the RunwayModel
        const airport = AirportController.airport_get();
        const runway = aircraft.fms.departureRunwayModel;
        const spotInQueue = runway.getAircraftQueuePosition(aircraft.id);
        const isInQueue = spotInQueue > -1;
        const aircraftAhead = runway.queue[spotInQueue - 1];
        const wind = airport.getWind();
        const roundedWindAngleInDegrees = round(radiansToDegrees(wind.angle) / 10) * 10;
        const roundedWindSpeed = round(wind.speed);
        const readback = {};

        if (!isInQueue) {
            return [false, 'unable to take off, we\'re completely lost'];
        }

        if (!aircraft.isOnGround()) {
            return [false, 'unable to take off, we\'re already airborne'];
        }

        if (aircraft.flightPhase === FLIGHT_PHASE.APRON) {
            return [false, 'unable to take off, we\'re still at the gate'];
        }

        if (aircraft.flightPhase === FLIGHT_PHASE.TAXI) {
            readback.log = `unable to take off, we're still taxiing to runway ${runway.name}`;
            readback.say = `unable to take off, we're still taxiing to runway ${radio_runway(runway.name)}`;

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

        runway.removeAircraftFromQueue(aircraft.id);
        aircraft.pilot.configureForTakeoff(airport.initial_alt, runway, aircraft.model.speed.cruise);
        aircraft.takeoffTime = GameController.game_time();
        aircraft.setFlightPhase(FLIGHT_PHASE.TAKEOFF);
        aircraft.scoreWind('taking off');

        readback.log = `wind ${roundedWindAngleInDegrees} at ${roundedWindSpeed}, runway ${runway.name}, ` +
            'cleared for takeoff';
        readback.say = `wind ${radio_spellOut(roundedWindAngleInDegrees)} at ` +
            `${radio_spellOut(roundedWindSpeed)}, runway ${radio_runway(runway.name)}, cleared for takeoff`;

        return [true, readback];
    }

    /**
     * @for AircraftCommander
     * @method runLanding
     * @param aircraft {AircraftModel}
     * @param data {array}
     */
    runLanding(aircraft, data) {
        const approachType = 'ils';
        const runwayName = data[1].toUpperCase();
        const runway = AirportController.airport_get().getRunway(runwayName);

        return aircraft.pilot.conductInstrumentApproach(approachType, runway);
    }

    /**
     * @for AircraftCommander
     * @method runAbort
     * @param aircraft {AircraftModel}
     */
    runAbort(aircraft) {
        const airport = AirportController.airport_get();

        switch (aircraft.flightPhase) {
            case FLIGHT_PHASE.TAXI:
                return aircraft.pilot.stopOutboundTaxiAndReturnToGate();
            case FLIGHT_PHASE.WAITING:
                return aircraft.pilot.stopWaitingInRunwayQueueAndReturnToGate();
            case FLIGHT_PHASE.LANDING:
                return aircraft.pilot.goAround(aircraft.heading, aircraft.speed, airport.elevation);
            case FLIGHT_PHASE.APPROACH:
                return aircraft.pilot.cancelApproachClearance(aircraft.altitude, aircraft.heading);
            default:
                return [false, 'we aren\'t doing anything that can be aborted'];
        }
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
