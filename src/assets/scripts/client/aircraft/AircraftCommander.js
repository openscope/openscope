import _ceil from 'lodash/ceil';
import _floor from 'lodash/floor';
import _has from 'lodash/has';
import _isNaN from 'lodash/isNaN';
import _isNil from 'lodash/isNil';
import _map from 'lodash/map';
import Waypoint from './FlightManagementSystem/Waypoint';
import RouteModel from '../navigationLibrary/Route/RouteModel';
import { speech_say } from '../speech';
import { radians_normalize } from '../math/circle';
import { round, clamp } from '../math/core';
import { vradial, vsub } from '../math/vector';
import {
    radio_cardinalDir_names,
    groupNumbers,
    radio_runway,
    radio_heading,
    radio_spellOut,
    radio_altitude,
    radio_trend,
    getCardinalDirection
} from '../utilities/radioUtilities';
import { radiansToDegrees, degreesToRadians, heading_to_string } from '../utilities/unitConverters';
import {
    FLIGHT_MODES,
    FLIGHT_CATEGORY,
    WAYPOINT_NAV_MODE,
    FP_LEG_TYPE
} from '../constants/aircraftConstants';
import {
    MCP_MODE,
    MCP_MODE_NAME,
} from './ModeControl/modeControlConstants';


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
    descendViaSTAR: 'runDescendViaSTAR',
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
            return ['fail', 'not understood'];
        }

        return this[call_func](aircraft, data);
    }

    /**
     * @for AircraftCommander
     * @method runHeading
     * @param data
     */
    runHeading(aircraft, data) {
        const direction = data[0];
        const heading = data[1];
        const incremental = data[2];

        return aircraft.pilot.maintainHeading(heading, direction, incremental);
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
     * @method runDescendViaSTAR
     * @param data
     * @return {boolean|undefined}
     */
    runDescendViaSTAR(aircraft, /* optional */ altitude) {
        return aircraft.pilot.descendViaSTAR(altitude);
    }

    /**
     * @for AircraftCommander
     * @method runSpeed
     * @param data
     */
    runSpeed(aircraft, data) {
        const speed = data[0];

        return aircraft.pilot.maintainSpeed(speed);
    }

    /**
     * @for AircraftCommander
     * @method runHold
     * @param data
     */
    runHold(aircraft, data) {
        const airport = this._airportController.airport_get();
        let dirTurns = data[0];
        let legLength = data[1];
        let holdFix = data[2];
        let holdFixLocation = null;
        let inboundHdg;
        // let inboundDir;

        // TODO: this might be better handled from within the parser
        if (dirTurns == null) {
            // standard for holding patterns is right-turns
            dirTurns = 'right';
        }

        // TODO: this might be better handled from within the parser
        if (legLength == null) {
            legLength = '1min';
        }

        // TODO: simplify this nested if.
        if (holdFix !== null) {
            holdFix = holdFix.toUpperCase();
            holdFixLocation = this._navigationLibrary.getFixPositionCoordinates(holdFix);

            if (!holdFixLocation) {
                return ['fail', `unable to find fix ${holdFix}`];
            }
        }

        if (aircraft.isTakeoff() && !holdFix) {
            return ['fail', 'where do you want us to hold?'];
        }

        // Determine whether or not to enter the hold from present position
        if (holdFix) {
            // FIXME: replace `vradial(vsub())` with `bearingToPoint()`
            // holding over a specific fix (currently only able to do so on inbound course)
            inboundHdg = vradial(vsub(aircraft.position, holdFixLocation));

            if (holdFix !== aircraft.__fms__.currentWaypoint.fix) {
                // TODO: break up the inline creation of Waypoints by setting them to constants with meaningful
                // names first, then use those consts to send to the fms method

                // not yet headed to the hold fix
                aircraft.__fms__.insertLegHere({
                    type: 'fix',
                    route: '[GPS/RNAV]',
                    waypoints: [
                        // proceed direct to holding fix
                        new Waypoint(
                            {
                                fix: holdFix,
                                altitude: aircraft.__fms__.altitudeForCurrentWaypoint(),
                                speed: aircraft.__fms__.currentWaypoint.speed
                            },
                            airport
                        ),
                        // then enter the hold
                        new Waypoint(
                            {
                                navmode: WAYPOINT_NAV_MODE.HOLD,
                                speed: aircraft.__fms__.currentWaypoint.speed,
                                altitude: aircraft.__fms__.altitudeForCurrentWaypoint(),
                                fix: null,
                                hold: {
                                    fixName: holdFix,
                                    fixPos: holdFixLocation,
                                    dirTurns: dirTurns,
                                    legLength: legLength,
                                    inboundHdg: inboundHdg,
                                    timer: null
                                }
                            },
                            airport
                        )
                    ]
                });
            } else {
                // TODO: this should be a `Waypoint`

                // already currently going to the hold fix
                // Force the initial turn to outbound heading when entering the hold
                aircraft.__fms__.appendWaypoint({
                    navmode: WAYPOINT_NAV_MODE.HOLD,
                    speed: aircraft.__fms__.currentWaypoint.speed,
                    altitude: aircraft.__fms__.altitudeForCurrentWaypoint(),
                    fix: null,
                    hold: {
                        fixName: holdFix,
                        fixPos: holdFixLocation,
                        dirTurns: dirTurns,
                        legLength: legLength,
                        inboundHdg: inboundHdg,
                        timer: null
                    }
                });
            }
        } else {
            // holding over present position (currently only able to do so on present course)
            holdFixLocation = aircraft.position; // make a/c hold over their present position
            inboundHdg = aircraft.heading;

            const holdingWaypointModel = new Waypoint({
                navmode: WAYPOINT_NAV_MODE.HOLD,
                speed: aircraft.fms.currentWaypoint.speed,
                altitude: aircraft.fms.altitudeForCurrentWaypoint(),
                fix: null,
                hold: {
                    fixName: '[custom]',
                    fixPos: holdFixLocation,
                    dirTurns: dirTurns,
                    legLength: legLength,
                    inboundHdg: inboundHdg,
                    timer: null
                }
            });

            aircraft.fms.insertLegHere({
                type: 'fix',
                waypoints: [holdingWaypointModel]
            });
        }

        // TODO: abstract to helper function `.getInboundCardinalDirection(inboundHeading)`
        const inboundDir = radio_cardinalDir_names[getCardinalDirection(radians_normalize(inboundHdg + Math.PI)).toLowerCase()];

        if (holdFix) {
            return ['ok', `proceed direct ${holdFix} and hold inbound, ${dirTurns} turns, ${legLength} legs`];
        }

        return ['ok', `hold ${inboundDir} of present position, ${dirTurns} turns, ${legLength} legs`];
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

        aircraft.pilot.applyArrivalProcedure(routeString);
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
     * @param data
     */
    runTakeoff(aircraft, data) {
        // TODO: all this if logic should be simplified or abstracted
        if (aircraft.category !== 'departure') {
            return ['fail', 'inbound'];
        }

        if (!aircraft.isOnGround()) {
            return ['fail', 'already airborne'];
        }
        if (aircraft.mode === FLIGHT_MODES.APRON) {
            return ['fail', 'unable, we\'re still in the parking area'];
        }
        if (aircraft.mode === FLIGHT_MODES.TAXI) {
            return ['fail', `taxi to runway ${radio_runway(aircraft.rwy_dep)} not yet complete`];
        }
        if (aircraft.mode === FLIGHT_MODES.TAKEOFF) {
            // FIXME: this is showing immediately after a to clearance.
            return ['fail', 'already taking off'];
        }

        if (aircraft.__fms__.altitudeForCurrentWaypoint() <= 0) {
            return ['fail', 'no altitude assigned'];
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
            const readback = {
                // TODO: the wind_dir calculation should be abstracted
                log: `wind ${round(wind_dir / 10) * 10} ${round(wind.speed)}, runway ${aircraft.rwy_dep}, cleared for takeoff`,
                say: `wind ${radio_spellOut(round(wind_dir / 10) * 10)} at ${radio_spellOut(round(wind.speed))}, runway ${radio_runway(aircraft.rwy_dep)}, cleared for takeoff`
            };

            return ['ok', readback];
        }

        const waiting = runway.inQueue(aircraft);

        return ['fail', `number ${waiting} behind ${runway.queue[waiting - 1].getRadioCallsign()}`, ''];
    }

    runLanding(aircraft, data) {
        const variant = data[0];
        const runway = this._airportController.airport_get().getRunway(data[1]);

        if (!runway) {
            return ['fail', `there is no runway ${radio_runway(data[1])}`];
        }

        aircraft.setArrivalRunway(data[1].toUpperCase());
        // tell fms to follow ILS approach
        aircraft.__fms__.followApproach('ils', aircraft.rwy_arr, variant);

        const readback = {
            log: `cleared ILS runway ${aircraft.rwy_arr} approach`,
            say: `cleared ILS runway ${radio_runway(aircraft.rwy_arr)} approach`
        };

        return ['ok', readback];
    }

    /**
     * @for AircraftCommander
     * @method runAbort
     * @param aircraft {AircraftInstanceModel}
     * @param data
     */
    runAbort(aircraft, data) {
        // TODO: these ifs on `mode` should be converted to a switch
        if (aircraft.mode === FLIGHT_MODES.TAXI) {
            aircraft.mode = FLIGHT_MODES.APRON;
            aircraft.taxi_start = 0;

            console.log('aborted taxi to runway');

            const isWarning = true;
            this._uiController.ui_log(`${aircraft.getCallsign()} aborted taxi to runway`, isWarning);

            return ['ok', 'taxiing back to terminal'];
        } else if (aircraft.mode === FLIGHT_MODES.WAITING) {
            return ['fail', 'unable to return to the terminal'];
        } else if (aircraft.mode === FLIGHT_MODES.LANDING) {
            aircraft.cancelLanding();

            const readback = {
                log: `go around, fly present heading, maintain ${aircraft.__fms__.altitudeForCurrentWaypoint()}`,
                say: `go around, fly present heading, maintain ${radio_altitude(aircraft.__fms__.altitudeForCurrentWaypoint())}`
            };

            return ['ok', readback];
        } else if (aircraft.mode === FLIGHT_MODES.CRUISE && aircraft.__fms__.currentWaypoint.navmode === WAYPOINT_NAV_MODE.RWY) {
            aircraft.cancelLanding();

            const readback = {
                log: `cancel approach clearance, fly present heading, maintain ${aircraft.__fms__.altitudeForCurrentWaypoint()}`,
                say: `cancel approach clearance, fly present heading, maintain ${radio_altitude(aircraft.__fms__.altitudeForCurrentWaypoint())}`
            };

            return ['ok', readback];
        } else if (aircraft.mode === FLIGHT_MODES.CRUISE && aircraft.__fms__.currentWaypoint.navmode === WAYPOINT_NAV_MODE.FIX) {
            aircraft.cancelFix();

            if (aircraft.category === FLIGHT_CATEGORY.ARRIVAL) {
                return ['ok', 'fly present heading, vector to final approach course'];
            } else if (aircraft.category === 'departure') {
                return ['ok', 'fly present heading, vector for entrail spacing'];
            }
        }

        // modes 'apron', 'takeoff', ('cruise' for some navmodes)
        return ['fail', 'unable to abort'];
    }

    // FIXME: is this in use?
    /**
     * @for AircraftCommander
     * @method runDebug
     * * @param aircraft {AircraftInstanceModel}
     */
    runDebug(aircraft) {
        window.aircraft = aircraft;
        return ['ok', { log: 'in the console, look at the variable &lsquo;aircraft&rsquo;', say: '' }];
    }

    // FIXME: is this in use?
    /**
     * @for AircraftCommander
     * @method runDelete
     * @param aircraft {AircraftInstanceModel}
     */
    runDelete(aircraft) {
        window.aircraftController.aircraft_remove(aircraft);
    }
}
