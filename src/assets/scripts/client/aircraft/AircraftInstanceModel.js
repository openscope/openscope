/* eslint-disable max-len */
import $ from 'jquery';
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _has from 'lodash/has';
import _isEqual from 'lodash/isEqual';
import _isNaN from 'lodash/isNaN';
import _isNil from 'lodash/isNil';
import _isString from 'lodash/isString';
import _map from 'lodash/map';
import _without from 'lodash/without';
import AircraftFlightManagementSystem from './FlightManagementSystem/AircraftFlightManagementSystem';
import AircraftStripView from './AircraftStripView';
import Waypoint from './FlightManagementSystem/Waypoint';
import RouteModel from '../airport/Route/RouteModel';
import { speech_say } from '../speech';
import { tau, radians_normalize, angle_offset } from '../math/circle';
import { round, abs, sin, cos, extrapolate_range_clamp, clamp } from '../math/core';
import { distance2d } from '../math/distance';
import { getOffset } from '../math/flightMath';
import {
    vlen,
    vradial,
    vsub,
    vadd,
    vscale,
    vturn,
    distance_to_poly,
    point_to_mpoly,
    point_in_poly,
    point_in_area
} from '../math/vector';
import {
    radio_cardinalDir_names,
    digits_decimal,
    groupNumbers,
    radio_runway,
    radio_heading,
    radio_spellOut,
    radio_altitude,
    radio_trend,
    getCardinalDirection
} from '../utilities/radioUtilities';
import { km, radiansToDegrees, degreesToRadians, heading_to_string } from '../utilities/unitConverters';
import {
    FLIGHT_MODES,
    FLIGHT_CATEGORY,
    WAYPOINT_NAV_MODE,
    FP_LEG_TYPE
} from '../constants/aircraftConstants';
import { SELECTORS } from '../constants/selectors';
import { GAME_EVENTS } from '../game/GameController';

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
 * @property FLIGHT_RULES
 * @type {Object}
 * @final
 */
const FLIGHT_RULES = {
    VFR: 'vfr',
    IFR: 'ifr'
};

/**
 * Each simulated aircraft in the game. Contains a model, fms, and conflicts.
 *
 * @class AircraftInstanceModel
 */
export default class Aircraft {
    /**
     * @for AircraftInstanceModel
     * @constructor
     * @param options {object}
     */
    constructor(options = {}) {
        /* eslint-disable no-multi-spaces*/
        this.eid          = prop.aircraft.list.length;  // entity ID
        this.position     = [0, 0];     // Aircraft Position, in km, relative to airport position
        this.model        = null;       // Aircraft type
        this.airline      = '';         // Airline Identifier (eg. 'AAL')
        this.callsign     = '';         // Flight Number ONLY (eg. '551')
        this.heading      = 0;          // Magnetic Heading
        this.altitude     = 0;          // Altitude, ft MSL
        this.speed        = 0;          // Indicated Airspeed (IAS), knots
        this.groundSpeed  = 0;          // Groundspeed (GS), knots
        this.groundTrack  = 0;          //
        this.ds           = 0;          //
        this.takeoffTime  = 0;          //
        this.rwy_dep      = null;       // Departure Runway (to use, currently using, or used)
        this.rwy_arr      = null;       // Arrival Runway (to use, currently using, or used)
        this.approachOffset = 0;        // Distance laterally from the approach path
        this.approachDistance = 0;      // Distance longitudinally from the threshold
        this.radial       = 0;          // Angle from airport center to aircraft
        this.distance     = 0;          //
        this.destination  = null;       // Destination they're flying to
        this.trend        = 0;          // Indicator of descent/level/climb (1, 0, or 1)
        this.history      = [];         // Array of previous positions
        this.restricted   = { list: [] };
        this.notice       = false;      // Whether aircraft
        this.warning      = false;      //
        this.hit          = false;      // Whether aircraft has crashed
        this.taxi_next    = false;      //
        this.taxi_start   = 0;          //
        this.taxi_time    = 3;          // Time spent taxiing to the runway. *NOTE* this should be INCREASED to around 60 once the taxi vs LUAW issue is resolved (#406)
        this.rules        = FLIGHT_RULES.IFR;      // Either IFR or VFR (Instrument/Visual Flight Rules)
        this.inside_ctr   = false;      // Inside ATC Airspace
        this.datablockDir = -1;         // Direction the data block points (-1 means to ignore)
        this.conflicts    = {};         // List of aircraft that MAY be in conflict (bounding box)
        this.terrain_ranges = false;
        // FIXME: change name, and update refs in `InputController`. perhaps change to be a ref to the AircraftStripView class instead of directly accessing the html?
        this.aircraftStripView = null;
        this.$html = null;

        this.$strips = $(SELECTORS.DOM_SELECTORS.STRIPS);
        /* eslint-enable multi-spaces*/

        // Set to true when simulating future movements of the aircraft
        // Should be checked before updating global state such as score
        // or HTML.
        this.projected = false;
        this.position_history = [];

        this.category = options.category; // 'arrival' or 'departure'
        this.mode = FLIGHT_MODES.CRUISE;

        /*
         * the following diagram illustrates all allowed mode transitions:
         *
         * apron -> taxi -> waiting -> takeoff -> cruise <-> landing
         *   ^                                       ^
         *   |                                       |
         * new planes with                      new planes with
         * category 'departure'                 category 'arrival'
         */

        // Initialize the FMS
        this.fms = new AircraftFlightManagementSystem({
            aircraft: this,
            model: options.model
        });

        // target represents what the pilot makes of the tower's commands. It is
        // most important when the plane is in a 'guided' situation, that is it is
        // not given a heading directly, but has a fix or is following an ILS path
        this.target = {
            heading: null,
            turn: null,
            altitude: 0,
            expedite: false,
            speed: 0
        };

        this.emergency = {};
        this.takeoffTime = options.category === FLIGHT_CATEGORY.ARRIVAL
            ? window.gameController.game_time()
            : null;


        this.buildCurrentTerrainRanges();
        this.buildRestrictedAreaLinks();
        this.assignInitialRunway(options);
        this.parse(options);
        this.updateFmsAfterInitialLoad(options);
        this.createStrip();
        this.updateStrip();
    }

    /**
     * @for AircraftInstanceModel
     * @method buildCurrentTerrainRanges
     */
    buildCurrentTerrainRanges() {
        const terrain = _get(prop, 'airport.current.terrain', null);

        if (!terrain) {
            return;
        }

        this.terrain_ranges = {};
        this.terrain_level = 0;

        _forEach(terrain, (terrainRange, k) => {
            this.terrain_ranges[k] = {};

            _forEach(terrainRange, (range, j) => {
                this.terrain_ranges[k][j] = Infinity;
            });
        });
    }

    /**
     * Set up links to restricted areas
     *
     * @for AircraftInstanceModel
     * @method buildRestrictedAreaLinks
     */
    buildRestrictedAreaLinks() {
        const restrictedAreas = prop.airport.current.restricted_areas;

        _forEach(restrictedAreas, (area) => {
            this.restricted.list.push({
                data: area,
                range: null,
                inside: false
            });
        });
    }

    /**
     * Initial Runway Assignment
     *
     * @for AircraftInstanceModel
     * @method assignInitialRunway
     * @param options {object}
     */
    assignInitialRunway(options) {
        if (options.category === FLIGHT_CATEGORY.ARRIVAL) {
            this.setArrivalRunway(window.airportController.airport_get().runway);
        } else if (options.category === FLIGHT_CATEGORY.DEPARTURE) {
            this.setDepartureRunway(window.airportController.airport_get().runway);
        }
    }

    parse(data) {
        this.position = _get(data, 'position', this.position);
        this.model = _get(data, 'model', this.model);
        this.airline = _get(data, 'airline', this.airline);
        this.callsign = _get(data, 'callsign', this.callsign);
        this.category = _get(data, 'category', this.category);
        this.heading = _get(data, 'heading', this.heading);
        this.altitude = _get(data, 'altitude', this.altitude);
        this.speed = _get(data, 'speed', this.speed);
    }

    updateFmsAfterInitialLoad(data) {
        if (this.category === FLIGHT_CATEGORY.ARRIVAL) {
            if (data.waypoints.length > 0) {
                this.setArrivalWaypoints(data.waypoints);
            }

            this.destination = data.destination;
            this.setArrivalRunway(window.airportController.airport_get(this.destination).runway);
        } else if (this.category === FLIGHT_CATEGORY.DEPARTURE) {
            const airport = window.airportController.airport_get();
            this.mode = FLIGHT_MODES.APRON;
            this.destination = data.destination;
            this.setDepartureRunway(airport.runway);
            this.altitude = airport.position.elevation;
            this.speed = 0;
        }

        // TODO: combine these two to asingle constant
        if (data.heading) {
            this.fms.setCurrent({ heading: data.heading });
        }

        if (data.altitude) {
            this.fms.setCurrent({ altitude: data.altitude });
        }

        const speed = _get(data, 'speed', this.model.speed.cruise);
        this.fms.setCurrent({ speed: speed });

        if (data.route) {
            const route = this.fms.formatRoute(data.route);

            this.fms.customRoute(route, true);
            this.fms.descendViaSTAR();
        }

        if (data.nextFix) {
            this.fms.skipToFix(data.nextFix);
        }
    }

    setArrivalWaypoints(waypoints) {
        // add arrival fixes to fms
        for (let i = 0; i < waypoints.length; i++) {
            this.fms.appendLeg({
                type: 'fix',
                route: waypoints[i].fix
            });
        }

        // TODO: this could be another class method for FMS
        if (this.fms.currentWaypoint.navmode === WAYPOINT_NAV_MODE.HEADING) {
            // aim aircraft at airport
            this.fms.setCurrent({
                heading: vradial(this.position) + Math.PI
            });
        }

        if (this.fms.legs.length > 0) {
            // go to the first fix!
            this.fms.nextWaypoint();
        }
    }

