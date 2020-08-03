import _ceil from 'lodash/ceil';
import _defaultTo from 'lodash/defaultTo';
import _findIndex from 'lodash/findIndex';
import _floor from 'lodash/floor';
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _isEmpty from 'lodash/isEmpty';
import _isEqual from 'lodash/isEqual';
import _isNil from 'lodash/isNil';
import _uniqueId from 'lodash/uniqueId';
import AircraftTypeDefinitionModel from './AircraftTypeDefinitionModel';
import AirportController from '../airport/AirportController';
import Fms from './FlightManagementSystem/Fms';
import GameController, { GAME_EVENTS } from '../game/GameController';
import ModeController from './ModeControl/ModeController';
import Pilot from './Pilot/Pilot';
import TimeKeeper from '../engine/TimeKeeper';
import UiController from '../ui/UiController';
import EventBus from '../lib/EventBus';
import { AIRCRAFT_EVENT } from '../constants/eventNames';
import {
    radians_normalize,
    angle_offset
} from '../math/circle';
import {
    abs,
    cos,
    extrapolate_range_clamp,
    sin,
    spread
} from '../math/core';
import {
    getOffset,
    calculateCrosswindAngle,
    calculateTurnInitiationDistance
} from '../math/flightMath';
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
import { speech_say, randomizePilotVoice } from '../speech';
import {
    digits_decimal,
    groupNumbers,
    radio_runway,
    radio_altitude,
    radio_spellOut
} from '../utilities/radioUtilities';
import {
    degreesToRadians,
    nm,
    UNIT_CONVERSION_CONSTANTS
} from '../utilities/unitConverters';
import {
    MCP_MODE,
    MCP_MODE_NAME
} from './ModeControl/modeControlConstants';
import {
    FLIGHT_CATEGORY,
    FLIGHT_PHASE,
    PERFORMANCE
} from '../constants/aircraftConstants';
import {
    AIRPORT_CONSTANTS,
    AIRPORT_CONTROL_POSITION_NAME
} from '../constants/airportConstants';
import {
    INVALID_NUMBER,
    TIME
} from '../constants/globalConstants';
import { ENVIRONMENT } from '../constants/environmentConstants';

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
 * @class AircraftModel
 */
export default class AircraftModel {
    /**
     * @for AircraftModel
     * @constructor
     * @param options {object}
     */
    constructor(options = {}) {
        /**
         * Unique id
         *
         * Useful for debugging
         *
         * @for AircraftModel
         * @property id
         * @type {string}
         */
        this.id = _uniqueId('aircraft-');

        /**
         * Aircraft's DynamicPositionModel
         *
         * @for AircraftModel
         * @property positionModel
         * @type {DynamicPositionModel|null}
         */
        this.positionModel = null;

        /**
         * AircraftTypeDefinitionModel for the type of aircraft being flown
         *
         * @for AircraftModel
         * @property model
         * @type {AircraftTypeDefinitionModel|null}
         * @default null
         */
        this.model = null;

        /**
         * Airline Identifier (eg. 'AAL')
         *
         * @property airlineId
         * @type {string}
         * @default ''
         */
        this.airlineId = '';

        /**
         * Airline's radio callsign (eg. 'American')
         *
         * @for AircraftModel
         * @property airlineCallsign
         * @type {string}
         * @default ''
         */
        this.airlineCallsign = '';

        /**
         * Flight Number ONLY (eg. '551')
         *
         * @for AircraftModel
         * @property flightNumber
         * @type {string}
         * @default ''
         */
        this.flightNumber = '';

        /**
         * Trasponder code
         *
         * Initially generated and assined on instantiation by the `AircraftController`
         *
         * @for AircraftModel
         * @property transponderCode
         * @type {number}
         * @default 1200
         */
        this.transponderCode = 1200;

        /**
         * Pilot's voice
         *
         * Initially generated and assined on instantiation by the `AircraftController`
         *
         * @for AircraftModel
         * @property pilotVoice
         * @type {string}
         */
        this.pilotVoice = randomizePilotVoice();

        /**
         * Magnetic heading the aircraft is facing
         *
         * @for AircraftModel
         * @property heading
         * @type {number}
         * @default 0
         */
        this.heading = 0;

        /**
         * Altitude, ft MSL
         *
         * @for AircraftModel
         * @property altitude
         * @type {number}
         * @default 0
         */
        this.altitude = 0;

        /**
         * Indicated Airspeed (IAS), knots
         * Not to be confused with #trueAirspeed
         *
         * @property speed
         * @type {number}
         * @default 0
         */
        this.speed = 0;

        /**
         * Groundspeed (GS), knots
         *
         * @for AircraftModel
         * @property groundSpeed
         * @type {number}
         * @default 0
         */
        this.groundSpeed = 0;

        /**
         * Azimuth of movement across the ground, in radians
         *
         * @for AircraftModel
         * @property groundTrack
         * @type {number}
         * @default 0
         */
        this.groundTrack = 0;

        /**
         * Game time takeoff occurred
         *
         * @for AircraftModel
         * @property takeoffTime
         * @type {number}
         * @default 0
         */
        this.takeoffTime = 0;

        /**
         * True Airspeed, not to be confused with indicated airspeed (#speed)
         *
         * @for AircraftModel
         * @property trueAirspeed
         * @type {number}
         * @default 0
         */
        this.trueAirspeed = 0;

        /**
         * Azimuth from airport center to aircraft, in radians
         *
         * @for AircraftModel
         * @property radial
         * @type {number}
         * @default 0
         */
        this.radial = 0;

        /**
         * Distance from the airport, in km
         *
         * @for AircraftModel
         * @property distance
         * @type {number}
         * @default 0
         */
        this.distance = 0;

        /**
         * The origin ariport for an aircraft
         *
         * This will only be populated for dpearture aircraft
         *
         * @for AircraftModel
         * @property origin
         * @type {string}
         * @default ''
         */
        this.origin = '';

        /**
         * The destination airpot of an aircraft
         *
         * This will only be populated for arrivals
         *
         * @for AircraftModel
         * @property destination
         * @type {string}
         * @default ''
         */
        this.destination = '';

        /**
         * Indicator of descent/level/climb (-1, 0, or 1)
         *
         * @for AircraftModel
         * @property trend
         * @type {number}
         * @default 0
         */
        this.trend = 0;

        /**
         * Array of previous positions
         *
         * @for AircraftModel
         * @property history
         * @type <array<array<number>>>
         * @default []
         */
        this.history = [];

        /**
         * @for AircraftModel
         * @property restricted
         * @type {object}
         * @default { list: [] }
         */
        this.restricted = { list: [] };

        /**
         * @for AircraftModel
         * @property warning
         * @type {boolean}
         * @default false
         */
        this.warning = false;

        /**
         * Whether aircraft has crashed
         *
         * @for AircraftModel
         * @property hit
         * @type {boolean}
         * @default false
         */
        this.hit = false;

        /**
         * Game time an aircraft starts the taxi
         *
         * @for AircraftModel
         * @property taxi_start
         * @type {number}
         * @default 0
         */
        this.taxi_start = 0;

        /**
         * Time spent taxiing to the runway. *NOTE* this should be INCREASED
         * to around 60 once the taxi vs LUAW issue is resolved (#406)
         *
         * @for AircraftModel
         * @property taxi_time
         * @type {number}
         * @default 3
         */
        this.taxi_time = 3;

        /**
         * Either IFR or VFR (Instrument/Visual Flight Rules)
         *
         * @for AircraftModel
         * @property rules
         * @type {FLIGHT_RULES}
         * @default FLIGHT_RULES.IFR
         */
        this.rules = FLIGHT_RULES.IFR;

        /**
         * Flag for if an aircraft is within controlled airspace, thus
         * making an aircraft _controllable_
         *
         * @for AircraftModel
         * @property isControllable
         * @type {boolean}
         * @default false
         */
        this.isControllable = false;

        /**
         * List of aircraft that MAY be in conflict (bounding box)
         *
         * @for AircraftModel
         * @property conflicts
         * @type {object}
         * @default {}
         */
        this.conflicts = {};

        /**
         * @for AircraftModel
         * @property terrain_ranges
         * @type {boolean}
         * @default false
         */
        this.terrain_ranges = false;

        /**
         * Flag used to determine if an aircraft is established on a holding pattern
         *
         * This is switched to true after the first turn of a holding pattern is made.
         * This allows for offset calculations to be performed on the legLength to
         * account for the time it takes to make a turn from one leg to the next
         * in a holding pattern.
         *
         * @for AircraftModel
         * @property _isEstablishedOnHoldingPattern
         * @type {boolean}
         * @default false
         * @private
         */
        this._isEstablishedOnHoldingPattern = false;

        /**
         * Flag used to determine if an aircraft can be removed from the sim.
         *
         * This tells the `AircraftController` that `AircraftStripView` associated with this
         * instance is safe to remove. This property should only be changed via the
         * `.setIsFlightStripRemovable()` method
         *
         * The `AircraftModel` will know when conditions are correct for the `StripView`
         * to be removed, however, only the `AircraftController` has access to an aircraft's
         * `StripView`.
         *
         * @for AircraftModel
         * @property isRemovable
         * @type {boolean}
         * @default false
         */
        this.isFlightStripRemovable = false;

        /**
         * Flag used to determine if an aircraft can be removed from the sim.
         *
         * This tells the `AircraftController` that this instance is safe to remove.
         * This property should only be changed via the `.setIsRemovable()` method.
         *
         * @for AircraftModel
         * @property isRemovable
         * @type {boolean}
         * @default false
         */
        this.isRemovable = false;

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
            heading: null,
            turn: null,
            speed: 0
        };

        // TODO: Move all target properties here in order to utilize getters/setters
        // this._targetAltitude = 0;
        // this._targetAltitudeExpedite = false;
        this._targetHeading = null;
        this._targetGroundTrack = null;
        // this._targetTurnDirection = null;
        // this._targetIndicatedAirspeed = 0;

