/* eslint-disable max-len, no-undef */
import $ from 'jquery';
import _clamp from 'lodash/clamp';
import _defaultTo from 'lodash/defaultTo';
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _isEqual from 'lodash/isEqual';
import _isNil from 'lodash/isNil';
import _uniqueId from 'lodash/uniqueId';
import AircraftStripView from './AircraftStripView';
import Fms from './FlightManagementSystem/Fms';
import ModeController from './ModeControl/ModeController';
import Pilot from './Pilot/Pilot';
import { speech_say } from '../speech';
import { tau, radians_normalize, angle_offset } from '../math/circle';
import { abs, cos, extrapolate_range_clamp, sin, spread } from '../math/core';
import { getOffset, calculateTurnInitiaionDistance } from '../math/flightMath';
import {
    distance_to_poly,
    point_to_mpoly,
    point_in_poly,
    point_in_area,
    vadd,
    vectorize_2d,
    vlen,
    vradial,
    vscale,
    vsub
} from '../math/vector';
import {
    digits_decimal,
    groupNumbers,
    radio_altitude
} from '../utilities/radioUtilities';
import {
    degreesToRadians,
    heading_to_string,
    km,
    nm,
    UNIT_CONVERSION_CONSTANTS
} from '../utilities/unitConverters';
import {
    FLIGHT_CATEGORY,
    FLIGHT_PHASE,
    PERFORMANCE,
    WAYPOINT_NAV_MODE
} from '../constants/aircraftConstants';
import { AIRPORT_CONSTANTS, AIRPORT_CONTROL_POSITION_NAME } from '../constants/airportConstants';
import { SELECTORS } from '../constants/selectors';
import { GAME_EVENTS } from '../game/GameController';
import { MCP_MODE, MCP_MODE_NAME } from './ModeControl/modeControlConstants';
import { TIME } from '../constants/globalConstants';

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
        this._id = _uniqueId('aircraft-');
        this._navigationLibrary = navigationLibrary;
        this.positionModel = null;       // Aircraft Position
        this.model        = null;       // Aircraft type
        this.airlineId      = '';         // Airline Identifier (eg. 'AAL')
        this.airlineCallsign = '';
        this.flightNumber = '';         // Flight Number ONLY (eg. '551')
        this.heading      = 0;          // Magnetic Heading
        this.altitude     = 0;          // Altitude, ft MSL
        this.speed        = 0;          // Indicated Airspeed (IAS), knots
        this.groundSpeed  = 0;          // Groundspeed (GS), knots
        this.groundTrack  = 0;          //
        this.takeoffTime  = 0;          //
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

        /**
         * Flag used to determine if an aircraft is established on a holding pattern
         *
         * This is switched to true after the first turn of a holding pattern is made.
         * This allows for offset calculations to be performed on the legLength to
         * account for the time it takes to make a turn from one leg to the next
         * in a holding pattern.
         *
         * @property _isEstablishedOnHoldingPattern
         * @type {boolean}
         * @default false
         * @private
         */
        this._isEstablishedOnHoldingPattern = false;

        /**
         * Flag used to determine if an aircraft can be removed from the sim.
         *
         * This tells the `AircraftController` that this instance is safe to remove.
         * This property should only be changed via the `.setIsRemovable()` method.
         *
         * @property isRemovable
         * @type {boolean}
         * @default false
         */
        this.isRemovable = false;

        // TODO: change name, and update refs in `InputController`. perhaps change to be a ref to the AircraftStripView class instead of directly accessing the html?
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

        /**
         * the following diagram illustrates all allowed mode transitions:
         *
         * apron -> taxi -> waiting -> takeoff -> cruise <-> landing
         *   ^                                       ^
         *   |                                       |
         * new planes with                      new planes with
         * category 'departure'                 category 'arrival'
         */

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
        this.parse(options);
        this.initFms(options);

        this.mcp = new ModeController();
        this.pilot = new Pilot(this.mcp, this.fms);

        // TODO: There are better ways to ensure the autopilot is on for aircraft spawning inflight...
        if (options.category === FLIGHT_CATEGORY.ARRIVAL) {
            const bottomAltitude = this.fms.getBottomAltitude();

            this.mcp.initializeForAirborneFlight(bottomAltitude, this.heading, this.speed);
        }

        this.createStrip();
        this.updateStrip();
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
     * @for AircraftInstanceModel
     * @property callsign
     * @return {string}
     */
    get callsign() {
        return `${this.airlineId.toUpperCase()}${this.flightNumber.toUpperCase()}`;
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

    // TODO: this feels like it belongs in either the AirportModel or the AirspaceModel which then exposes a
    // method that will check collisions
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

    parse(data) {
        // TODO: these _gets can likely be removed
        this.positionModel = _get(data, 'positionModel', this.positionModel);
        this.model = _get(data, 'model', this.model);
        this.airlineId = _get(data, 'airline', this.airlineId);
        this.airlineCallsign = _get(data, 'airlineCallsign', this.airlineCallsign);
        this.flightNumber = _get(data, 'callsign', this.flightNumber);
        this.category = _get(data, 'category', this.category);
        this.heading = _get(data, 'heading', this.heading);
        this.altitude = _get(data, 'altitude', this.altitude);
        this.speed = _get(data, 'speed', this.speed);
        this.destination = _get(data, 'destination', this.destination);
        this.inside_ctr = data.category === FLIGHT_CATEGORY.DEPARTURE;
    }

    initFms(data) {
        const airport = window.airportController.airport_get();
        const initialRunway = airport.getRunway(airport.runway);

        this.fms = new Fms(data, initialRunway, this.model, this._navigationLibrary);

        if (this.category === FLIGHT_CATEGORY.DEPARTURE) {

            this.setFlightPhase(FLIGHT_PHASE.APRON);
            this.altitude = airport.positionModel.elevation;
            this.speed = 0;

            return;
        } else if (this.category !== FLIGHT_CATEGORY.ARRIVAL) {
            throw new Error('Invalid #category found in AircraftInstanceModel');
        }

        if (data.nextFix) {
            this.fms.skipToWaypoint(data.nextFix);
        }
    }

    /**
     * Called when the aircraft crosses the airspace boundary (ie, leaving our airspace)
     *
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
        if (this.inside_ctr) {
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

        this.hideStrip();
        this.setIsRemovable();

        // TODO: this seems redundant. if its already in the leg its in the fms.
        if (this.mcp.headingMode !== MCP_MODE.HEADING.LNAV || !this.fms.hasWaypoint(this.fms.currentLeg.exitName)) {
            this.radioCall(
                `leaving radar coverage without being cleared to ${this.fms.currentLeg.exitName}`,
                AIRPORT_CONTROL_POSITION_NAME.DEPARTURE,
                true
            );
            window.gameController.events_recordNew(GAME_EVENTS.NOT_CLEARED_ON_ROUTE);

            return;
        }

        this.radioCall('switching to center, good day', AIRPORT_CONTROL_POSITION_NAME.DEPARTURE);
        window.gameController.events_recordNew(GAME_EVENTS.DEPARTURE);
    }

    /**
     * An arriving aircraft is exiting the airpsace
     *
     * @for AircraftInstanceModel
     * @method arrivalExit
     */
    arrivalExit() {
        this.setIsRemovable();
        this.radioCall('leaving radar coverage as arrival', AIRPORT_CONTROL_POSITION_NAME.APPROACH, true);
        window.gameController.events_recordNew(GAME_EVENTS.AIRSPACE_BUST);
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

        return _isEqual(callsignToMatch.toUpperCase(), this.callsign);
    }

    /**
     * @for AircraftInstanceModel
     * @method getRadioCallsign
     * @return cs {string}
     */
    getRadioCallsign() {
        let heavy = '';
        let radioCallsign = this.airlineCallsign;

        // TODO: Move the weight qualifiers to a getter, and call it here to get the value of `heavy`
        if (this.model.weightclass === 'H') {
            heavy = ' heavy';
        }

        if (this.model.weightclass === 'U') {
            heavy = ' super';
        }

        if (this.airlineCallsign === 'November') {
            radioCallsign += ` radio_spellOut(${this.flightNumber})${heavy}`;
        } else {
            radioCallsign += ` ${groupNumbers(this.flightNumber)}${heavy}`;
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
    }

    /**
     * @for AircraftInstanceModel
     * @method cancelLanding
     */
    cancelLanding() {
        // TODO: add fms.clearRunwayAssignment()?
        this.setFlightPhase(FLIGHT_PHASE.CRUISE);

        return true;
    }

    // TODO: is this method still in use?
    /**
     * @for AircraftInstanceModel
     * @method pushHistory
     */
    pushHistory() {
        // TODO: this should use just positionModel.relativePosition
        this.history.push([this.positionModel.relativePosition[0], this.positionModel.relativePosition[1]]);

        if (this.history.length > 10) {
            this.history.splice(0, this.history.length - 10);
        }
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
     * Aircraft is established on the course tuned into the nav radio and course buildCurrentTerrainRanges
     *
     * @for AircraftInstanceModel
     * @method isEstablishedOnCourse
     * @return {boolean}
     */
    isEstablishedOnCourse() {
        const runway = this.fms.arrivalRunway;

        if (!runway) {
            return false;
        }

        const runwayHeading = runway.angle;
        const approachOffset = getOffset(this, runway.relativePosition, runwayHeading);
        const lateralDistanceFromCourse_nm = abs(nm(approachOffset[0]));
        const onApproachCourse = lateralDistanceFromCourse_nm <= PERFORMANCE.MAXIMUM_DISTANCE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE_NM;
        const heading_diff = abs(angle_offset(this.heading, runwayHeading));
        const onCorrectHeading = heading_diff < PERFORMANCE.MAXIMUM_ANGLE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE;

        return onApproachCourse && onCorrectHeading;

        // const courseDatum = this.mcp.nav1Datum;
        // const course = this.mcp.course;
        // const courseOffset = getOffset(this, courseDatum.relativePosition, course);
        // const lateralDistanceFromCourse_nm = abs(nm(courseOffset[0]));
        // const isAlignedWithCourse = lateralDistanceFromCourse_nm <= PERFORMANCE.MAXIMUM_DISTANCE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE_NM;
        // const heading_diff = abs(angle_offset(this.heading, course));
        // const isOnCourseHeading = heading_diff < PERFORMANCE.MAXIMUM_ANGLE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE;
        //
        // return isAlignedWithCourse && isOnCourseHeading;
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
        const runway = this.fms.currentRunway;
        const nearRunwayAltitude = abs(this.altitude - runway.elevation) < errorAllowanceInFeet;
        const nearAirportAltitude = abs(this.altitude - airport.elevation) < errorAllowanceInFeet;

        return nearRunwayAltitude || nearAirportAltitude;
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
        return this.flightPhase === FLIGHT_PHASE.APRON ||
            this.flightPhase === FLIGHT_PHASE.TAXI ||
            this.flightPhase === FLIGHT_PHASE.WAITING;
    }

    /**
     * Returns whether the aircraft is currently taking off
     *
     * @for AircraftInstanceModel
     * @method isTakeoff
     */
    isTakeoff() {
        return this.isTaxiing() || this.flightPhase === FLIGHT_PHASE.TAKEOFF;
    }

    // TODO: the logic in this method can be cleaned up and simplified
    /**
     * @for AircraftInstanceModel
     * @method isVisible
     */
    isVisible() {
        // TODO: this if/else if would be cleaner with just if (this.flightPhase === FLIGHT_PHASE.WAITING) {}
        // hide aircraft on twys
        if (this.flightPhase === FLIGHT_PHASE.APRON || this.flightPhase === FLIGHT_PHASE.TAXI) {
            return false;
        }

        if (this.isTaxiing()) {
            // show only the first aircraft in the takeoff queue
            const runway = this.fms.departureRunway;
            const nextInRunwayQueue = runway.isAircraftNextInQueue(this);

            return this.flightPhase === FLIGHT_PHASE.WAITING && nextInRunwayQueue;
        }

        return true;
    }

    /**
     * Sets `#isRemovable` to true
     *
     * Provides a single source to change the value of `#isRemovable`.
     *
     * @for AircraftInstanceModel
     * @method setIsRemovable
     */
    setIsRemovable() {
        this.isRemovable = true;
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

        const airport = window.airportController.airport_get();
        const wind = airport.wind;
        const runway = this.fms.currentRunway;
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
        const callsign_L = this.callsign;
        const callsign_S = this.getRadioCallsign();

        if (sectorType) {
            call += window.airportController.airport_get().radio[sectorType];
        }

        // call += ", " + this.callsign + " " + msg;

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

            window.uiController.ui_log(`${window.airportController.airport_get().radio.app}, ${this.callsign} with you ${alt_log}`);
            speech_say([
                { type: 'text', content: `${window.airportController.airport_get().radio.app}, ` },
                { type: 'callsign', content: this },
                { type: 'text', content: `with you ${alt_say}` }
            ]);
        }

        if (this.category === FLIGHT_CATEGORY.DEPARTURE) {
            window.uiController.ui_log(`${window.airportController.airport_get().radio.twr}, ${this.callsign}, ready to taxi`);
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
            window.uiController.ui_log(`${this.callsign} ${action} with major crosswind'`, isWarning);
        } else if (components.cross >= 10) {
            window.gameController.events_recordNew(GAME_EVENTS.HIGH_CROSSWIND_OPERATION);
            window.uiController.ui_log(`${this.callsign} ${action} with crosswind'`, isWarning);
        }

        if (components.head <= -10) {
            window.gameController.events_recordNew(GAME_EVENTS.EXTREME_TAILWIND_OPERATION);
            window.uiController.ui_log(`${this.callsign} ${action} with major tailwind'`, isWarning);
        } else if (components.head <= -1) {
            window.gameController.events_recordNew(GAME_EVENTS.HIGH_TAILWIND_OPERATION);
            window.uiController.ui_log(`${this.callsign} ${action} with tailwind'`, isWarning);
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

        // TODO: this method may not be needed but could be leveraged for housekeeping if deemed appropriate
        this.overrideTarget();
    }

    /**
     * @for AircraftInstanceModel
     * @method overrideTarget
     */
    overrideTarget() {
        switch (this.flightPhase) {
            case FLIGHT_PHASE.APRON:
                // TODO: Is this needed?
                // this.target.altitude = this.altitude;
                // this.target.expedite = false;
                // this.target.heading = this.heading;
                // this.target.speed = 0;

                break;

            case FLIGHT_PHASE.TAXI:
                // TODO: Is this needed?
                // this.target.altitude = this.altitude;
                // this.target.expedite = false;
                // this.target.heading = this.heading;
                // this.target.speed = 0;

                break;

            case FLIGHT_PHASE.WAITING:
                // TODO: Is this needed?
                // this.target.altitude = this.altitude;
                // this.target.expedite = false;
                // this.target.heading = this.heading;
                // this.target.speed = 0;

                break;

            case FLIGHT_PHASE.TAKEOFF: {
                this.target.altitude = this.altitude;

                if (this.speed >= this.model.speed.min) {
                    this.target.altitude = this.model.ceiling;
                }

                this.target.expedite = false;
                this.target.heading = this.heading;
                this.target.speed = this.model.speed.min;

                // TODO: Enumerate the '-999' invalid value
                if (this.mcp.heading === -1) {
                    console.warn(`${this.callsign} took off with no directional instructions!`);
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

            case FLIGHT_PHASE.APPROACH:
                break;

            case FLIGHT_PHASE.LANDING: {
                this.target.heading = this.mcp.course;

                if (this.altitude <= this.mcp.nav1Datum.elevation) {
                    this.altitude = this.mcp.nav1Datum.elevation;
                    this.target.speed = 0;
                }

                break;
            }

            default:
                break;
        }

        // If stalling, make like a meteorite and fall to the earth!
        if (this.isStalling()) {
            this.target.altitude = Math.min(0, this.target.altitude);
        }

        // Limit speed to 250 knots while under 10,000 feet MSL (it's the law!)
        // TODO: Isn't this covered by `this._calculateLegalSpeed()`?
        if (this.altitude < 10000) {
            this.target.speed = Math.min(this.target.speed, AIRPORT_CONSTANTS.MAX_SPEED_BELOW_10K_FEET);
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

    /**
     * Update the FMS's flight phase
     *
     * @for AircraftInstanceModel
     * @method updateFlightPhase
     */
    updateFlightPhase() {
        const airportModel = window.airportController.airport_get();
        const runwayModel = this.fms.departureRunway;

        if (this._shouldEnterHoldingPattern()) {
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
                    this.pilot.raiseLandingGearAndActivateAutopilot();
                    this.setFlightPhase(FLIGHT_PHASE.CLIMB);
                }

                break;

            case FLIGHT_PHASE.CLIMB:
                if (this.altitude === this.fms.flightPlanAltitude) {
                    this.setFlightPhase(FLIGHT_PHASE.CRUISE);
                }

                break;

            case FLIGHT_PHASE.HOLD:
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
                if (this.positionModel.distanceToPosition(this.mcp.nav1Datum) < AIRPORT_CONSTANTS.FINAL_APPROACH_FIX_DISTANCE_NM) {
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

        if (this.flightPhase === FLIGHT_PHASE.HOLD) {
            this.updateTargetHeadingForHold();

            return;
        }

        if (this.flightPhase === FLIGHT_PHASE.LANDING) {
            return this._calculateTargetedHeadingDuringLanding();
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

        if (this.flightPhase === FLIGHT_PHASE.LANDING) {
            return this._calculateTargetedSpeedDuringLanding();
        }

        switch (this.mcp.speedMode) {
            case MCP_MODE.SPEED.OFF:
                return this._calculateLegalSpeed(this.speed);

            case MCP_MODE.SPEED.HOLD:
                return this._calculateLegalSpeed(this.mcp.speed);

            // future functionality
            // case MCP_MODE.SPEED.LEVEL_CHANGE:
            //     return;

            case MCP_MODE.SPEED.N1:
                return this._calculateLegalSpeed(this.model.speed.max);

            case MCP_MODE.SPEED.VNAV: {
                const maxSpeed = this.mcp.speed;
                const waypointSpeed = this.fms.currentWaypoint.speedRestriction;
                const waypointHasSpeed = waypointSpeed !== -1;

                if (waypointHasSpeed) {
                    return this._calculateLegalSpeed(waypointSpeed);
                }

                return this._calculateLegalSpeed(maxSpeed);
            }

            default:
                console.warn('Expected MCP speed mode of "OFF", "HOLD", "LEVEL_CHANGE", "N1", or "VNAV", but ' +
                    `received "${this.mcp[MCP_MODE_NAME.SPEED]}"`);
                return this._calculateLegalSpeed(this.speed);
        }
    }

    /**
     * This method limits the aircraft's speed to a maximum of a specific speed
     * while below 10,000 feet MSL, to comply with regulations.
     *
     * @for AircraftInstanceModel
     * @method _calculateLegalSpeed
     * @param speed {number} desired speed
     * @return {number}      permitted speed
     */
    _calculateLegalSpeed(speed) {
        if (this.altitude < 10000) {
            return Math.min(speed, AIRPORT_CONSTANTS.MAX_SPEED_BELOW_10K_FEET);
        }

        return speed;
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

        if (this.flightPhase === FLIGHT_PHASE.LANDING) {
            return this._calculateTargetedAltitudeDuringLanding();
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

                if (!waypointHasAltitude) {
                    return this.mcp.altitude;
                }

                if (this.flightPhase === FLIGHT_PHASE.TAKEOFF || this.flightPhase === FLIGHT_PHASE.CLIMB) {
                    return Math.min(waypointAltitude, this.mcp.altitude);
                }

                if (this.flightPhase === FLIGHT_PHASE.DESCENT) {
                    return Math.max(waypointAltitude, this.mcp.altitude);
                }

                break;
            }

            default:
                console.warn('Expected MCP altitude mode of "OFF", "HOLD", "APPROACH", "LEVEL_CHANGE", ' +
                    `"VERTICAL_SPEED", or "VNAV", but received "${this.mcp[MCP_MODE_NAME.ALTITUDE]}"`);
                break;
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
        // GENERALIZED CODE
        // const glideDatum = this.mcp.nav1Datum;
        // const distanceFromDatum_nm = this.positionModel.distanceToPosition(glideDatum);
        // const slope = Math.tan(degreesToRadians(3));
        // const distanceFromDatum_ft = distanceFromDatum_nm * UNIT_CONVERSION_CONSTANTS.NM_FT;
        // const glideslopeAltitude = glideDatum.elevation + (slope * (distanceFromDatum_ft));
        // const altitudeToTarget = _clamp(glideslopeAltitude, glideDatum.elevation, this.altitude);

        // ILS SPECIFIC CODE
        const runway = this.fms.arrivalRunway;
        const offset = getOffset(this, runway.relativePosition, runway.angle);
        const distanceOnFinal_km = offset[1];
        const glideslopeAltitude = runway.getGlideslopeAltitude(distanceOnFinal_km);
        const altitudeToTarget = Math.min(this.mcp.altitude, glideslopeAltitude);

        return altitudeToTarget;
    }

    /**
     * Calculate the heading to target while intercepting a horizontally aligned course
     *
     * @for AircraftInstanceModel
     * @method _calculateTargetedHeadingToInterceptCourse
     * @private
     */
    _calculateTargetedHeadingToInterceptCourse() {
        // Guide aircraft onto the localizer
        const datum = this.mcp.nav1Datum;
        const course = this.mcp.course;
        const courseOffset = getOffset(this, datum.relativePosition, course);
        const lateralDistanceFromCourse_nm = nm(courseOffset[0]);
        const headingDifference = angle_offset(course, this.heading);
        const bearingFromAircaftToRunway = this.positionModel.bearingToPosition(datum);
        const angleAwayFromLocalizer = course - bearingFromAircaftToRunway;
        const turnTimeInSeconds = abs(headingDifference) / PERFORMANCE.TURN_RATE;    // time to turn headingDifference degrees
        const turningRadius = this.speed * (turnTimeInSeconds * TIME.ONE_SECOND_IN_HOURS);  // dist covered in the turn, nm
        const distanceCoveredDuringTurn = turningRadius * abs(headingDifference);
        const distanceToLocalizer = lateralDistanceFromCourse_nm / sin(headingDifference); // dist from the localizer intercept point, nm
        const distanceEarly = 0.5;    // start turn early, to avoid overshoots from tailwind
        const shouldAttemptIntercept = (distanceToLocalizer > 0 && distanceToLocalizer <= distanceCoveredDuringTurn + distanceEarly);
        const inTheWindow = abs(angleAwayFromLocalizer) < degreesToRadians(1.5);  // if true, aircraft will move to localizer, regardless of assigned heading

        if (!(shouldAttemptIntercept || inTheWindow)) {
            return this.mcp.heading;
        }

        const severity_of_correction = 50;  // controls steepness of heading adjustments during localizer tracking
        let interceptAngle = angleAwayFromLocalizer * -severity_of_correction;
        const minimumInterceptAngle = degreesToRadians(10);
        const isAlignedWithCourse = abs(lateralDistanceFromCourse_nm) <= PERFORMANCE.MAXIMUM_DISTANCE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE_NM;

        // TODO: This is a patch fix, and it stinks. This whole method needs to be improved greatly.
        if (isAlignedWithCourse) {
            return course + interceptAngle;
        }

        interceptAngle = spread(interceptAngle, -minimumInterceptAngle, minimumInterceptAngle);
        const interceptHeading = course + interceptAngle;

        // TODO: This should be abstracted
        if (this.mcp.heading < this.mcp.course) {
            const headingToFly = Math.max(interceptHeading, this.mcp.heading);

            return headingToFly;
        } else if (this.mcp.heading > this.mcp.course) {
            const headingToFly = Math.min(interceptHeading, this.mcp.heading);

            return headingToFly;
        }
    }
    /* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ THESE SHOULD STAY ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */

    /* vvvvvvvvvvv THESE SHOULD BE EXAMINED AND EITHER REMOVED OR MOVED ELSEWHERE vvvvvvvvvvv */
    /**
     * Cancels the landing and disaply message
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

        window.uiController.ui_log(`${this.callsign} approach course intercept angle was greater than 30 degrees`, isWarning);
        window.gameController.events_recordNew(GAME_EVENTS.ILLEGAL_APPROACH_CLEARANCE);
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
        // TODO: abstract this logic to helper method
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
     * @method updateTargetHeadingForHold
     */
    updateTargetHeadingForHold() {
        const invalidTimerValue = -999;
        const { hold } = this.fms.currentWaypoint;
        const outboundHeading = radians_normalize(hold.inboundHeading + Math.PI);
        const offset = getOffset(this, hold.fixPos, hold.inboundHeading);
        const holdLegDurationInSeconds = hold.legLength * TIME.ONE_MINUTE_IN_SECONDS;
        const bearingToHoldFix = vradial(vsub(hold.fixPos, this.relativePosition));
        const gameTime = window.gameController.game.time;
        const isPastFix = offset[1] < 1 && offset[2] < 2;
        const isTimerSet = hold.timer !== invalidTimerValue;
        const isTimerExpired = isTimerSet && gameTime > this.fms.currentWaypoint.timer;

        if (isPastFix && !this._isEstablishedOnHoldingPattern) {
            this._isEstablishedOnHoldingPattern = true;
        }

        if (!this._isEstablishedOnHoldingPattern) {
            this.target.heading = bearingToHoldFix;

            return;
        }

        let nextTargetHeading = outboundHeading;

        if (this.heading === outboundHeading && !isTimerSet) {
            // set timer
            this.fms.currentWaypoint.timer = gameTime + holdLegDurationInSeconds;
        }

        if (isTimerExpired) {
            nextTargetHeading = bearingToHoldFix;

            if (isPastFix) {
                this.fms.currentWaypoint.timer = invalidTimerValue;
                nextTargetHeading = outboundHeading;
            }
        }

        // turn direction is defaulted to `right` by the commandParser
        this.target.turn = hold.dirTurns;
        this.target.heading = nextTargetHeading;

        // TODO: add distance based hold
    }
    /* ^^^^^^^^^^^ THESE SHOULD BE EXAMINED AND EITHER REMOVED OR MOVED ELSEWHERE ^^^^^^^^^^^ */

    /* vvvvvvv THESE HAVE ELEMENTS THAT SHOULD BE MOVED INTO THE PHYSICS CALCULATIONS vvvvvvv */

    /**
     * Calculates the altitude for a landing aircraft
     *
     * @for AircraftInstanceModel
     * @method _calculateTargetedAltitudeDuringLanding
     * @return {number}
     */
    _calculateTargetedAltitudeDuringLanding() {
        const runway = this.fms.arrivalRunway;
        const offset = getOffset(this, runway.relativePosition, runway.angle);
        const distanceOnFinal_km = offset[1];

        if (distanceOnFinal_km > 0) {
            return this._calculateTargetedAltitudeToInterceptGlidepath();
        }

        return runway.elevation;
    }

    /**
     * Calculates the heading for a landing aircraft
     *
     * @for AircraftInstanceModel
     * @method _calculateTargetedHeadingDuringLanding
     * @return {number}
     */
    _calculateTargetedHeadingDuringLanding() {
        const runway = this.fms.arrivalRunway;
        const offset = getOffset(this, runway.relativePosition, runway.angle);
        const distanceOnFinal_nm = nm(offset[1]);

        if (distanceOnFinal_nm > 0) {
            const bearingFromAircaftToRunway = this.positionModel.bearingToPosition(runway.positionModel);

            return bearingFromAircaftToRunway;
        }

        return runway.angle;
    }

    /**
     * Calculates the speed for a landing aircraft
     *
     * @for AircraftInstanceModel
     * @method _calculateTargetedSpeedDuringLanding
     * @return {number}
     */
    _calculateTargetedSpeedDuringLanding() {
        let startSpeed = this.speed;
        const runway  = this.fms.arrivalRunway;
        const offset = getOffset(this, runway.relativePosition, runway.angle);
        const distanceOnFinal_nm = nm(offset[1]);

        if (distanceOnFinal_nm <= 0 && this.isOnGround())  {
            return 0;
        }

        if (this.mcp.speedMode === MCP_MODE.SPEED.HOLD) {
            startSpeed = this.mcp.speed;
        }

        const nextSpeed = extrapolate_range_clamp(
            AIRPORT_CONSTANTS.LANDING_FINAL_APPROACH_SPEED_DISTANCE_NM,
            distanceOnFinal_nm,
            AIRPORT_CONSTANTS.LANDING_ASSIGNED_SPEED_DISTANCE_NM,
            this.model.speed.landing,
            startSpeed
        );

        return nextSpeed;
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

        this.distance = vlen(this.positionModel.relativePosition);
        this.radial = radians_normalize(vradial(this.positionModel.relativePosition));

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
            this.target.turn = null;

            return;
        }

        const secondsElapsed = window.gameController.game_delta();
        const angle_diff = angle_offset(this.target.heading, this.heading);
        const angle_change = PERFORMANCE.TURN_RATE * secondsElapsed;

        // TODO: clean this up if possible, there is a lot of branching logic here
        if (abs(angle_diff) <= angle_change) {
            this.heading = this.target.heading;
        } else if (this.target.turn) {
            if (this.target.turn === 'left') {
                this.heading = radians_normalize(this.heading - angle_change);
            } else if (this.target.turn === 'right') {
                this.heading = radians_normalize(this.heading + angle_change);
            }
        } else if (angle_diff <= 0) {
            this.heading = radians_normalize(this.heading - angle_change);
        } else if (angle_diff > 0) {
            this.heading = radians_normalize(this.heading + angle_change);
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

        // TODO: Is this needed?
        // // TODO: abstract to class method
        // if (this.speed <= this.model.speed.min && this.mcp.speedMode === MCP_MODE.SPEED.N1) {
        //     return;
        // }

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
        // TODO: this should be an available property on the `AircraftTypeDefinitionModel`
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
        let speedChange = 0;
        const differenceBetweenPresentAndTargetSpeeds = this.speed - this.target.speed;

        if (differenceBetweenPresentAndTargetSpeeds === 0) {
            return;
        }

        if (this.speed > this.target.speed) {
            speedChange = -this.model.rate.decelerate * window.gameController.game_delta() / 2;

            if (this.isOnGround()) {
                speedChange *= PERFORMANCE.DECELERATION_FACTOR_DUE_TO_GROUND_BRAKING;
            }
        } else if (this.speed < this.target.speed) {
            speedChange  = this.model.rate.accelerate * window.gameController.game_delta() / 2;
            speedChange *= extrapolate_range_clamp(0, this.speed, this.model.speed.min, 2, 1);
        }

        this.speed += speedChange;

        if (abs(speedChange) > abs(differenceBetweenPresentAndTargetSpeeds)) {
            this.speed = this.target.speed;
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

        this.groundTrack = groundTrack;
        this.groundSpeed = groundSpeed;

        // TODO: is this needed anymore?
        // TODO: Fix this to prevent drift (being blown off course)
        // if (this.isOnGround()) {
        //     vector = vscale([sin(angle), cos(angle)], trueAirSpeed);
        // } else {
        //     let crab_angle = 0;
        //
        //     // Compensate for crosswind while tracking a fix or on ILS
        //     if (this.__fms__.currentWaypoint.navmode === WAYPOINT_NAV_MODE.FIX || this.flightPhase === FLIGHT_PHASE.LANDING) {
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

    // NOTE: Remove after 5/1/2017
    /**
     * This uses the current speed information to update the ground speed and position
     *
     * @for AircraftInstanceModel
     * @method updateSimpleGroundSpeedPhysics
     * @param scaleSpeed
     * @deprecated
     */
    updateSimpleGroundSpeedPhysics() {
        // const hoursElapsed = window.gameController.game_delta() * TIME.ONE_SECOND_IN_HOURS;
        // const distanceTraveled_nm = this.speed * hoursElapsed;
        //
        // this.positionModel.setCoordinatesByBearingAndDistance(this.heading, distanceTraveled_nm);
        //
        // // TODO: Is this nonsense actually needed, or can we remove it?
        // this.groundSpeed = this.speed;
        // this.groundTrack = this.heading;
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
                    area.range -= this.groundSpeed;
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
                curr_ranges[id] -= this.groundSpeed;
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
                            window.uiController.ui_log(`${this.callsign} collided with terrain in controlled flight`, isWarning);
                            speech_say([
                                { type: 'callsign', content: this },
                                { type: 'text', content: ', we\'re going down!' }
                            ]);

                            window.gameController.events_recordNew(GAME_EVENTS.COLLISION);
                        }
                    } else {
                        curr_ranges[id] = Math.max(0.2, status.distance);
                        // console.log(this.callsign, 'in', curr_ranges[id], 'km from', id, area[0].length);
                    }
                }
            }
        }

        this.warning = warning;
    }

    /**
     * Encapsulation of boolean logic used to determine when the `#flightPhase` should be
     * changed to `HOLD`
     *
     * @method _shouldEnterHoldingPattern
     * @return {boolean}
     * @private
     */
    _shouldEnterHoldingPattern() {
        if (!this.fms.currentWaypoint.isHold) {
            return false;
        }

        const distanceToHoldPosition = this.positionModel.distanceToPosition(this.fms.currentWaypoint.positionModel);
        const maximumAcceptableDistance = 3;    // in nm
        const shouldEnterHold = distanceToHoldPosition <= maximumAcceptableDistance;

        return shouldEnterHold;
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
        this.conflicts[conflictingAircraft.callsign] = conflict;
    }

    /**
     * @for AircraftInstanceModel
     * @method checkConflict
     * @param {Aircraft} conflictingAircraft
     */
    checkConflict(conflictingAircraft) {
        if (this.conflicts[conflictingAircraft.callsign]) {
            this.conflicts[conflictingAircraft.callsign].update();

            return true;
        }

        return false;
    }

    /**
     * @for AircraftInstanceModel
     * @method hasAlerts
     */
    hasAlerts() {
        const alert = [false, false];

        for (const i in this.conflicts) {
            const conflict = this.conflicts[i].hasAlerts();

            alert[0] = (alert[0] || conflict[0]);
            alert[1] = (alert[1] || conflict[1]);
        }

        return alert;
    }

    /**
     * @for AircraftInstanceModel
     * @method removeConflict
     * @param {Aircraft} conflictingAircraft
     */
    removeConflict(conflictingAircraft) {
        delete this.conflicts[conflictingAircraft.callsign];
    }

    // TODO: aircraft strip methods below will be abstracted and de-coupled from this model

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

        switch (this.flightPhase) {
            case FLIGHT_PHASE.APRON:
                this.aircraftStripView.updateViewForApron(destinationDisplay, hasAltitude);

                break;
            case FLIGHT_PHASE.TAXI:
                this.aircraftStripView.updateViewForTaxi(destinationDisplay, hasAltitude, altitudeText);

                break;
            case FLIGHT_PHASE.WAITING:
                this.aircraftStripView.updateViewForWaiting(destinationDisplay, this.mcp.isEnabled, hasAltitude);

                break;
            case FLIGHT_PHASE.TAKEOFF:
                this.aircraftStripView.updateViewForTakeoff(destinationDisplay);

                break;
            case FLIGHT_PHASE.CLIMB:
            case FLIGHT_PHASE.HOLD:
            case FLIGHT_PHASE.DESCENT:
            case FLIGHT_PHASE.CRUISE:
                let cruiseNavMode = WAYPOINT_NAV_MODE.FIX;
                let headingDisplay = this.fms.currentWaypoint.name.toUpperCase();
                const isFollowingSid = this.fms.isFollowingSid();
                const isFollowingStar = this.fms.isFollowingStar();
                const fixRestrictions = {
                    altitude: this.fms.currentWaypoint.altitudeRestriction !== -1,
                    speed: this.fms.currentWaypoint.speedRestriction !== -1
                };
                destinationDisplay = this.fms.getProcedureAndExitName();

                if (this.fms.currentWaypoint.isHold) {
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
            case FLIGHT_PHASE.APPROACH:
            case FLIGHT_PHASE.LANDING:
                destinationDisplay = this.fms.getDestinationAndRunwayName();

                this.aircraftStripView.updateViewForLanding(destinationDisplay);

                break;
            default:
                throw new TypeError(`Invalid FLIGHT_MODE ${this.flightPhase} passed to .updateStrip()`);
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
