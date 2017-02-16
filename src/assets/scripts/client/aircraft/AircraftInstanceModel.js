/* eslint-disable max-len */
import $ from 'jquery';
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _has from 'lodash/has';
import _isEqual from 'lodash/isEqual';
import _isNil from 'lodash/isNil';
import _isString from 'lodash/isString';
import _map from 'lodash/map';
import AircraftFlightManagementSystem from './FlightManagementSystem/AircraftFlightManagementSystem';
import Fms from './FlightManagementSystem/Fms';
import AircraftStripView from './AircraftStripView';
import RouteModel from '../navigationLibrary/Route/RouteModel';
import { speech_say } from '../speech';
import { tau, radians_normalize, angle_offset } from '../math/circle';
import { round, abs, sin, cos, extrapolate_range_clamp, clamp } from '../math/core';
import { distance2d } from '../math/distance';
import { getOffset, calculateTurnInitiaionDistance } from '../math/flightMath';
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
    digits_decimal,
    groupNumbers,
    radio_runway,
    radio_spellOut,
    radio_altitude
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
     * @param navigationLibrary {NavigationLibrary}
     */
    constructor(options = {}, navigationLibrary) {
        /* eslint-disable no-multi-spaces*/
        this._navigationLibrary = navigationLibrary;
        this.eid          = global.prop.aircraft.list.length;  // entity ID
        this.position     = [0, 0];     // Aircraft Position, in km, relative to airport position
        this.model        = null;       // Aircraft type
        this.airlineId      = '';         // Airline Identifier (eg. 'AAL')
        this.airlineCallsign = '';
        // FIXME: change this to`flightNumber`
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
        this.__fms__ = new AircraftFlightManagementSystem({
            aircraft: this,
            model: options.model,
            navigationLibrary: this._navigationLibrary
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
        this.initFms(options);
        this.createStrip();
        this.updateStrip();
    }

    /**
     *
     *
     * @property telemetry
     * @return {object}
     */
    get telemetry() {
        return {
            altitude: this.altitude,
            heading: this.heading,
            speed: this.speed
        };
    }

    /**
     * The name of the currently assigned runway
     *
     * @property initialRunwayAssignment
     * @return {string}
     */
    get initialRunwayAssignment() {
        return this.rwy_dep
            ? this.rwy_dep
            : this.rwy_arr;
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
        const runway = window.airportController.airport_get().runway;

        if (options.category === FLIGHT_CATEGORY.ARRIVAL) {
            this.setArrivalRunway(runway);
        } else if (options.category === FLIGHT_CATEGORY.DEPARTURE) {
            this.setDepartureRunway(runway);
        }
    }

    parse(data) {
        this.position = _get(data, 'position', this.position);
        this.model = _get(data, 'model', this.model);
        this.airlineId = _get(data, 'airline', this.airlineId);
        this.airlineCallsign = _get(data, 'airlineCallsign', this.airlineCallsign);
        this.callsign = _get(data, 'callsign', this.callsign);
        this.category = _get(data, 'category', this.category);
        this.heading = _get(data, 'heading', this.heading);
        this.altitude = _get(data, 'altitude', this.altitude);
        this.speed = _get(data, 'speed', this.speed);
    }

    initFms(data) {
        this.fms = new Fms(data, this.initialRunwayAssignment, this.model, this._navigationLibrary);
        console.log('::: FMS', this.fms);

        if (this.category === FLIGHT_CATEGORY.ARRIVAL) {
            this.destination = data.destination;

            this.fms.updateModesForArrival();
            this.setArrivalWaypoints(data.waypoints);
            // this.setArrivalRunway(window.airportController.airport_get(this.destination).runway);
        } else if (this.category === FLIGHT_CATEGORY.DEPARTURE) {
            const airport = window.airportController.airport_get();

            this.fms.updateModesForDeparture();
            this.mode = FLIGHT_MODES.APRON;
            this.destination = data.destination;
            // this.setDepartureRunway(airport.runway);
            this.altitude = airport.position.elevation;
            this.speed = 0;
        }

        // TODO: combine these two to asingle constant
        if (data.heading) {
            this.fms.setHeadingHold(data.heading);
            // this.__fms__.setCurrent({ heading: data.heading });
        }

        if (data.altitude) {
            this.fms.setAltitudeHold(data.altitude);
            // this.__fms__.setCurrent({ altitude: data.altitude });
        }

        // temporary ternary that should be refactored in the future. A departure will have a speed
        // of 0, but should display the projected cruise speed before takeoff
        const speed = data.speed !== 0
            ? data.speed
            : this.model.speed.cruise;

        this.fms.setSpeedHold(speed);
        // this.__fms__.setCurrent({ speed: speed });

        // if (data.category === FLIGHT_CATEGORY.ARRIVAL && RouteModel.isProcedureRouteString(data.route)) {
        //     const route = this.__fms__.formatRoute(data.route);
        //
        //     this.__fms__.customRoute(route, true);
        //     this.__fms__.descendViaSTAR();
        // }

        if (data.nextFix) {
            this.fms.skipToWaypoint(data.nextFix);
        }
    }

    setArrivalWaypoints(waypoints) {
        if (!waypoints || waypoints.length === 0) {
            return;
        }

        // add arrival fixes to fms
        for (let i = 0; i < waypoints.length; i++) {
            this.__fms__.appendLeg({
                type: 'fix',
                route: waypoints[i]
            });
        }

        // TODO: this could be another class method for FMS
        if (this.__fms__.currentWaypoint.navmode === WAYPOINT_NAV_MODE.HEADING) {
            // aim aircraft at airport
            this.__fms__.setCurrent({
                heading: vradial(this.position) + Math.PI
            });
        }

        if (this.__fms__.legs.length > 0) {
            // go to the first fix!
            this.__fms__.nextWaypoint();
        }
    }

    setArrivalRunway(rwy) {
        this.rwy_arr = rwy;

        // Update the assigned STAR to use the fixes for the specified runway, if they exist
    }

    setDepartureRunway(rwy) {
        this.rwy_dep = rwy;

        // // Update the assigned SID to use the portion for the new runway
        // const leg = this.fms.currentLeg;
        //
        // // TODO: this should return early
        // if (leg.type === FP_LEG_TYPE.SID) {
        //     const a = _map(leg.waypoints, (v) => v.altitude);
        //     const cvs = !a.every((v) => v === window.airportController.airport_get().initial_alt);
        //     this.__fms__.followSID(leg.route.routeCode);
        //
        //     if (cvs) {
        //         this.__fms__.climbViaSID();
        //     }
        // }
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

    // Called when the aircraft crosses the airspace boundary (ie, leaving our airspace)
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

            return;
        }

        // leaving airspace
        this.onAirspaceExit();
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
            _forEach(this.__fms__.legs, (leg) => {
                if (leg.type === FP_LEG_TYPE.SID) {
                    // TODO: use lodash `_last()` here
                    exit = leg.waypoints[leg.waypoints.length - 1].fix;
                    return;
                }
            });

            // Verify aircraft was cleared to departure fix
            const ok = this.__fms__.hasWaypoint(exit);

            if (ok) {
                this.radioCall('switching to center, good day', 'dep');
                window.gameController.events_recordNew(GAME_EVENTS.DEPARTURE);
            } else {
                // TODO: this is a temporary fix for `release/3.0.0`. this will need to be refactored
                let fmsDestination = this.__fms__.fp.route[1].indexOf('.') !== -1
                    ? this.__fms__.fp.route[1].split('.')[1]
                    : this.__fms__.fp.route[1];

                // TODO: add helper method to FMS class for this
                this.radioCall(`leaving radar coverage without being cleared to ${fmsDestination}`, 'dep', true);
                window.gameController.events_recordNew(GAME_EVENTS.NOT_CLEARED_ON_ROUTE);
            }
        }

        this.__fms__.setCurrent({
            altitude: this.__fms__.fp.altitude,
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

    /**
     * @for AircraftInstanceModel
     * @method getCallsign
     * @return {string}
     */
    getCallsign() {
        // TODO: this should be an instance property. however, it seems callsign is used in places where it should be
        // flightnumber and visa versa. this needs to be ironed out first before making a class property.
        return `${this.airlineId.toUpperCase()}${this.callsign.toUpperCase()}`;
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

        let flightNumber = this.callsign;
        if (condensed) {
            const length = 2;
            flightNumber = flightNumber.substr(flightNumber.length - length);
        }

        // TODO: this may not be needed any longer
        // let cs = window.airlineController.airline_get(this.airline).callsign;
        //
        // if (cs === 'November') {
        //    cs += ` ${radio_spellOut(callsign)} ${heavy}`;
        // } else {
        //    cs += ` ${groupNumbers(callsign, this.airline)} ${heavy}`;
        // }
        //
        // return cs;
    }

    /**
     * @for AircraftInstanceModel
     * @method getClimbRate
     * @return {number}
     */
    getClimbRate() {
        let serviceCeilingClimbRate;
        let cr_uncorr;
        let cr_current;
        const altitude = this.altitude;
        const rate = this.model.rate.climb;
        const ceiling = this.model.ceiling;

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

    // TODO: move to `fms.cancelFix()`
    /**
     * @for AircraftInstanceModel
     * @method cancelFix
     */
    cancelFix() {
        if (this.__fms__.currentWaypoint.navmode !== WAYPOINT_NAV_MODE.FIX) {
            return false;
        }

        const curr = this.__fms__.currentWaypoint;

        this.__fms__.appendLeg({
            altitude: curr.altitude,
            navmode: WAYPOINT_NAV_MODE.HEADING,
            heading: this.heading,
            speed: curr.speed
        });

        this.__fms__.nextLeg();
        this.updateStrip();

        return true;
    }

    /**
     * @for AircraftInstanceModel
     * @method cancelLanding
     */
    cancelLanding() {
        // TODO: this logic could be simplified. do an early return instead of wrapping the entire function in an if.
        if (this.__fms__.currentWaypoint.navmode !== WAYPOINT_NAV_MODE.RWY) {
            this.__fms__.setCurrent({ runway: null });

            return false;
        }

        const runway = window.airportController.airport_get().getRunway(this.rwy_arr);

        if (this.mode === FLIGHT_MODES.LANDING) {
            // TODO: enumerate the magic numbers
            this.__fms__.setCurrent({
                altitude: Math.max(2000, round((this.altitude / 1000)) * 1000),
                heading: runway.angle
            });
        }

        this.__fms__.setCurrent({
            navmode: WAYPOINT_NAV_MODE.HEADING,
            runway: null
        });

        this.mode = FLIGHT_MODES.CRUISE;
        this.updateStrip();

        return true;
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
     *
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
            const altdiff = this.altitude - this.fms.getAltitude();
            const alt = digits_decimal(this.altitude, -2);

            if (Math.abs(altdiff) > 200) {
                if (altdiff > 0) {
                    alt_log = `descending through ${alt} for ${this.target.altitude}`;
                    alt_say = `descending through ${radio_altitude(alt)} for ${radio_altitude(this.target.altitude)}`;
                } else if (altdiff < 0) {
                    alt_log = `climbing through ${alt} for ${this.target.altitude}`;
                    alt_say = `climbing through ${radio_altitude(alt)} for ${radio_altitude(this.target.altitude)}`;
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
        let position;

        this.updateTargetTowardsNextFix();

        switch (this.__fms__.currentWaypoint.navmode) {
            case WAYPOINT_NAV_MODE.RWY:
                this.updateTargetPrepareAircraftForLanding();

                break;
            case WAYPOINT_NAV_MODE.FIX:
                this.updateTargetTowardsNextFix();

                break;
            case WAYPOINT_NAV_MODE.HOLD:
                this.updateTargetPrepareAircraftForHold();

                break;
            default:
                this.target.heading = this.fms.getHeading();
                this.target.turn = this.__fms__.currentWaypoint.turn;

                break;
        }

        if (this.mode !== FLIGHT_MODES.LANDING) {
            // this.target.altitude = this.fms.getAltitude();
            this.target.expedite = this.__fms__.currentWaypoint.expedite;
            this.target.altitude = Math.max(1000, this.fms.getAltitude());
            // this.target.speed = _get(this, 'fms.currentWaypoint.speed', this.speed);
            this.target.speed = clamp(this.model.speed.min, this.fms.getSpeed(), this.model.speed.max);
        }

        // If stalling, make like a meteorite and fall to the earth!
        if (this.speed < this.model.speed.min && !this.isOnGround()) {
            this.target.altitude = Math.min(0, this.target.altitude);
        }

        // finally, taxi overrides everything
        let was_taxi = false;

        switch (this.mode) {
            case FLIGHT_MODES.TAXI:
                const elapsed = window.gameController.game_time() - this.taxi_start;

                if (elapsed > this.taxi_time) {
                    this.mode = FLIGHT_MODES.WAITING;
                    was_taxi = true;

                    this.updateStrip();
                }

                break;
            case FLIGHT_MODES.WAITING:
                runway = airport.getRunway(this.rwy_dep);
                position = runway.position;

                this.position[0] = position[0];
                this.position[1] = position[1];
                this.heading = runway.angle;
                this.altitude = runway.elevation;

                if (!this.projected && runway.isAircraftNextInQueue(this) && was_taxi) {
                    window.uiController.ui_log(`${this.getCallsign()}, holding short of runway ${this.rwy_dep}`);

                    speech_say([
                        { type: 'callsign', content: this },
                        { type: 'text', content: `holding short of runway ${radio_runway(this.rwy_dep)}` }
                    ]);

                    this.updateStrip();
                }

                break;
            case FLIGHT_MODES.TAKEOFF:
                runway = airport.getRunway(this.rwy_dep);

                // Altitude Control
                this.target.altitude = this.fms.getAltitude();

                if (this.speed < this.model.speed.min) {
                    this.target.altitude = runway.elevation;
                }

                // Heading Control
                const runwayHeading = runway.angle;

                if ((this.altitude - runway.elevation) < 400) {
                    this.target.heading = runwayHeading;
                } else {
                    // if (!this.__fms__.followCheck().sid && this.__fms__.currentWaypoint.heading === null) {
                    if (this.fms.getHeading() === -999) {
                        // if no directional instructions available after takeoff
                        // fly runway heading
                        this.fms.setHeadingHold(runwayHeading);
                        // this.__fms__.setCurrent({ heading: runwayHeading });
                    }

                    this.mode = FLIGHT_MODES.CRUISE;
                    this.updateStrip();
                }

                // Speed Control
                // go fast!
                this.target.speed = this.model.speed.cruise;

                break;
            default:
                break;

        }

        // Limit speed to 250 knots while under 10,000 feet MSL (it's the law!)
        if (this.altitude > 10000) {
            return;
        }

        let nextSpeed = Math.min(this.fms.getSpeed(), 250);

        if (this.isPrecisionGuided()) {
            // btwn 0 and 250
            nextSpeed = Math.min(this.target.speed, 250);
        }

        this.target.speed = nextSpeed;
    }

    /**
     * Updates the heading for a landing aircraft
     *
     * @for AircraftInstanceModel
     * @method updateTargetPrepareAircraftForLanding
     */
    updateTargetPrepareAircraftForLanding() {
        const airport = window.airportController.airport_get();
        const runway  = airport.getRunway(this.rwy_arr);
        const offset = getOffset(this, runway.position, runway.angle);
        const offset_angle = vradial(offset);
        const angle = radians_normalize(runway.angle);
        const glideslope_altitude = clamp(runway.elevation, runway.getGlideslopeAltitude(offset[1]), this.altitude);
        // const assignedHdg = this.__fms__.currentWaypoint.heading;
        const localizerRange = runway.ils.enabled
            ? runway.ils.loc_maxDist :
            40;
        this.offset_angle = offset_angle;
        this.approachOffset = abs(offset[0]);
        this.approachDistance = offset[1];
        this.target.heading = this.fms.getHeading();
        this.target.turn = this.__fms__.currentWaypoint.turn;
        this.target.altitude = this.__fms__.currentWaypoint.altitude;
        this.target.speed = this.__fms__.currentWaypoint.speed;

        // Established on ILS
        if (this.mode === FLIGHT_MODES.LANDING) {
            this.updateLandingFinalApproachHeading(angle);
            this.target.altitude = Math.min(this.__fms__.currentWaypoint.altitude, glideslope_altitude);
            this.updateLandingFinalSpeedControll(runway, offset);

            if (abs(offset[0]) > 0.100) {
                this.updateLandingFailedLanding();
            }
        } else if (offset[1] < localizerRange) {
            this.updateInterceptLocalizer(angle, offset, glideslope_altitude);
            this.updateTargetHeadingForLanding(angle, offset);
        }
    }

    /**
     * Updates the heading for a landing aircraft
     *
     * @for AircraftInstanceModel
     * @method updateLandingFinalSpeedControll
     */
    updateLandingFinalSpeedControll(runway, offset) {
        // Final Approach Speed Control
        if (this.__fms__.currentWaypoint.speed > 0)  {
            this.__fms__.setCurrent({ start_speed: this.__fms__.currentWaypoint.speed });
        }

        if (this.isOnGround()) {
            this.target.altitude = runway.elevation;
            this.target.speed = 0;

            return;
        }

        const dist_final_app_spd = 3.5; // 3.5km ~= 2nm
        const dist_assigned_spd = 9.5;  // 9.5km ~= 5nm
        this.target.speed = extrapolate_range_clamp(
            dist_final_app_spd, offset[1],
            dist_assigned_spd,
            this.model.speed.landing,
            this.__fms__.currentWaypoint.start_speed
        );
    }

    /**
     * Cancles the landing and disaply message
     *
     * @for AircraftInstanceModel
     * @method updateLandingFailedLanding
     */
    updateLandingFailedLanding() {
        // Failed Approach
        if ((this.approachDistance > 0.100) && (!this.projected)) {
            this.updateStrip();
            this.cancelLanding();

            const isWarning = true;
            //TODO: Should be moved to where the output is handled
            window.uiController.ui_log(`${this.getRadioCallsign()} aborting landing, lost ILS`, isWarning);
            speech_say([
                { type: 'callsign', content: this },
                { type: 'text', content: ' going around' }
            ]);
            window.gameController.events_recordNew(GAME_EVENTS.GO_AROUND);
        }
    }

    /**
     * Updates the heading for a landing aircraft
     *
     * @for AircraftInstanceModel
     * @method updateLandingFinalApproachHeading
     */
    updateLandingFinalApproachHeading(angle) {
        // Final Approach Heading Control
        const severity_of_correction = 25;  // controls steepness of heading adjustments during localizer tracking
        const targetHeadinh = angle + (this.offset_angle * -severity_of_correction);
        const minHeading = angle - degreesToRadians(30);
        const maxHeading = angle + degreesToRadians(30);
        this.target.heading = clamp(targetHeadinh, minHeading, maxHeading);
    }

    /**
     * This will display a waring and record an illegal approach event
     * @for AircraftInstanceModel
     * @method warnInterceptAngle
     */
    warnInterceptAngle() {
        const isWarning = true;
        window.uiController.ui_log(`${this.getCallsign()} approach course intercept angle was greater than 30 degrees`, isWarning);
        window.gameController.events_recordNew(GAME_EVENTS.ILLEGAL_APPROACH_CLEARANCE);
    }

    //TODO: More Simplification of this function should be done, abstract warings to their own functions
    /**
     * Updates the aircraft status to landing and wil also send out a waring if the change in angle is greater than 30 degrees.
     *
     * @for AircraftInstanceModel
     * @method updateFixTarget
     * @param offset
     * @param angle
     * @param glideslope_altitude
     */
    updateInterceptLocalizer(angle, offset, glideslope_altitude) {
        // Joining the ILS
        // Check if aircraft has just become established on the localizer
        const alignedWithRunway = abs(offset[0]) < 0.050;  // within 50m
        const onRunwayHeading = abs(this.heading - angle) < degreesToRadians(5);
        const runwayNominalHeading = degreesToRadians(parseInt(this.rwy_arr.substr(0, 2), 10) * 10, 10);
        const maxInterceptAngle = degreesToRadians(30);
        const maxAboveGlideslope = 250;
        const interceptAngle = abs(angle_offset(this.target.heading, runwayNominalHeading));
        const courseDifference = abs(angle_offset(this.heading, runwayNominalHeading));

        if (alignedWithRunway && onRunwayHeading && this.mode !== FLIGHT_MODES.LANDING) {
            this.mode = FLIGHT_MODES.LANDING;
            this.target.heading = angle;

            // Check legality of localizer interception
            if (!this.projected) {  // do not give penalty during a future projection
                // Intercept Angle
                if (!this.target.heading && courseDifference > maxInterceptAngle) { // intercept via fixes
                    this.warnInterceptAngle();
                } else if (interceptAngle > maxInterceptAngle) {    // intercept via vectors
                    this.warnInterceptAngle();
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
    }

    /**
     * Updates the heading to the runway for the aircraft to land if the change in flight is less than 30 degrees
     *
     * @for AircraftInstanceModel
     * @method updateTargetHeadingForLanding
     * @param  angle
     * @param  offset
     */
    updateTargetHeadingForLanding(angle, offset) {
        // TODO: this math section should be absctracted to a helper function
        // Guide aircraft onto the localizer
        const angle_diff = angle_offset(angle, this.heading);
        const turning_time = Math.abs(radiansToDegrees(angle_diff)) / 3; // time to turn angle_diff degrees at 3 deg/s
        const turning_radius = km(this.speed) / 3600 * turning_time; // dist covered in the turn, km
        const dist_to_localizer = offset[0] / sin(angle_diff); // dist from the localizer intercept point, km
        const turn_early_km = 1;    // start turn 1km early, to avoid overshoots from tailwind
        const should_attempt_intercept = (dist_to_localizer > 0 && dist_to_localizer <= turning_radius + turn_early_km);
        const in_the_window = abs(this.offset_angle) < degreesToRadians(1.5);  // if true, aircraft will move to localizer, regardless of assigned heading

        if (should_attempt_intercept || in_the_window) {  // time to begin turn
            const severity_of_correction = 50;  // controls steepness of heading adjustments during localizer tracking
            const tgtHdg = angle + (this.offset_angle * -severity_of_correction);
            const minHdg = angle - degreesToRadians(30);
            const maxHdg = angle + degreesToRadians(30);

            this.target.heading = clamp(tgtHdg, minHdg, maxHdg);
        }
    }

    /**
     * This will update the FIX for the aircraft and will change the aircraft's heading
     *
     * @for AircraftInstanceModel
     * @method updateFixTarget
     */
    updateTargetTowardsNextFix() {
        if (!this.fms.currentWaypoint) {
            return;
        }

        const currentWaypointPosition = this.fms.currentWaypoint.position;
        const vectorToFix = vsub(this.position, currentWaypointPosition);
        const distanceToFix = distance2d(this.position, currentWaypointPosition);
        const isFixLessThanTurnInitiation = distanceToFix < calculateTurnInitiaionDistance(this, currentWaypointPosition);

        if (
            distanceToFix < 1 ||
            (distanceToFix < 10 && isFixLessThanTurnInitiation)
        ) {
            // // if there are more waypoints available
            // if (!this.__fms__.atLastWaypoint()) {
            //     this.__fms__.nextWaypoint();
            // } else {
            //     this.cancelFix();
            // }

            this.fms.nextWaypoint();
            this.updateStrip();

            return;
        }

        this.target.heading = vradial(vectorToFix) - Math.PI;
        this.target.turn = null;
    }

    /**
     * This will sets up and prepares the aircraft to hold
     *
     * @for AircraftInstanceModel
     * @method updateTargetPrepareAircraftForHold
     */
    updateTargetPrepareAircraftForHold() {
        const hold = this.__fms__.currentWaypoint.hold;
        const angle_off_of_leg_hdg = abs(angle_offset(this.heading, this.target.heading));

        // within ~2° of upwd/dnwd
        if (angle_off_of_leg_hdg < 0.035) {
            const offset = getOffset(this, hold.fixPos);

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

        this.updateAircraftTurnPhysics();
        this.updateAltitudePhysics();

        if (this.isOnGround()) {
            this.trend = 0;
        }

        // SPEED
        this.updateSpeedPhysics();

        if (!this.position) {
            return;
        }

        // TODO: abstract to AircraftPositionHistory class
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

        // FIXME: is this ratio correct? is it 0.000514444 or 0.514444?
        const scaleSpeed = this.speed * 0.000514444 * window.gameController.game_delta(); // knots to m/s

        this.updateGroundSpeedPhysics(scaleSpeed);

        // if (window.gameController.game.option.get('simplifySpeeds') === 'no') {
        //     this.updateGroundSpeedPhysics(scaleSpeed);
        // } else {
        //     this.updateSimpleGroundSpeedPhysics(scaleSpeed);
        // }

        this.distance = vlen(this.position);
        this.radial = vradial(this.position);

        if (this.radial < 0) {
            this.radial += tau();
        }

        // TODO: I am not sure what this has to do with aircraft Physics
        const isInsideAirspace = this.isInsideAirspace(window.airportController.airport_get());

        if (isInsideAirspace !== this.inside_ctr) {
            this.crossBoundary(isInsideAirspace);
        }
    }

    /**
     * This turns the aircraft if it is not on the ground and has not arived at its destenation
     *
     * @for AircraftInstanceModel
     * @method updateAircraftTurnPhysics
     */
    updateAircraftTurnPhysics() {
        // Exits eary if the airplane is on the ground or at its destenation
        if (this.isOnGround() && this.heading === this.target.heading) {
            return;
        }
        // TURNING
        // this.target.heading = radians_normalize(this.target.heading);
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

    /**
     * This updates the Altitude for the instance of the aircraft by checking the difference between current Altitude and requested Altitude
     *
     * @for AircraftInstanceModel
     * @method updateAltitudePhysics
     */
    updateAltitudePhysics() {
        this.trend = 0;

        if (this.target.altitude < this.altitude) {
            this.decreaseAircraftAltitude();
        } else if (this.target.altitude > this.altitude) {
            this.increaseAircraftAltitude();
        }
    }

    /**
    * Decreases the aircrafts altitude
    *
    * @for AircraftInstanceModel
    * @method decreaseAircraftAltitude
    */
    decreaseAircraftAltitude() {
        let distance = -this.model.rate.descent / 60 * window.gameController.game_delta();
        const expedite_factor = 1.5;

        if (this.mode === FLIGHT_MODES.LANDING) {
            distance *= 3;
        }

        this.trend -= 1;
        // TODO: This might be able to become its own function since it is repeated again in the increaseAircraftAltitude()
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
    }

    /**
    * Increases the aircrafts altitude
    *
    * @for AircraftInstanceModel
    * @method increaseAircraftAltitude
    */
    increaseAircraftAltitude() {
        const climbrate = this.getClimbRate();
        const expedite_factor = 1.5;
        let distance = climbrate / 60 * window.gameController.game_delta();

        if (this.mode === FLIGHT_MODES.LANDING) {
            distance *= 1.5;
        }

        this.trend = 1;
        // TODO: This might be able to become its own function since it is repeated  in the decreaseAircraftAltitude() Also I think the  outer If() might not be needed
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
    }

    /**
     * This updates the speed for the instance of the aircraft by checking the difference between current speed and requested speed
     *
     * @for AircraftInstanceModel
     * @method updateWarning
     */
    updateSpeedPhysics() {
        let difference = null;

        if (this.target.speed < this.speed - 0.01) {
            difference = -this.model.rate.decelerate * window.gameController.game_delta() / 2;

            if (this.isOnGround()) {
                // What is 3.5 is this restiance/breaking power?
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
    }

    /**
     * This calculates the ground speed
     *
     * @for AircraftInstanceModel
     * @method updateVectorPhysics
     * @param scaleSpeed
     */
    updateGroundSpeedPhysics(scaleSpeed) {
        if (window.gameController.game.option.get('simplifySpeeds') === 'yes') {
            return this.updateSimpleGroundSpeedPhysics(scaleSpeed);
        }

        // TODO: this should be abstracted to a helper function
        // Calculate the true air speed as indicated airspeed * 1.6% per 1000'
        const trueAirSpeed = scaleSpeed * (1 + this.altitude * 0.000016);

        // Calculate movement including wind assuming wind speed
        // increases 2% per 1000'
        const wind = window.airportController.airport_get().wind;
        const angle = this.heading;
        let vector;

        if (this.isOnGround()) {
            vector = vscale([sin(angle), cos(angle)], trueAirSpeed);
        } else {
            let crab_angle = 0;

            // Compensate for crosswind while tracking a fix or on ILS
            if (this.__fms__.currentWaypoint.navmode === WAYPOINT_NAV_MODE.FIX || this.mode === FLIGHT_MODES.LANDING) {
                // TODO: this should be abstracted to a helper function
                const offset = angle_offset(this.heading, wind.angle + Math.PI);
                crab_angle = Math.asin((wind.speed * sin(offset)) / this.speed);
            }

            // TODO: this should be abstracted to a helper function
            vector = vadd(vscale(
                vturn(wind.angle + Math.PI),
                wind.speed * 0.000514444 * window.gameController.game_delta()),
                vscale(vturn(angle + crab_angle), trueAirSpeed)
            );
        }

        this.ds = vlen(vector);
        // TODO: this should be abstracted to a helper function
        this.groundSpeed = this.ds / 0.000514444 / window.gameController.game_delta();
        this.groundTrack = vradial(vector);
        this.position = vadd(this.position, vector);
    }

    /**
     * This uses the current speed information to update the ground speed and position
     *
     * @for AircraftInstanceModel
     * @method updateSimpleGroundSpeedPhysics
     * @param scaleSpeed
     */
    updateSimpleGroundSpeedPhysics(scaleSpeed) {
        const angle = this.heading;

        this.ds = scaleSpeed;
        this.groundSpeed = this.speed;
        this.groundTrack = this.heading;
        this.position = vadd(this.position, vscale([sin(angle), cos(angle)], scaleSpeed));
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
        this.__fms__.followCheck();

        const wp = this.__fms__.currentWaypoint;
        // Populate strip fields with default values
        const defaultHeadingText = heading_to_string(this.fms.getHeading());
        const defaultAltitudeText = this.fms.getAltitude();
        const defaultDestinationText = _get(this, 'destination', window.airportController.airport_get().icao);
        const currentSpeedText = this.fms.getSpeed();

        let headingText;
        const altitudeText = this.taxi_next ? 'ready' : null;
        let destinationText = this.__fms__.getFollowingSIDText();
        const hasAltitude = _has(wp, 'altitude');
        const isFollowingSID = _isString(destinationText);
        const isFollowingSTAR = _isString(this.__fms__.following.star);
        const { fixRestrictions } = this.__fms__.currentWaypoint;

        this.aircraftStripView.update(defaultHeadingText, defaultAltitudeText, defaultDestinationText, currentSpeedText);

        switch (this.mode) {
            case FLIGHT_MODES.APRON:
                this.aircraftStripView.updateViewForApron(destinationText, hasAltitude);
                break;
            case FLIGHT_MODES.TAXI:
                this.aircraftStripView.updateViewForTaxi(destinationText, hasAltitude, altitudeText);
                break;
            case FLIGHT_MODES.WAITING:
                this.aircraftStripView.updateViewForWaiting(destinationText, hasAltitude);
                break;
            case FLIGHT_MODES.TAKEOFF:
                // When taking off...
                this.aircraftStripView.updateViewForTakeoff(destinationText);

                break;
            case FLIGHT_MODES.CRUISE:
                // When in normal flight...
                if (wp.navmode === WAYPOINT_NAV_MODE.FIX) {
                    headingText = wp.fix[0] === '_'
                        ? '[RNAV]'
                        : wp.fix;
                    destinationText = this.__fms__.getFollowingSTARText();
                } else if (wp.navmode === WAYPOINT_NAV_MODE.HOLD) {
                    headingText = 'holding';
                } else if (wp.navmode === WAYPOINT_NAV_MODE.RWY) {
                    headingText = 'intercept';
                    destinationText = this.__fms__.getDesinationIcaoWithRunway();
                }

                this.aircraftStripView.updateViewForCruise(wp.navmode, headingText, destinationText, isFollowingSID, isFollowingSTAR, fixRestrictions);

                break;
            case FLIGHT_MODES.LANDING:
                destinationText = this.__fms__.getDesinationIcaoWithRunway();

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

    // FIXME: Presumably the use of the 'delete' operator here is a bit of a no-no...
    /**
     * @for AircraftInstanceModel
     * @method removeConflict
     * @param {Aircraft} conflictingAircraft
     */
    removeConflict(conflictingAircraft) {
        delete this.conflicts[conflictingAircraft.getCallsign()];
    }
}