        /**
         * @for AircraftModel
         * @property model
         * @type {AircraftTypeDefinitionModel}
         */
        this.model = new AircraftTypeDefinitionModel(options.model);

        /**
         * @for AircraftModel
         * @property mcp
         * @type {ModeController}
         */
        this.mcp = new ModeController();

        /**
         * @for AircraftModel
         * @property fms
         * @type {Fms}
         */
        this.fms = new Fms(options);

        /**
         * @for AircraftModel
         * @property pilot
         * @type {Pilot}
         */
        this.pilot = new Pilot(this.fms, this.mcp);

        this.takeoffTime = options.category === FLIGHT_CATEGORY.ARRIVAL ?
            TimeKeeper.accumulatedDeltaTime :
            null;

        this.buildCurrentTerrainRanges();
        this.buildRestrictedAreaLinks();
        this.parse(options);

        const airport = AirportController.airport_get();
        // const initialRunway = airport.getActiveRunwayForCategory(this.category);

        if (this.category === FLIGHT_CATEGORY.DEPARTURE) {
            this.setFlightPhase(FLIGHT_PHASE.APRON);
            this.altitude = airport.positionModel.elevation;
            this.speed = 0;
        } else if (this.category !== FLIGHT_CATEGORY.ARRIVAL && this.category !== FLIGHT_CATEGORY.OVERFLIGHT) {
            throw new Error('Invalid #category found in AircraftModel');
        }