    setArrivalRunway(rwy) {
        this.rwy_arr = rwy;

        // Update the assigned STAR to use the fixes for the specified runway, if they exist
    }

    setDepartureRunway(rwy) {
        this.rwy_dep = rwy;

        // Update the assigned SID to use the portion for the new runway
        const leg = this.fms.currentLeg;

        // TODO: this should return early
        // TODO: use existing enumeration for `sid`
        if (leg.type === 'sid') {
            const a = _map(leg.waypoints, (v) => v.altitude);
            const cvs = !a.every((v) => v === window.airportController.airport_get().initial_alt);
            this.fms.followSID(leg.route.routeCode);

            if (cvs) {
                this.fms.climbViaSID();
            }
        }
    }

    cleanup() {
        this.$html.remove();
    }

    /**
     * Create the aircraft's flight strip and add to strip bay
     */
    createStrip() {
        this.aircraftStripView = new AircraftStripView(
            this.getCallsign(),
            this
        );

        this.$html = this.aircraftStripView.$element;
        // Add the strip to the html
        const scrollPos = this.$strips.scrollTop();
        this.$strips.prepend(this.aircraftStripView.$element);
        // shift scroll down one strip's height
        this.$strips.scrollTop(scrollPos + this.aircraftStripView.height);

        // Determine whether or not to show the strip in our bay
        if (this.category === FLIGHT_CATEGORY.ARRIVAL) {
            this.aircraftStripView.hide();
        }

        if (this.category === FLIGHT_CATEGORY.DEPARTURE) {
            // TODO: does this have anything to do with the aircraft strip? if not this should live somewhere else.
            this.inside_ctr = true;
        }
    }

    // Called when the aircraft crosses the center boundary (ie, leaving our airspace)
    /**
     * @for AircraftInstanceModel
     * @method crossBoundary
     * @param inbound {}
     */
    crossBoundary(inbound) {
        this.inside_ctr = inbound;

        if (this.projected) {
            return;
        }

        // Crossing into the center
        if (inbound) {
            this.showStrip();
            this.callUp();
        } else {
            // leaving airspace
            this.onAirspaceExit();
        }
    }

    /**
     * @for AircraftInstanceModel
     * @method onAirspaceExit
     */
    onAirspaceExit() {
        if (this.category === FLIGHT_CATEGORY.ARRIVAL) {
            this.arrivalExit();
        }

        // Leaving the facility's airspace
        this.hideStrip();

        // TODO: is this supposed to be `typeof === 'number'` or is destination a literal string 'number' here?
        if (this.destination === 'number') {
            // an aircraft was given a radial  clearance
            if (this.isHeadingInsideDepartureWindow()) {
                this.radioCall('switching to center, good day', 'dep');
                window.gameController.events_recordNew(GAME_EVENTS.DEPARTURE);
            } else {
                this.radioCall('leaving radar coverage outside departure window', 'dep', true);
                window.gameController.events_recordNew(GAME_EVENTS.NOT_CLEARED_ON_ROUTE);
            }
        } else {
            // following a Standard Instrument Departure procedure
            // Find the desired SID exitPoint
            let exit;

            // TODO: if we just need the last fix in the list, why loop through all the legs?
            _forEach(this.fms.legs, (leg) => {
                if (leg.type === 'sid') {
                    // TODO: use lodash `_last()` here
                    exit = leg.waypoints[leg.waypoints.length - 1].fix;
                    return;
                }
            });

            // Verify aircraft was cleared to departure fix
            const ok = this.fms.hasWaypoint(exit);

            if (ok) {
                this.radioCall('switching to center, good day', 'dep');
                window.gameController.events_recordNew(GAME_EVENTS.DEPARTURE);
            } else {
                // TODO: this is a temporary fix for `release/3.0.0`. this will need to be refactored
                let fmsDestination = this.fms.fp.route[1].indexOf('.') !== -1
                    ? this.fms.fp.route[1].split('.')[1]
                    : this.fms.fp.route[1];

                // TODO: add helper method to FMS class for this
                this.radioCall(`leaving radar coverage without being cleared to ${fmsDestination}`, 'dep', true);
                window.gameController.events_recordNew(GAME_EVENTS.NOT_CLEARED_ON_ROUTE);
            }
        }

        this.fms.setCurrent({
            altitude: this.fms.fp.altitude,
            speed: this.model.speed.cruise
        });
    }

    /**
     * An arriving aircraft is exiting the airpsace
     *
     * @for AircraftInstanceModel
     * @method arrivalExit
     */
    arrivalExit() {
        this.radioCall('leaving radar coverage as arrival', 'app', true);
        window.gameController.events_recordNew(GAME_EVENTS.AIRSPACE_BUST);
    }

    /**
     * Is an aircraft's current heading within a specific range
     *
     * @for AircraftInstanceModel
     * @method isHeadingInsideDepartureWindow
     */
    isHeadingInsideDepartureWindow() {
        // TODO: enumerate the magic number
        // Within 5 degrees of destination heading
        return abs(this.radial - this.destination) < 0.08726;
    }

    /**
     * @for AircraftInstanceModel
     * @method matchCallsign
     * @param callsign {string}
     */
    matchCallsign(callsignToMatch) {
        if (callsignToMatch === '*') {
            return true;
        }

        return _isEqual(callsignToMatch.toUpperCase(), this.getCallsign());
    }

    // TODO: this could be a getter
    /**
     * @for AircraftInstanceModel
     * @method getCallsign
     * @return {string}
     */
    getCallsign() {
        return (this.getAirline().icao + this.callsign).toUpperCase();
    }

    // TODO: this could be a getter
    /**
     * @for AircraftInstanceModel
     * @method getAirline
     * @return {string}
     */
    getAirline() {
        return window.airlineController.airline_get(this.airline);
    }

    /**
     * @for AircraftInstanceModel
     * @method getRadioCallsign
     * @param condensed
     */
    getRadioCallsign(condensed) {
        let heavy = '';

        if (this.model.weightclass === 'H') {
            heavy = ' heavy';
        }

        if (this.model.weightclass === 'U') {
            heavy = ' super';
        }

        let callsign = this.callsign;
        if (condensed) {
            const length = 2;
            callsign = callsign.substr(callsign.length - length);
        }

        let cs = window.airlineController.airline_get(this.airline).callsign;

        if (cs === 'November') {
            cs += ` ${radio_spellOut(callsign)} ${heavy}`;
        } else {
            cs += ` ${groupNumbers(callsign, this.airline)} ${heavy}`;
        }

        return cs;
    }

    /**
     * @for AircraftInstanceModel
     * @method getClimbRate
     * @return {number}
     */
    getClimbRate() {
        const altitude = this.altitude;
        const rate = this.model.rate.climb;
        const ceiling = this.model.ceiling;
        let serviceCeilingClimbRate;
        let cr_uncorr;
        let cr_current;

        if (this.model.engines.type === 'J') {
            serviceCeilingClimbRate = 500;
        } else {
            serviceCeilingClimbRate = 100;
        }

        // TODO: enumerate the magic number
        // in troposphere
        if (this.altitude < 36152) {
            // TODO: break this assignemnt up into smaller parts and holy magic numbers! enumerate the magic numbers
            cr_uncorr = rate * 420.7 * ((1.232 * Math.pow((518.6 - 0.00356 * altitude) / 518.6, 5.256)) / (518.6 - 0.00356 * altitude));
            cr_current = cr_uncorr - (altitude / ceiling * cr_uncorr) + (altitude / ceiling * serviceCeilingClimbRate);
        } else {
            // in lower stratosphere
            // re-do for lower stratosphere
            // Reference: https://www.grc.nasa.gov/www/k-12/rocket/atmos.html
            // also recommend using graphing calc from desmos.com
            return this.model.rate.climb; // <-- NOT VALID! Just a placeholder!
        }

        return cr_current;
    }

    /**
     * @for AircraftInstanceModel
     * @method hideStrip
     */
    hideStrip() {
        this.$html.hide(600);
    }


    // TODO: move aircraftCommands to a new class
    /**
     * @for AircraftInstanceModel
     * @method runCommands
     * @param commands
     */
    runCommands(commands) {
        if (!this.inside_ctr) {
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

            let retval = this.run(command, args);

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
            const retval  = this.run(command, args);

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

            window.uiController.ui_log(`${this.getCallsign()}, ${r_log} ${response_end}`);
            speech_say([
                { type: 'callsign', content: this },
                { type: 'text', content: `${r_say} ${response_end}` }
            ]);
        }

        this.updateStrip();

        return true;
    }

    /**
     * @for AircraftInstanceModel
     * @method run
     * @param command
     * @param data
     * @return {function}
     */
    run(command, data) {
        let call_func;

        if (COMMANDS[command]) {
            call_func = COMMANDS[command];
        }

        if (!call_func) {
            return ['fail', 'not understood'];
        }

        return this[call_func](data);
    }

