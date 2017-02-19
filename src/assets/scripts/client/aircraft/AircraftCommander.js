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
    MCP_PROPERTY_MAP
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
        const airport = this._airportController.airport_get();
        const direction = data[0];
        let heading = data[1];
        const incremental = data[2];
        let amount = 0;
        let instruction;

        // TODO: this should be handled in the commandParser
        if (_isNaN(heading)) {
            return ['fail', 'heading not understood'];
        }

        if (incremental) {
            amount = heading;

            if (direction === 'left') {
                heading = radiansToDegrees(aircraft.heading) - amount;
            } else if (direction === 'right') {
                heading = radiansToDegrees(aircraft.heading) + amount;
            }
        }

        aircraft.fms.setHeadingHold(heading);

        // TODO: this probably shouldn't be the AircraftInstanceModel's job. this logic should belong somewhere else.
        // Update the FMS
        let wp = aircraft.__fms__.currentWaypoint;
        const leg = aircraft.__fms__.currentLeg;
        const f = aircraft.__fms__.following;

        if (wp.navmode === WAYPOINT_NAV_MODE.RWY) {
            aircraft.cancelLanding();
        }

        // already being vectored or holding. Will now just change the assigned heading.
        if (wp.navmode === WAYPOINT_NAV_MODE.HEADING) {
            aircraft.__fms__.setCurrent({
                altitude: wp.altitude,
                navmode: WAYPOINT_NAV_MODE.HEADING,
                heading: degreesToRadians(heading),
                speed: wp.speed,
                turn: direction,
                hold: false
            });
        } else if (wp.navmode === WAYPOINT_NAV_MODE.HOLD) {
            // in hold. Should leave the hold, and add leg for vectors
            const index = aircraft.__fms__.current[0] + 1;
            const waypointToAdd = new Waypoint(
                {
                    altitude: wp.altitude,
                    navmode: WAYPOINT_NAV_MODE.HEADING,
                    heading: degreesToRadians(heading),
                    speed: wp.speed,
                    turn: direction,
                    hold: false
                },
                airport
            );

            // add new Leg after hold leg
            aircraft.__fms__.insertLeg({
                firstIndex: index,
                waypoints: [waypointToAdd]
            });

            // move from hold leg to vector leg.
            aircraft.__fms__.nextWaypoint();
        } else if (f.sid || f.star || f.awy) {
            const waypointToAdd = new Waypoint(
                {
                    altitude: wp.altitude,
                    navmode: WAYPOINT_NAV_MODE.HEADING,
                    heading: degreesToRadians(heading),
                    speed: wp.speed,
                    turn: direction,
                    hold: false
                },
                airport
            );

            // TODO: this should be an FMS class method that accepts a new `waypointToAdd`
            // insert wp with heading at current position within the already active leg
            leg.waypoints.splice(aircraft.__fms__.current[1], 0, waypointToAdd);
        } else if (leg.route !== '[radar vectors]') {
            // needs new leg added
            if (aircraft.__fms__.atLastWaypoint()) {
                const waypointToAdd = new Waypoint(
                    {
                        altitude: wp.altitude,
                        navmode: WAYPOINT_NAV_MODE.HEADING,
                        heading: degreesToRadians(heading),
                        speed: wp.speed,
                        turn: direction,
                        hold: false
                    },
                    airport
                );

                aircraft.__fms__.appendLeg({
                    waypoints: [waypointToAdd]
                });

                aircraft.__fms__.nextLeg();
            } else {
                const waypointToAdd = new Waypoint(
                    {
                        altitude: wp.altitude,
                        navmode: WAYPOINT_NAV_MODE.HEADING,
                        heading: degreesToRadians(heading),
                        speed: wp.speed,
                        turn: direction,
                        hold: false
                    },
                    airport
                );

                aircraft.__fms__.insertLegHere({
                    waypoints: [waypointToAdd]
                });
            }
        }

        wp = aircraft.__fms__.currentWaypoint;  // update 'wp'

        // Construct the readback
        instruction = 'fly heading';
        if (direction) {
            instruction = `turn ${direction} heading`;
        }

        const readback = {};
        readback.log = `${instruction} ${heading_to_string(wp.heading)}`;
        readback.say = `${instruction} ${radio_heading(heading_to_string(wp.heading))}`;

        if (incremental) {
            readback.log = `turn ${amount} degrees ${direction}`;
            readback.say = `turn ${groupNumbers(amount)} degrees ${direction}`;
        }

        return ['ok', readback];
    }

    /**
     * @for AircraftCommander
     * @method runAltitude
     * @param data
     */
    runAltitude(aircraft, data) {
        const altitude = data[0];
        const shouldExpedite = data[1];
        const airport = this._airportController.airport_get();
        const radioTrendAltitude = radio_trend('altitude', aircraft.altitude, altitude);
        const currentWaypointRadioAltitude = radio_altitude(aircraft.__fms__.altitudeForCurrentWaypoint());
        let shouldExpediteReadback = shouldExpedite
            ? 'and expedite'
            : '';

        if (aircraft.mode === FLIGHT_MODES.LANDING) {
            aircraft.cancelLanding();
        }

        let ceiling = airport.ctr_ceiling;
        if (this._gameController.game.option.get('softCeiling') === 'yes') {
            ceiling += 1000;
        }

        const altitudeAdjustedForElevation = clamp(round(airport.elevation / 100) * 100 + 1000, altitude, ceiling);

        aircraft.fms.setAltitudeHold(altitudeAdjustedForElevation);

        aircraft.__fms__.setCurrent({ expedite: shouldExpedite });
        aircraft.__fms__.setAll({
            // TODO: enumerate the magic numbers
            altitude: altitudeAdjustedForElevation,
            expedite: shouldExpedite
        });

        const readback = {
            log: `${radioTrendAltitude} ${altitudeAdjustedForElevation} ${shouldExpediteReadback}`,
            say: `${radioTrendAltitude} ${currentWaypointRadioAltitude} ${shouldExpediteReadback}`
        };

        return ['ok', readback];
    }

    /**
     * @for AircraftCommander
     * @method runClearedAsFiled
     * @return {array}
     */
    runClearedAsFiled(aircraft) {
        if (!this.runSID(aircraft, [aircraft.destination])) {
            return [true, 'unable to clear as filed'];
        }

        aircraft.fms.setAltitudeVnav();
        aircraft.fms.setHeadingLnav(aircraft.heading);

        const airport = this._airportController.airport_get();
        const { name: procedureName } = this._navigationLibrary.sidCollection.findRouteByIcao(aircraft.destination);
        const readback = {};

        readback.log = `cleared to destination via the ${aircraft.destination} departure, then as filed. Climb and ` +
            `maintain ${airport.initial_alt}, expect ${aircraft.__fms__.fp.altitude} 10 minutes after departure `;
        readback.say = `cleared to destination via the ${procedureName.toUpperCase()} ` +
            `departure, then as filed. Climb and maintain ${radio_altitude(airport.initial_alt)}, ` +
            `expect ${radio_altitude(aircraft.__fms__.fp.altitude)}, ${radio_spellOut('10')} minutes after departure'`;

        return ['ok', readback];
    }

    /**
     * @for AircraftCommander
     * @method runClimbViaSID
     */
    runClimbViaSID(aircraft) {
        if (aircraft.__fms__.currentLeg.type !== FP_LEG_TYPE.SID || !aircraft.__fms__.climbViaSID()) {
            const isWarning = true;

            this._uiController.ui_log(`${aircraft.getCallsign()} unable to climb via SID`, isWarning);

            return;
        }

        const airport = this._airportController.airport_get();
        const { name: procedureName } = this._navigationLibrary.sidCollection.findRouteByIcao(aircraft.__fms__.currentLeg.route.procedure);
        const readback = {
            log: `climb via the ${aircraft.__fms__.currentLeg.route.procedure} departure`,
            say: `climb via the ${procedureName.toUpperCase()} departure`
        };

        return ['ok', readback];
    }

    /**
     * @for AircraftCommander
     * @method runDescendViaSTAR
     * @param data
     * @return {boolean|undefined}
     */
    runDescendViaSTAR(aircraft) {
        aircraft.fms.setAltitudeVnav();

        if (!aircraft.__fms__.descendViaSTAR() || !aircraft.__fms__.following.star) {
            const isWarning = true;
            this._uiController.ui_log(`${aircraft.getCallsign()}, unable to descend via STAR`, isWarning);

            return;
        }

        const airport = this._airportController.airport_get();
        const { name: procedureName } = this._navigationLibrary.starCollection.findRouteByIcao(aircraft.__fms__.currentLeg.route.procedure);
        const readback = {
            log: `descend via the ${aircraft.__fms__.following.star} arrival`,
            say: `descend via the ${procedureName.toUpperCase()} arrival`
        };

        return ['ok', readback];
    }

    /**
     * @for AircraftCommander
     * @method runSpeed
     * @param data
     */
    runSpeed(aircraft, data) {
        const speed = data[0];

        // this condition should never happen here it will be caught in the `CommandParser`
        // FIXME: remove this if block
        if (_isNaN(speed)) {
            return ['fail', 'speed not understood'];
        }

        aircraft.fms.setSpeedHold(speed);

        const clampedSpeed = clamp(aircraft.model.speed.min, speed, aircraft.model.speed.max);
        aircraft.__fms__.setAll({ speed: clampedSpeed });

        const radioTrendSpeed = radio_trend('speed', aircraft.speed, aircraft.__fms__.currentWaypoint.speed);
        const readback = {
            log: `${radioTrendSpeed} ${aircraft.__fms__.currentWaypoint.speed}`,
            say: `${radioTrendSpeed} ${radio_spellOut(aircraft.__fms__.currentWaypoint.speed)}`
        };

        return ['ok', readback];
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
     * @for AircraftCommander
     * @method runDirect
     * @param data
     */
    runDirect(aircraft, data) {
        // TODO: maybe handle with parser?
        const fixName = data[0].toUpperCase();

        if (_isNil(this._navigationLibrary.findFixByName(fixName))) {
            return ['fail', `unable to find fix called ${fixName}`];
        }

        aircraft.fms.skipToWaypoint(fixName);
        aircraft.setMcpMode(MCP_MODE_NAME.HEADING, MCP_MODE.HEADING.LNAV);

        // remove intermediate fixes
        if (aircraft.mode === FLIGHT_MODES.TAKEOFF) {
            aircraft.__fms__.skipToFix(fixName);
        } else if (!aircraft.__fms__.skipToFix(fixName)) {
            return ['fail', `${fixName} is not in our flightplan`];
        }

        return ['ok', `proceed direct ${fixName}`];
    }

    runFix(aircraft, data) {
        let last_fix;
        let fail;
        const fixes = _map(data, (fixname) => {
            if (_isNil(this._navigationLibrary.findFixByName(fixname))) {
                fail = ['fail', `unable to find fix called ${fixname}`];

                return;
            }

            // to avoid repetition, compare name with the previous fix
            if (fixname === last_fix) {
                return;
            }

            last_fix = fixname;

            return fixname;
        });

        if (fail) {
            return fail;
        }

        for (let i = 0; i < fixes.length; i++) {
            // FIXME: use enumerated constant for type
            aircraft.__fms__.insertLegHere({ type: 'fix', route: fixes[i] });
        }

        if (aircraft.mode !== FLIGHT_MODES.WAITING &&
            aircraft.mode !== FLIGHT_MODES.TAKEOFF &&
            aircraft.mode !== FLIGHT_MODES.APRON &&
            aircraft.mode !== FLIGHT_MODES.TAXI
        ) {
            aircraft.cancelLanding();
        }

        return ['ok', `proceed direct ${fixes.join(', ')}`];
    }

    /**
     * @for AircraftCommander
     * @method runFlyPresentHeading
     * @param data
     */
    runFlyPresentHeading(aircraft, data) {
        const headingInRadians = radiansToDegrees(aircraft.heading);

        aircraft.cancelFix();
        aircraft.fms.setHeadingHold(aircraft.heading);

        this.runHeading(aircraft, [null, headingInRadians]);

        return ['ok', 'fly present heading'];
    }

    /**
     * @for AircraftCommander
     * @method runSayRoute
     * @param data
     */
    runSayRoute(aircraft, data) {
        console.log(aircraft.fms.currentRoute);

        return ['ok', {
            log: `route: ${aircraft.__fms__.fp.route.join(' ')}`,
            say: 'here\'s our route'
        }];
    }

    /**
     * @for AircraftCommander
     * @method runSID
     */
    runSID(aircraft, data) {
        const airport = this._airportController.airport_get();
        const sidId = data[0];
        const standardRouteModel = this._navigationLibrary.sidCollection.findRouteByIcao(sidId);
        const exit = this._navigationLibrary.sidCollection.findRandomExitPointForSIDIcao(sidId);
        const route = `${airport.icao}.${sidId}.${exit}`;

        if (_isNil(standardRouteModel)) {
            return ['fail', 'SID name not understood'];
        }

        if (aircraft.category !== FLIGHT_CATEGORY.DEPARTURE) {
            return ['fail', 'unable to fly SID, we are an inbound'];
        }

        if (!aircraft.rwy_dep) {
            aircraft.setDepartureRunway(airport.runway);
        }

        if (!standardRouteModel.hasFixName(aircraft.rwy_dep)) {
            return ['fail', `unable, the ${standardRouteModel.name.toUpperCase()} departure not valid from Runway ${aircraft.rwy_dep}`];
        }

        // TODO: this is the wrong place for this `.toUpperCase()`
        aircraft.__fms__.followSID(route.toUpperCase());

        const readback = {
            log: `cleared to destination via the ${sidId} departure, then as filed`,
            say: `cleared to destination via the ${standardRouteModel.name} departure, then as filed`
        };

        return ['ok', readback];
    }

    /**
     * @for AircraftCommander
     * @method runSTAR
     * @param data {array<string>} a string representation of the STAR, ex: `QUINN.BDEGA2.KSFO`
     */
    runSTAR(aircraft, data) {
        const routeModel = new RouteModel(data[0]);
        const airport = this._airportController.airport_get();
        const { name: starName } = this._navigationLibrary.starCollection.findRouteByIcao(routeModel.procedure);

        if (aircraft.category !== FLIGHT_CATEGORY.ARRIVAL) {
            return ['fail', 'unable to fly STAR, we are a departure!'];
        }

        // TODO: the data[0].length check might not be needed. this is covered via the CommandParser when
        // this method runs as the result of a command.
        if (data[0].length === 0 || !this._navigationLibrary.starCollection.hasRoute(routeModel.procedure)) {
            return ['fail', 'STAR name not understood'];
        }

        aircraft.__fms__.followSTAR(routeModel.routeCode);

        // TODO: casing may be an issue here.
        const readback = {
            log: `cleared to the ${airport.name} via the ${routeModel.procedure} arrival`,
            say: `cleared to the ${airport.name} via the ${starName.toUpperCase()} arrival`
        };

        return ['ok', readback];
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
         // capitalize everything
        data = data[0].toUpperCase();
        let worked = true;
        // TODO: replace with routeStringFormatHelper
        const route = aircraft.__fms__.formatRoute(data);

        if (worked && route) {
            // Add to fms
            worked = aircraft.__fms__.customRoute(route, false);
        }

        if (!route || !data || data.indexOf(' ') > -1) {
            worked = false;
        }

        // Build the response
        if (worked) {
            const readback = {
                log: `rerouting to :${aircraft.__fms__.fp.route.join(' ')}`,
                say: 'rerouting as requested'
            };

            return ['ok', readback];
        }

        const readback = {
            log: `your route "${data}" is invalid!`,
            say: 'that route is invalid!'
        };

        return ['fail', readback];
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
        // TODO: capitalize everything?
        data = data[0].toUpperCase();
        let worked = true;
        const route = aircraft.__fms__.formatRoute(data);

        if (worked && route) {
            // Reset fms
            worked = aircraft.__fms__.customRoute(route, true);
        }

        // TODO: what exactly are we checking here?
        if (!route || !data || data.indexOf(' ') > -1) {
            worked = false;
        }

        // Build the response
        if (worked) {
            const readback = {
                log: `rerouting to: ${aircraft.__fms__.fp.route.join(' ')}`,
                say: 'rerouting as requested'
            };

            return ['ok', readback];
        }

        const readback = {
            log: `your route "${data}" is invalid!`,
            say: 'that route is invalid!'
        };

        return ['fail', readback];
    }

    /**
     * @for AircraftCommander
     * @method runTaxi
     * @param data
     */
    runTaxi(aircraft, data) {
        // TODO: all this if logic should be simplified or abstracted
        if (aircraft.category !== FLIGHT_CATEGORY.DEPARTURE) {
            return ['fail', 'inbound'];
        }

        if (aircraft.mode === FLIGHT_MODES.TAXI) {
            return ['fail', `already taxiing to ${radio_runway(aircraft.rwy_dep)}`];
        }

        if (aircraft.mode === FLIGHT_MODES.WAITING) {
            return ['fail', 'already waiting'];
        }

        if (aircraft.mode !== FLIGHT_MODES.APRON) {
            return ['fail', 'wrong mode'];
        }

        // Set the runway to taxi to
        if (data[0]) {
            if (this._airportController.airport_get().getRunway(data[0].toUpperCase())) {
                aircraft.setDepartureRunway(data[0].toUpperCase());
            } else {
                return ['fail', `no runway ${data[0].toUpperCase()}`];
            }
        }

        // Start the taxi
        aircraft.taxi_start = this._gameController.game_time();
        const runway = this._airportController.airport_get().getRunway(aircraft.rwy_dep);

        runway.addAircraftToQueue(aircraft);
        aircraft.mode = FLIGHT_MODES.TAXI;

        const readback = {
            log: `taxi to runway ${runway.name}`,
            say: `taxi to runway ${radio_runway(runway.name)}`
        };

        return ['ok', readback];
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