        if (this.category !== FLIGHT_CATEGORY.DEPARTURE) {
            const bottomAltitude = this.fms.getBottomAltitude();
            const airportModel = AirportController.airport_get();
            const airspaceCeiling = airportModel.maxAssignableAltitude;

            this.mcp.initializeForAirborneFlight(
                bottomAltitude,
                airspaceCeiling,
                this.altitude,
                this.heading,
                this.speed
            );
        }
    }

    /**
     * The magnetic heading to target while applying NO correction for the wind, in radians
     * NOTE: This will not be the heading the aircraft moves along-- the wind will blow it off
     *       course. For that heading, use #targetGroundTrack instead.
     *
     * @for AircraftModel
     * @property targetHeading
     * @type {number} heading, in radians magnetic
     */
    get targetHeading() {
        if (_isNil(this._targetHeading)) {
            if (_isNil(this._targetGroundTrack)) {
                throw new TypeError('Expected a targetHeading OR targetGroundTrack, but neither has been set!');
            }

            return this._calculateCrabHeadingForGroundTrack(this._targetGroundTrack);
        }

        return this._targetHeading;
    }

    set targetHeading(heading) {
        this._targetHeading = heading;
        this._targetGroundTrack = null;
    }

    /**
    * The magnetic heading to target, for which a/c SHOULD apply wind correction, in radians
    * NOTE: This will not be the heading the aircraft is actually facing-- the aircraft will be crabbing into
    *       the wind. For the heading the aircraft is physically pointing at, use #targetHeading instead.
    *
    * @for AircraftModel
    * @property targetGroundTrack
    * @type {number} heading, in radians magnetic
    */
    get targetGroundTrack() {
        if (_isNil(this._targetGroundTrack)) {
            if (_isNil(this._targetHeading)) {
                throw new TypeError('Expected a targetHeading OR targetGroundTrack, but neither has been set!');
            }

            return this._calculateGroundTrackForHeading(this._targetHeading);
        }

        return this._targetGroundTrack;
    }

    set targetGroundTrack(groundTrack) {
        this._targetGroundTrack = groundTrack;
        this._targetHeading = null;
    }

    /**
     * @for AircraftModel
     * @property callsign
     * @return {string}
     */
    get callsign() {
        return `${this.airlineId.toUpperCase()}${this.flightNumber.toUpperCase()}`;
    }

    /**
     * Current flight phase
     *
     * @for AircraftModel
     * @property flightPhase
     * @type {string}
     */
    get flightPhase() {
        return this.fms.currentPhase;
    }

    /**
     * Fascade to access relative position
     *
     * @for AircraftModel
     * @property relativePosition
     * @type {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        return this.positionModel.relativePosition;
    }

    // TODO: this feels like it belongs in either the AirportModel or the AirspaceModel which then exposes a
    // method that will check collisions
    /**
     * @for AircraftModel
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
     * @for AircraftModel
     * @method buildRestrictedAreaLinks
     */
    buildRestrictedAreaLinks() {
        const restrictedAreas = AirportController.current.restricted_areas;

        _forEach(restrictedAreas, (area) => {
            this.restricted.list.push({
                data: area,
                range: null,
                inside: false
            });
        });
    }

    parse(data) {
        this.positionModel = data.positionModel;
        this.transponderCode = data.transponderCode;
        this.airlineId = data.airline;
        this.airlineCallsign = data.airlineCallsign;
        this.flightNumber = data.callsign;
        this.category = data.category;
        this.heading = data.heading;
        this.altitude = data.altitude;
        this.speed = data.speed;
        this.origin = _get(data, 'origin', this.origin);
        this.destination = _get(data, 'destination', this.destination);

        this.target.altitude = this.altitude;
        this.targetHeading = this.heading;
        this.target.speed = this.speed;

        // This assumes and arrival spawns outside the airspace
        this.isControllable = data.category === FLIGHT_CATEGORY.DEPARTURE;
    }

    /**
     * Build an object that contains all the correct data, in the correct shape,
     * so it can be injected into the view.
     *
     * This method should only be used by the `StripView` classes when instantiating
     * or updating the aircraft progress strips.
     *
     * The data here should be considered read-only.
     *
     * @for AircraftModel
     * @method getViewModel
     * @return {object<string, string>}
     */
    getViewModel() {
        let assignedAltitude = '-';
        let flightPlanAltitude = '-';

        if (this.mcp.altitude !== INVALID_NUMBER) {
            assignedAltitude = Math.round(this.mcp.altitude) * UNIT_CONVERSION_CONSTANTS.FT_FL;
        }

        if (this.fms.flightPlanAltitude !== INVALID_NUMBER) {
            flightPlanAltitude = this.fms.flightPlanAltitude * UNIT_CONVERSION_CONSTANTS.FT_FL;
        }

        return {
            id: this.id,
            insideCenter: this.isControllable,
            callsign: this.callsign,
            transponderCode: this.transponderCode,
            icaoWithWeightClass: this.model.icaoWithWeightClass,
            assignedAltitude,
            flightPlanAltitude,
            arrivalAirportId: this.destination.toUpperCase(),
            departureAirportId: this.origin.toUpperCase(),
            flightPlan: this.fms.getFullRouteStringWithoutAirportsWithSpaces()
        };
    }

    /**
     * Returns a true value if there is a match from the callsignToMatch
     *
     * @for AircraftModel
    * @method matchCallsign
    * @param callsign {string}
     */
    matchCallsign(callsignToMatch) {
        const shouldMatchAnyCallsign = callsignToMatch === '*';
        // checks to see if the given call sign matches the airline Id + callsign format
        if (shouldMatchAnyCallsign || (this.airlineId.toUpperCase() + callsignToMatch.toUpperCase() === this.callsign)) {
            return true;
        }

        // Checks to see if the given callsign matches only the callsign since callsign numbers should be unique
        return _isEqual(callsignToMatch.toUpperCase(), this.callsign);
    }

    /**
     * verifies if there is a matched callsign and if the  aircraft is visable.
     * @for AircraftModel
     * @method getCallsign
     * @return {string}
     */
    getCallsign() {
        return this.callsign.toUpperCase();
    }

    /**
     * @for AircraftModel
     * @method getRadioCallsign
     * @return cs {string}
     */
    getRadioCallsign() {
        let weight = this.model.getRadioWeightClass();

        if (!_isEmpty(weight)) {
            weight = ` ${weight}`;
        }

        if (this.airlineCallsign === 'November') {
            return `${this.airlineCallsign} ${radio_spellOut(this.flightNumber)}${weight}`;
        }

        return `${this.airlineCallsign} ${groupNumbers(this.flightNumber)}${weight}`;
    }


    // TODO: this method should move to the `AircraftTypeDefinitionModel`
    /**
     * @for AircraftModel
     * @method getClimbRate
     * @return {number}
     */
    getClimbRate() {
        let serviceCeilingClimbRate;
        let cr_uncorr;
        let cr_current;
        const { altitude } = this;
        const rate = this.model.rate.climb;
        const { ceiling } = this.model;

        if (this.model.engines.type === 'J') {
            serviceCeilingClimbRate = 500;
        } else {
            serviceCeilingClimbRate = 100;
        }

        // TODO: enumerate the magic number
        // in troposphere
        if (this.altitude < 36152) {
            // TODO: break this assignemnt up into smaller parts and holy magic numbers! enumerate the magic numbers
            cr_uncorr = rate * 420.7 * ((1.232 * (((518.6 - 0.00356 * altitude) / 518.6) ** 5.256)) /
                (518.6 - 0.00356 * altitude));
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
     * @for AircraftModel
     * @method cancelFix
     */
    cancelFix() {
        this.fms.cancelFix();
    }

    /**
     * Abort the landing attempt, and fly present heading, climbing to the minimum safe altitude
     *
     * @for AircraftModel
     * @method cancelLanding
     */
    cancelLanding() {
        if (this.projected) {
            return;
        }

        const missedApproachAltitude = _ceil(this.fms.arrivalRunwayModel.elevation + 2000, -3);
        const nextIfrAltitudeBelow = _floor(this.altitude, -3);
        let nextAltitudeToMaintain = missedApproachAltitude;
        let radioMessage = `going missed approach, present heading, climbing to ${missedApproachAltitude}`;

        if (nextIfrAltitudeBelow >= missedApproachAltitude) {
            nextAltitudeToMaintain = nextIfrAltitudeBelow;
            radioMessage = `going missed approach, present heading, leveling at ${nextIfrAltitudeBelow}`;
        }

        this.pilot.hasApproachClearance = false;

        this.mcp.setAltitudeFieldValue(nextAltitudeToMaintain);
        this.mcp.setAltitudeHold();
        this.mcp.setHeadingFieldValue(this.heading);
        this.mcp.setHeadingHold();
        this.setFlightPhase(FLIGHT_PHASE.DESCENT);
        this.radioCall(radioMessage, AIRPORT_CONTROL_POSITION_NAME.APPROACH, true);
    }

    /**
     * Return whether the aircraft is off the ground
     *
     * @for AircraftModel
     * @method isAirborne
     * @return {boolean}
     */
    isAirborne() {
        return !this.isOnGround();
    }

    /**
     * Returns whether it is time to begin deceleration in order to comply with the posted speed restrictions
     *
     * @for AircraftModel
     * @method isBeyondDecelerationPointForWaypointModel
     * @param waypointModel {WaypointModel} the waypoint with a speed restriction
     * @return {boolean}
     */
    isBeyondDecelerationPointForWaypointModel(waypointModel) {
        if (_isNil(waypointModel)) {
            return false;
        }

        const waypointSpeed = waypointModel.speedMaximum;
        const waypointDistance = this.positionModel.distanceToPosition(waypointModel.positionModel);
        const speedChange = waypointSpeed - this.speed;
        const decelerationRate = -this.model.rate.decelerate / 2; // units of rate.decel are 'knots per 2 seconds'
        const decelerationTime = speedChange / decelerationRate;
        const timeUntilWaypoint = waypointDistance / this.groundSpeed * TIME.ONE_HOUR_IN_SECONDS;

        return decelerationTime > timeUntilWaypoint;
    }

    /**
     * Returns whether it is time to begin descent in order to comply with the posted altitude restrictions
     *
     * @for AircraftModel
     * @method isBeyondTopOfDescentForWaypointModel
     * @param waypointModel {WaypointModel} the waypoint at which to comply with the restriction
     * @param targetAltitude {number} the altitude to comnply with
     * @return {boolean}
     */
    isBeyondTopOfDescentForWaypointModel(waypointModel, targetAltitude) {
        const targetPosition = waypointModel.positionModel;
        const waypointDistance = this.positionModel.distanceToPosition(targetPosition);
        const altitudeChange = targetAltitude - this.altitude;
        const descentRate = -this.model.rate.descent * PERFORMANCE.TYPICAL_DESCENT_FACTOR;
        const descentTime = altitudeChange / descentRate;
        const timeUntilWaypoint = waypointDistance / this.groundSpeed * TIME.ONE_HOUR_IN_MINUTES;

        return descentTime > timeUntilWaypoint;
    }

    /**
     * Returns whether the aircraft is an arrival
     *
     * @for AircraftModel
     * @method isArrival
     * @returns {boolean}
     */
    isArrival() {
        return this.fms.isArrival();
    }

    /**
     * Returns whether the aircraft is a departure
     *
     * @for AircraftModel
     * @method isDeparture
     * @returns {booelan}
     */
    isDeparture() {
        return this.fms.isDeparture();
    }

    /**
     * Returns whether or not this aircraft is an overflight (neither departing or arriving within our airspace)
     *
     * @for AircraftModel
     * @method isArrival
     * @returns booelan
     */
    isOverflight() {
        return this.origin === '' && this.destination === '';
    }

    /**
     * Returns whether aircraft is above the glidepath at (or abeam) their current position
     *
     * Note that a small allowance is applied here to still be considered "on or below"
     *
     * @for AircraftModel
     * @method isAboveGlidepath
     * @return {boolean}
     */
    isAboveGlidepath() {
        const glideslopeAltitude = this._calculateArrivalRunwayModelGlideslopeAltitude();
        const altitudeDifference = glideslopeAltitude - this.altitude;

        return altitudeDifference < -PERFORMANCE.MAXIMUM_ALTITUDE_DIFFERENCE_CONSIDERED_ESTABLISHED_ON_GLIDEPATH;
    }

    /**
     * Aircraft is established on the course tuned into the nav radio and course
     *
     * @for AircraftModel
     * @method isEstablishedOnCourse
     * @return {boolean}
     */
    isEstablishedOnCourse() {
        const runwayModel = this.fms.arrivalRunwayModel;

        if (!runwayModel) {
            return false;
        }

        // TODO: the `this` here is ugly, but will be needed until `getOffset`
        // is refactored (#291 - https://github.com/openscope/openscope/issues/291)
        // TODO: The methods called here should be moved to the AircraftModel,
        // so that it can also be used for non-runway course interception
        return runwayModel.isOnApproachCourse(this) && runwayModel.isOnCorrectApproachGroundTrack(this.groundTrack);

        // TODO: Use this instead
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
     * Aircraft is established on the glidepath
     *
     * Note that this is currently only usable for runway glideslopes, but should eventually
     * be elaborated upon to support other types of glidepaths (such as those from FMS VNAV)
     *
     * @for AircraftModel
     * @method isEstablishedOnCourse
     * @return {boolean}
     */
    isEstablishedOnGlidepath() {
        const glideslopeAltitude = this._calculateArrivalRunwayModelGlideslopeAltitude();
        const glideslopeAltitudeDifference = abs(glideslopeAltitude - this.altitude);

        return glideslopeAltitudeDifference <= PERFORMANCE.MAXIMUM_ALTITUDE_DIFFERENCE_CONSIDERED_ESTABLISHED_ON_GLIDEPATH;
    }

    // TODO: the logic here should be moved to the `AirportModel`
    /**
     * Checks if the aircraft is inside the airspace of a specified airport
     *
     * @for AircraftModel
     * @method isInsideAirspace
     * @param  {airport} airport the airport whose airspace we are checking
     * @return {boolean}
     */
    isInsideAirspace(airport) {
        let withinAirspaceLateralBoundaries = this.distance <= airport.ctr_radius;
        const withinAirspaceAltitudeRange = this.altitude <= airport.ctr_ceiling;

        // polygonal airspace boundary
        if (!_isNil(airport.perimeter)) {
            withinAirspaceLateralBoundaries = point_in_area(this.positionModel.relativePosition, airport.perimeter);
        }

        return withinAirspaceAltitudeRange && withinAirspaceLateralBoundaries;
    }

    /**
     * Returns whether the aircraft is on the approach course and within the final approach fix
     *
     * @for AircraftModel
     * @method isOnFinal
     * @return {boolean}
     */
    isOnFinal() {
        if (!this.isEstablishedOnCourse()) {
            return false;
        }

        const approachDistanceNm = this.positionModel.distanceToPosition(this.mcp.nav1Datum);
        const maxDistanceConsideredOnFinalNm = AIRPORT_CONSTANTS.FINAL_APPROACH_FIX_DISTANCE_NM;

        return approachDistanceNm <= maxDistanceConsideredOnFinalNm;
    }

    /**
     * Aircraft has "weight-on-wheels" (on the ground)
     *
     * @for AircraftModel
     * @method isOnGround
     * @return {boolean}
     */
    isOnGround() {
        let airportModel = this.fms.departureAirportModel;
        let runwayModel = this.fms.departureRunwayModel;

        if (this.isOverflight()) {
            return false;
        }

        if (this.isArrival()) {
            airportModel = this.fms.arrivalAirportModel;
            runwayModel = this.fms.arrivalRunwayModel;
        }

        const errorAllowanceInFeet = 5;
        const isAtOrBelowRunwayAltitude = this.altitude - runwayModel.elevation < errorAllowanceInFeet;
        const isAtOrBelowAirportAltitude = this.altitude - airportModel.elevation < errorAllowanceInFeet;

        return isAtOrBelowRunwayAltitude || isAtOrBelowAirportAltitude;
    }

    /**
     * Aircraft is on the apron
     *
     * @for AircraftModel
     * @method isApron
     * @return {boolean}
     */
    isApron() {
        return this.flightPhase === FLIGHT_PHASE.APRON;
    }

    /**
     * @for AircraftModel
     * @method isStopped
     */
    isStopped() {
        // TODO: enumerate the magic number.
        return this.isOnGround() && this.speed < 5;
    }

    /**
     * Return whether the aircraft is in flight AND below its stall speed
     *
     * @for AircraftModel
     * @method isStalling
     * @return {boolean}
     */
    isStalling() {
        const isStalling = this.speed < this.model.speed.min && this.isAirborne();

        return isStalling;
    }

    /**
     * @for AircraftModel
     * @method isTaxiing
     */
    isTaxiing() {
        return this.flightPhase === FLIGHT_PHASE.APRON ||
            this.flightPhase === FLIGHT_PHASE.TAXI ||
            this.flightPhase === FLIGHT_PHASE.WAITING;
    }

    // TODO: The function description and what it actually does do not match
    /**
     * Returns whether the aircraft is currently taking off
     *
     * @for AircraftModel
     * @method isTakeoff
     */
    isTakeoff() {
        return this.isTaxiing() || this.flightPhase === FLIGHT_PHASE.TAKEOFF;
    }

    /**
     * @for AircraftModel
     * @method isVisible
     * @return {boolean}
     */
    isVisible() {
        // hide aircraft on taxiways
        if (this.flightPhase === FLIGHT_PHASE.APRON || this.flightPhase === FLIGHT_PHASE.TAXI) {
            return false;
        }

        if (this.flightPhase === FLIGHT_PHASE.WAITING) {
            // show only the first aircraft in the takeoff queue
            return this.fms.departureRunwayModel.isAircraftNextInQueue(this.id);
        }

        return true;
    }

    /**
     * Sets `#isFlightStripRemovable` to true
     *
     * Provides a single source of change for the value of `#isFlightStripRemovable`
     *
     * @for AircraftModel
     * @method isFlightStripRemovable
     */
    setIsFlightStripRemovable() {
        this.isFlightStripRemovable = true;
    }

    /**
     * Sets `#isRemovable` to true
     *
     * Provides a single source of change for the value of `#isRemovable`
     * This is evaluated by the `AircraftController` when determining
     * if an aircraft should be removed or not
     *
     * @for AircraftModel
     * @method setIsRemovable
     */
    setIsRemovable() {
        this.isRemovable = true;
    }

    /**
      * @for AircraftModel
      * @method getWindComponents
      * @return {object} headwind and crosswind
      */
    getWindComponents() {
        const { wind } = AirportController.airport_get();
        const crosswindAngle = calculateCrosswindAngle(this.heading, wind.angle);

        return {
            cross: sin(crosswindAngle) * wind.speed,
            head: cos(crosswindAngle) * wind.speed
        };
    }

    /**
     * Reposition the aircraft to the location of the specified runway
     *
     * @for AircraftModel
     * @method moveToRunway
     * @param runwayModel {RunwayModel}
     */
    moveToRunway(runwayModel) {
        this.positionModel.setCoordinates(runwayModel.gps);

        this.heading = runwayModel.angle;
        this.altitude = runwayModel.elevation;
    }

    /**
     * @for AircraftModel
     * @method radioCall
     * @param msg {string}
     * @param sectorType {string}
     * @param alert {string}
     */
    radioCall(msg, sectorType, alert) {
        if (this.projected) {
            return;
        }

        const writtenCallsign = this.callsign;
        const spokenCallsign = this.getRadioCallsign();

        // let call = '';
        //
        // if (sectorType) {
        //     call += AirportController.airport_get().radio[sectorType];
        // }
        //
        // call += ", " + this.callsign + " " + msg;

        // TODO: quick abstraction, this doesn't belong here.
        const logMessage = (callsign) => `${AirportController.airport_get().radio[sectorType]}, ${callsign} ${msg}`;

        if (alert) {
            const isWarning = true;
            UiController.ui_log(logMessage(writtenCallsign), isWarning);
        } else {
            UiController.ui_log(logMessage(writtenCallsign));
        }

        speech_say(
            [{
                type: 'text',
                content: logMessage(spokenCallsign)
            }],
            this.pilotVoice
        );
    }

    /**
     * @for AircraftModel
     * @method callUp
     */
    callUp() {
        let alt_log;
        let alt_say;

        if (this.isArrival()) {
            const altdiff = this.altitude - this.mcp.altitude;
            const alt = digits_decimal(this.altitude, -2);

            if (Math.abs(altdiff) > 200) {
                if (altdiff > 0) {
                    alt_log = `descending through ${alt} for ${this.mcp.altitude}`;
                    alt_say = `descending through ${radio_altitude(alt)} for ${radio_altitude(this.mcp.altitude)}`;
                } else if (altdiff < 0) {
                    alt_log = `climbing through ${alt} for ${this.mcp.altitude}`;
                    alt_say = `climbing through ${radio_altitude(alt)} for ${radio_altitude(this.mcp.altitude)}`;
                }
            } else {
                alt_log = `at ${alt}`;
                alt_say = `at ${radio_altitude(alt)}`;
            }

            UiController.ui_log(`${AirportController.airport_get().radio.app}, ${this.callsign} with you ${alt_log}`);
            speech_say(
                [
                    { type: 'text', content: `${AirportController.airport_get().radio.app}, ` },
                    { type: 'callsign', content: this },
                    { type: 'text', content: `with you ${alt_say}` }
                ],
                this.pilotVoice
            );
        }

        if (this.isDeparture()) {
            UiController.ui_log(`${AirportController.airport_get().radio.twr}, ${this.callsign}, ready to taxi`);
            speech_say(
                [
                    { type: 'text', content: AirportController.airport_get().radio.twr },
                    { type: 'callsign', content: this },
                    { type: 'text', content: ', ready to taxi' }
                ],
                this.pilotVoice
            );
        }
    }

    /**
     * @for AircraftModel
     * @method taxiToRunway
     * @param runwayModel {RunwayModel}
     * @return {array} [success of operation, readback]
     */
    taxiToRunway(runwayModel) {
        if (this.isAirborne()) {
            return [false, 'unable to taxi, we\'re already airborne'];
        }

        if (this.flightPhase === FLIGHT_PHASE.TAKEOFF) {
            return [false, 'unable to taxi, we\'re already taking off'];
        }

        if (this.isArrival()) {
            return [false, 'unable to taxi to runway, we have just landed'];
        }

        this.setFlightPhase(FLIGHT_PHASE.TAXI);
        // remove aircraft from previous runway's queue
        this.fms.departureRunwayModel.removeAircraftFromQueue(this.id);
        this.fms.setDepartureRunway(runwayModel);
        this.fms.departureRunwayModel.addAircraftToQueue(this.id);

        this.taxi_start = TimeKeeper.accumulatedDeltaTime;

        GameController.game_timeout(
            this._changeFromTaxiToWaiting,
            this.taxi_time,
            this,
            null
        );

        const readback = {};
        readback.log = `taxi to and hold short of Runway ${runwayModel.name}`;
        readback.say = `taxi to and hold short of Runway ${radio_runway(runwayModel.name)}`;

        return [true, readback];
    }

    /**
     * @for AircraftModel
     * @method _changeFromTaxiToWaiting
     */
    _changeFromTaxiToWaiting() {
        this.setFlightPhase(FLIGHT_PHASE.WAITING);
    }

    /**
     * Initialize all autopilot systems after being given an IFR clearance to destination and execute takeoff.
     *
     * @for AircraftModel
     * @method takeoff
     * @param runway {RunwayModel} the runway taking off on
     */
    takeoff(runway) {
        const cruiseSpeed = this.model.speed.cruise;
        const initialAltitude = this.fms.getInitialClimbClearance();

        this._prepareMcpForTakeoff(initialAltitude, runway.angle, cruiseSpeed);
        this.setFlightPhase(FLIGHT_PHASE.TAKEOFF);
        EventBus.trigger(AIRCRAFT_EVENT.TAKEOFF, this, runway);

        this.takeoffTime = TimeKeeper.accumulatedDeltaTime;
        runway.lastDepartedAircraftCallsign = this.callsign;
    }

    /**
     * Initialize all autopilot systems for takeoff.
     *
     * @for AircraftModel
     * @method _prepareMcpForTakeoff
     * @param altitude {number}
     * @param heading {number}
     * @param speed {number}
     */
    _prepareMcpForTakeoff(altitude, heading, speed) {
        if (this.mcp.altitude === INVALID_NUMBER) {
            this.mcp.setAltitudeFieldValue(altitude);
        }

        if (this.mcp.altitudeMode === MCP_MODE.ALTITUDE.OFF) {
            this.mcp.setAltitudeHold();
        }

        if (this.mcp.heading === INVALID_NUMBER) {
            this.mcp.setHeadingFieldValue(heading);
        }

        if (this.mcp.headingMode === MCP_MODE.HEADING.OFF) {
            this.mcp.setHeadingLnav();
        }

        if (this.mcp.speed === INVALID_NUMBER) {
            this.mcp.setSpeedFieldValue(speed);
        }

        if (this.mcp.speedMode === MCP_MODE.SPEED.OFF) {
            this.mcp.setSpeedN1();
        }
    }

    /**
     * Update the aircraft's targeted telemetry (altitude, heading, and speed)
     *
     * @for AircraftModel
     * @method updateTarget
     */
    updateTarget() {
        this.target.altitude = _defaultTo(this._calculateTargetedAltitude(), this.target.altitude);

        this._updateTargetedDirectionality();

        this.target.speed = _defaultTo(this._calculateTargetedSpeed(), this.target.speed);

        // TODO: this method may not be needed but could be leveraged for housekeeping if deemed appropriate
        this.overrideTarget();
    }

    /**
     * @for AircraftModel
     * @method overrideTarget
     */
    overrideTarget() {
        switch (this.flightPhase) {
            case FLIGHT_PHASE.APRON:
                // TODO: Is this needed?
                // this.target.altitude = this.altitude;
                // this.targetHeading = this.heading;
                // this.target.speed = 0;

                break;

            case FLIGHT_PHASE.TAXI:
                // TODO: Is this needed?
                // this.target.altitude = this.altitude;
                // this.targetHeading = this.heading;
                // this.target.speed = 0;

                break;

            case FLIGHT_PHASE.WAITING:
                // TODO: Is this needed?
                // this.target.altitude = this.altitude;
                // this.targetHeading = this.heading;
                // this.target.speed = 0;

                break;

            case FLIGHT_PHASE.TAKEOFF: {
                this.target.altitude = this.altitude;

                if (this.speed >= this.model.speed.min) {
                    this.target.altitude = this.model.ceiling;
                }

                this.targetHeading = this.heading;
                this.target.speed = this.model.speed.min;

                if (this.mcp.heading === INVALID_NUMBER) {
                    console.warn(`${this.callsign} took off with no directional instructions!`);
                }

                break;
            }

            case FLIGHT_PHASE.CLIMB:
                break;

            case FLIGHT_PHASE.CRUISE:
                break;

            case FLIGHT_PHASE.DESCENT:
                break;

            case FLIGHT_PHASE.APPROACH:
                break;

            case FLIGHT_PHASE.LANDING: {
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

        if (this.target.altitude > this.model.ceiling) {
            this.target.altitude = this.model.ceiling;
        }

        if (this.target.speed > this.model.speed.max) {
            this.target.speed = this.model.speed.max;
        }

        if (this.target.speed < this.model.speed.min && this.isAirborne()) {
            this.target.speed = this.model.speed.min;
        }
    }

    /**
     * Fascade to set the fms's flight phase
     *
     * @for AircraftModel
     * @method setFlightPhase
     * @param phase {string}
     */
    setFlightPhase(phase) {
        this.fms.setFlightPhase(phase);
    }

    /**
     * Update the FMS's flight phase
     *
     * @for AircraftModel
     * @method updateFlightPhase
     */
    updateFlightPhase() {
        const runwayModel = this.fms.departureRunwayModel;

        switch (this.flightPhase) {
            case FLIGHT_PHASE.TAXI: {
                const elapsed = TimeKeeper.accumulatedDeltaTime - this.taxi_start;

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

            case FLIGHT_PHASE.CRUISE:
                if (this.altitude < this.fms.flightPlanAltitude) {
                    this.setFlightPhase(FLIGHT_PHASE.DESCENT);
                }

                break;

            case FLIGHT_PHASE.DESCENT:
                if (this.pilot.hasApproachClearance && this.isEstablishedOnCourse()) {
                    this.setFlightPhase(FLIGHT_PHASE.APPROACH);

                    if (!this.projected) {
                        EventBus.trigger(AIRCRAFT_EVENT.APPROACH, this);
                    }
                }

                break;

            case FLIGHT_PHASE.APPROACH: {
                if (!this.isOnFinal()) {
                    break;
                }

                if (!this.isEstablishedOnGlidepath()) {
                    this.cancelLanding();

                    break;
                }

                this.setFlightPhase(FLIGHT_PHASE.LANDING);

                if (!this.projected) {
                    EventBus.trigger(AIRCRAFT_EVENT.FINAL_APPROACH, this, this.fms.arrivalRunwayModel);
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
     * Calculate the glideslope altitude abeam the current position for the expected landing runway
     *
     * @for AircraftModel
     * @method _calculateArrivalRunwayModelGlideslopeAltitude
     * @private
     */
    _calculateArrivalRunwayModelGlideslopeAltitude() {
        const runwayModel = this.fms.arrivalRunwayModel;
        const offset = getOffset(this, runwayModel.relativePosition, runwayModel.angle);
        const distanceOnFinalKm = offset[1];
        const glideslopeAltitude = runwayModel.getGlideslopeAltitude(distanceOnFinalKm);

        return glideslopeAltitude;
    }

    /**
     * Calculate the heading needed in order for the aircraft to move along a specified angle across the ground
     * https://www.cliffsnotes.com/study-guides/trigonometry/vectors/vector-operations (see example 2)
     *
     * @for AircraftModel
     * @method _calculateCrabHeadingForGroundTrack
     * @param {number} groundTrackHeading
     * @returns {number} magnetic heading, in radians
     * @private
     */
    _calculateCrabHeadingForGroundTrack(groundTrackHeading) {
        const windVector = AirportController.airport_get().getWindVectorAtAltitude(this.altitude);
        const windAngle = vradial(windVector);
        const angleDifference = groundTrackHeading - windAngle;
        const crabAngle = Math.asin((vlen(windVector) * sin(angleDifference)) / this.trueAirspeed);

        return groundTrackHeading + crabAngle;
    }

    /**
     * Calculate the angle across the ground which results from the aircraft's heading and the wind
     *
     * @for AircraftModel
     * @method _calculateGroundTrackForHeading
     * @param {number} heading
     * @returns {number} magnetic heading, in radians
     * @priate
     */
    _calculateGroundTrackForHeading(heading) {
        const headingVector = vscale(vectorize_2d(heading), this.trueAirspeed);
        const windVector = AirportController.airport_get().getWindVectorAtAltitude(this.altitude);
        const groundTrackHeading = vradial(vadd(headingVector, windVector));

        return radians_normalize(groundTrackHeading);
    }

    /**
     * Determine the appropriate heading, or ground track, that the aircraft should be attempting to follow
     * Then, you can use #targetHeading and/or #targetGroundTrack to retrieve the desired information
     *
     * @for AircraftModel
     * @method _updateTargetedDirectionality
     * @private
     */
    _updateTargetedDirectionality() {
        if (this.mcp.autopilotMode !== MCP_MODE.AUTOPILOT.ON) {
            return;
        }

        if (this.flightPhase === FLIGHT_PHASE.LANDING) {
            this.targetGroundTrack = this._calculateTargetedGroundTrackDuringLanding();

            return;
        }

        switch (this.mcp.headingMode) {
            case MCP_MODE.HEADING.OFF: {
                this.targetHeading = this.heading;

                break;
            }

            case MCP_MODE.HEADING.HOLD: {
                this.targetHeading = this.mcp.heading;

                break;
            }

            case MCP_MODE.HEADING.LNAV: {
                this.targetGroundTrack = this._calculateTargetedGroundTrackLnav();

                break;
            }

            case MCP_MODE.HEADING.VOR_LOC: {
                this.targetGroundTrack = this._calculateTargetedHeadingToInterceptCourse();

                break;
            }

            default:
                console.warn('Expected MCP heading mode of "OFF", "HOLD", "LNAV", or "VOR", ' +
                    `but received "${this.mcp.headingMode}"`);
        }
    }

    /**
     * Calculate the aircraft's targeted speed
     *
     * @for AircraftModel
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
                const vnavSpeed = this._calculateTargetedSpeedVnav();

                return this._calculateLegalSpeed(vnavSpeed);
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
     * @for AircraftModel
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
     * @for AircraftModel
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
                return this._calculateTargetedAltitudeVnav();
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
     * @for AircraftModel
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

        if (!this.isEstablishedOnCourse()) {
            return this.mcp.altitude;
        }

        // ILS SPECIFIC CODE
        const glideslopeAltitude = this._calculateArrivalRunwayModelGlideslopeAltitude();
        const altitudeToTarget = Math.min(this.mcp.altitude, glideslopeAltitude);

        return altitudeToTarget;
    }

    /**
     * Calculate the heading to target while intercepting a horizontally aligned course
     *
     * @for AircraftModel
     * @method _calculateTargetedHeadingToInterceptCourse
     * @private
     */
    _calculateTargetedHeadingToInterceptCourse() {
        // Guide aircraft onto the localizer
        const { course, nav1Datum } = this.mcp;
        const courseOffset = getOffset(this, nav1Datum.relativePosition, course);
        const lateralDistanceFromCourseNm = nm(courseOffset[0]);
        const headingDifference = angle_offset(course, this.heading);
        const bearingFromAircaftToRunway = this.positionModel.bearingToPosition(nav1Datum);
        const angleAwayFromLocalizer = course - bearingFromAircaftToRunway;
        const turnTimeInSeconds = abs(headingDifference) / PERFORMANCE.TURN_RATE; // time to turn headingDifference degrees
        // TODO: this should be moved to a class method `.getTurningRadius()`
        const turningRadius = this.speed * (turnTimeInSeconds * TIME.ONE_SECOND_IN_HOURS); // dist covered in the turn, nm
        const distanceCoveredDuringTurn = turningRadius * abs(headingDifference);
        const distanceToLocalizer = lateralDistanceFromCourseNm / sin(headingDifference); // dist from localizer intercept, nm
        const distanceEarly = 0.5; // start turn early, to avoid overshoots from tailwind
        const shouldAttemptIntercept = (distanceToLocalizer > 0 &&
            distanceToLocalizer <= distanceCoveredDuringTurn + distanceEarly);
        const inTheWindow = abs(angleAwayFromLocalizer) < degreesToRadians(1.5); // move to loc regardless of assigned heading

        if (!shouldAttemptIntercept && !inTheWindow) {
            return this.mcp.heading;
        }
        // continue if shouldAttemptIntercept OR inTheWindow

        const severity_of_correction = 20; // controls steepness of heading adjustments during localizer tracking
        let interceptAngle = angleAwayFromLocalizer * -severity_of_correction;
        const minimumInterceptAngle = degreesToRadians(10);
        const isAlignedWithCourse = abs(lateralDistanceFromCourseNm) <= PERFORMANCE.MAXIMUM_DISTANCE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE_NM;

        // TODO: This is a patch fix, and it stinks. This whole method needs to be improved greatly.
        if (inTheWindow || isAlignedWithCourse) {
            this.target.turn = null;

            return course + interceptAngle;
        }

        interceptAngle = spread(interceptAngle, -minimumInterceptAngle, minimumInterceptAngle);
        const interceptHeading = course + interceptAngle;

        // TODO: This should be abstracted
        if (this.mcp.heading < this.mcp.course) {
            const headingToFly = Math.max(interceptHeading, this.mcp.heading);

            return headingToFly;
        }

        if (this.mcp.heading > this.mcp.course) {
            const headingToFly = Math.min(interceptHeading, this.mcp.heading);

            return headingToFly;
        }
    }

    /**
     * This will update the FIX for the aircraft and will change the aircraft's heading
     *
     * @for AircraftModel
     * @method _calculateTargetedGroundTrackLnav
     */
    _calculateTargetedGroundTrackLnav() {
        if (!this.fms.currentWaypoint) {
            return new Error('Unable to utilize LNAV, because there are no waypoints in the FMS');
        }

        if (this.fms.currentWaypoint.isVectorWaypoint) {
            return this.fms.currentWaypoint.getVector();
        }

        if (this.fms.currentWaypoint.isHoldWaypoint) {
            return this._calculateTargetedHeadingHold();
        }

        const waypointPosition = this.fms.currentWaypoint.positionModel;
        const distanceToWaypoint = this.positionModel.distanceToPosition(waypointPosition);
        const groundTrackToWaypoint = this.positionModel.bearingToPosition(waypointPosition);
        const turnInitiationDistance = calculateTurnInitiationDistance(this, waypointPosition);
        const isTimeToStartTurning = distanceToWaypoint < turnInitiationDistance;
        const closeToBeingOverFix = distanceToWaypoint < PERFORMANCE.MAXIMUM_DISTANCE_TO_PASS_WAYPOINT_NM;
        const closeEnoughToFlyByFix = distanceToWaypoint < PERFORMANCE.MAXIMUM_DISTANCE_TO_FLY_BY_WAYPOINT_NM;
        const shouldFlyByFix = closeEnoughToFlyByFix && isTimeToStartTurning;
        let shouldMoveToNextFix = closeToBeingOverFix;

        if (!this.fms.currentWaypoint.isFlyOverWaypoint) {
            shouldMoveToNextFix = closeToBeingOverFix || shouldFlyByFix;
        }

        if (shouldMoveToNextFix) {
            if (!this.fms.hasNextWaypoint()) {
                // we've hit this block because and aircraft is about to fly over the last waypoint in its flightPlan
                this.pilot.maintainPresentHeading(this);

                return this.groundTrack;
            }

            this.fms.moveToNextWaypoint();

            const { currentWaypoint } = this.fms;

            if (currentWaypoint.isVectorWaypoint) {
                return currentWaypoint.getVector();
            }

            const nextWaypointPosition = currentWaypoint.positionModel;

            if (_isNil(nextWaypointPosition)) {
                console.warn('Expected a valid PositionModel object for waypoint ' +
                    `"${currentWaypoint.name}", but received ${nextWaypointPosition}`);
            }

            return this.positionModel.bearingToPosition(nextWaypointPosition);
        }

        return groundTrackToWaypoint;
    }

    /**
     * This will sets up and prepares the aircraft to hold
     *
     * @for AircraftModel
     * @method _calculateTargetedHeadingHold
     */
    _calculateTargetedHeadingHold() {
        const { currentWaypoint } = this.fms;
        const { holdParameters } = currentWaypoint;
        const waypointRelativePosition = currentWaypoint.relativePosition;
        const bearingToHoldFix = vradial(vsub(waypointRelativePosition, this.relativePosition));

        if (typeof holdParameters.inboundHeading === 'undefined') {
            // store the current heading as inbound heading, see #836
            holdParameters.inboundHeading = bearingToHoldFix;
        }

        const { inboundHeading, legLength } = holdParameters;
        const outboundHeading = radians_normalize(inboundHeading + Math.PI);
        const groundTrack = radians_normalize(this.groundTrack);
        const offset = getOffset(this, waypointRelativePosition, inboundHeading);
        const gameTime = TimeKeeper.accumulatedDeltaTime;
        const isPastFix = offset[1] < 1 && offset[2] < 2;
        const isTimerSet = holdParameters.timer !== INVALID_NUMBER;
        const isTimerExpired = isTimerSet && gameTime > holdParameters.timer;

        if (isPastFix && !this._isEstablishedOnHoldingPattern) {
            this._isEstablishedOnHoldingPattern = true;
        }

        if (!this._isEstablishedOnHoldingPattern) {
            return bearingToHoldFix;
        }

        let nextTargetHeading = outboundHeading;

        if (abs(groundTrack - outboundHeading) < PERFORMANCE.MAXIMUM_ANGLE_CONSIDERED_ESTABLISHED_ON_HOLD_COURSE && !isTimerSet) {
            let holdLegDurationInSeconds;

            if (legLength.indexOf('min') !== -1) {
                const holdLegDurationInMinutes = legLength.replace('min', '');
                holdLegDurationInSeconds = holdLegDurationInMinutes * TIME.ONE_MINUTE_IN_SECONDS;
            } else {
                // Leg is a distance, use the ground speed to determine the duration
                const holdLegDistance = legLength.replace('nm', '');
                holdLegDurationInSeconds = (holdLegDistance / this.groundSpeed) * TIME.ONE_HOUR_IN_SECONDS;
            }

            currentWaypoint.setHoldTimer(gameTime + holdLegDurationInSeconds);
        }

        if (isTimerExpired) {
            nextTargetHeading = bearingToHoldFix;

            if (isPastFix) {
                currentWaypoint.resetHoldTimer();
                nextTargetHeading = outboundHeading;
            }
        }

        this.target.turn = holdParameters.turnDirection;

        return nextTargetHeading;
    }

    /**
     * Calculates the altitude for a landing aircraft
     *
     * @for AircraftModel
     * @method _calculateTargetedAltitudeDuringLanding
     * @return {number}
     */
    _calculateTargetedAltitudeDuringLanding() {
        const runwayModel = this.fms.arrivalRunwayModel;
        const offset = getOffset(this, runwayModel.relativePosition, runwayModel.angle);
        const distanceOnFinal_km = offset[1];

        if (distanceOnFinal_km > 0) {
            return this._calculateTargetedAltitudeToInterceptGlidepath();
        }

        return runwayModel.elevation;
    }

    /**
     * Calculates the altitude for an aircraft in a VNAV-guided altitude change
     *
     * @for AircraftModel
     * @method _calculateTargetedAltitudeVnav
     * @return {number}
     */
    _calculateTargetedAltitudeVnav() {
        const altitudeMaximumWaypoint = this.fms.findNextWaypointWithMaximumAltitudeRestriction();
        const altitudeMinimumWaypoint = this.fms.findNextWaypointWithMinimumAltitudeRestriction();
        const maximumAltitudeExists = !_isNil(altitudeMaximumWaypoint);
        const minimumAltitudeExists = !_isNil(altitudeMinimumWaypoint);

        if (this.mcp.altitude < this.altitude) {
            // we want to descend...
            if (!minimumAltitudeExists || altitudeMinimumWaypoint.altitudeMinimum < this.mcp.altitude) {
                // ... and there is nothing that can stop us.
                return this.mcp.altitude;
            }

            const { altitudeMinimum } = altitudeMinimumWaypoint;

            if (this.altitude < altitudeMinimum) {
                // ... but we are too low and we have to comply with VNAV restriction
                return this._calculateTargetedAltitudeVnavClimb(altitudeMinimumWaypoint);
            }

            if (maximumAltitudeExists) {
                const { altitudeMaximum } = altitudeMaximumWaypoint;

                if (this.mcp.altitude > altitudeMaximum) {
                    // we are too high but we are prioritizing clearance over VNAV restriction
                    return this.mcp.altitude;
                }

                if (this.altitude > altitudeMaximum) {
                    // we are too high...
                    if (altitudeMinimum > altitudeMaximum) {
                        // the minimum altitude is above the maximum altiude, check if we can descend all the way down
                        // without violating VNAV restrictions.
                        const firstWaypoint = this._findFirstWaypoint(
                            this.fms.waypoints,
                            altitudeMinimumWaypoint,
                            altitudeMaximumWaypoint
                        );

                        if (firstWaypoint.name === altitudeMinimumWaypoint.name) {
                            // ... but we can not descend all the way down yet
                            return this._calculateTargetedAltitudeVnavDescent(altitudeMinimumWaypoint, altitudeMinimum);
                        }
                    }
                    // ...so descend to comply with VNAV restriction
                    return this._calculateTargetedAltitudeVnavDescent(altitudeMaximumWaypoint, altitudeMaximum);
                }
            }
        } else {
            // we want to climb...
            if (!maximumAltitudeExists || this.mcp.altitude < altitudeMaximumWaypoint.altitudeMaximum) {
                // ... and there is nothing that can stop us.
                return this.mcp.altitude;
            }

            const { altitudeMaximum } = altitudeMaximumWaypoint;

            if (this.altitude > altitudeMaximum) {
                // .. but we are too high and have to comply with NAV restriction
                return this._calculateTargetedAltitudeVnavDescent(altitudeMaximumWaypoint, altitudeMaximum);
            }

            if (minimumAltitudeExists) {
                const { altitudeMinimum } = altitudeMinimumWaypoint;

                if (this.mcp.altitude < altitudeMinimum) {
                    // we are too low but we are prioritizing clearance over VNAV restriction
                    return this.mcp.altitude;
                }

                if (this.altitude < altitudeMinimum) {
                    // we are too low ...
                    if (altitudeMaximum < altitudeMinimum) {
                        // the maximum altitude is below the minimal altiude, check if we can climb all the way up
                        // without violating VNAV restrictions.
                        const firstWaypoint = this._findFirstWaypoint(this.fms.waypoints, altitudeMinimumWaypoint, altitudeMaximumWaypoint);

                        if (firstWaypoint.name === altitudeMaximumWaypoint.name) {
                            // ... but we can not climb all the way up yet
                            return altitudeMaximum;
                        }
                    }
                    // ... climb to comply with VNAV restriction
                    return this._calculateTargetedAltitudeVnavClimb(altitudeMinimumWaypoint);
                }
            }

            return altitudeMaximum;
        }
    }

    /**
     * Takes two waypoints and returns the waypoint that comes first in the list of waypoints
     *
     * @for AircraftModel
     * @method _findFirstWaypoint
     * @param waypoints
     * @param waypointA {WaypointModel}
     * @param waypointB {WaypointModel}
     * @return waypointA or waypointB {WaypointModel}
     */
    _findFirstWaypoint(waypoints, waypointA, waypointB) {
        const indexOfA = _findIndex(waypoints, (waypoint) => waypoint.name === waypointA.name);
        const indexOfB = _findIndex(waypoints, (waypoint) => waypoint.name === waypointB.name);

        return indexOfA < indexOfB ? waypointA : waypointB;
    }

    /**
     * Calculates the altitude for an aircraft in a VNAV-guided climb
     *
     * @for AircraftModel
     * @method _calculateTargetedAltitudeVnavClimb
     * @param waypointWithMinimumAltitudeRestriction {WaypointModel}
     * @return {number}
     */
    _calculateTargetedAltitudeVnavClimb(waypointWithMinimumAltitudeRestriction) {
        const waypointMinimumAltitude = waypointWithMinimumAltitudeRestriction.altitudeMinimum;

        return waypointMinimumAltitude;
    }

    /**
     * Calculates the altitude for an aircraft in a VNAV-guided descent
     *
     * @for AircraftModel
     * @method _calculateTargetedAltitudeVnavDescent
     * @param waypointModel {WaypointModel} the waypoint at which to comply with the restriction
     * @param targetAltitude {number} the altitude to comply with
     * @return {number}
     */
    _calculateTargetedAltitudeVnavDescent(waypointModel, targetAltitude) {
        if (!this.isBeyondTopOfDescentForWaypointModel(waypointModel, targetAltitude)) {
            return;
        }

        return targetAltitude;
    }

    /**
     * Calculates the heading for a landing aircraft
     *
     * @for AircraftModel
     * @method _calculateTargetedGroundTrackDuringLanding
     * @return {number}
     */
    _calculateTargetedGroundTrackDuringLanding() {
        const runwayModel = this.fms.arrivalRunwayModel;
        const offset = getOffset(this, runwayModel.relativePosition, runwayModel.angle);
        const distanceOnFinal_nm = nm(offset[1]);

        if (distanceOnFinal_nm > 0) {
            const bearingFromAircaftToRunway = this.positionModel.bearingToPosition(runwayModel.positionModel);

            return bearingFromAircaftToRunway;
        }

        return runwayModel.angle;
    }

    /**
     * Calculates the speed for a landing aircraft
     *
     * @for AircraftModel
     * @method _calculateTargetedSpeedDuringLanding
     * @return {number}
     */
    _calculateTargetedSpeedDuringLanding() {
        let startSpeed = this.speed;
        const runwayModel = this.fms.arrivalRunwayModel;
        const offset = getOffset(this, runwayModel.relativePosition, runwayModel.angle);
        const distanceOnFinal_nm = nm(offset[1]);
        const stableApproachTimeHours = PERFORMANCE.STABLE_APPROACH_TIME_SECONDS * TIME.ONE_SECOND_IN_HOURS;
        const stableApproachDistance = this.model.speed.landing * stableApproachTimeHours;

        if (distanceOnFinal_nm <= 0 && this.isOnGround()) {
            return 0;
        }

        if (this.mcp.speedMode === MCP_MODE.SPEED.HOLD) {
            startSpeed = this.mcp.speed;
        }

        const nextSpeed = extrapolate_range_clamp(
            stableApproachDistance,
            distanceOnFinal_nm,
            AIRPORT_CONSTANTS.FINAL_APPROACH_FIX_DISTANCE_NM,
            this.model.speed.landing,
            startSpeed
        );

        return nextSpeed;
    }

    /**
     * Calculates the speed for an aircraft in a VNAV-guided speed change
     *
     * @for AircraftModel
     * @method _calculateTargetedSpeedVnav
     * @return {number} speed, in knots
     */
    _calculateTargetedSpeedVnav() {
        const nextSpeedMaximumWaypoint = this.fms.findNextWaypointWithMaximumSpeedAtOrBelow(this.speed);
        const nextSpeedMinimumWaypoint = this.fms.findNextWaypointWithMinimumSpeedAtOrAbove(this.speed);
        const hasMaximumSpeed = !_isNil(nextSpeedMaximumWaypoint);
        const hasMinimumSpeed = !_isNil(nextSpeedMinimumWaypoint);

        if (!hasMaximumSpeed && !hasMinimumSpeed) {
            return this.mcp.speed;
        }

        if (hasMaximumSpeed && hasMinimumSpeed) {
            const { waypoints } = this.fms;
            const indexOfMax = _findIndex(waypoints, (waypoint) => waypoint.name === nextSpeedMaximumWaypoint.name);
            const indexOfMin = _findIndex(waypoints, (waypoint) => waypoint.name === nextSpeedMinimumWaypoint.name);

            if (indexOfMax < indexOfMin) {
                return this._calculateTargetedSpeedVnavDeceleration(nextSpeedMaximumWaypoint);
            }

            return this._calculateTargetedSpeedVnavAcceleration(nextSpeedMinimumWaypoint);
        }

        if (hasMaximumSpeed) {
            return this._calculateTargetedSpeedVnavDeceleration(nextSpeedMaximumWaypoint);
        }

        if (hasMinimumSpeed) {
            return this._calculateTargetedSpeedVnavAcceleration(nextSpeedMinimumWaypoint);
        }
    }

    /**
     * Calculates the speed for an aircraft in a VNAV-guided acceleration
     *
     * @for AircraftModel
     * @method _calculateTargetedSpeedVnavAcceleration
     * @param waypointWithMinimumSpeedRestriction {WaypointModel}
     * @return {number}
     */
    _calculateTargetedSpeedVnavAcceleration(waypointWithMinimumSpeedRestriction) {
        const waypointMinimumSpeed = waypointWithMinimumSpeedRestriction.speedMinimum;

        return Math.min(waypointMinimumSpeed, this.mcp.speed);
    }

    /**
     * Calculates the speed for an aircraft in a VNAV-guided deceleration
     *
     * @for AircraftModel
     * @method _calculateTargetedSpeedVnavDeceleration
     * @param hardRestrictedWaypointModel {WaypointModel}
     * @return {number}
     */
    _calculateTargetedSpeedVnavDeceleration(waypointWithMaximumSpeedRestriction) {
        const waypointMaximumSpeed = waypointWithMaximumSpeedRestriction.speedMaximum;

        if (!this.isBeyondDecelerationPointForWaypointModel(waypointWithMaximumSpeedRestriction)) {
            return;
        }

        return Math.min(waypointMaximumSpeed, this.mcp.speed);
    }

    // TODO: this method needs a lot of love. its much too long with waaay too many nested if/else ifs.
    /**
     * @for AircraftModel
     * @method updatePhysics
     */
    updatePhysics() {
        if (this.isTaxiing()) {
            return;
        }

        if (this.hit) {
            // 90fps fall rate?...
            this.altitude -= 90 * TimeKeeper.getDeltaTimeForGameStateAndTimewarp();
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

        const offsetGameTime = TimeKeeper.accumulatedDeltaTime / GameController.game_speedup();
        // const nextHistoricalPosition = [
        //     this.positionModel.relativePosition[0],
        //     this.positionModel.relativePosition[1],
        //     offsetGameTime
        // ];

        // TODO: whats the difference here between the if and else blocks? why are we looking for a 0 length?
        // TODO: abstract to AircraftPositionHistory class
        // Trailling
        if (this.relativePositionHistory.length === 0) {
            this.relativePositionHistory.push([
                this.positionModel.relativePosition[0],
                this.positionModel.relativePosition[1],
                offsetGameTime
            ]);
            // TODO: this can be abstracted
        } else if (abs(offsetGameTime - this.relativePositionHistory[this.relativePositionHistory.length - 1][2]) > 4 / GameController.game_speedup()) {
            this.relativePositionHistory.push([
                this.positionModel.relativePosition[0],
                this.positionModel.relativePosition[1],
                offsetGameTime
            ]);
        }

        this.updateGroundSpeedPhysics();

        this.distance = vlen(this.positionModel.relativePosition);
        this.radial = radians_normalize(vradial(this.positionModel.relativePosition));
    }

    /**
     * This turns the aircraft if it is not on the ground and has not arived at its destenation
     *
     * @for AircraftModel
     * @method updateAircraftTurnPhysics
     */
    updateAircraftTurnPhysics() {
        if (this.isOnGround() || this.heading === this.targetHeading) {
            this.target.turn = null;

            return;
        }

        const secondsElapsed = TimeKeeper.getDeltaTimeForGameStateAndTimewarp();
        const angle_diff = angle_offset(this.targetHeading, this.heading);
        const angle_change = PERFORMANCE.TURN_RATE * secondsElapsed;

        // TODO: clean this up if possible, there is a lot of branching logic here
        if (abs(angle_diff) <= angle_change) {
            this.heading = this.targetHeading;
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
     * This updates the Altitude for the instance of the aircraft by checking the difference
     * between current Altitude and requested Altitude
     *
     * @for AircraftModel
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
    * @for AircraftModel
    * @method decreaseAircraftAltitude
    */
    decreaseAircraftAltitude() {
        const altitude_diff = this.altitude - this.target.altitude;
        let descentRate = this.model.rate.descent * PERFORMANCE.TYPICAL_DESCENT_FACTOR;

        if (this.mcp.shouldExpediteAltitudeChange || this.isEstablishedOnCourse()) {
            descentRate = this.model.rate.descent;
        }

        const feetPerSecond = descentRate * TIME.ONE_SECOND_IN_MINUTES;
        const feetDescended = feetPerSecond * TimeKeeper.getDeltaTimeForGameStateAndTimewarp();

        if (abs(altitude_diff) < feetDescended) {
            this.altitude = this.target.altitude;
            this.mcp.shouldExpediteAltitudeChange = false;
        } else {
            this.altitude -= feetDescended;
        }

        this.trend -= 1;
    }

    /**
    * Increases the aircrafts altitude
    *
    * @for AircraftModel
    * @method increaseAircraftAltitude
    */
    increaseAircraftAltitude() {
        const altitude_diff = this.altitude - this.target.altitude;
        let climbRate = this.getClimbRate() * PERFORMANCE.TYPICAL_CLIMB_FACTOR;

        // TODO: Ensure expediting is STOPPED when the altitude is reached
        if (this.mcp.shouldExpediteAltitudeChange || this.isTakeoff()) {
            climbRate = this.model.rate.climb;
        }

        const feetPerSecond = climbRate * TIME.ONE_SECOND_IN_MINUTES;
        const feetClimbed = feetPerSecond * TimeKeeper.getDeltaTimeForGameStateAndTimewarp();

        if (abs(altitude_diff) < abs(feetClimbed)) {
            this.altitude = this.target.altitude;
            this.mcp.shouldExpediteAltitudeChange = false;
        } else {
            this.altitude += feetClimbed;
        }

        this.trend = 1;
    }

    /**
     * This updates the speed for the instance of the aircraft by checking the
     * difference between current speed and requested speed
     *
     * @for AircraftModel
     * @method updateWarning
     */
    updateSpeedPhysics() {
        let speedChange = 0;
        const differenceBetweenPresentAndTargetSpeeds = this.speed - this.target.speed;

        if (differenceBetweenPresentAndTargetSpeeds === 0) {
            return;
        }

        if (this.speed > this.target.speed) {
            speedChange = -this.model.rate.decelerate * TimeKeeper.getDeltaTimeForGameStateAndTimewarp() / 2;

            if (this.isOnGround()) {
                speedChange *= PERFORMANCE.DECELERATION_FACTOR_DUE_TO_GROUND_BRAKING;
            }
        } else if (this.speed < this.target.speed) {
            speedChange = this.model.rate.accelerate * TimeKeeper.getDeltaTimeForGameStateAndTimewarp() / 2;
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
     * @for AircraftModel
     * @method updateVectorPhysics
     * @param scaleSpeed
     */
    updateGroundSpeedPhysics() {
        // TODO: Much of this should be abstracted to helper functions

        // Calculate true air speed vector
        const indicatedAirspeed = this.speed;
        const trueAirspeedIncreaseFactor = this.altitude * ENVIRONMENT.DENSITY_ALT_INCREASE_FACTOR_PER_FT;
        const trueAirspeed = indicatedAirspeed * (1 + trueAirspeedIncreaseFactor);
        const flightThroughAirVector = vscale(vectorize_2d(this.heading), trueAirspeed);

        // Calculate ground speed and direction
        const windVector = AirportController.airport_get().getWindVectorAtAltitude(this.altitude);
        const flightPathVector = vadd(flightThroughAirVector, windVector);
        const groundSpeed = vlen(flightPathVector);
        let groundTrack = vradial(flightPathVector);

        // Prevent aircraft on the ground from being blown off runway centerline when too slow to crab sufficiently
        if (this.isOnGround()) {
            // TODO: Aircraft crabbing into the wind will show an increase in groundspeed after they reduce to slower than
            // the wind speed. This should be corrected so their groundspeed gradually reduces from touchdown spd to 0.
            groundTrack = this.targetGroundTrack;
        }

        // Calculate new position
        const hoursElapsed = TimeKeeper.getDeltaTimeForGameStateAndTimewarp() * TIME.ONE_SECOND_IN_HOURS;
        const distanceTraveled_nm = groundSpeed * hoursElapsed;

        this.positionModel.setCoordinatesByBearingAndDistance(groundTrack, distanceTraveled_nm);

        this.groundTrack = groundTrack;
        this.groundSpeed = groundSpeed;
        this.trueAirspeed = trueAirspeed;
    }

    // TODO: this method needs a lot of love. its much too long with waaay too many nested if/else ifs.
    /**
     * @for AircraftModel
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
                        GameController.events_recordNew(GAME_EVENTS.AIRSPACE_BUST);
                        area.range = this.speed * 1.85 / 3.6 * 50 / 1000; // check in 50 seconds
                        // speed is kts, range is km.
                        // if a plane got into restricted area, don't check it too often
                    } else {
                        // don't calculate more often than every 10 seconds
                        area.range = Math.max(
                            this.speed * 1.85 / 36 / 1000 * 10,
                            distance_to_poly(this.positionModel.relativePosition, area.data.coordinates)
                        );
                    }

                    area.inside = new_inside;
                }
            }

            // this was a $.each() and may need to verified that its working with _forEach()
            // raise warning if in at least one restricted area
            _forEach(this.restricted.list, (k, v) => {
                warning = warning || v.inside;
            });
        }

        if (this.terrain_ranges && !this.isOnGround()) {
            const { terrain } = AirportController.current;
            const prev_level = this.terrain_ranges[this.terrain_level];
            const ele = Math.ceil(this.altitude, 1000);
            const curr_ranges = this.terrain_ranges[ele];

            if (ele !== this.terrain_level) {
                for (const lev in prev_level) {
                    prev_level[lev] = Infinity;
                }

                this.terrain_level = ele;
            }

            for (const id in curr_ranges) {
                curr_ranges[id] -= this.groundSpeed;

                if (curr_ranges[id] < 0 || curr_ranges[id] === Infinity) {
                    area = terrain[ele][id];
                    status = point_to_mpoly(this.positionModel.relativePosition, area, id);

                    if (status.inside) {
                        this.altitude = 0;

                        if (!this.hit) {
                            this.hit = true;

                            const isWarning = true;
                            UiController.ui_log(`${this.callsign} collided with terrain in controlled flight`, isWarning);
                            speech_say(
                                [
                                    { type: 'callsign', content: this },
                                    { type: 'text', content: ', we\'re going down!' }
                                ],
                                this.pilotVoice
                            );

                            GameController.events_recordNew(GAME_EVENTS.COLLISION);
                        }
                    } else {
                        curr_ranges[id] = Math.max(0.2, status.distance);
                    }
                }
            }
        }

        this.warning = warning;
    }

    /**
     * @for AircraftModel
     * @method update
     */
    update() {
        this.updateFlightPhase();
        this.updateTarget();
        this.updatePhysics();
        this._updateAircraftVisibility();
    }

    /**
     * @for AircraftModel
     * @method addConflict
     * @param {AircraftConflict} conflict
     * @param {AircraftModel} conflictingAircraft
     */
    addConflict(conflict, conflictingAircraft) {
        this.conflicts[conflictingAircraft.callsign] = conflict;
    }

    /**
     * Used to determine if a `conflictingAircraft.callsign` already exists within
     * the list of known conflicts for an aircaft
     *
     * @for AircraftModel
     * @method hasConflictWithAircraftModel
     * @param {AircraftModel} conflictingAircraft
     * @returns {boolean}
     */
    hasConflictWithAircraftModel(conflictingAircraftModel) {
        return conflictingAircraftModel.callsign in this.conflicts;
    }

    /**
     * Return the presence/absence of (any existing) conflict or violation in terms
     * of separation with another aircraft
     *
     * @for AircraftModel
     * @method getAlerts
     * @return {array} [hasConflict, hasViolation]
     */
    getAlerts() {
        const alert = [false, false];

        for (const i in this.conflicts) {
            const hasConflict = this.conflicts[i].hasConflict();
            const hasViolation = this.conflicts[i].hasViolation();

            alert[0] = (alert[0] || hasConflict);
            alert[1] = (alert[1] || hasViolation);

            if (alert[0] && alert[1]) {
                return alert;
            }
        }

        return alert;
    }

    /**
     * @for AircraftModel
     * @method removeConflict
     * @param {AircraftModel} conflictingAircraft
     */
    removeConflict(conflictingAircraft) {
        delete this.conflicts[conflictingAircraft.callsign];
    }

    // TODO: needs better name
    /**
     * @for AircraftModel
     * @method _contactAircraftAfterControllabilityChange
     * @private
     */
    _contactAircraftAfterControllabilityChange() {
        // Crossing into the center
        if (this.isControllable) {
            this.callUp();

            // for reentry, see #993
            this.isFlightStripRemovable = false;

            return;
        }

        this.setIsRemovable();
        EventBus.trigger(AIRCRAFT_EVENT.AIRSPACE_EXIT, this);
    }

    /**
     * @for AircraftModel
     * @method _updateAircraftVisibility
     * @private
     */
    _updateAircraftVisibility() {
        const isInsideAirspace = this.isInsideAirspace(AirportController.airport_get());

        if (isInsideAirspace === this.isControllable || this.projected) {
            return;
        }

        this._updateControllableStatus(isInsideAirspace);
        this._contactAircraftAfterControllabilityChange();
    }

    /**
     * Updates the `#isControllable` property when an aircraft either
     * enters or exits controlled airspace
     *
     * @for AircraftModel
     * @method _updateControllableStatus
     * @param {booelan} nextControllableStatus
     */
    _updateControllableStatus(nextControllableStatus) {
        this.isControllable = nextControllableStatus;

        if (!nextControllableStatus) {
            this.setIsFlightStripRemovable();
        }
    }

    /**
     * Returns the distance to another aircraft in nm
     *
     * @for AircraftModel
     * @method distanceToAircraft
     * @param aircraftModel {AircraftModel}
     * @return {number} distance in nm
     */
    distanceToAircraft(anotherAircraftModel) {
        return this.positionModel.distanceToPosition(anotherAircraftModel.positionModel);
    }

    /**
     * Ensure that the provided altitude is valid
     *
     * @for AircraftModel
     * @method validateNextAltitude
     * @param nextAltitude {number} altitude the aircraft should maintain
     * @return {array}           [success of operation, readback]
     */
    validateNextAltitude(nextAltitude, airportModel) {
        if (nextAltitude === INVALID_NUMBER) {
            return [false, 'unable, no altitude assigned'];
        }

        if (typeof nextAltitude !== 'number') {
            return [false, `unable to maintain an altitude of ${nextAltitude}`];
        }

        if (!this.model.isAbleToMaintainAltitude(nextAltitude)) {
            const readback = {};
            readback.log = `unable to maintain ${nextAltitude} due to performance`;
            readback.say = `unable to maintain ${radio_altitude(nextAltitude)} due to performance`;

            return [false, readback];
        }

        if (nextAltitude < airportModel.minAssignableAltitude) {
            const minimumAltitude = airportModel.minAssignableAltitude;
            const readback = {};
            readback.log = `unable to maintain ${nextAltitude}, the MSA is ${minimumAltitude}`;
            readback.say = `unable to maintain ${radio_altitude(nextAltitude)}, the MSA is ${radio_altitude(minimumAltitude)}`;

            return [false, readback];
        }

        return [true];
    }
}