    /**
     * @for AircraftInstanceModel
     * @method runHeading
     * @param data
     */
    runHeading(data) {
        const airport = window.airportController.airport_get();
        const direction = data[0];
        let heading = data[1];
        const incremental = data[2];
        let amount = 0;
        let instruction;

        if (_isNaN(heading)) {
            return ['fail', 'heading not understood'];
        }

        if (incremental) {
            amount = heading;

            if (direction === 'left') {
                heading = radiansToDegrees(this.heading) - amount;
            } else if (direction === 'right') {
                heading = radiansToDegrees(this.heading) + amount;
            }
        }

        // TODO: this probably shouldn't be the AircraftInstanceModel's job. this logic should belong somewhere else.
        // Update the FMS
        let wp = this.fms.currentWaypoint;
        const leg = this.fms.currentLeg;
        const f = this.fms.following;

        if (wp.navmode === WAYPOINT_NAV_MODE.RWY) {
            this.cancelLanding();
        }

        // already being vectored or holding. Will now just change the assigned heading.
        if (wp.navmode === WAYPOINT_NAV_MODE.HEADING) {
            this.fms.setCurrent({
                altitude: wp.altitude,
                navmode: WAYPOINT_NAV_MODE.HEADING,
                heading: degreesToRadians(heading),
                speed: wp.speed,
                turn: direction,
                hold: false
            });
        } else if (wp.navmode === WAYPOINT_NAV_MODE.HOLD) {
            // in hold. Should leave the hold, and add leg for vectors
            const index = this.fms.current[0] + 1;
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
            this.fms.insertLeg({
                firstIndex: index,
                waypoints: [waypointToAdd]
            });

            // move from hold leg to vector leg.
            this.fms.nextWaypoint();
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
            leg.waypoints.splice(this.fms.current[1], 0, waypointToAdd);
        } else if (leg.route !== '[radar vectors]') {
            // needs new leg added
            if (this.fms.atLastWaypoint()) {
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

                this.fms.appendLeg({
                    waypoints: [waypointToAdd]
                });

                this.fms.nextLeg();
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

                this.fms.insertLegHere({
                    waypoints: [waypointToAdd]
                });
            }
        }

        wp = this.fms.currentWaypoint;  // update 'wp'

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
     * @for AircraftInstanceModel
     * @method runAltitude
     * @param data
     */
    runAltitude(data) {
        const altitude = data[0];
        let expedite = data[1];
        const airport = window.airportController.airport_get();

        if ((altitude == null) || isNaN(altitude)) {
            // FIXME: move this to it's own command. if expedite can be passed as a sole command it should be its own command
            if (expedite) {
                this.fms.setCurrent({ expedite: true });
                const radioTrendAltitude = radio_trend('altitude', this.altitude, this.fms.altitudeForCurrentWaypoint());

                return ['ok', `${radioTrendAltitude} ${this.fms.altitudeForCurrentWaypoint()} expedite`];
            }

            return ['fail', 'altitude not understood'];
        }

        if (this.mode === FLIGHT_MODES.LANDING) {
            this.cancelLanding();
        }

        let ceiling = airport.ctr_ceiling;
        if (window.gameController.game.option.get('softCeiling') === 'yes') {
            ceiling += 1000;
        }

        this.fms.setAll({
            // TODO: enumerate the magic numbers
            altitude: clamp(round(airport.elevation / 100) * 100 + 1000, altitude, ceiling),
            expedite: expedite
        });

        const newAltitude = this.fms.altitudeForCurrentWaypoint();
        const instruction = radio_trend('altitude', this.altitude, newAltitude);
        const readback_text = `${instruction} ${newAltitude}`;
        const readback_verbal = `${instruction} ${radio_altitude(newAltitude)}`;

        const readback = {
            log: readback_text,
            say: readback_verbal
        };

        if (expedite) {
            readback.log = `${readback_text} and expedite`;
            readback.say = `${readback_verbal} and expedite`;
        }

        return ['ok', readback];
    }

    /**
     * @for AircraftInstanceModel
     * @method runClearedAsFiled
     * @return {array}
     */
    runClearedAsFiled() {
        if (!this.runSID([this.destination])) {
            return [true, 'unable to clear as filed'];
        }

        const airport = window.airportController.airport_get();
        const { name: procedureName } = airport.sidCollection.findRouteByIcao(this.destination);
        const readback = {};

        readback.log = `cleared to destination via the ${this.destination} departure, then as filed. Climb and ` +
            `maintain ${airport.initial_alt}, expect ${this.fms.fp.altitude} 10 minutes after departure `;
        readback.say = `cleared to destination via the ${procedureName} ` +
            `departure, then as filed. Climb and maintain ${radio_altitude(airport.initial_alt)}, ` +
            `expect ${radio_altitude(this.fms.fp.altitude)}, ${radio_spellOut('10')} minutes after departure'`;

        return ['ok', readback];
    }

    /**
     * @for AircraftInstanceModel
     * @method runClimbViaSID
     */
    runClimbViaSID() {
        if (this.fms.currentLeg.type !== FP_LEG_TYPE.SID || !this.fms.climbViaSID()) {
            const isWarning = true;

            window.uiController.ui_log(`${this.getCallsign()} unable to climb via SID`, isWarning);

            return;
        }

        const airport = window.airportController.airport_get();
        const { name: procedureName } = airport.sidCollection.findRouteByIcao(this.fms.currentLeg.route.procedure);
        const readback = {
            log: `climb via the ${this.fms.currentLeg.route.procedure} departure`,
            say: `climb via the ${procedureName} departure`
        };

        return ['ok', readback];
    }

    /**
     * @for AircraftInstanceModel
     * @method runDescendViaSTAR
     * @param data
     * @return {boolean|undefined}
     */
    runDescendViaSTAR() {
        if (!this.fms.descendViaSTAR() || !this.fms.following.star) {
            const isWarning = true;
            window.uiController.ui_log(`${this.getCallsign()}, unable to descend via STAR`, isWarning);

            return;
        }

        const airport = window.airportController.airport_get();
        const { name: procedureName } = airport.starCollection.findRouteByIcao(this.fms.currentLeg.route.procedure);
        const readback = {
            log: `descend via the ${this.fms.following.star} arrival`,
            say: `descend via the ${procedureName} arrival`
        };

        return ['ok', readback];
    }

    /**
     * @for AircraftInstanceModel
     * @method runSpeed
     * @param data
     */
    runSpeed(data) {
        const speed = data[0];

        if (_isNaN(speed)) {
            return ['fail', 'speed not understood'];
        }

        const clampedSpeed = clamp(this.model.speed.min, speed, this.model.speed.max);
        this.fms.setAll({ speed: clampedSpeed });

        const radioTrendSpeed = radio_trend('speed', this.speed, this.fms.currentWaypoint.speed);
        const readback = {
            log: `${radioTrendSpeed} ${this.fms.currentWaypoint.speed}`,
            say: `${radioTrendSpeed} ${radio_spellOut(this.fms.currentWaypoint.speed)}`
        };

        return ['ok', readback];
    }

    /**
     * @for AircraftInstanceModel
     * @method runHold
     * @param data
     */
    runHold(data) {
        const airport = window.airportController.airport_get();
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
            holdFixLocation = airport.getFixPosition(holdFix);

            if (!holdFixLocation) {
                return ['fail', `unable to find fix ${holdFix}`];
            }
        }

        if (this.isTakeoff() && !holdFix) {
            return ['fail', 'where do you want us to hold?'];
        }

        // Determine whether or not to enter the hold from present position
        if (holdFix) {
            // holding over a specific fix (currently only able to do so on inbound course)
            inboundHdg = vradial(vsub(this.position, holdFixLocation));

            if (holdFix !== this.fms.currentWaypoint.fix) {
                // not yet headed to the hold fix
                this.fms.insertLegHere({
                    type: 'fix',
                    route: '[GPS/RNAV]',
                    waypoints: [
                        // proceed direct to holding fix
                        new Waypoint(
                            {
                                fix: holdFix,
                                altitude: this.fms.altitudeForCurrentWaypoint(),
                                speed: this.fms.currentWaypoint.speed
                            },
                            airport
                        ),
                        // then enter the hold
                        new Waypoint(
                            {
                                navmode: WAYPOINT_NAV_MODE.HOLD,
                                speed: this.fms.currentWaypoint.speed,
                                altitude: this.fms.altitudeForCurrentWaypoint(),
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
                this.fms.appendWaypoint({
                    navmode: WAYPOINT_NAV_MODE.HOLD,
                    speed: this.fms.currentWaypoint.speed,
                    altitude: this.fms.altitudeForCurrentWaypoint(),
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
            holdFixLocation = this.position; // make a/c hold over their present position
            inboundHdg = this.heading;

            // TODO: these aren't `Waypoints` and they should be
            this.fms.insertLegHere({
                type: 'fix',
                waypoints: [
                    { // document the present position as the 'fix' we're holding over
                        navmode: WAYPOINT_NAV_MODE.FIX,
                        fix: '[custom]',
                        location: holdFixLocation,
                        altitude: this.fms.altitudeForCurrentWaypoint(),
                        speed: this.fms.currentWaypoint.speed
                    },
                    { // Force the initial turn to outbound heading when entering the hold
                        navmode: WAYPOINT_NAV_MODE.HOLD,
                        speed: this.fms.currentWaypoint.speed,
                        altitude: this.fms.altitudeForCurrentWaypoint(),
                        fix: null,
                        hold: {
                            fixName: holdFix,
                            fixPos: holdFixLocation,
                            dirTurns: dirTurns,
                            legLength: legLength,
                            inboundHdg: inboundHdg,
                            timer: null
                        }
                    }
                ]
            });
        }

        // TODO: abstract to method `.getInboundCardinalDirection()`
        const inboundDir = radio_cardinalDir_names[getCardinalDirection(radians_normalize(inboundHdg + Math.PI)).toLowerCase()];

        if (holdFix) {
            return ['ok', `proceed direct ${holdFix} and hold inbound, ${dirTurns} turns, ${legLength} legs`];
        }

        return ['ok', `hold ${inboundDir} of present position, ${dirTurns} turns, ${legLength} legs`];
    }

    /**
     * @for AircraftInstanceModel
     * @method runDirect
     * @param data
     */
    runDirect(data) {
        const fixname = data[0].toUpperCase();
        // TODO replace with FixCollection
        const fix = window.airportController.airport_get().getFixPosition(fixname);

        if (!fix) {
            return ['fail', `unable to find fix called ${fixname}`];
        }

        // remove intermediate fixes
        if (this.mode === FLIGHT_MODES.TAKEOFF) {
            this.fms.skipToFix(fixname);
        } else if (!this.fms.skipToFix(fixname)) {
            return ['fail', `${fixname} is not in our flightplan`];
        }

        return ['ok', `proceed direct ${fixname}`];
    }

    runFix(data) {
        let last_fix;
        let fail;
        const fixes = _map(data, (fixname) => {
            // TODO: this may beed to be the FixCollection
            const fix = window.airportController.airport_get().getFixPosition(fixname);

            if (!fix) {
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
            this.fms.insertLegHere({ type: 'fix', route: fixes[i] });
        }

        if (this.mode !== FLIGHT_MODES.WAITING &&
            this.mode !== FLIGHT_MODES.TAKEOFF &&
            this.mode !== FLIGHT_MODES.APRON &&
            this.mode !== FLIGHT_MODES.TAXI
        ) {
            this.cancelLanding();
        }

        return ['ok', `proceed direct ${fixes.join(', ')}`];
    }

    /**
     * @for AircraftInstanceModel
     * @method runFlyPresentHeading
     * @param data
     */
    runFlyPresentHeading(data) {
        this.cancelFix();
        this.runHeading([null, radiansToDegrees(this.heading)]);

        return ['ok', 'fly present heading'];
    }

    /**
     * @for AircraftInstanceModel
     * @method runSayRoute
     * @param data
     */
    runSayRoute(data) {
        return ['ok', {
            log: `route: ${this.fms.fp.route.join(' ')}`,
            say: 'here\'s our route'
        }];
    }

    /**
     * @for AircraftInstanceModel
     * @method runSID
     */
    runSID(data) {
        const airport = window.airportController.airport_get();
        const { sidCollection } = airport;
        const sidId = data[0];
        const standardRouteModel = sidCollection.findRouteByIcao(sidId);
        const exit = airport.getSIDExitPoint(sidId);
        // TODO: perhaps this should use the `RouteModel`?
        const route = `${airport.icao}.${sidId}.${exit}`;

        if (_isNil(standardRouteModel)) {
            return ['fail', 'SID name not understood'];
        }

        if (this.category !== FLIGHT_CATEGORY.DEPARTURE) {
            return ['fail', 'unable to fly SID, we are an inbound'];
        }

        if (!this.rwy_dep) {
            this.setDepartureRunway(airportController.airport_get().runway);
        }

        if (!standardRouteModel.hasFixName(this.rwy_dep)) {
            return ['fail', `unable, the ${standardRouteModel.name} departure not valid from Runway ${this.rwy_dep}`];
        }

        // TODO: this is the wrong place for this `.toUpperCase()`
        this.fms.followSID(route.toUpperCase());

        const readback = {
            log: `cleared to destination via the ${sidId} departure, then as filed`,
            say: `cleared to destination via the ${standardRouteModel.name} departure, then as filed`
        };

        return ['ok', readback];
    }

    /**
     * @for AircraftInstanceModel
     * @method runSTAR
     * @param data {array<string>} a string representation of the STAR, ex: `QUINN.BDEGA2.KSFO`
     */
    runSTAR(data) {
        const routeModel = new RouteModel(data[0]);
        const airport = window.airportController.airport_get();
        const { name: starName } = airport.starCollection.findRouteByIcao(routeModel.procedure);

        if (this.category !== FLIGHT_CATEGORY.ARRIVAL) {
            return ['fail', 'unable to fly STAR, we are a departure!'];
        }

        // TODO: the data[0].length check might not be needed. this is covered via the CommandParser when
        // this method runs as the result of a command.
        if (data[0].length === 0 || !airport.starCollection.hasRoute(routeModel.procedure)) {
            return ['fail', 'STAR name not understood'];
        }

        this.fms.followSTAR(routeModel.routeCode);

        // TODO: casing may be an issue here.
        const readback = {
            log: `cleared to the ${airport.name} via the ${routeModel.procedure} arrival`,
            say: `cleared to the ${airport.name} via the ${starName} arrival`
        };

        return ['ok', readback];
    }

    /**
     * @for AircraftInstanceModel
     * @method runMoveDataBlock
     * @param data
     */
    runMoveDataBlock(dir) {
        // TODO: what do all these numbers mean?
        const positions = { 8: 360, 9: 45, 6: 90, 3: 135, 2: 180, 1: 225, 4: 270, 7: 315, 5: 'ctr' };

        if (!_has(positions, dir[0])) {
            return;
        }

        this.datablockDir = positions[dir[0]];
    }

    /**
     * Adds a new Leg to fms with a user specified route
     * Note: See notes on 'runReroute' for how to format input for this command
     *
     * @for AircraftInstanceModel
     * @method runRoute
     * @param data
     */
    runRoute(data) {
         // capitalize everything
        data = data[0].toUpperCase();
        let worked = true;
        const route = this.fms.formatRoute(data);

        if (worked && route) {
            // Add to fms
            worked = this.fms.customRoute(route, false);
        }

        if (!route || !data || data.indexOf(' ') > -1) {
            worked = false;
        }

        // Build the response
        if (worked) {
            const readback = {
                log: `rerouting to :${this.fms.fp.route.join(' ')}`,
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
      * @for AircraftInstanceModel
      * @method runReroute
      * @param data
      */
    runReroute(data) {
        // TODO: capitalize everything?
        data = data[0].toUpperCase();
        let worked = true;
        const route = this.fms.formatRoute(data);

        if (worked && route) {
            // Reset fms
            worked = this.fms.customRoute(route, true);
        }

        // TODO: what exactly are we checking here?
        if (!route || !data || data.indexOf(' ') > -1) {
            worked = false;
        }

        // Build the response
        if (worked) {
            const readback = {
                log: `rerouting to: ${this.fms.fp.route.join(' ')}`,
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
     * @for AircraftInstanceModel
     * @method runTaxi
     * @param data
     */
    runTaxi(data) {
        // TODO: all this if logic should be simplified or abstracted
        if (this.category !== FLIGHT_CATEGORY.DEPARTURE) {
            return ['fail', 'inbound'];
        }

        if (this.mode === FLIGHT_MODES.TAXI) {
            return ['fail', `already taxiing to ${radio_runway(this.rwy_dep)}`];
        }

        if (this.mode === FLIGHT_MODES.WAITING) {
            return ['fail', 'already waiting'];
        }

        if (this.mode !== FLIGHT_MODES.APRON) {
            return ['fail', 'wrong mode'];
        }

        // Set the runway to taxi to
        if (data[0]) {
            if (window.airportController.airport_get().getRunway(data[0].toUpperCase())) {
                this.setDepartureRunway(data[0].toUpperCase());
            } else {
                return ['fail', `no runway ${data[0].toUpperCase()}`];
            }
        }

        // Start the taxi
        this.taxi_start = window.gameController.game_time();
        const runway = window.airportController.airport_get().getRunway(this.rwy_dep);

        runway.addAircraftToQueue(this);
        this.mode = FLIGHT_MODES.TAXI;

        const readback = {
            log: `taxi to runway ${runway.name}`,
            say: `taxi to runway ${radio_runway(runway.name)}`
        };

        return ['ok', readback];
    }

    /**
     * @for AircraftInstanceModel
     * @method runTakeoff
     * @param data
     */
    runTakeoff(data) {
        // TODO: all this if logic should be simplified or abstracted
        if (this.category !== 'departure') {
            return ['fail', 'inbound'];
        }

        if (!this.isOnGround()) {
            return ['fail', 'already airborne'];
        }
        if (this.mode === FLIGHT_MODES.APRON) {
            return ['fail', 'unable, we\'re still in the parking area'];
        }
        if (this.mode === FLIGHT_MODES.TAXI) {
            return ['fail', `taxi to runway ${radio_runway(this.rwy_dep)} not yet complete`];
        }
        if (this.mode === FLIGHT_MODES.TAKEOFF) {
            // FIXME: this is showing immediately after a to clearance.
            return ['fail', 'already taking off'];
        }

        if (this.fms.altitudeForCurrentWaypoint() <= 0) {
            return ['fail', 'no altitude assigned'];
        }

        const runway = window.airportController.airport_get().getRunway(this.rwy_dep);

        if (runway.isAircraftInQueue(this)) {
            if (runway.positionOfAircraftInQueue(this) === 0) {
                runway.removeAircraftFromQueue(this);
                this.mode = FLIGHT_MODES.TAKEOFF;
                this.scoreWind('taking off');
                this.takeoffTime = window.gameController.game_time();

                if (this.fms.currentWaypoint.speed == null) {
                    this.fms.setCurrent({ speed: this.model.speed.cruise });
                }

                const wind = window.airportController.airport_get().getWind();
                const wind_dir = round(radiansToDegrees(wind.angle));
                const readback = {
                    // TODO: the wind_dir calculation should be abstracted
                    log: `wind ${round(wind_dir / 10) * 10} ${round(wind.speed)}, runway ${this.rwy_dep}, cleared for takeoff`,
                    say: `wind ${radio_spellOut(round(wind_dir / 10) * 10)} at ${radio_spellOut(round(wind.speed))}, runway ${radio_runway(this.rwy_dep)}, cleared for takeoff`
                };

                return ['ok', readback];
            }

            const numberInRunwayQueue = runway.positionOfAircraftInQueue(this) + 1;

            return ['fail', `we are actually number ${numberInRunwayQueue} for runway ${runway.name}`];
        }

        return ['fail', `we are not waiting at runway ${runway.name}`];
    }

    runLanding(data) {
        const variant = data[0];
        const runway = window.airportController.airport_get().getRunway(data[1]);

        if (!runway) {
            return ['fail', `there is no runway ${radio_runway(data[1])}`];
        }

        this.setArrivalRunway(data[1].toUpperCase());
        // tell fms to follow ILS approach
        this.fms.followApproach('ils', this.rwy_arr, variant);

        const readback = {
            log: `cleared ILS runway ${this.rwy_arr} approach`,
            say: `cleared ILS runway ${radio_runway(this.rwy_arr)} approach`
        };

        return ['ok', readback];
    }

    /**
     * @for AircraftInstanceModel
     * @method runAbort
     * @param data
     */
    runAbort(data) {
        // TODO: these ifs on `mode` should be converted to a switch
        if (this.mode === FLIGHT_MODES.TAXI) {
            this.mode = FLIGHT_MODES.APRON;
            this.taxi_start = 0;

            console.log('aborted taxi to runway');

            const isWarning = true;
            window.uiController.ui_log(`${this.getCallsign()} aborted taxi to runway`, isWarning);

            return ['ok', 'taxiing back to terminal'];
        } else if (this.mode === FLIGHT_MODES.WAITING) {
            return ['fail', 'unable to return to the terminal'];
        } else if (this.mode === FLIGHT_MODES.LANDING) {
            this.cancelLanding();

            const readback = {
                log: `go around, fly present heading, maintain ${this.fms.altitudeForCurrentWaypoint()}`,
                say: `go around, fly present heading, maintain ${radio_altitude(this.fms.altitudeForCurrentWaypoint())}`
            };

            return ['ok', readback];
        } else if (this.mode === FLIGHT_MODES.CRUISE && this.fms.currentWaypoint.navmode === WAYPOINT_NAV_MODE.RWY) {
            this.cancelLanding();

            const readback = {
                log: `cancel approach clearance, fly present heading, maintain ${this.fms.altitudeForCurrentWaypoint()}`,
                say: `cancel approach clearance, fly present heading, maintain ${radio_altitude(this.fms.altitudeForCurrentWaypoint())}`
            };

            return ['ok', readback];
        } else if (this.mode === FLIGHT_MODES.CRUISE && this.fms.currentWaypoint.navmode === WAYPOINT_NAV_MODE.FIX) {
            this.cancelFix();

            if (this.category === FLIGHT_CATEGORY.ARRIVAL) {
                return ['ok', 'fly present heading, vector to final approach course'];
            } else if (this.category === 'departure') {
                return ['ok', 'fly present heading, vector for entrail spacing'];
            }
        }

        // modes 'apron', 'takeoff', ('cruise' for some navmodes)
        return ['fail', 'unable to abort'];
    }

    // FIXME: is this in use?
    /**
     * @for AircraftInstanceModel
     * @method runDebug
     */
    runDebug() {
        window.aircraft = this;
        return ['ok', { log: 'in the console, look at the variable &lsquo;aircraft&rsquo;', say: '' }];
    }

    // FIXME: is this in use?
    /**
     * @for AircraftInstanceModel
     * @method runDelete
     */
    runDelete() {
        window.aircraftController.aircraft_remove(this);
    }

    // TODO: move to `fms.cancelFix()`
    /**
     * @for AircraftInstanceModel
     * @method cancelFix
     */
    cancelFix() {
        // TODO: this logic could be simplified. do an early return instead of wrapping the entire function in an if.
        if (this.fms.currentWaypoint.navmode === WAYPOINT_NAV_MODE.FIX) {
            const curr = this.fms.currentWaypoint;

            this.fms.appendLeg({
                altitude: curr.altitude,
                navmode: WAYPOINT_NAV_MODE.HEADING,
                heading: this.heading,
                speed: curr.speed
            });

            this.fms.nextLeg();
            this.updateStrip();

            return true;
        }

        return false;
    }

    /**
     * @for AircraftInstanceModel
     * @method cancelLanding
     */
    cancelLanding() {
        // TODO: this logic could be simplified. do an early return instead of wrapping the entire function in an if.
        if (this.fms.currentWaypoint.navmode === WAYPOINT_NAV_MODE.RWY) {
            const runway = window.airportController.airport_get().getRunway(this.rwy_arr);

            if (this.mode === FLIGHT_MODES.LANDING) {
                // TODO: enumerate the magic numbers
                this.fms.setCurrent({
                    altitude: Math.max(2000, round((this.altitude / 1000)) * 1000),
                    heading: runway.angle
                });
            }

            this.fms.setCurrent({
                navmode: WAYPOINT_NAV_MODE.HEADING,
                runway: null
            });

            this.mode = FLIGHT_MODES.CRUISE;
            this.updateStrip();

            return true;
        }

        this.fms.setCurrent({ runway: null });

        return false;
    }

    // FIXME: is this method still in use?
    /**
     * @for AircraftInstanceModel
     * @method pushHistory
     */
    pushHistory() {
        this.history.push([this.position[0], this.position[1]]);

        if (this.history.length > 10) {
            this.history.splice(0, this.history.length - 10);
        }
    }

    /**
     * @for AircraftInstanceModel
     * @method moveForward
     */
    moveForward() {
        this.mode = FLIGHT_MODES.TAXI;
        this.taxi_next  = true;
    }

    /**
     * Aircraft is established on FINAL APPROACH COURSE
     * @for AircraftInstanceModel
     * @method runTakeoff
     */
    isEstablished() {
        if (this.mode !== FLIGHT_MODES.LANDING) {
            return false;
        }

        // TODO: why 48m?  whats the significance of that number?
        // 160 feet or 48 meters
        return this.approachOffset <= 0.048;
    }

    /**
     * Checks if the aircraft is inside the airspace of a specified airport
     *
     * @for AircraftInstanceModel
     * @method isInsideAirspace
     * @param  {airport} airport the airport whose airspace we are checking
     * @return {Boolean}
     * @private
     */
    isInsideAirspace(airport) {
        let withinAirspaceLateralBoundaries = this.distance <= airport.ctr_radius;
        const withinAirspaceAltitudeRange = this.altitude <= airport.ctr_ceiling;

        if (!_isNil(airport.perimeter)) {    // polygonal airspace boundary
            withinAirspaceLateralBoundaries = point_in_area(this.position, airport.perimeter);
        }

        return withinAirspaceAltitudeRange && withinAirspaceLateralBoundaries;
    }

    /**
     * Aircraft has "weight-on-wheels" (on the ground)
     * @for AircraftInstanceModel
     * @method isOnGround
     */
    isOnGround() {
        const error_allowance_ft = 5;
        const airport = window.airportController.airport_get();
        const runway = airport.getRunway(this.rwy_dep || this.rwy_arr);
        const nearRunwayAltitude = abs(this.altitude - runway.elevation) < error_allowance_ft;
        const nearAirportAltitude = abs(this.altitude - airport.position.elevation) < error_allowance_ft;

        return nearRunwayAltitude || nearAirportAltitude;
    }

    /**
     * Aircraft is actively following an instrument approach and is elegible for reduced separation
     *
     * If the game ever distinguishes between ILS/MLS/LAAS
     * approaches and visual/localizer/VOR/etc. this should
     * distinguish between them.  Until then, presume landing is via
     * ILS with appropriate procedures in place.
     *
     * @for AircraftInstanceModel
     * @method runTakeoff
     */
    isPrecisionGuided() {
        return this.mode === FLIGHT_MODES.LANDING;
    }

    /**
     * @for AircraftInstanceModel
     * @method isStopped
     */
    isStopped() {
        // TODO: enumerate the magic number.
        return this.isOnGround() && this.speed < 5;
    }

    /**
     * @for AircraftInstanceModel
     * @method isTaxiing
     */
    isTaxiing() {
        return this.mode === FLIGHT_MODES.APRON ||
            this.mode === FLIGHT_MODES.TAXI ||
            this.mode === FLIGHT_MODES.WAITING;
    }

    /**
     * @for AircraftInstanceModel
     * @method isTakeoff
     */
    isTakeoff() {
        return this.isTaxiing() || this.mode === FLIGHT_MODES.TAKEOFF;
    }

    // TODO: the logic in this method can be cleaned up and simplified
    /**
     * @for AircraftInstanceModel
     * @method isVisible
     */
    isVisible() {
        // TODO: this if/else if would be cleaner with just if (this.mode === FLIGHT_MODES.WAITING) {}
        // hide aircraft on twys
        if (this.mode === FLIGHT_MODES.APRON || this.mode === FLIGHT_MODES.TAXI) {
            return false;
        }

        if (this.isTaxiing()) {
            // show only the first aircraft in the takeoff queue
            const runway = window.airportController.airport_get().getRunway(this.rwy_dep);
            const nextInRunwayQueue = runway.isAircraftNextInQueue(this);

            return this.mode === FLIGHT_MODES.WAITING && nextInRunwayQueue;
        }

        return true;
    }

    /**
     * @for AircraftInstanceModel
     * @method getWind
     */
    getWind() {
        const windForRunway = {
            cross: 0,
            head: 0
        };

        if (this.rwy_dep) {
            const airport = window.airportController.airport_get();
            const wind = airport.wind;
            const runway = airport.getRunway(this.rwy_dep);
            const angle =  abs(angle_offset(runway.angle, wind.angle));

            // TODO: these two bits of math should be abstracted to a helper function
            windForRunway.cross = sin(angle) * wind.speed;
            windForRunway.head = cos(angle) * wind.speed;
        }

        return windForRunway;
    }

    /**
     * @for AircraftInstanceModel
     * @method radioCall
     * @param msg {string}
     * @param sectorType {string}
     * @param alert {string}
     */
    radioCall(msg, sectorType, alert) {
        if (this.projected) {
            return;
        }

        // var is unused
        let call = '';
        const callsign_L = this.getCallsign();
        const callsign_S = this.getRadioCallsign();

        if (sectorType) {
            call += window.airportController.airport_get().radio[sectorType];
        }

        // call += ", " + this.getCallsign() + " " + msg;

        // TODO: quick abstraction, this doesn't belong here.
        const logMessage = (callsign) => `${window.airportController.airport_get().radio[sectorType]}, ${callsign} ${msg}`;

        if (alert) {
            const isWarning = true;
            window.uiController.ui_log(logMessage(callsign_L), isWarning);
        } else {
            window.uiController.ui_log(logMessage(callsign_L));
        }

        speech_say([{
            type: 'text',
            content: logMessage(callsign_S)
        }]);
    }

    /**
     * @for AircraftInstanceModel
     * @method callUp
     */
    callUp() {
        let alt_log;
        let alt_say;

        if (this.category === FLIGHT_CATEGORY.ARRIVAL) {
            const altdiff = this.altitude - this.fms.altitudeForCurrentWaypoint();
            const alt = digits_decimal(this.altitude, -2);

            if (Math.abs(altdiff) > 200) {
                if (altdiff > 0) {
                    alt_log = `descending through ${alt} for ${this.target.altitude}`;
                    alt_say = `descending through ${radio_altitude(alt)} for ${radio_altitude(this.target.altitude)}`;
                } else if (altdiff < 0) {
                    alt_log = ` climbing through ${alt} for ${this.target.altitude}`;
                    alt_say = ` climbing through ${radio_altitude(alt)} for ${radio_altitude(this.target.altitude)}`;
                }
            } else {
                alt_log = `at ${alt}`;
                alt_say = `at ${radio_altitude(alt)}`;
            }

            window.uiController.ui_log(`${window.airportController.airport_get().radio.app}, ${this.getCallsign()} with you ${alt_log}`);
            speech_say([
                { type: 'text', content: `${window.airportController.airport_get().radio.app}, ` },
                { type: 'callsign', content: this },
                { type: 'text', content: `with you ${alt_say}` }
            ]);
        }

        if (this.category === FLIGHT_CATEGORY.DEPARTURE) {
            window.uiController.ui_log(`${window.airportController.airport_get().radio.twr}, ${this.getCallsign()}, ready to taxi`);
            speech_say([
                { type: 'text', content: window.airportController.airport_get().radio.twr },
                { type: 'callsign', content: this },
                { type: 'text', content: ', ready to taxi' }
            ]);
        }
    }

    // TODO: This method should be moved elsewhere, since it doesn't really belong to the aircraft itself
    /**
     * @for AircraftInstanceModel
     * @method scoreWind
     * @param action
     */
    scoreWind(action) {
        let score = 0;
        const components = this.getWind();
        const isWarning = true;

        // TODO: these two if blocks could be done in a single switch statement
        if (components.cross >= 20) {
            window.gameController.events_recordNew(GAME_EVENTS.EXTREME_CROSSWIND_OPERATION);
            window.uiController.ui_log(`${this.getCallsign()} ${action} with major crosswind'`, isWarning);
        } else if (components.cross >= 10) {
            window.gameController.events_recordNew(GAME_EVENTS.HIGH_CROSSWIND_OPERATION);
            window.uiController.ui_log(`${this.getCallsign()} ${action} with crosswind'`, isWarning);
        }

        if (components.head <= -10) {
            window.gameController.events_recordNew(GAME_EVENTS.EXTREME_TAILWIND_OPERATION);
            window.uiController.ui_log(`${this.getCallsign()} ${action} with major tailwind'`, isWarning);
        } else if (components.head <= -1) {
            window.gameController.events_recordNew(GAME_EVENTS.HIGH_TAILWIND_OPERATION);
            window.uiController.ui_log(`${this.getCallsign()} ${action} with tailwind'`, isWarning);
        }

        return score;
    }

    /**
     * @for AircraftInstanceModel
     * @method showStrip
     */
    showStrip() {
        this.$html.detach();

        const scrollPos = this.$strips.scrollTop();

        this.$strips.prepend(this.$html);
        this.$html.show();
        // TODO enumerate the magic number
        // shift scroll down one strip's height
        this.$strips.scrollTop(scrollPos + 45);
    }

    // TODO: this method needs a lot of love. its much too long with waaay too many nested if/else ifs.
    /**
     * @for AircraftInstanceModel
     * @method updateTarget
     */
    updateTarget() {
        let airport = window.airportController.airport_get();
        let runway = null;
        let offset = null;
        let offset_angle = null;
        let glideslope_altitude = null;
        let angle = null;
        let runway_elevation = 0;
        let position;

        if (this.rwy_arr !== null) {
            runway_elevation = airport.getRunway(this.rwy_arr).elevation;
        }

        if (this.fms.altitudeForCurrentWaypoint() > 0) {
            this.fms.setCurrent({
                altitude: Math.max(1000, this.fms.altitudeForCurrentWaypoint())
            });
        }

        if (this.fms.currentWaypoint.navmode === WAYPOINT_NAV_MODE.RWY) {
            runway  = airport.getRunway(this.rwy_arr);
            offset = getOffset(this, runway.position, runway.angle);
            offset_angle = vradial(offset);
            angle = radians_normalize(runway.angle);
            glideslope_altitude = clamp(runway.elevation, runway.getGlideslopeAltitude(offset[1]), this.altitude);
            const assignedHdg = this.fms.currentWaypoint.heading;
            const localizerRange = runway.ils.enabled ? runway.ils.loc_maxDist : 40;
            this.offset_angle = offset_angle;
            this.approachOffset = abs(offset[0]);
            this.approachDistance = offset[1];
            this.target.heading = assignedHdg;
            this.target.turn = this.fms.currentWaypoint.turn;
            this.target.altitude = this.fms.currentWaypoint.altitude;
            this.target.speed = this.fms.currentWaypoint.speed;

            // Established on ILS
            if (this.mode === FLIGHT_MODES.LANDING) {
                // Final Approach Heading Control
                const severity_of_correction = 25;  // controls steepness of heading adjustments during localizer tracking
                const tgtHdg = angle + (offset_angle * -severity_of_correction);
                const minHdg = angle - degreesToRadians(30);
                const maxHdg = angle + degreesToRadians(30);
                this.target.heading = clamp(tgtHdg, minHdg, maxHdg);

                // Final Approach Altitude Control
                this.target.altitude = Math.min(this.fms.currentWaypoint.altitude, glideslope_altitude);

                // Final Approach Speed Control
                if (this.fms.currentWaypoint.speed > 0) {
                    this.fms.setCurrent({ start_speed: this.fms.currentWaypoint.speed });
                }

                if (this.isOnGround()) {
                    this.target.altitude = runway.elevation;
                    this.target.speed = 0;
                } else {
                    const dist_final_app_spd = 3.5; // 3.5km ~= 2nm
                    const dist_assigned_spd = 9.5;  // 9.5km ~= 5nm
                    this.target.speed = extrapolate_range_clamp(
                        dist_final_app_spd, offset[1],
                        dist_assigned_spd,
                        this.model.speed.landing,
                        this.fms.currentWaypoint.start_speed
                    );
                }

                // Failed Approach
                if (abs(offset[0]) > 0.100) {
                    if (!this.projected) {
                        this.updateStrip();
                        this.cancelLanding();
                        const isWarning = true;
                        window.uiController.ui_log(`${this.getRadioCallsign()} aborting landing, lost ILS`, isWarning);
                        speech_say([
                            { type: 'callsign', content: this },
                            { type: 'text', content: ' going around' }
                        ]);
                        window.gameController.events_recordNew(GAME_EVENTS.GO_AROUND);
                    }
                }
            } else if (offset[1] < localizerRange) {  // Joining the ILS
                // Check if aircraft has just become established on the localizer
                const alignedWithRunway = abs(offset[0]) < 0.050;  // within 50m
                const onRunwayHeading = abs(this.heading - angle) < degreesToRadians(5);
                const runwayNominalHeading = degreesToRadians(parseInt(this.rwy_arr.substr(0, 2), 10) * 10, 10);
                const maxInterceptAngle = degreesToRadians(30);
                const maxAboveGlideslope = 250;
                const interceptAngle = abs(angle_offset(assignedHdg, runwayNominalHeading));
                const courseDifference = abs(angle_offset(this.heading, runwayNominalHeading));
                if (alignedWithRunway && onRunwayHeading && this.mode !== FLIGHT_MODES.LANDING) {
                    this.mode = FLIGHT_MODES.LANDING;
                    this.target.heading = angle;
                    // Check legality of localizer interception
                    if (!this.projected) {  // do not give penalty during a future projection
                        // TODO: Abstraction on the below, to remove duplicate code
                        // Intercept Angle
                        if (!assignedHdg && courseDifference > maxInterceptAngle) { // intercept via fixes
                            const isWarning = true;
                            window.uiController.ui_log(`${this.getCallsign()} approach course intercept angle was greater than 30 degrees`, isWarning);
                            window.gameController.events_recordNew(GAME_EVENTS.ILLEGAL_APPROACH_CLEARANCE);
                        } else if (interceptAngle > maxInterceptAngle) {    // intercept via vectors
                            const isWarning = true;
                            window.uiController.ui_log(`${this.getCallsign()} approach course intercept angle was greater than 30 degrees`, isWarning);
                            window.gameController.events_recordNew(GAME_EVENTS.ILLEGAL_APPROACH_CLEARANCE);
                        }

                        // Glideslope intercept
                        if (this.altitude > glideslope_altitude + maxAboveGlideslope) {
                            const isWarning = true;
                            window.uiController.ui_log(`${this.getRadioCallsign()} joined localizer above glideslope altitude`, isWarning);
                            window.gameController.events_recordNew(GAME_EVENTS.ILLEGAL_APPROACH_CLEARANCE);
                        }
                    }

                    this.updateStrip();
                    this.target.turn = null;
                }

                // TODO: this math section should be absctracted to a helper function
                // Guide aircraft onto the localizer
                const angle_diff = angle_offset(angle, this.heading);
                const turning_time = Math.abs(radiansToDegrees(angle_diff)) / 3; // time to turn angle_diff degrees at 3 deg/s
                const turning_radius = km(this.speed) / 3600 * turning_time; // dist covered in the turn, km
                const dist_to_localizer = offset[0] / sin(angle_diff); // dist from the localizer intercept point, km
                const turn_early_km = 1;    // start turn 1km early, to avoid overshoots from tailwind
                const should_attempt_intercept = (0 < dist_to_localizer && dist_to_localizer <= turning_radius + turn_early_km);
                const in_the_window = abs(offset_angle) < degreesToRadians(1.5);  // if true, aircraft will move to localizer, regardless of assigned heading

                if (should_attempt_intercept || in_the_window) {  // time to begin turn
                    const severity_of_correction = 50;  // controls steepness of heading adjustments during localizer tracking
                    const tgtHdg = angle + (offset_angle * -severity_of_correction);
                    const minHdg = angle - degreesToRadians(30);
                    const maxHdg = angle + degreesToRadians(30);
                    this.target.heading = clamp(tgtHdg, minHdg, maxHdg);
                }
            }
        } else if (this.fms.currentWaypoint.navmode === WAYPOINT_NAV_MODE.FIX) {
            const fix = this.fms.currentWaypoint.location;
            if (!fix) {
                console.error(`${this.getCallsign()} using "fix" navmode, but no fix location!`);
                console.log(this.fms);
                console.log(this.fms.currentWaypoint);
            }

            const vector_to_fix = vsub(this.position, fix);
            const distance_to_fix = distance2d(this.position, fix);

            if ((distance_to_fix < 1) ||
                ((distance_to_fix < 10) &&
                (distance_to_fix < window.aircraftController.aircraft_turn_initiation_distance(this, fix)))
            ) {
                // if there are more waypoints available
                if (!this.fms.atLastWaypoint()) {
                    this.fms.nextWaypoint();
                } else {
                    this.cancelFix();
                }

                this.updateStrip();
            } else {
                this.target.heading = vradial(vector_to_fix) - Math.PI;
                this.target.turn = null;
            }
        } else if (this.fms.currentWaypoint.navmode === WAYPOINT_NAV_MODE.HOLD) {
            const hold = this.fms.currentWaypoint.hold;
            const angle_off_of_leg_hdg = abs(angle_offset(this.heading, this.target.heading));

            // within ~2° of upwd/dnwd
            if (angle_off_of_leg_hdg < 0.035) {
                offset = getOffset(this, hold.fixPos);

                // entering hold, just passed the fix
                if (hold.timer === null && offset[1] < 0 && offset[2] < 2) {
                    // Force aircraft to enter the hold immediately
                    hold.timer = -999;
                }

                // Holding Logic
                // time-based hold legs
                if (hold.timer && hold.legLength.includes('min')) {
                    if (hold.timer === -1) {
                        // save the time
                        hold.timer = window.gameController.game.time;
                    } else if (window.gameController.game.time >= hold.timer + parseInt(hold.legLength.replace('min', ''), 10) * 60) {
                        // time to turn
                        this.target.heading += Math.PI;   // turn to other leg
                        this.target.turn = hold.dirTurns;
                        hold.timer = -1; // reset the timer
                    } else if (hold.legLength.includes('nm')) {
                        // distance-based hold legs
                        // not yet implemented
                    }
                }
            }
        } else {
            this.target.heading = this.fms.currentWaypoint.heading;
            this.target.turn = this.fms.currentWaypoint.turn;
        }

        if (this.mode !== FLIGHT_MODES.LANDING) {
            this.target.altitude = this.fms.altitudeForCurrentWaypoint();
            this.target.expedite = this.fms.currentWaypoint.expedite;
            this.target.altitude = Math.max(1000, this.target.altitude);
            this.target.speed = _get(this, 'fms.currentWaypoint.speed', this.speed);
            this.target.speed = clamp(this.model.speed.min, this.target.speed, this.model.speed.max);
        }

        // If stalling, make like a meteorite and fall to the earth!
        if (this.speed < this.model.speed.min && !this.isOnGround()) {
            this.target.altitude = Math.min(0, this.target.altitude);
        }

        // finally, taxi overrides everything
        let was_taxi = false;

        if (this.mode === FLIGHT_MODES.TAXI) {
            const elapsed = window.gameController.game_time() - this.taxi_start;

            if (elapsed > this.taxi_time) {
                this.mode = FLIGHT_MODES.WAITING;
                was_taxi = true;

                this.updateStrip();
            }
        } else if (this.mode === FLIGHT_MODES.WAITING) {
            runway = window.airportController.airport_get().getRunway(this.rwy_dep);

            position = runway.position;
            this.position[0] = position[0];
            this.position[1] = position[1];
            this.heading = runway.angle;
            this.altitude = runway.elevation;

            if (!this.projected &&
                runway.isAircraftNextInQueue(this) &&
                was_taxi === true
            ) {
                window.uiController.ui_log(`${this.getCallsign()}, holding short of runway ${this.rwy_dep}`);
                speech_say([
                    { type: 'callsign', content: this },
                    { type: 'text', content: `holding short of runway ${radio_runway(this.rwy_dep)}` }
                ]);

                this.updateStrip();
            }
        } else if (this.mode === FLIGHT_MODES.TAKEOFF) {
            runway = window.airportController.airport_get().getRunway(this.rwy_dep);

            // Altitude Control
            if (this.speed < this.model.speed.min) {
                this.target.altitude = runway.elevation;
            } else {
                this.target.altitude = this.fms.altitudeForCurrentWaypoint();
            }

            // Heading Control
            const rwyHdg = window.airportController.airport_get().getRunway(this.rwy_dep).angle;
            if ((this.altitude - runway.elevation) < 400) {
                this.target.heading = rwyHdg;
            } else {
                if (!this.fms.followCheck().sid && this.fms.currentWaypoint.heading === null) {
                    // if no directional instructions available after takeoff
                    // fly runway heading
                    this.fms.setCurrent({ heading: rwyHdg });
                }

                this.mode = FLIGHT_MODES.CRUISE;
                this.updateStrip();
            }

            // Speed Control
            // go fast!
            this.target.speed = this.model.speed.cruise;
        }

        // Limit speed to 250 knots while under 10,000 feet MSL (it's the law!)
        if (this.altitude < 10000) {
            if (this.isPrecisionGuided()) {
                // btwn 0 and 250
                this.target.speed = Math.min(this.target.speed, 250);
            } else {
                // btwn scheduled speed and 250
                this.target.speed = Math.min(this.fms.currentWaypoint.speed, 250);
            }
        }
    }

    // TODO: this method needs a lot of love. its much too long with waaay too many nested if/else ifs.
    /**
     * @for AircraftInstanceModel
     * @method updatePhysics
     */
    updatePhysics() {
        if (this.isTaxiing()) {
            return;
        }

        if (this.hit) {
            // 90fps fall rate?...
            this.altitude -= 90 * window.gameController.game_delta();
            this.speed *= 0.99;

            return;
        }

        // TURNING
        // this.target.heading = radians_normalize(this.target.heading);
        if (!this.isOnGround() && this.heading !== this.target.heading) {
            // Perform standard turns 3 deg/s or 25 deg bank, whichever
            // requires less bank angle.
            // Formula based on http://aviation.stackexchange.com/a/8013
            const turn_rate = clamp(0, 1 / (this.speed / 8.883031), 0.0523598776);
            const turn_amount = turn_rate * window.gameController.game_delta();
            const offset = angle_offset(this.target.heading, this.heading);

            if (abs(offset) < turn_amount) {
                this.heading = this.target.heading;
            } else if ((offset < 0 && this.target.turn === null) || this.target.turn === 'left') {
                this.heading -= turn_amount;
            } else if ((offset > 0 && this.target.turn === null) || this.target.turn === 'right') {
                this.heading += turn_amount;
            }
        }

        // ALTITUDE
        let distance = null;
        const expedite_factor = 1.5;
        this.trend = 0;

        if (this.target.altitude < this.altitude - 0.02) {
            distance = -this.model.rate.descent / 60 * window.gameController.game_delta();

            if (this.mode === FLIGHT_MODES.LANDING) {
                distance *= 3;
            }

            this.trend -= 1;
        } else if (this.target.altitude > this.altitude + 0.02) {
            const climbrate = this.getClimbRate();
            distance = climbrate / 60 * window.gameController.game_delta();

            if (this.mode === FLIGHT_MODES.LANDING) {
                distance *= 1.5;
            }

            this.trend = 1;
        }

        if (distance) {
            if (this.target.expedite) {
                distance *= expedite_factor;
            }

            const offset = this.altitude - this.target.altitude;

            if (abs(offset) < abs(distance)) {
                this.altitude = this.target.altitude;
            } else {
                this.altitude += distance;
            }
        }

        if (this.isOnGround()) {
            this.trend = 0;
        }

        // SPEED
        let difference = null;

        if (this.target.speed < this.speed - 0.01) {
            difference = -this.model.rate.decelerate * window.gameController.game_delta() / 2;

            if (this.isOnGround()) {
                difference *= 3.5;
            }
        } else if (this.target.speed > this.speed + 0.01) {
            difference  = this.model.rate.accelerate * window.gameController.game_delta() / 2;
            difference *= extrapolate_range_clamp(0, this.speed, this.model.speed.min, 2, 1);
        }

        if (difference) {
            const offset = this.speed - this.target.speed;

            if (abs(offset) < abs(difference)) {
                this.speed = this.target.speed;
            } else {
                this.speed += difference;
            }
        }

        if (!this.position) {
            return;
        }

        // Trailling
        if (this.position_history.length === 0) {
            this.position_history.push([
                this.position[0],
                this.position[1],
                window.gameController.game_time() / window.gameController.game_speedup()
            ]);
            // TODO: this can be abstracted
        } else if (abs((window.gameController.game_time() / window.gameController.game_speedup()) - this.position_history[this.position_history.length - 1][2]) > 4 / window.gameController.game_speedup()) {
            this.position_history.push([this.position[0], this.position[1], window.gameController.game_time() / window.gameController.game_speedup()]);
        }

        const angle = this.heading;
        // FIXME: is this ratio correct? is it 0.000514444 or 0.514444?
        let scaleSpeed = this.speed * 0.000514444 * window.gameController.game_delta(); // knots to m/s

        if (window.gameController.game.option.get('simplifySpeeds') === 'no') {
            // TODO: this should be abstracted to a helper function
            // Calculate the true air speed as indicated airspeed * 1.6% per 1000'
            scaleSpeed *= 1 + (this.altitude * 0.000016);

            // Calculate movement including wind assuming wind speed
            // increases 2% per 1000'
            const wind = window.airportController.airport_get().wind;
            let vector;

            if (this.isOnGround()) {
                vector = vscale([sin(angle), cos(angle)], scaleSpeed);
            } else {
                let crab_angle = 0;

                // Compensate for crosswind while tracking a fix or on ILS
                if (this.fms.currentWaypoint.navmode === WAYPOINT_NAV_MODE.FIX || this.mode === FLIGHT_MODES.LANDING) {
                    // TODO: this should be abstracted to a helper function
                    const offset = angle_offset(this.heading, wind.angle + Math.PI);
                    crab_angle = Math.asin((wind.speed * sin(offset)) / this.speed);
                }

                // TODO: this should be abstracted to a helper function
                vector = vadd(vscale(
                    vturn(wind.angle + Math.PI),
                    wind.speed * 0.000514444 * window.gameController.game_delta()),
                    vscale(vturn(angle + crab_angle), scaleSpeed)
                );
            }

            this.ds = vlen(vector);
            // TODO: this should be abstracted to a helper function
            this.groundSpeed = this.ds / 0.000514444 / window.gameController.game_delta();
            this.groundTrack = vradial(vector);
            this.position = vadd(this.position, vector);
        } else {
            this.ds = scaleSpeed;
            this.groundSpeed = this.speed;
            this.groundTrack = this.heading;
            this.position = vadd(this.position, vscale([sin(angle), cos(angle)], scaleSpeed));
        }

        this.distance = vlen(this.position);
        this.radial = vradial(this.position);

        if (this.radial < 0) {
            this.radial += tau();
        }

        const isInsideAirspace = this.isInsideAirspace(window.airportController.airport_get());

        if (isInsideAirspace !== this.inside_ctr) {
            this.crossBoundary(isInsideAirspace);
        }
    }

    // TODO: this method needs a lot of love. its much too long with waaay too many nested if/else ifs.
    /**
     * @for AircraftInstanceModel
     * @method updateWarning
     */
    updateWarning() {
        let area;
        let warning;
        let status;
        let new_inside;

        // Ignore other aircraft while taxiing
        if (this.isTaxiing()) {
            return;
        }

        warning = false;

        // restricted areas
        // players are penalized for each area entry
        if (this.position) {
            for (let i = 0; i < this.restricted.list.length; i++) {
                // TODO: this should be abstracted to a helper function
                //   Polygon matching procedure:
                //
                //   1. Filter polygons by aircraft altitude
                //   2. For other polygons, measure distance to it (distance_to_poly), then
                //      substract travelled distance every turn
                //      If distance is about less than 10 seconds of flight,
                //      assign distance equal to 10 seconds of flight,
                //      otherwise planes flying along the border of entering at shallow angle
                //      will cause too many checks.
                //   3. if distance has reached 0, check if the aircraft is within the poly.
                //      If not, redo #2.
                area = this.restricted.list[i];

                // filter only those relevant by height
                if (area.data.height < this.altitude) {
                    area.range = null;
                    area.inside = false;
                    continue;
                }

                // count distance untill the next check
                if (area.range) {
                    area.range -= this.ds;
                }

                // recalculate for new areas or those that should be checked
                if (!area.range || area.range <= 0) {
                    new_inside = point_in_poly(this.position, area.data.coordinates);

                    // ac has just entered the area: .inside is still false, but st is true
                    if (new_inside && !area.inside) {
                        window.gameController.events_recordNew(GAME_EVENTS.AIRSPACE_BUST);
                        area.range = this.speed * 1.85 / 3.6 * 50 / 1000; // check in 50 seconds
                        // speed is kts, range is km.
                        // if a plane got into restricted area, don't check it too often
                    } else {
                        // don't calculate more often than every 10 seconds
                        area.range = Math.max(
                        this.speed * 1.85 / 36 / 1000 * 10,
                        distance_to_poly(this.position, area.data.coordinates));
                    }

                    area.inside = new_inside;
                }
            }

            // raise warning if in at least one restricted area
            $.each(this.restricted.list, (k, v) => {
                warning = warning || v.inside;
            });
        }

        if (this.terrain_ranges && !this.isOnGround()) {
            const terrain = prop.airport.current.terrain;
            const prev_level = this.terrain_ranges[this.terrain_level];
            const ele = Math.ceil(this.altitude, 1000);
            let curr_ranges = this.terrain_ranges[ele];

            if (ele !== this.terrain_level) {
                for (const lev in prev_level) {
                    prev_level[lev] = Infinity;
                }

                this.terrain_level = ele;
            }

            for (const id in curr_ranges) {
                curr_ranges[id] -= this.ds;
                // console.log(curr_ranges[id]);

                if (curr_ranges[id] < 0 || curr_ranges[id] === Infinity) {
                    area = terrain[ele][id];
                    status = point_to_mpoly(this.position, area, id);

                    if (status.inside) {
                        this.altitude = 0;

                        if (!this.hit) {
                            this.hit = true;

                            console.log('hit terrain');
                            const isWarning = true;
                            window.uiController.ui_log(`${this.getCallsign()} collided with terrain in controlled flight`, isWarning);
                            speech_say([
                                { type: 'callsign', content: this },
                                { type: 'text', content: ', we\'re going down!' }
                            ]);

                            window.gameController.events_recordNew(GAME_EVENTS.COLLISION);
                        }
                    } else {
                        curr_ranges[id] = Math.max(0.2, status.distance);
                        // console.log(this.getCallsign(), 'in', curr_ranges[id], 'km from', id, area[0].length);
                    }
                }
            }
        }

        this.warning = warning;
    }

    /**
     * @for AircraftInstanceModel
     * @method updateStrip
     */
    updateStrip() {
        if (this.projected) {
            return;
        }

        // Update fms.following
        this.fms.followCheck();

        const wp = this.fms.currentWaypoint;
        // Populate strip fields with default values
        const defaultHeadingText = heading_to_string(wp.heading);
        const defaultAltitudeText = _get(wp, 'altitude', '-');
        const defaultDestinationText = _get(this, 'destination', window.airportController.airport_get().icao);
        const currentSpeedText = wp.speed;

        let headingText;
        const altitudeText = this.taxi_next ? 'ready' : null;
        let destinationText = this.fms.getFollowingSIDText();
        const hasAltitude = _has(wp, 'altitude');
        const isFollowingSID = _isString(destinationText);
        const isFollowingSTAR = _isString(this.fms.following.star);
        const { fixRestrictions } = this.fms.currentWaypoint;

        this.aircraftStripView.update(defaultHeadingText, defaultAltitudeText, defaultDestinationText, currentSpeedText);

        switch (this.mode) {
            case FLIGHT_MODES.APRON:
                this.aircraftStripView.updateViewForApron(destinationText, hasAltitude, isFollowingSID);
                break;
            case FLIGHT_MODES.TAXI:
                this.aircraftStripView.updateViewForTaxi(destinationText, hasAltitude, isFollowingSID, altitudeText);
                break;
            case FLIGHT_MODES.WAITING:
                this.aircraftStripView.updateViewForWaiting(destinationText, hasAltitude, isFollowingSID);
                break;
            case FLIGHT_MODES.TAKEOFF:
                // When taking off...
                this.aircraftStripView.updateViewForTakeoff(destinationText, isFollowingSID);

                break;
            case FLIGHT_MODES.CRUISE:
                // When in normal flight...
                if (wp.navmode === WAYPOINT_NAV_MODE.FIX) {
                    headingText = wp.fix[0] === '_'
                        ? '[RNAV]'
                        : wp.fix;
                    destinationText = this.fms.getFollowingSTARText();
                } else if (wp.navmode === WAYPOINT_NAV_MODE.HOLD) {
                    headingText = 'holding';
                } else if (wp.navmode === WAYPOINT_NAV_MODE.RWY) {
                    headingText = 'intercept';
                    destinationText = this.fms.getDesinationIcaoWithRunway();
                }

                this.aircraftStripView.updateViewForCruise(wp.navmode, headingText, destinationText, isFollowingSID, isFollowingSTAR, fixRestrictions);
                break;
            case FLIGHT_MODES.LANDING:
                destinationText = this.fms.getDesinationIcaoWithRunway();

                this.aircraftStripView.updateViewForLanding(destinationText);
                break;
            default:
                throw new TypeError(`Invalid FLIGHT_MODE ${this.mode} passed to .updateStrip()`);
        }
    }

    /**
     * @for AircraftInstanceModel
     * @method updateAuto
     */
    updateAuto() {}

    /**
     * @for AircraftInstanceModel
     * @method update
     */
    update() {
        if (prop.aircraft.auto.enabled) {
            this.updateAuto();
        }

        this.updateTarget();
        this.updatePhysics();
    }

    /**
     * @for AircraftInstanceModel
     * @method addConflict
     * @param {AircraftConflict} conflict
     * @param {Aircraft} conflictingAircraft
     */
    addConflict(conflict, conflictingAircraft) {
        this.conflicts[conflictingAircraft.getCallsign()] = conflict;
    }

    /**
     * @for AircraftInstanceModel
     * @method checkConflict
     * @param {Aircraft} conflictingAircraft
     */
    checkConflict(conflictingAircraft) {
        if (this.conflicts[conflictingAircraft.getCallsign()]) {
            this.conflicts[conflictingAircraft.getCallsign()].update();
            return true;
        }

        return false;
    }

    /**
     * @for AircraftInstanceModel
     * @method hasAlerts
     */
    hasAlerts() {
        const a = [false, false];
        let c = null;
        for (const i in this.conflicts) {
            c = this.conflicts[i].hasAlerts();
            a[0] = (a[0] || c[0]);
            a[1] = (a[1] || c[1]);
        }

        return a;
    }

    /**
     * @for AircraftInstanceModel
     * @method removeConflict
     * @param {Aircraft} conflictingAircraft
     */
    removeConflict(conflictingAircraft) {
        const conflictBeingRemoved = this.conflicts[conflictingAircraft.getCallsign()];
        this.conflicts = _without(this.conflicts, conflictBeingRemoved);
    }
}
