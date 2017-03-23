/* eslint-disable max-len */
import $ from 'jquery';
import _defaultTo from 'lodash/defaultTo';
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _isEqual from 'lodash/isEqual';
import _isNil from 'lodash/isNil';
import AircraftFlightManagementSystem from './FlightManagementSystem/AircraftFlightManagementSystem';
import AircraftStripView from './AircraftStripView';
import Fms from './FlightManagementSystem/Fms';
import ModeController from './ModeControl/ModeController';
import Pilot from './Pilot/Pilot';
import { TIME } from '../constants/globalConstants';
import { speech_say } from '../speech';
import { tau, radians_normalize, angle_offset } from '../math/circle';
import { round, abs, sin, cos, extrapolate_range_clamp, clamp } from '../math/core';
import { getOffset, calculateTurnInitiaionDistance } from '../math/flightMath';
import { MCP_MODE, MCP_MODE_NAME } from './ModeControl/modeControlConstants';
import {
    vectorize_2d,
    vlen,
    vradial,
    vadd,
    vscale,
    distance_to_poly,
    point_to_mpoly,
    point_in_poly,
    point_in_area
} from '../math/vector';
import {
    digits_decimal,
    groupNumbers,
    radio_altitude,
    radio_spellOut
} from '../utilities/radioUtilities';
import {
    degreesToRadians,
    heading_to_string,
    km,
    nm,
    radiansToDegrees
} from '../utilities/unitConverters';
import {
    FLIGHT_CATEGORY,
    FLIGHT_MODES,
    FLIGHT_PHASE,
    FP_LEG_TYPE,
    PERFORMANCE,
    WAYPOINT_NAV_MODE
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
export default class AircraftInstanceModel {
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
        this.positionModel = null;       // Aircraft Position
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
        this.relativePositionHistory = [];

        this.category = options.category; // 'arrival' or 'departure'
        this.mode = FLIGHT_MODES.CRUISE;

        /**
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
            altitude: 0,
            expedite: false,
            heading: null,
            turn: null,
            speed: 0
        };

        this.takeoffTime = options.category === FLIGHT_CATEGORY.ARRIVAL
            ? window.gameController.game_time()
            : null;


        this.buildCurrentTerrainRanges();
        this.buildRestrictedAreaLinks();
        this.assignInitialRunway(options);
        this.parse(options);
        this.initFms(options);

        this.mcp = new ModeController();
        this.pilot = new Pilot(this.mcp, this.fms);

        // TODO: There are better ways to ensure the autopilot is on for aircraft spawning inflight...
        if (options.category === FLIGHT_CATEGORY.ARRIVAL) {
            // FIXME: No cheating by accessing private methods!!!
            const bottomAltitude = this.fms.getBottomAltitude();

            this.mcp._initializeForAirborneFlight(bottomAltitude, this.heading, this.speed);
        }

        this.createStrip();
        this.updateStrip();
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
     * Current flight phase
     *
     * @for AircraftInstanceModel
     * @property flightPhase
     * @type {string}
     */
    get flightPhase() {
        return this.fms.currentPhase;
    }

    /**
     * Fascade to access relative position
     *
     * @for AircraftInstanceModel
     * @property relativePosition
     * @type {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        return this.positionModel.relativePosition;
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

        switch (options.category) {
            case FLIGHT_CATEGORY.ARRIVAL:
                this.rwy_arr = runway;

                break;
            case FLIGHT_CATEGORY.DEPARTURE:
                this.rwy_dep = runway;

                break;
            default:
                break;
        }
    }

    parse(data) {
        // FIXME: these _gets can likely be removed
        this.positionModel = _get(data, 'positionModel', this.positionModel);
        this.model = _get(data, 'model', this.model);
        this.airlineId = _get(data, 'airline', this.airlineId);
        this.airlineCallsign = _get(data, 'airlineCallsign', this.airlineCallsign);
        this.callsign = _get(data, 'callsign', this.callsign);
        this.category = _get(data, 'category', this.category);
        this.heading = _get(data, 'heading', this.heading);
        this.altitude = _get(data, 'altitude', this.altitude);
        this.speed = _get(data, 'speed', this.speed);
        this.destination = _get(data, 'destination', this.destination);
        this.inside_ctr = data.category === FLIGHT_CATEGORY.DEPARTURE;
    }

    initFms(data) {
        this.fms = new Fms(data, this.initialRunwayAssignment, this.model, this._navigationLibrary);
        console.log('::: FMS', this.fms);

        if (this.category === FLIGHT_CATEGORY.DEPARTURE) {
            const airport = window.airportController.airport_get();

            this.mode = FLIGHT_MODES.APRON;
            this.altitude = airport.positionModel.elevation;
            this.speed = 0;

            return;
        } else if (this.category !== FLIGHT_CATEGORY.ARRIVAL) {
            throw new Error('Invalid #category found in AircraftInstanceModel');
        }

        // FIXME: this should probably move
        // this.fms.setHeadingHold(data.heading);
        // this.fms.setAltitudeHold(data.altitude);
        // this.fms.setSpeedHold(data.speed);

        if (data.nextFix) {
            this.fms.skipToWaypoint(data.nextFix);
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
            return this.arrivalExit();
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
     * @return cs {string}
     */
    getRadioCallsign() {
        let heavy;
        let radioCallsign;

        if (this.model.weightclass === 'H') {
            heavy = ' heavy';
        }

        if (this.model.weightclass === 'U') {
            heavy = ' super';
        }

        if (this.airlineCallsign !== 'November') {
            radioCallsign += ` ${radio_spellOut(this.airlineCallsign)} ${heavy}`;
        } else {
            radioCallsign += ` ${groupNumbers(this.flightNumber, this.airlineCallsign)} ${heavy}`;
        }

        return radioCallsign;
    }

    // TODO: this method should move to the `AircraftTypeDefinitionModel`
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
     * @method cancelFix
     */
    cancelFix() {
        this.fms.cancelFix();

        // if (this.__fms__.currentWaypoint.navmode !== WAYPOINT_NAV_MODE.FIX) {
        //     return false;
        // }
        //
        // const curr = this.__fms__.currentWaypoint;
        //
        // this.__fms__.appendLeg({
        //     altitude: curr.altitude,
        //     navmode: WAYPOINT_NAV_MODE.HEADING,
        //     heading: this.heading,
        //     speed: curr.speed
        // });
        //
        // this.__fms__.nextLeg();
        this.updateStrip();

        // return true;
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
        this.history.push([this.positionModel.relativePosition[0], this.positionModel.relativePosition[1]]);

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
     * Return whether the aircraft is off the ground
     *
     * @for AircraftInstanceModel
     * @method isAirborne
     * @return {boolean}
     */
    isAirborne() {
        return !this.isOnGround();
    }

    /**
     * Aircraft is established on FINAL APPROACH COURSE
     * @for AircraftInstanceModel
     * @method runTakeoff
     */
    isEstablished() {
        const runway = window.airportController.airport_get().getRunway(this.fms.currentRunwayName);
        const runwayHeading = runway.angle;
        const approachOffset = getOffset(this, runway.relativePosition, runwayHeading);
        const lateralDistanceFromCourse_nm = abs(nm(approachOffset[0]));
        const onApproachCourse = lateralDistanceFromCourse_nm <= PERFORMANCE.MAXIMUM_DISTANCE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE_NM;
        const heading_diff = abs(angle_offset(this.heading, runwayHeading));
        const onCorrectHeading = heading_diff < PERFORMANCE.MAXIMUM_ANGLE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE;

        return onApproachCourse && onCorrectHeading;
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
            withinAirspaceLateralBoundaries = point_in_area(this.positionModel.relativePosition, airport.perimeter);
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
        const errorAllowanceInFeet = 5;
        const airport = window.airportController.airport_get();
        const runway = airport.getRunway(this.initialRunwayAssignment);
        const nearRunwayAltitude = abs(this.altitude - runway.elevation) < errorAllowanceInFeet;
        const nearAirportAltitude = abs(this.altitude - airport.positionModel.elevation) < errorAllowanceInFeet;

        return nearRunwayAltitude || nearAirportAltitude;
    }

    // TODO: Possible duplicate
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
        return this.isEstablished();
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
     * Return whether the aircraft is in flight AND below its stall speed
     *
     * @for AircraftInstanceModel
     * @method isStalling
     * @return {boolean}
     */
    isStalling() {
        const isStalling = this.speed < this.model.speed.min && this.isAirborne();

        return isStalling;
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
     * Returns whether the aircraft is currently taking off
     *
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

    // TODO: this should be a method in the `AirportModel`
    /**
     * @for AircraftInstanceModel
     * @method getWind
     */
    getWind() {
        const windForRunway = {
            cross: 0,
            head: 0
        };

        if (!this.rwy_dep) {
            return;
        }

        const airport = window.airportController.airport_get();
        const wind = airport.wind;
        const runway = airport.getRunway(this.rwy_dep);
        const angle =  abs(angle_offset(runway.angle, wind.angle));

        // TODO: these two bits of math should be abstracted to helper functions
        windForRunway.cross = sin(angle) * wind.speed;
        windForRunway.head = cos(angle) * wind.speed;

        return windForRunway;
    }

    /**
     * Reposition the aircraft to the location of the specified runway
     *
     * @for AircraftInstanceModel
     * @method moveToRunway
     * @param runwayModel {RunwayModel}
     */
    moveToRunway(runwayModel) {
        this.positionModel.setCoordinates(runwayModel.positionModel.gps);
        this.heading = runwayModel.angle;
        this.altitude = runwayModel.elevation;
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
            const altdiff = this.altitude - this.pilot.sayTargetedAltitude();
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

    /* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv THESE SHOULD STAY vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
    /**
     * Update the aircraft's targeted telemetry (altitude, heading, and speed)
     *
     * @for AircraftInstanceModel
     * @method updateTarget
     */
    updateTarget() {
        this.target.expedite = _defaultTo(this.fms.currentWaypoint.expedite, false);
        this.target.altitude = _defaultTo(this._calculateTargetedAltitude(), this.target.altitude);
        this.target.heading = _defaultTo(this._calculateTargetedHeading(), this.target.heading);
        this.target.speed = _defaultTo(this._calculateTargetedSpeed(), this.target.speed);
    }

    /**
     * @for AircraftInstanceModel
     * @method overrideTarget
     */
    overrideTarget() {
        switch (this.flightPhase) {
            case FLIGHT_PHASE.APRON:
                this.target.altitude = this.altitude;
                this.target.expedite = false;
                this.target.heading = this.heading;
                this.target.speed = 0;

                break;

            case FLIGHT_PHASE.TAXI:
                this.target.altitude = this.altitude;
                this.target.expedite = false;
                this.target.heading = this.heading;
                this.target.speed = 0;

                break;

            case FLIGHT_PHASE.WAITING:
                this.target.altitude = this.altitude;
                this.target.expedite = false;
                this.target.heading = this.heading;
                this.target.speed = 0;

                break;

            case FLIGHT_PHASE.TAKEOFF: {
                this.target.altitude = this.altitude;

                if (this.speed > this.model.speed.min) {
                    this.target.altitude = this.model.ceiling;
                }

                this.target.expedite = false;
                this.target.heading = this.heading;
                this.target.speed = this.model.speed.min;

                // TODO: Enumerate the '-999' invalid value
                if (this.mcp.heading === -999) {
                    console.warn(`${this.getCallsign()} took off with no directional instructions!`);
                }

                break;
            }

            case FLIGHT_PHASE.CLIMB:
                break;

            case FLIGHT_PHASE.CRUISE:
                break;

            case FLIGHT_PHASE.HOLD:
                break;

            case FLIGHT_PHASE.DESCENT:
                break;

            case FLIGHT_PHASE.APPROACH: {
                // // FIXME: this is wrong
                // this.target.expedite = this.__fms__.currentWaypoint.expedite;
                // this.target.altitude = Math.max(1000, this.pilot.sayTargetedAltitude());
                // // this.target.speed = _get(this, 'fms.currentWaypoint.speed', this.speed);
                // this.target.speed = clamp(this.model.speed.min, this.pilot.sayTargetedSpeed(), this.model.speed.max);

                break;
            }

            case FLIGHT_PHASE.LANDING:
                break;

            default:
                break;
        }

        // If stalling, make like a meteorite and fall to the earth!
        if (this.isStalling()) {
            this.target.altitude = Math.min(0, this.target.altitude);
        }

        // Limit speed to 250 knots while under 10,000 feet MSL (it's the law!)
        if (this.altitude < 10000) {
            this.target.speed = Math.min(this.target.speed, 250);
        }
    }

    /**
     * Fascade to set the fms's flight phase
     *
     * @for AircraftInstanceModel
     * @method setFlightPhase
     * @param phase {string}
     */
    setFlightPhase(phase) {
        this.fms.setFlightPhase(phase);
    }

    // TODO: This probably doesn't belong in the aircraft. More thought needed.
    // FIXME: This is filled with nonsensical jibber jabber! :(
    /**
     * Update the FMS's flight phase
     *
     * @for AircraftInstanceModel
     * @method updateFlightPhase
     */
    updateFlightPhase() {
        const airportModel = window.airportController.airport_get();
        const runwayModel = airportModel.getRunway(this.rwy_dep);

        // TODO: abstract boolean logic to class method
        if (this.flightPhase !== FLIGHT_PHASE.HOLD && this.fms.currentWaypoint.isHold) {
            this.setFlightPhase(FLIGHT_PHASE.HOLD);

            return;
        }

        switch (this.flightPhase) {
            case FLIGHT_PHASE.TAXI: {
                const elapsed = window.gameController.game_time() - this.taxi_start;

                if (elapsed > this.taxi_time) {
                    this.setFlightPhase(FLIGHT_PHASE.WAITING);
                    this.moveToRunway(runwayModel);
                }

                break;
            }

            case FLIGHT_PHASE.WAITING:
                break;

            case FLIGHT_PHASE.TAKEOFF:
                if ((this.altitude - runwayModel.elevation) > PERFORMANCE.TAKEOFF_TURN_ALTITUDE) {
                    this.setFlightPhase(FLIGHT_PHASE.CLIMB);
                }

                break;

            case FLIGHT_PHASE.CLIMB:
                if (this.altitude === this.fms.flightPlanAltitude) {
                    this.setFlightPhase(FLIGHT_PHASE.CRUISE);
                }

                break;

            case FLIGHT_PHASE.CRUISE:
                if (this.altitude < this.fms.flightPlanAltitude) {
                    this.setFlightPhase(FLIGHT_PHASE.DESCENT);
                }

                break;

            case FLIGHT_PHASE.DESCENT:
                if (this.pilot.hasApproachClearance) {
                    this.setFlightPhase(FLIGHT_PHASE.APPROACH);
                }

                break;

            case FLIGHT_PHASE.APPROACH: {
                if (this.altitude < PERFORMANCE.INSTRUMENT_APPROACH_MINIMUM_DESCENT_ALTITUDE) {
                    this.setFlightPhase(FLIGHT_PHASE.LANDING);
                }

                break;
            }

            case FLIGHT_PHASE.LANDING:
                break;

            default:
                break;

        }
    }

    /**
     * Calculate the aircraft's targeted heading
     *
     * @for AircraftInstanceModel
     * @method _calculateTargetedHeading
     * @private
     */
    _calculateTargetedHeading() {
        if (this.mcp.autopilotMode !== MCP_MODE.AUTOPILOT.ON) {
            return;
        }

        if (this.fms.currentWaypoint.isHold) {
            this.updateTargetPrepareAircraftForHold();

            return;
        }

        switch (this.mcp.headingMode) {
            case MCP_MODE.HEADING.OFF:
                return this.heading;

            case MCP_MODE.HEADING.HOLD:
                return this.mcp.heading;

            case MCP_MODE.HEADING.LNAV: {
                return this._calculateTargetedHeadingLnav();
            }

            case MCP_MODE.HEADING.VOR_LOC:
                // TODO: fill out this function
                return this._calculateTargetedHeadingToInterceptCourse();

            default:
                console.warn('Expected MCP heading mode of "OFF", "HOLD", "LNAV", or "VOR", ' +
                    `but received "${this.mcp.headingMode}"`);
                return this.heading;
        }
    }

    /**
     * Calculate the aircraft's targeted speed
     *
     * @for AircraftInstanceModel
     * @method _calculateTargetedSpeed
     * @private
     */
    _calculateTargetedSpeed() {
        if (this.mcp.autopilotMode !== MCP_MODE.AUTOPILOT.ON) {
            return;
        }

        switch (this.mcp.speedMode) {
            case MCP_MODE.SPEED.OFF:
                return this.speed;

            case MCP_MODE.SPEED.HOLD:
                return this.mcp.speed;

            // future functionality
            // case MCP_MODE.SPEED.LEVEL_CHANGE:
            //     return;

            case MCP_MODE.SPEED.N1:
                return this.model.speed.max;

            case MCP_MODE.SPEED.VNAV: {
                const maxSpeed = this.mcp.speed;
                const waypointSpeed = this.fms.currentWaypoint.speedRestriction;
                const waypointHasSpeed = waypointSpeed !== -1;

                if (waypointHasSpeed) {
                    return waypointSpeed;
                }

                return maxSpeed;
            }

            default:
                console.warn('Expected MCP speed mode of "OFF", "HOLD", "LEVEL_CHANGE", "N1", or "VNAV", but ' +
                    `received "${this.mcp[MCP_MODE_NAME.SPEED]}"`);
                return this.speed;
        }
    }

    /**
     * Calculate the aircraft's targeted altitude
     *
     * @for AircraftInstanceModel
     * @method _calculateTargetedAltitude
     * @private
     */
    _calculateTargetedAltitude() {
        if (this.mcp.autopilotMode !== MCP_MODE.AUTOPILOT.ON) {
            return;
        }

        switch (this.mcp.altitudeMode) {
            case MCP_MODE.ALTITUDE.OFF:
                return this.altitude;

            case MCP_MODE.ALTITUDE.HOLD:
                return this.mcp.altitude;

            case MCP_MODE.ALTITUDE.APPROACH:
                return this._calculateTargetedAltitudeToInterceptGlidepath();

            // future functionality
            // case MCP_MODE.ALTITUDE.LEVEL_CHANGE:
            //     return;

            // future functionality
            // case MCP_MODE.ALTITUDE.VERTICAL_SPEED:
            //     return;

            case MCP_MODE.ALTITUDE.VNAV: {
                const waypointAltitude = this.fms.currentWaypoint.altitudeRestriction;
                const waypointHasAltitude = waypointAltitude !== -1;
                const endingAltitude = this.mcp.altitude;
                const flightPhase = this.flightPhase;

                if (!waypointHasAltitude) {
                    return endingAltitude;
                }

                if (flightPhase === FLIGHT_PHASE.CLIMB) {
                    return Math.min(waypointAltitude, endingAltitude);
                }

                if (flightPhase === FLIGHT_PHASE.DESCENT) {
                    return Math.max(waypointAltitude, endingAltitude);
                }

                break;
            }

            default:
                console.warn('Expected MCP altitude mode of "OFF", "HOLD", "APPROACH", "LEVEL_CHANGE", ' +
                    `"VERTICAL_SPEED", or "VNAV", but received "${this.mcp[MCP_MODE_NAME.ALTITUDE]}"`);
                return;
        }
    }

    /**
     * Calculate the altitude to target while intercepting a vertically aligned course
     *
     * @for AircraftInstanceModel
     * @method _calculateTargetedAltitudeToInterceptGlidepath
     * @private
     */
    _calculateTargetedAltitudeToInterceptGlidepath() {
        const runway = window.airportController.airport_get().getRunway(this.rwy_arr);
        const distanceFromThreshold_km = getOffset(this.positionModel, runway.relativePosition, runway.angle);
        const glideslopeAltitude = runway.getGlideslopeAltitude(distanceFromThreshold_km[1]);
        const targetAltitude = clamp(runway.elevation, glideslopeAltitude, this.altitude);

        return targetAltitude;
    }

    /**
     * Calculate the heading to target while intercepting a horizontally aligned course
     *
     * @for AircraftInstanceModel
     * @method _calculateTargetedHeadingToInterceptCourse
     * @private
     */
    _calculateTargetedHeadingToInterceptCourse() {
        // TODO: abstract this to be not specific to ILS interception, but interception of a 'course' to a 'datum'

        // Guide aircraft onto the localizer
        const runway = window.airportController.airport_get().getRunway(this.fms.currentRunwayName);
        const runwayHeading = radians_normalize(runway.angle);
        const approachOffset = getOffset(this, runway.relativePosition, runwayHeading);
        const lateralDistanceFromCourse_nm = nm(approachOffset[0]);
        const angle_diff = angle_offset(runwayHeading, this.heading);
        const bearingFromAircaftToRunway = this.positionModel.bearingToPosition(runway.positionModel);
        const angleAwayFromLocalizer = runwayHeading - bearingFromAircaftToRunway;
        // TODO: abstract to helper function
        const turning_time = Math.abs(radiansToDegrees(angle_diff / PERFORMANCE.TURN_RATE));    // time to turn angle_diff degrees at 3 deg/s
        // TODO: abstract to helper function
        const turning_radius = (this.speed * TIME.ONE_HOUR_IN_SECONDS) * turning_time;  // dist covered in the turn, nm
        // TODO: abstract to helper function
        const dist_to_localizer = lateralDistanceFromCourse_nm / sin(angle_diff); // dist from the localizer intercept point, nm
        const turn_early_nm = 0.5;    // start turn early, to avoid overshoots from tailwind
        const should_attempt_intercept = (dist_to_localizer > 0 && dist_to_localizer <= turning_radius + turn_early_nm);
        const in_the_window = abs(angleAwayFromLocalizer) < degreesToRadians(1.5);  // if true, aircraft will move to localizer, regardless of assigned heading

        // TODO: the logic here should be reversed to return early
        if (should_attempt_intercept || in_the_window) {  // time to begin turn
            // TODO: abstract to helper function
            const severity_of_correction = 25.0;  // controls steepness of heading adjustments during localizer tracking
            const tgtHdg = runwayHeading + (angleAwayFromLocalizer * -severity_of_correction);
            const minHdg = runwayHeading - degreesToRadians(30);
            const maxHdg = runwayHeading + degreesToRadians(30);
            const targetHeading = clamp(tgtHdg, minHdg, maxHdg);

            return targetHeading;
        }
    }
    /* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ THESE SHOULD STAY ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */

    /* vvvvvvvvvvv THESE SHOULD BE EXAMINED AND EITHER REMOVED OR MOVED ELSEWHERE vvvvvvvvvvv */
    /**
     * Prepares the aircraft for landing
     *
     * @for AircraftInstanceModel
     * @method updateTargetPrepareAircraftForLanding
     */
    updateTargetPrepareAircraftForLanding() {
        const airport = window.airportController.airport_get();
        const runway  = airport.getRunway(this.rwy_arr);
        // TODO: abstract to RunwayModel method
        const offset = getOffset(this, runway.relativePosition, runway.angle);
        const offset_angle = vradial(offset);
        // TODO: abstract to RunwayModel method
        const angle = radians_normalize(runway.angle);
        // TODO: abstract to RunwayModel method
        const glideslope_altitude = clamp(runway.elevation, runway.getGlideslopeAltitude(offset[1]), this.altitude);
        // const assignedHdg = this.__fms__.currentWaypoint.heading;
        const localizerRange = runway.ils.enabled
            ? runway.ils.loc_maxDist :
            40;
        this.offset_angle = offset_angle;
        this.approachOffset = abs(offset[0]);
        this.approachDistance = offset[1];
        this.target.heading = this.mcp.heading;
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
            // TODO: Should be moved to where the output is handled
            window.gameController.events_recordNew(GAME_EVENTS.GO_AROUND);
            window.uiController.ui_log(`${this.getRadioCallsign()} aborting landing, lost ILS`, isWarning);

            speech_say([
                { type: 'callsign', content: this },
                { type: 'text', content: ' going around' }
            ]);
        }
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

    // TODO: More Simplification of this function should be done, abstract warings to their own functions
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
     * @method _calculateTargetedHeadingLnav
     */
    _calculateTargetedHeadingLnav() {
        if (!this.fms.currentWaypoint) {
            return new Error('Unable to utilize LNAV, because there are no waypoints in the FMS');
        }

        const waypointPosition = this.fms.currentWaypoint.positionModel;
        const distanceToWaypoint = this.positionModel.distanceToPosition(waypointPosition);
        const headingToWaypoint = this.positionModel.bearingToPosition(waypointPosition);
        const isTimeToStartTurning = distanceToWaypoint < nm(calculateTurnInitiaionDistance(this, waypointPosition));
        const closeToBeingOverFix = distanceToWaypoint < PERFORMANCE.MAXIMUM_DISTANCE_TO_PASS_WAYPOINT_NM;
        const closeEnoughToFlyByFix = distanceToWaypoint < PERFORMANCE.MAXIMUM_DISTANCE_TO_FLY_BY_WAYPOINT_NM;
        const shouldMoveToNextFix = closeToBeingOverFix || (closeEnoughToFlyByFix && isTimeToStartTurning);

        if (shouldMoveToNextFix) {
            if (!this.fms.hasNextWaypoint()) {
                // we've hit this block becuase and aircraft is about to fly over the last waypoint in its flightPlan
                this.pilot.maintainPresentHeading(this.heading);

                return headingToWaypoint;
            }

            this.fms.nextWaypoint();
        }

        return headingToWaypoint;
    }

    /**
     * This will sets up and prepares the aircraft to hold
     *
     * @for AircraftInstanceModel
     * @method updateTargetPrepareAircraftForHold
     */
    updateTargetPrepareAircraftForHold() {
        const invalidTimerValue = -999;
        const hold = this.fms.currentWaypoint.hold;
        const angle_off_of_leg_hdg = abs(angle_offset(this.heading, this.mcp.heading));
        const offset = getOffset(this, hold.fixPos);
        const shouldEnterHold = hold.timer === invalidTimerValue && offset[1] < 0 && offset[2] < 2;
        const holdLegDurationInSeconds = hold.timer + parseInt(hold.legLength.replace('min', ''), 10) * TIME.ONE_MINUTE_IN_SECONDS;

        // TODO: only enter hold if near fix

        // TODO: early return
        // within ~2° of upwd/dnwd
        if (angle_off_of_leg_hdg < 0.035) {
            // entering hold, just passed the fix
            if (shouldEnterHold) {
                // Force aircraft to enter the hold immediately
                this.fms.currentWaypoint.timer = invalidTimerValue;
            }

            // TODO: add class property that converts hold time to correct unit
            // TODO: remove `includes`, this should be handled by the CommandParser
            // Holding Logic
            // time-based hold legs
            // if (hold.timer && hold.legLength.includes('min')) {
                if (hold.timer === invalidTimerValue) {
                    // save the time
                    this.fms.currentWaypoint.timer = window.gameController.game.time;
                } else if (window.gameController.game.time >= holdLegDurationInSeconds) {
                    // turn to other leg
                    this.target.heading += Math.PI;
                    this.target.turn = hold.dirTurns;
                    // reset the timer
                    this.fms.currentWaypoint.timer = invalidTimerValue;
                }
                // TODO: add distance based hold
            // }
        }
    }
    /* ^^^^^^^^^^^ THESE SHOULD BE EXAMINED AND EITHER REMOVED OR MOVED ELSEWHERE ^^^^^^^^^^^ */

    /* vvvvvvv THESE HAVE ELEMENTS THAT SHOULD BE MOVED INTO THE PHYSICS CALCULATIONS vvvvvvv */
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
    /* ^^^^^^^ THESE HAVE ELEMENTS THAT SHOULD BE MOVED INTO THE PHYSICS CALCULATIONS ^^^^^^^ */

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

        if (!this.positionModel) {
            return;
        }

        // TODO: abstract to AircraftPositionHistory class
        // Trailling
        if (this.relativePositionHistory.length === 0) {
            this.relativePositionHistory.push([
                this.positionModel.relativePosition[0],
                this.positionModel.relativePosition[1],
                window.gameController.game_time() / window.gameController.game_speedup()
            ]);
            // TODO: this can be abstracted
        } else if (abs((window.gameController.game_time() / window.gameController.game_speedup()) - this.relativePositionHistory[this.relativePositionHistory.length - 1][2]) > 4 / window.gameController.game_speedup()) {
            this.relativePositionHistory.push([this.positionModel.relativePosition[0], this.positionModel.relativePosition[1], window.gameController.game_time() / window.gameController.game_speedup()]);
        }

        this.updateGroundSpeedPhysics();

        // if (window.gameController.game.option.get('simplifySpeeds') === 'no') {
        //     this.updateGroundSpeedPhysics(scaleSpeed);
        // } else {
        //     this.updateSimpleGroundSpeedPhysics(scaleSpeed);
        // }

        this.distance = vlen(this.positionModel.relativePosition);
        this.radial = vradial(this.positionModel.relativePosition);

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
        if (this.isOnGround() || this.heading === this.target.heading) {
            return;
        }

        const secondsElapsed = window.gameController.game_delta();
        const angle_diff = angle_offset(this.target.heading, this.heading);
        const angle_change = PERFORMANCE.TURN_RATE * secondsElapsed;

        if (abs(angle_diff) <= angle_change) {
            this.heading = this.target.heading;
        } else if (angle_diff < 0 && this.target.turn !== 'right') {
            this.heading -= angle_change;
        } else if (angle_diff > 0 && this.target.turn !== 'left') {
            this.heading += angle_change;
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
        const altitude_diff = this.altitude - this.target.altitude;
        let descentRate = this.model.rate.descent * PERFORMANCE.TYPICAL_DESCENT_FACTOR;

        if (this.target.expedite) {
            descentRate = this.model.rate.descent;
        }

        const feetPerSecond = descentRate * TIME.ONE_SECOND_IN_MINUTES;
        const feetDescended = feetPerSecond * window.gameController.game_delta();

        if (abs(altitude_diff) < feetDescended) {
            this.altitude = this.target.altitude;
        } else {
            this.altitude -= feetDescended;
        }

        this.trend -= 1;
    }

    /**
    * Increases the aircrafts altitude
    *
    * @for AircraftInstanceModel
    * @method increaseAircraftAltitude
    */
    increaseAircraftAltitude() {
        const altitude_diff = this.altitude - this.target.altitude;
        let climbRate = this.getClimbRate() * PERFORMANCE.TYPICAL_CLIMB_FACTOR;

        if (this.target.expedite) {
            climbRate = this.model.rate.climb;
        }

        const feetPerSecond = climbRate * TIME.ONE_SECOND_IN_MINUTES;
        const feetClimbed = feetPerSecond * window.gameController.game_delta();


        if (abs(altitude_diff) < abs(feetClimbed)) {
            this.altitude = this.target.altitude;
        } else {
            this.altitude += feetClimbed;
        }

        this.trend = 1;
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
    updateGroundSpeedPhysics() {
        if (window.gameController.game.option.get('simplifySpeeds') === 'yes') {
            return this.updateSimpleGroundSpeedPhysics();
        }

        // TODO: Much of this should be abstracted to helper functions

        // Calculate true air speed vector
        const trueAirspeedIncreaseFactorPerFoot = 0.000016; // 0.16% per thousand feet
        const indicatedAirspeed = this.speed;
        const trueAirspeed = indicatedAirspeed * (1 + (this.altitude * trueAirspeedIncreaseFactorPerFoot));
        const flightThroughAirVector = vscale(vectorize_2d(this.heading), trueAirspeed);

        // Calculate wind vector
        const windIncreaseFactorPerFoot = 0.00002;  // 2.00% per thousand feet
        const wind = window.airportController.airport_get().wind;
        const windTravelDirection = wind.angle + Math.PI;
        const windTravelSpeedAtSurface = wind.speed;
        const windTravelSpeed = windTravelSpeedAtSurface * (1 + (this.altitude * windIncreaseFactorPerFoot));
        const windVector = vscale(vectorize_2d(windTravelDirection), windTravelSpeed);


        // Calculate ground speed and direction
        const flightPathVector = vadd(flightThroughAirVector, windVector);
        const groundTrack = vradial(flightPathVector);
        const groundSpeed = vlen(flightPathVector);

        // Calculate new position
        const hoursElapsed = window.gameController.game_delta() * TIME.ONE_SECOND_IN_HOURS;
        const distanceTraveled_nm = groundSpeed * hoursElapsed;

        this.positionModel.setCoordinatesByBearingAndDistance(groundTrack, distanceTraveled_nm);

        // FIXME: Fix this to prevent drift (being blown off course)
        // if (this.isOnGround()) {
        //     vector = vscale([sin(angle), cos(angle)], trueAirSpeed);
        // } else {
        //     let crab_angle = 0;
        //
        //     // Compensate for crosswind while tracking a fix or on ILS
        //     if (this.__fms__.currentWaypoint.navmode === WAYPOINT_NAV_MODE.FIX || this.mode === FLIGHT_MODES.LANDING) {
        //         // TODO: this should be abstracted to a helper function
        //         const offset = angle_offset(this.heading, wind.angle + Math.PI);
        //         crab_angle = Math.asin((wind.speed * sin(offset)) / indicatedAirspeed);
        //     }
        //
        //     // TODO: this should be abstracted to a helper function
        //     vector = vadd(vscale(
        //         vturn(wind.angle + Math.PI),
        //         wind.speed * 0.000514444 * window.gameController.game_delta()),
        //         vscale(vturn(angle + crab_angle), trueAirSpeed)
        //     );
        // }
    }

    /**
     * This uses the current speed information to update the ground speed and position
     *
     * @for AircraftInstanceModel
     * @method updateSimpleGroundSpeedPhysics
     * @param scaleSpeed
     */
    updateSimpleGroundSpeedPhysics() {
        const hoursElapsed = window.gameController.game_delta() * TIME.ONE_SECOND_IN_HOURS;
        const distanceTraveled_nm = this.speed * hoursElapsed;

        this.positionModel.setCoordinatesByBearingAndDistance(this.heading, distanceTraveled_nm);

        // TODO: Is this nonsense actually needed, or can we remove it?
        this.groundSpeed = this.speed;
        this.groundTrack = this.heading;
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
        if (this.positionModel) {
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
                    new_inside = point_in_poly(this.positionModel.relativePosition, area.data.coordinates);

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
                        distance_to_poly(this.positionModel.relativePosition, area.data.coordinates));
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
                    status = point_to_mpoly(this.positionModel.relativePosition, area, id);

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

        this.updateFlightPhase();
        this.updateTarget();
        this.updatePhysics();
        this.updateStrip();
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
        delete this.conflicts[conflictingAircraft.getCallsign()];
    }

    /**
     * Create the aircraft's flight strip and add to strip bay
     */
    createStrip() {
        this.aircraftStripView = new AircraftStripView(this);

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
    }

    // TODO: move these view methods to `AircraftStripView` or a different file
    /**
     * @for AircraftInstanceModel
     * @method updateStrip
     */
    updateStrip() {
        if (this.projected) {
            return;
        }

        const heading = heading_to_string(this.mcp.heading);
        const altitude = this.mcp.altitude;
        const speed = this.mcp.speed;

        let destinationDisplay = !this.mcp.isEnabled
            ? this.destination
            : this.fms.getProcedureAndExitName();
        const altitudeText = this.taxi_next
            ? 'ready'
            : null;
        const hasAltitude = this.mcp.altitude !== -1;

        this.aircraftStripView.update(heading, altitude, this.destination, speed);

        switch (this.mode) {
            case FLIGHT_MODES.APRON:
                this.aircraftStripView.updateViewForApron(destinationDisplay, hasAltitude);

                break;
            case FLIGHT_MODES.TAXI:
                this.aircraftStripView.updateViewForTaxi(destinationDisplay, hasAltitude, altitudeText);

                break;
            case FLIGHT_MODES.WAITING:
                this.aircraftStripView.updateViewForWaiting(destinationDisplay, this.mcp.isEnabled, hasAltitude);

                break;
            case FLIGHT_MODES.TAKEOFF:
                this.aircraftStripView.updateViewForTakeoff(destinationDisplay);

                break;
            case FLIGHT_MODES.CRUISE:
                let cruiseNavMode = WAYPOINT_NAV_MODE.FIX;
                let headingDisplay = this.fms.currentWaypoint.name.toUpperCase();
                const isFollowingSid = this.fms.isFollowingSid();
                const isFollowingStar = this.fms.isFollowingStar();
                const fixRestrictions = {
                    altitude: this.fms.currentWaypoint.altitudeRestriction !== -1,
                    speed: this.fms.currentWaypoint.speedRestriction !== -1
                };
                destinationDisplay = this.fms.getProcedureAndExitName();

                if (this.fms.currentLeg.isHold) {
                    cruiseNavMode = WAYPOINT_NAV_MODE.HOLD;
                    headingDisplay = 'holding';
                    destinationDisplay = this.fms.getDestinationName();
                } else if (this.mcp.headingMode === MCP_MODE.HEADING.HOLD) {
                    headingDisplay = this.mcp.headingInDegrees;
                    destinationDisplay = this.fms.getDestinationName();
                } else if (this.mcp.headingMode === MCP_MODE.HEADING.VOR_LOC) {
                    cruiseNavMode = WAYPOINT_NAV_MODE.RWY;
                    headingDisplay = 'intercept';
                    destinationDisplay = this.fms.getDestinationAndRunwayName();
                }

                this.aircraftStripView.updateViewForCruise(
                    cruiseNavMode,
                    headingDisplay,
                    destinationDisplay,
                    isFollowingSid,
                    isFollowingStar,
                    fixRestrictions
                );

                break;
            case FLIGHT_MODES.LANDING:
                destinationDisplay = this.fms.getDestinationAndRunwayName();

                this.aircraftStripView.updateViewForLanding(destinationDisplay);

                break;
            default:
                throw new TypeError(`Invalid FLIGHT_MODE ${this.mode} passed to .updateStrip()`);
        }
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

    /**
     * @for AircraftInstanceModel
     * @method hideStrip
     */
    hideStrip() {
        this.$html.hide(600);
    }

    cleanup() {
        this.$html.remove();
    }
}
