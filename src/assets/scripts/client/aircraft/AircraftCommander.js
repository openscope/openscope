import _ceil from 'lodash/ceil';
import _has from 'lodash/has';
import _map from 'lodash/map';
import { speech_say } from '../speech';
import { radiansToDegrees } from '../math/circle';
import { round } from '../math/core';
import { bearingToPoint } from '../math/flightMath';
import {
    radio_runway,
    radio_spellOut,
    radio_altitude,
    getRadioCardinalDirectionNameForHeading
} from '../utilities/radioUtilities';
import {
    FLIGHT_MODES,
    FLIGHT_CATEGORY,
    WAYPOINT_NAV_MODE
} from '../constants/aircraftConstants';


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
    constructor(airportController, navigationLibrary, gameController, uiController) {
        this._airportController = airportController;
        this._navigationLibrary = navigationLibrary;
        this._gameController = gameController;
        this._uiController = uiController;
    }

    /**
     * @for AircraftCommander
     * @method runCommands
     * @param aircraft {AircraftInstanceModel}
     * @param commands {CommandParser}
     */
    runCommands(aircraft, commands) {
        if (!aircraft.inside_ctr) {
            return true;
        }

        let response = [];
        let response_end = '';
        const deferred = [];

        for (let i = 0; i < commands.length; i++) {
            const command = commands[i][0];
            const args = commands[i].splice(1);

            if (command === FLIGHT_MODES.TAKEOFF) {
                deferred.push([command, args]);

                continue;
            }

            let retval = this.run(aircraft, command, args);

            if (retval) {
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
                say: 'not understood',
                log: 'not understood'
            }];
            response_end = 'say again';
        }

        if (response.length >= 1) {
            if (response_end) {
                response_end = `, ${response_end}`;
            }

            const r_log = _map(response, (r) => r.log).join(', ');
            const r_say = _map(response, (r) => r.say).join(', ');

            this._uiController.ui_log(`${aircraft.getCallsign()}, ${r_log} ${response_end}`);
            speech_say([
                { type: 'callsign', content: aircraft },
                { type: 'text', content: `${r_say} ${response_end}` }
            ]);
        }

        aircraft.updateStrip();

        return true;
    }

    /**
     * @for AircraftCommander
     * @method run
     * @param aircraft {AircraftInstanceModel}
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
     * @param aircraft {AircraftInstanceModel}
     * @param data {array}
     * @return {array}  [success of operation, readback]
     */
    runAltitude(aircraft, data) {
        const altitudeRequested = data[0];
        const expediteRequested = data[1];
        const shouldUseSoftCeiling = this._gameController.game.option.get('softCeiling') === 'yes';
        const airport = this._airportController.airport_get();

        return aircraft.pilot.maintainAltitude(
            aircraft.currentAltitude,
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
     * @param aircraft {AircraftInstanceModel}
     * @param data {array}
     * @return {array} [success of operation, readback]
     */
    runHeading(aircraft, data) {
        const direction = data[0];
        const heading = data[1];
        const incremental = data[2];

        return aircraft.pilot.maintainHeading(aircraft.heading, heading, direction, incremental);
    }

    /**
     * Activate the flightplan stored in the FMS
     *
     * @for AircraftCommander
     * @method runClearedAsFiled
     * @param aircraft {AircraftInstanceModel}
     * @return {array} [success of operation, readback]
     */
    runClearedAsFiled(aircraft) {
        const airport = window.airportController.airport_get();
        const { angle: runwayHeading } = airport.getRunway(aircraft.rwy_dep);

        return aircraft.pilot.clearedAsFiled(airport.initial_alt, runwayHeading, aircraft.model.speed.cruise);
    }

    /**
     * @for AircraftCommander
     * @method runClimbViaSID
     * @param aircraft {AircraftInstanceModel}
     * @return {array} [success of operation, readback]
     */
    runClimbViaSID(aircraft) {
        return aircraft.pilot.climbViaSid();
    }

    /**
     * @for AircraftCommander
     * @method runDescendViaStar
     * @param aircraft {AircraftInstanceModel}
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
     * @param aircraft {AircraftInstanceModel}
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
     * @param aircraft {AircraftInstanceModel}
     * @param data {array}
     * @return {array} [success of operation, readback]
     */
    runHold(aircraft, data) {
        const turnDirection = data[0];
        const legLength = data[1];
        const holdFix = data[2];
        let holdFixLocation = aircraft.position;
        let inboundHdg = aircraft.heading;

        if (holdFix) {
            holdFixLocation = this._navigationLibrary.getFixPositionCoordinates(holdFix);
            inboundHdg = bearingToPoint(aircraft.position, holdFixLocation);
        }

        return aircraft.pilot.initiateHoldingPattern(inboundHdg, turnDirection, legLength, holdFix, holdFixLocation);
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

        return aircraft.pilot.proceedDirect(fixName);
    }

    /**
     * @for AircraftCommander
     * @method runFlyPresentHeading
     * @param aircraft {AircraftInstanceModel}
     */
    runFlyPresentHeading(aircraft) {
        return aircraft.pilot.maintainPresentHeading(aircraft.heading);
    }

    /**
     * @for AircraftCommander
     * @method runSayRoute
     * @param aircraft {AircraftInstanceModel}
     * @return {array}   [success of operation, readback]
     */
    runSayRoute(aircraft) {
        return aircraft.pilot.sayRoute();
    }

    /**
     * @for AircraftCommander
     * @method runSID
     * @param aircraft {AircraftInstanceModel}
     * @param data {array}
     * @return {array}   [success of operation, readback]
     */
    runSID(aircraft, data) {
        const sidId = data[0];
        const departureRunway = aircraft.rwy_dep;
        const { icao: airportIcao } = this._airportController.airport_get();

        return aircraft.pilot.applyDepartureProcedure(sidId, departureRunway, airportIcao);
    }

    /**
     * @for AircraftCommander
     * @method runSTAR
     * @param data {array<string>} a string representation of the STAR, ex: `QUINN.BDEGA2.KSFO`
     */
    runSTAR(aircraft, data) {
        const routeString = data[0];
        const arrivalRunway = aircraft.rwy_arr;
        const { name: airportName } = this._airportController.airport_get();

        return aircraft.pilot.applyArrivalProcedure(routeString, arrivalRunway, airportName);
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
     */
    runRoute(aircraft, data) {
        // TODO: is this .toUpperCase() necessary??
        const routeString = data[0].toUpperCase();

        aircraft.pilot.applyPartialRouteAmendment(routeString);
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
      */
    runReroute(aircraft, data) {
        // TODO: is this .toUpperCase() necessary??
        const routeString = data[0].toUpperCase();

        aircraft.pilot.applyNewRoute(routeString);
    }

    /**
     * @for AircraftCommander
     * @method runTaxi
     * @param data
     */
    runTaxi(aircraft, data) {
        // TODO: is this .toUpperCase() necessary??
        const taxiDestination = data[0].toUpperCase();
        const isDeparture = aircraft.category === FLIGHT_CATEGORY.DEPARTURE;
        const isOnGround = aircraft.isOnGround();
        const flightPhase = aircraft.mode;

        aircraft.pilot.taxi(taxiDestination, isDeparture, isOnGround, flightPhase);
    }

    /**
     * @for AircraftCommander
     * @method runTakeoff
     */
    runTakeoff(aircraft) {
        if (!aircraft.isOnGround()) {
            return [false, 'unable to take off, we\'re already airborne'];
        }
        if (aircraft.mode === FLIGHT_MODES.APRON) {
            return [false, 'unable to take off, we\'re still at the gate'];
        }
        if (aircraft.mode === FLIGHT_MODES.TAXI) {
            const readback = {};
            readback.log = `unable to take off, we're still taxiing to runway ${aircraft.rwy_dep}`;
            readback.say = `unable to take off, we're still taxiing to runway ${radio_runway(aircraft.rwy_dep)}`;

            return [false, readback];
        }
        if (aircraft.mode === FLIGHT_MODES.TAKEOFF) {
            // FIXME: this is showing immediately after a to clearance.
            return [false, 'already taking off'];
        }

        const runway = this._airportController.airport_get().getRunway(aircraft.rwy_dep);

        if (runway.removeQueue(aircraft)) {
            aircraft.mode = FLIGHT_MODES.TAKEOFF;
            aircraft.scoreWind('taking off');
            aircraft.takeoffTime = this._gameController.game_time();

            if (aircraft.__fms__.currentWaypoint.speed == null) {
                aircraft.__fms__.setCurrent({ speed: aircraft.model.speed.cruise });
            }

            const wind = this._airportController.airport_get().getWind();
            const wind_dir = round(radiansToDegrees(wind.angle));
            // TODO: Yikes, dats a lot of stuff goin' on...
            const readback = {
                // TODO: the wind_dir calculation should be abstracted
                log: `wind ${round(wind_dir / 10) * 10} ${round(wind.speed)}, runway ${aircraft.rwy_dep}, cleared for takeoff`,
                say: `wind ${radio_spellOut(round(wind_dir / 10) * 10)} at ${radio_spellOut(round(wind.speed))}, runway ${radio_runway(aircraft.rwy_dep)}, cleared for takeoff`
            };

            return [true, readback];
        }

        const spotInQueue = runway.inQueue(aircraft);
        const aircraftAhead = runway.queue[spotInQueue - 1];
        const readback = {};
        readback.log = `number ${spotInQueue} behind ${aircraftAhead.getCallsign()}`;
        readback.say = `number ${spotInQueue} behind ${aircraftAhead.getRadioCallsign()}`;

        return [false, readback];
    }

    /**
     * @for AircraftCommander
     * @method runLanding
     * @param data
     */
    runLanding(aircraft, data) {
        const approachType = 'ils';
        // TODO: Is this .toUpperCase() really necessary??
        const runwayName = data[1].toUpperCase();
        const runway = this._airportController.airport_get().getRunway(runwayName);

        return aircraft.pilot.conductInstrumentApproach(approachType, runway);
    }

    /**
     * @for AircraftCommander
     * @method runAbort
     * @param aircraft {AircraftInstanceModel}
     */
    runAbort(aircraft) {
        const airport = this._airportController.airport_get();

        switch (aircraft.mode) {
            case FLIGHT_MODES.TAXI:
                return aircraft.pilot.stopOutboundTaxiAndReturnToGate();
            case FLIGHT_MODES.WAITING:
                return aircraft.pilot.stopWaitingInRunwayQueueAndReturnToGate();
            case FLIGHT_MODES.LANDING:
                return aircraft.pilot.goAround(aircraft.heading, aircraft.speed, airport.elevation);
            case FLIGHT_MODES.CRUISE:
                return aircraft.pilot.cancelApproachClearance(aircraft.heading, aircraft.speed, airport.elevation);
            default:
                return [false, 'we aren\'t doing anything that can be aborted'];
        }
    }

    /**
     * @for AircraftCommander
     * @method runDelete
     * @param aircraft {AircraftInstanceModel}
     */
    runDelete(aircraft) {
        window.aircraftController.aircraft_remove(aircraft);
    }
}
