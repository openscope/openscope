import _find from 'lodash/find';
import _findLast from 'lodash/findLast';
import _includes from 'lodash/includes';
import _isEmpty from 'lodash/isEmpty';
import _isNil from 'lodash/isNil';
import _isObject from 'lodash/isObject';
import RouteModel from './RouteModel';
import AirportController from '../../airport/AirportController';
import NavigationLibrary from '../../navigationLibrary/NavigationLibrary';
import RunwayModel from '../../airport/runway/RunwayModel';
import {
    FLIGHT_CATEGORY,
    FLIGHT_PHASE
} from '../../constants/aircraftConstants';
import { INVALID_NUMBER } from '../../constants/globalConstants';
import { PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER } from '../../constants/routeConstants';

/**
 * Provides methods to create, update or replace a flightPlan and the legs
 * and waypoints that make up that flightPlan.
 *
 * This class is concerned only about maintaining the flightPlan, which is
 * really just the collection of `LegModels` and their respective
 * `WaypointModel` objects.
 *
 * This class should always be instantiated from an `AircraftModel` and
 * always instantiated from some form of `spawnPatternModel` using some kind of
 * routeString.
 *
 * This class is always instantiated with a routeString and any changes to the
 * flightPlan must happen with a routeString. For every fix/waypoint called out
 * in a routeString, there must exist a fix in the airport.json file.
 *
 *
 * RouteString examples and the terms used to describe them:
 * - directRouteString: `COWBY`
 *   A directRouteString will equate to a `LegModel` with a single `WaypointModel`.
 *
 * - holdRouteString: `@COWBY`
 *   A holdRouteString will equate to a `LegModel` with a single `WaypointModel` that has holding specifications defined
 *
 * - procedureRouteString: `KLAS.COWBY6.DRK`
 *   A procedureRouteString will equate to a single `LegModel` and possibly many waypoints for the individual waypoints
 *   that make up a procedureRoute (sid/star).
 *
 *
 * - simpleRouteString: `COWBY..DRK`
 * - complexRouteString: `COWBY..@BIKKR..DAG.KEPEC3.KLAS`
 *
 * When working with a complexRouteString, you will also see terms like `directRouteSegment`, `procedureRouteSegment`
 * or `holdRouteSegment`. When the word segment is involved, that means that particular segment is part of a
 * larger, likely complex, routeString.
 *
 *
 * @class Fms
 */
export default class Fms {
    /**
     * @constructor
     * @param aircraftInitProps {object}
     */
    constructor(aircraftInitProps) {
        if (!_isObject(aircraftInitProps) || _isEmpty(aircraftInitProps)) {
            throw new TypeError('Invalid aircraftInitProps passed to Fms');
        }

        /**
         * Airport the aircraft arrives at
         *
         * @for Fms
         * @property arrivalAirportModel
         * @type {AirportModel}
         */
        this.arrivalAirportModel = null;

        /**
         * Runway used at arrival airport
         *
         * @for Fms
         * @property arrivalRunwayModel
         * @type {RunwayModel}
         */
        this.arrivalRunwayModel = null;

        /**
         * Current flight phase of an aircraft
         *
         * @property currentPhase
         * @type {string}
         * @default ''
         */
        this.currentPhase = '';

        /**
         * Airport the aircraft departs from
         *
         * @for Fms
         * @property departureAirportModel
         * @type {AirportModel}
         */
        this.departureAirportModel = null;

        /**
         * Runway used at departure airport
         *
         * @for Fms
         * @property departureRunwayModel
         * @type {RunwayModel}
         */
        this.departureRunwayModel = null;

        // TODO: This value should NOT be changed 'as ATC amends it'
        /**
         * Altitude expected for this flight. Will change as ATC amends it.
         *
         * @property flightPlanAltitude
         * @type {number}
         * @default INVALID_NUMBER
         */
        this.flightPlanAltitude = INVALID_NUMBER;

        /**
         * Flight plan route for this aircraft, containing lateral and vertical guidance
         *
         * @for Fms
         * @property _routeModel
         * @type {RouteModel}
         * @private
         */
        this._routeModel = null;

        this.init(aircraftInitProps);
    }

    /**
     * The active Leg in the `legCollection`
     *
     * Assumed to ALWAYS be the first `LegModel` in the `legCollection`
     *
     * @property currentLeg
     * @type {LegModel}
     */
    get currentLeg() {
        return this._routeModel.currentLeg;
    }

    /**
     * The active waypoint an aircraft is flying towards
     *
     * Assumed to ALWAYS be the first `WaypointModel` in the `currentLeg`
     *
     * @property currentWaypoint
     * @type {WaypointModel}
     */
    get currentWaypoint() {
        return this._routeModel.currentWaypoint;
    }

    /**
     * Return the next waypoint which has an altitude restriction
     *
     * @for Fms
     * @property nextAltitudeRestrictedWaypoint
     * @type {WaypointModel}
     */
    get nextAltitudeRestrictedWaypoint() {
        const waypoints = this.getAltitudeRestrictedWaypoints();

        return waypoints[0];
    }

    /**
     * Return the next waypoint which has an "AT" altitude restriction
     *
     * @for Fms
     * @property nextHardAltitudeRestrictedWaypoint
     * @type {WaypointModel}
     */
    get nextHardAltitudeRestrictedWaypoint() {
        const waypoints = this.getAltitudeRestrictedWaypoints()
            .filter((waypoint) => waypoint.altitudeMaximum === waypoint.altitudeMinimum);

        return waypoints[0];
    }

    /**
     * Return the next waypoint which has an "AT" speed restriction
     *
     * @for Fms
     * @property nextHardSpeedRestrictedWaypoint
     * @type {WaypointModel}
     */
    get nextHardSpeedRestrictedWaypoint() {
        const waypoints = this.getSpeedRestrictedWaypoints()
            .filter((waypoint) => waypoint.speedMaximum === waypoint.speedMinimum);

        return waypoints[0];
    }

    /**
     * Return the next waypoint which has an altitude or speed restriction
     *
     * @for Fms
     * @property nextRestrictedWaypoint
     * @type {WaypointModel}
     */
    get nextRestrictedWaypoint() {
        const waypoints = this.getRestrictedWaypoints();

        return waypoints[0];
    }

    /**
     * Return the next waypoint which has a speed restriction
     *
     * @for Fms
     * @property nextSpeedRestrictedWaypoint
     * @type {WaypointModel}
     */
    get nextSpeedRestrictedWaypoint() {
        const waypoints = this.getSpeedRestrictedWaypoints();

        return waypoints[0];
    }

    /**
     * Get the next waypoint in the flight plan, if it exists
     *
     * @for Fms
     * @property nextWaypoint
     * @type {WaypointModel}
     */
    get nextWaypoint() {
        return this._routeModel.nextWaypoint;
    }

    /**
     * Return an array of all waypoints in all legs of the route
     *
     * @for Fms
     * @property waypoints
     * @type {array<WaypointModel>}
     */
    get waypoints() {
        return this._routeModel.waypoints;
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Initialize instance properties
     *
     * @for Fms
     * @method init
     * @param aircraftInitProps {object}
     * @chainable
     */
    init(aircraftInitProps) {
        const {
            altitude,
            category,
            destination,
            model,
            nextFix,
            origin,
            routeString
        } = aircraftInitProps;

        this._routeModel = new RouteModel(routeString);

        this._verifyRouteContainsMultipleWaypoints();
        this._initializeFlightPhaseForCategory(category);
        this._initializeDepartureAirport(origin);
        this._initializeDepartureRunway();
        this._initializeArrivalAirport(destination);
        this._initializeArrivalRunway();
        this._initializeFlightPlanAltitude(altitude, category, model);
        this._initializePositionInRouteToBeginAtFixName(nextFix, category);

        return this;
    }

    /**
     * Reset instance properties
     *
     * @for LegModel
     * @method reset
     * @chainable
     */
    reset() {
        this.arrivalAirportModel = null;
        this.arrivalRunwayModel = null;
        this.currentPhase = '';
        this.departureAirportModel = null;
        this.departureRunwayModel = null;
        this.flightPlanAltitude = INVALID_NUMBER;
        this._routeModel = null;

        return this;
    }

    /**
     * Initialize `#arrivalAirportModel`
     *
     * @for Fms
     * @method _initializeArrivalAirport
     * @param destinationIcao {string} ICAO identifier specified by spawn pattern
     * @private
     */
    _initializeArrivalAirport(destinationIcao) {
        if (destinationIcao === '') {
            return;
        }

        this.arrivalAirportModel = AirportController.airport_get(destinationIcao);
    }

    /**
     * Initialize `#arrivalRunwayModel`
     *
     * @for Fms
     * @method _initializeArrivalRunway
     * @private
     */
    _initializeArrivalRunway() {
        if (!this.arrivalAirportModel) {
            return;
        }

        const arrivalRunwayName = this._routeModel.getArrivalRunwayName();

        if (!arrivalRunwayName) {
            this.setArrivalRunway(this.arrivalAirportModel.arrivalRunwayModel);

            return;
        }

        const arrivalRunwayModel = this.arrivalAirportModel.getRunway(arrivalRunwayName);

        this.setArrivalRunway(arrivalRunwayModel);
    }

    /**
     * Initialize `#departureAirportModel`
     *
     * @for Fms
     * @method _initializeDepartureAirport
     * @param originIcao {string} ICAO identifier specified by spawn pattern
     * @private
     */
    _initializeDepartureAirport(originIcao) {
        if (originIcao === '') {
            return;
        }

        this.departureAirportModel = AirportController.airport_get(originIcao);
    }

    /**
     * Initialize `#departureRunwayModel`
     *
     * @for Fms
     * @method _initializeDepartureRunway
     * @private
     */
    _initializeDepartureRunway() {
        if (!this.departureAirportModel) {
            return;
        }

        const departureRunwayName = this._routeModel.getDepartureRunwayName();

        if (!departureRunwayName) {
            return this.setDepartureRunway(this.departureAirportModel.departureRunwayModel);
        }

        const departureRunwayModel = this.departureAirportModel.getRunway(departureRunwayName);

        this.setDepartureRunway(departureRunwayModel);
    }

    /**
     * Initialize `#currentPhase` as appropriate based on the spawn category
     *
     * @for Fms
     * @method _initializeFlightPhaseForCategory
     * @param category {string}
     * @private
     */
    _initializeFlightPhaseForCategory(category) {
        switch (category) {
            case FLIGHT_CATEGORY.ARRIVAL:
            case FLIGHT_CATEGORY.OVERFLIGHT:
                return this.setFlightPhase(FLIGHT_PHASE.CRUISE);

            case FLIGHT_CATEGORY.DEPARTURE:
                return this.setFlightPhase(FLIGHT_PHASE.APRON);

            default:
                throw new TypeError(`Expected known spawn pattern category, but received "${category}"`);
        }
    }

    /**
     * Initialize `#flightPlanAltitude`
     *
     * @for Fms
     * @method _initializeFlightPlanAltitude
     * @param altitude {number}
     * @param category {string} one of `FLIGHT_CATEGORY` enum
     * @param model {AircraftTypeDefinitionModel}
     * @private
     */
    _initializeFlightPlanAltitude(altitude, category, model) {
        this.flightPlanAltitude = altitude;

        if (category === FLIGHT_CATEGORY.DEPARTURE) {
            this.flightPlanAltitude = model.ceiling;
        }
    }

    /**
     * Skip ahead to the first waypoint a freshly created FMS should be going to
     *
     * This method is available because we have the ability to spawn aircraft
     * in "the middle" of any route, rather than requiring them to fly their
     * route from the beginning. This way, we have the choice to place the aircraft
     * wherever we want along the route without having to change its contents.
     *
     * This method takes an argument that specifies which fix to go to after spawn,
     * and if not specified, the FMS will target the second fix (because they are)
     * spawned AT the first fix.
     *
     * @for Fms
     * @method _initializePositionInRouteToBeginAtFixName
     * @param fixName {string}
     * @private
     */
    _initializePositionInRouteToBeginAtFixName(fixName, category) {
        if (category === FLIGHT_CATEGORY.DEPARTURE) {
            return;
        }

        if (_isNil(fixName)) {
            return this.moveToNextWaypoint();
        }

        if (!this._routeModel.hasWaypointName(fixName)) {
            throw new TypeError(`Expected initial fix to be in flight plan route, but received '${fixName}'`);
        }

        this.skipToWaypointName(fixName);
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Mark the specified waypoint as a hold waypoint
     *
     * @for Fms
     * @method activateHoldForWaypointName
     * @param waypointName {string} name of waypoint in route
     * @param holdParameters {object}
     * @param fallbackInboundHeading {number} an optional inboundHeading that is used if no default is available
     * @returns {array} [success of operation, readback-error OR holdParameters ]
     */
    activateHoldForWaypointName(waypointName, holdParameters, fallbackInboundHeading = undefined) {
        if (!this._routeModel.hasWaypointName(waypointName)) {
            // force lower-case in verbal readback to get speech synthesis to pronounce the fix instead of spelling it
            return [false, {
                log: `unable to hold at ${waypointName.toUpperCase()}; it is not on our route!`,
                say: `unable to hold at ${waypointName.toLowerCase()}; it is not on our route!`
            }];
        }

        return [true, this._routeModel.activateHoldForWaypointName(waypointName, holdParameters, fallbackInboundHeading)];
    }

    /**
     * Apply the specified route, and as applicable, merge it with the current route
     *
     * @for Fms
     * @method applyPartialRouteAmendment
     * @param routeString {tring}  route string in the form of `entry.procedure.airport`
     * @return {array}             [success of operation, readback]
     */
    applyPartialRouteAmendment(routeString) {
        let nextRouteModel;

        try {
            nextRouteModel = new RouteModel(routeString);
        } catch (error) {
            console.error(error);

            return [false, `requested route of "${routeString.toUpperCase()}" is invalid`];
        }

        return this._routeModel.absorbRouteModel(nextRouteModel);
    }

    /**
     * Return the waypoint that matches the provided name
     *
     * @for Fms
     * @method findWaypoiont
     * @param waypointName {string} name of the waypoint
     * @return {WaypointModel}
     */
    findWaypoint(waypointName) {
        const name = waypointName.toUpperCase();

        return _find(this.waypoints, (waypoint) => waypoint.name === name);
    }

    /**
     * Return the next waypoint having an #altitudeMaximum equal to or less than the specified value
     *
     * This is helpful to see only future waypoints for which a particular altitude is
     * considered NOT to be compliant. This allows us to focus which waypoints the aircraft
     * will need to adjust altitude for, even if they are many waypoints in the future.
     *
     * @for Fms
     * @method findNextWaypointWithMaximumAltitudeAtOrBelow
     * @param altitude {number}
     * @return {WaypointModel}
     */
    findNextWaypointWithMaximumAltitudeAtOrBelow(altitude) {
        return _find(this.waypoints, (waypointModel) => waypointModel.hasMaximumAltitudeAtOrBelow(altitude));
    }

    /**
     * Return the next waypoint having an #altitudeMaximum restriction
     *
     * @for Fms
     * @method findNextWaypointWithMaximumAltitudeRestriction
     * @return {WaypointModel}
     */
    findNextWaypointWithMaximumAltitudeRestriction() {
        return _find(this.waypoints, (waypointModel) => waypointModel.hasAltiudeMaximumRestriction);
    }

    /**
     * Return the next waypoint having a #speedMaximum equal to or less than the specified value
     *
     * This is helpful to see only future waypoints for which a particular speed is
     * considered NOT to be compliant. This allows us to focus which waypoints the aircraft
     * will need to adjust speed for, even if they are many waypoints in the future.
     *
     * @for Fms
     * @method findNextWaypointWithMaximumSpeedAtOrBelow
     * @param speed {number}
     * @return {WaypointModel}
     */
    findNextWaypointWithMaximumSpeedAtOrBelow(speed) {
        return _find(this.waypoints, (waypointModel) => waypointModel.hasMaximumSpeedAtOrBelow(speed));
    }

    /**
     * Return the next waypoint having an #altitudeMinimum equal to or greater than the specified value
     *
     * This is helpful to see only future waypoints for which a particular altitude is
     * considered NOT to be compliant. This allows us to focus which waypoints the aircraft
     * will need to adjust altitude for, even if they are many waypoints in the future.
     *
     * @for Fms
     * @method findNextWaypointWithMinimumAltitudeAtOrAbove
     * @param altitude {number}
     * @return {WaypointModel}
     */
    findNextWaypointWithMinimumAltitudeAtOrAbove(altitude) {
        return _find(this.waypoints, (waypointModel) => waypointModel.hasMinimumAltitudeAtOrAbove(altitude));
    }


    /**
     * Return the next waypoint having an #altitudeMinimum restriction
     *
     * @for Fms
     * @method findNextWaypointWithMinimumAltitudeRestriction
     * @return {WaypointModel}
     */
    findNextWaypointWithMinimumAltitudeRestriction() {
        return _find(this.waypoints, (waypointModel) => waypointModel.hasAltiudeMinimumRestriction);
    }

    /**
     * Return the next waypoint having a #speedMinimum equal to or greater than the specified value
     *
     * This is helpful to see only future waypoints for which a particular speed is
     * considered NOT to be compliant. This allows us to focus which waypoints the aircraft
     * will need to adjust speed for, even if they are many waypoints in the future.
     *
     * @for Fms
     * @method findNextWaypointWithMinimumSpeedAtOrAbove
     * @param speed {number}
     * @return {WaypointModel}
     */
    findNextWaypointWithMinimumSpeedAtOrAbove(speed) {
        return _find(this.waypoints, (waypointModel) => waypointModel.hasMinimumSpeedAtOrAbove(speed));
    }

    /**
     * Return an array of waypoints in the flight plan that have altitude restrictions
     *
     * @for Fms
     * @method getAltitudeRestrictedWaypoints
     * @return {array<WaypointModel>}
     */
    getAltitudeRestrictedWaypoints() {
        return this._routeModel.getAltitudeRestrictedWaypoints();
    }

    /**
     * Returns the lowest bottom altitude of any `LegModel` in the `#_legCollection`
     *
     * @for Fms
     * @method getBottomAltitude
     * @return {number}
     */
    getBottomAltitude() {
        return this._routeModel.getBottomAltitude();
    }

    /**
     * Get the full flight plan route string with legs separated by spaces
     *
     * @for Fms
     * @method getFullRouteStringWithoutAirportsWithSpaces
     * @return {string}
     */
    getFullRouteStringWithoutAirportsWithSpaces() {
        return this._routeModel.getFullRouteStringWithoutAirportsWithSpaces();
    }

    /**
     * Return the first fix in a flightPlan or the exit fix of
     * the current SID procedure
     *
     * Primarily used for aircraft dataBlock
     *
     * @for Fms
     * @method getFlightPlanEntry
     * @returns {string} First fix in flightPlan or exit fix of SID
     */
    getFlightPlanEntry() {
        return this._routeModel.getFlightPlanEntry();
    }

    /**
     * Get the position of the next waypoint in the flight plan
     *
     * Currently only used in `calculateTurnInitiationDistance()` helper function
     *
     * @for Fms
     * @method getNextWaypointPositionModel
     * @return waypointPosition {StaticPositionModel}
     */
    getNextWaypointPositionModel() {
        return this.nextWaypoint.positionModel;
    }

    /**
     * Return an array of waypoints in the flight plan that have altitude or speed restrictions
     *
     * @for Fms
     * @method getRestrictedWaypoints
     * @return {array<WaypointModel>}
     */
    getRestrictedWaypoints() {
        return this.waypoints.filter((waypoint) => waypoint.hasRestriction);
    }

    /**
     * Get the flight plan route string in dot notation
     *
     * @for Fms
     * @method getRouteString
     * @return {string}
     */
    getRouteString() {
        return this._routeModel.getRouteString();
    }

    /**
     * Get the flight plan route string with legs separated by spaces
     *
     * This is primarily meant for use in the `StripViewModel`.
     *
     * @for Fms
     * @method getRouteStringWithSpaces
     * @return {string}
     */
    getRouteStringWithSpaces() {
        return this._routeModel.getRouteStringWithSpaces();
    }

    /**
     * Facade for #_routeModel.getSidIcao
     *
     * @for Fms
     * @method getSidIcao
     * @return {string}
     */
    getSidIcao() {
        return this._routeModel.getSidIcao();
    }

    /**
     * Facade for #_routeModel.getSidName
     *
     * @for Fms
     * @method getSidName
     * @return {string}
     */
    getSidName() {
        return this._routeModel.getSidName();
    }

    /**
     * Facade for #_routeModel.getInitialClimbClearance
     *
     * @for Fms
     * @method getInitialClimbClearance
     * @return {number}
     */
    getInitialClimbClearance() {
        return this._routeModel.getInitialClimbClearance();
    }

    /**
     * Return an array of waypoints in the flight plan that have speed restrictions
     *
     * @for Fms
     * @method getSpeedRestrictedWaypoints
     * @return {array<WaypointModel>}
     */
    getSpeedRestrictedWaypoints() {
        return this.waypoints.filter((waypoint) => waypoint.hasSpeedRestriction);
    }

    /**
     * Returns the highest top altitude of any `LegModel` in the `#_legCollection`
     *
     * @for LegModel
     * @method getTopAltitude
     * @return {number}
     */
    getTopAltitude() {
        return this._routeModel.getTopAltitude();
    }

    /**
     * Return whether the route contains a waypoint after the currently active one
     *
     * @for Fms
     * @method hasNextWaypoint
     * @return {boolean}
     */
    hasNextWaypoint() {
        return this._routeModel.hasNextWaypoint();
    }

    /**
     * Return whether the route contains a waypoint with the specified name
     *
     * @for Fms
     * @method hasWaypointName
     * @param waypointName {string}
     * @return {boolean}
     */
    hasWaypointName(waypointName) {
        return this._routeModel.hasWaypointName(waypointName);
    }

    /**
     * Returns whether this is an arrival to an airport we control
     *
     * @for Fms
     * @method isArrival
     * @return {boolean}
     */
    isArrival() {
        return !_isNil(this.arrivalAirportModel);
    }

    /**
     * Returns whether this is a departure from an airport we control
     *
     * @for Fms
     * @method isDeparture
     * @return {boolean}
     */
    isDeparture() {
        return !_isNil(this.departureAirportModel);
    }

    /**
     * Returns whether this is an overflight
     *
     * @for Fms
     * @method isDeparture
     * @return {boolean}
     */
    isOverflight() {
        return !this.isArrival() && !this.isDeparture;
    }

    /**
     * Facade for `#_routeModel.isRunwayModelValidForSid()`
     *
     * Other classes will not have access to the `#_routeModel`, but can use this
     * facade to determine whether or not a given runway assignment is allowable,
     * given the departure procedure in the `#_routeModel`.
     *
     * @for Fms
     * @method isRunwayModelValidForSid
     * @param runwayModel {RunwayModel}
     * @return {boolean}
     */
    isRunwayModelValidForSid(runwayModel) {
        return this._routeModel.isRunwayModelValidForSid(runwayModel);
    }

    /**
     * Facade for `#_routeModel.isRunwayModelValidForStar()`
     *
     * Other classes will not have access to the `#_routeModel`, but can use this
     * facade to determine whether or not a given runway assignment is allowable,
     * given the arrival procedure in the `#_routeModel`.
     *
     * @for Fms
     * @method isRunwayModelValidForStar
     * @param runwayModel {RunwayModel}
     * @return {boolean}
     */
    isRunwayModelValidForStar(runwayModel) {
        return this._routeModel.isRunwayModelValidForStar(runwayModel);
    }

    /**
     * Move to the next possible waypoint
     *
     * This could be the next waypoint in the current leg,
     * or the first waypoint in the next leg.
     *
     * @for LegModel
     * @method moveToNextWaypoint
     */
    moveToNextWaypoint() {
        return this._routeModel.moveToNextWaypoint();
    }

    /**
     * Find the arrival procedure (if it exists) within the `#legCollection` and
     * reset it with a new arrival procedure.
     *
     * This method does not remove any `LegModel`s. It instead finds and updates a
     * `LegModel` with a new routeString. If a `LegModel` without a arrival
     * procedure cannot be found, then we create a new `LegModel` and place it
     * at the end of the `#legCollection`.
     *
     * @for Fms
     * @method replaceArrivalProcedure
     * @param routeString {string}
     * @return {array<boolean, string>}
     */
    replaceArrivalProcedure(routeString) {
        const routeStringElements = routeString.toUpperCase().split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER);

        if (routeStringElements.length !== 3) {
            return [false, 'arrival procedure format not understood'];
        }

        const procedureId = routeStringElements[1];

        if (!NavigationLibrary.hasProcedure(procedureId)) {
            return [false, `unknown procedure "${procedureId}"`];
        }

        const wasSuccessful = this._routeModel.replaceArrivalProcedure(routeString);

        if (wasSuccessful) {
            this._updateArrivalRunwayFromRoute();

            return [true, ''];
        }

        return [false, `route of "${routeString}" is not valid`];
    }

    /**
     * Replace departure procedure and departure runway
     *
     * @for Fms
     * @method replaceDepartureProcedure
     * @param routeString {string}
     * @return {boolean}
     */
    replaceDepartureProcedure(routeString, airportIcao) {
        const routeStringElements = routeString.toUpperCase().split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER);

        if (routeStringElements.length > 3) {
            return [false, 'departure procedure format not understood'];
        }

        let procedureId = routeStringElements[0];

        if (routeStringElements.length === 3) { // if the runway IS specified in the route string
            procedureId = routeStringElements[1];
        }

        const sidModel = NavigationLibrary.getProcedure(procedureId);

        if (_isNil(sidModel)) {
            return [false, `unknown procedure "${procedureId}"`];
        }

        if (routeStringElements.length === 1) { // RouteString looks like PROC
            const exitPoint = _findLast(this.waypoints, (waypointModel) => sidModel.hasExit(waypointModel.name));

            if (!exitPoint) {
                return [false, `the ${procedureId.toUpperCase()} departure doesn't have an exit along our route`];
            }

            routeStringElements.push(exitPoint.name);
        }

        if (routeStringElements.length === 2) { // RouteString looks like PROC.EXIT
            const expectedRunwayModel = this.departureRunwayModel;
            let entryPoint = `${airportIcao.toUpperCase()}${expectedRunwayModel.name}`;

            if (!sidModel.hasEntry(entryPoint)) {
                entryPoint = sidModel.getFirstEntryPoint();

                if (_isEmpty(entryPoint)) {
                    throw new TypeError(`the '${procedureId}' departure has no valid entry points`);
                }
            }

            routeStringElements.unshift(entryPoint);
        }

        const nextRouteString = routeStringElements.join(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER);
        const readback = this._routeModel.replaceDepartureProcedure(nextRouteString);

        if (readback[0]) {
            this._updateDepartureRunwayFromRoute();
        }

        return readback;
    }

    // TODO: we may need to update the runway in this method
    /**
     * Replace the current route with an entirely new one
     *
     * If route contains the same waypoint as the current waypoint, skip to that waypoint
     * and continue along the new route. This is a somewhat questionable strategy, but
     * has the advantage of supporting reroutes done in the middle of the flight,
     * whereas without this approach, the aircraft would turn around to the very first
     * waypoint as soon as they are rerouted.
     *
     * @for Fms
     * @method replaceFlightPlanWithNewRoute
     * @param routeString {string}
     * @return {boolean} whether the operation was successful
     */
    replaceFlightPlanWithNewRoute(routeString) {
        const currentWaypointName = this.currentWaypoint.name;
        let nextRouteModel;

        try {
            nextRouteModel = new RouteModel(routeString);
        } catch (error) {
            console.error(error);

            const readback = {};
            readback.log = `requested route of "${routeString}" is invalid`;
            readback.say = 'that route is invalid';

            return [false, readback];
        }

        this._routeModel = nextRouteModel;

        this.skipToWaypointName(currentWaypointName);

        // Build readback
        const readback = {};
        readback.log = `rerouting to: ${this.getRouteStringWithSpaces()}`;
        readback.say = 'rerouting as requested';

        return [true, readback];
    }

    /**
     * Verify and then set the value of `#arrivalRunwayModel`
     *
     * @for Fms
     * @method setArrivalRunway
     * @param nextRunwayModel {RunwayModel}
     */
    setArrivalRunway(nextRunwayModel) {
        if (!(nextRunwayModel instanceof RunwayModel)) {
            throw new TypeError(`Expected instance of RunwayModel, but received ${nextRunwayModel}`);
        }

        this.arrivalRunwayModel = nextRunwayModel;
    }

    /**
     * Verify and then set the value of `#departureRunwayModel`
     *
     * @for Fms
     * @method setDepartureRunway
     * @param runwayModel {RunwayModel}
     */
    setDepartureRunway(runwayModel) {
        if (!(runwayModel instanceof RunwayModel)) {
            throw new TypeError(`Expected instance of RunwayModel, but received ${runwayModel}`);
        }

        if (this.departureRunwayModel && this.departureRunwayModel.name === runwayModel.name) {
            return;
        }

        this.departureRunwayModel = runwayModel;

        this._routeModel.updateSidLegForDepartureRunwayModel(runwayModel);
    }

    /**
     * Set the `#currentPhase`
     *
     * this value is used to determine how to calculate and aircraft's next
     * altitude, heading and speed.
     *
     * @for Fms
     * @method setFlightPhase
     * @param phase {string}
     */
    setFlightPhase(phase) {
        if (!_includes(FLIGHT_PHASE, phase)) {
            throw new TypeError(`Expected known flight phase, but received '${phase}'`);
        }

        this.currentPhase = phase;
    }

    /**
     * Fascade
     *
     * @for Fms
     * @method skipToWaypointName
     * @param waypointName {string}
     */
    skipToWaypointName(waypointName) {
        return this._routeModel.skipToWaypointName(waypointName);
    }

    // ------------------------------ PRIVATE ------------------------------

    // /**
    // * Build a `LegModel` instance that contains a `WaypointModel` with hold properties
    // *
    // * @for Fms
    // * @method _createLegWithHoldWaypoint
    // * @param waypointProps {object}
    // * @return legModel {LegModel}
    // */
    // _createLegWithHoldWaypoint(waypointProps) {
    //     const legModel = new LegModel(
    //         waypointProps.name,
    //         this.currentRunwayName,
    //         this.currentPhase,
    //         waypointProps
    //     );
    //
    //     return legModel;
    // }

    /**
     * Ensure the STAR leg has the specified arrival runway as the exit point
     *
     * @for Fms
     * @method updateStarLegForArrivalRunway
     * @param nextRunwayModel {RunwayModel}
     * @return {array} [success of operation, response]
     */
    updateStarLegForArrivalRunway(nextRunwayModel) {
        const currentArrivalRunway = this.arrivalRunwayModel;

        if (!(nextRunwayModel instanceof RunwayModel)) {
            throw new TypeError(`Expected instance of RunwayModel, but received ${nextRunwayModel}`);
        }

        if (currentArrivalRunway && currentArrivalRunway.name === nextRunwayModel.name) {
            const readback = {};
            readback.log = `expect Runway ${nextRunwayModel.name}`;
            readback.say = `expect Runway ${nextRunwayModel.getRadioName()}`;

            return [true, readback];
        }

        if (!this._routeModel.isRunwayModelValidForStar(nextRunwayModel)) {
            const readback = {};
            readback.log = `unable, according to our charts, Runway ${nextRunwayModel.name} is ` +
                `not valid for the ${this._routeModel.getStarIcao()} arrival, expecting ` +
                `Runway ${currentArrivalRunway.name} instead`;
            readback.say = `unable, according to our charts, Runway ${nextRunwayModel.getRadioName()} ` +
                `is not valid for the ${this._routeModel.getStarName()} arrival, expecting ` +
                `Runway ${currentArrivalRunway.getRadioName()} instead`;

            return [false, readback];
        }

        this._routeModel.updateStarLegForArrivalRunwayModel(nextRunwayModel);
        this.setArrivalRunway(nextRunwayModel);

        const readback = {};
        readback.log = `expecting Runway ${nextRunwayModel.name}`;
        readback.say = `expecting Runway ${nextRunwayModel.getRadioName()}`;

        return [true, readback];
    }

    /**
     * Update the expected arrival runway based on the STAR's exit point runway
     *
     * @for Fms
     * @method _updateArrivalRunwayFromRoute
     */
    _updateArrivalRunwayFromRoute() {
        const arrivalRunwayModel = this._routeModel.getArrivalRunwayModel();

        if (_isNil(arrivalRunwayModel)) {
            console.error('Expected route to have a valid arrival runway');

            return;
        }

        this.setArrivalRunway(arrivalRunwayModel);
    }

    /**
     * Update the expected departure runway based on the SID's entry point runway
     *
     * @for Fms
     * @method _updateArrivalRunwayFromRoute
     */
    _updateDepartureRunwayFromRoute() {
        const departureRunwayModel = this._routeModel.getDepartureRunwayModel();

        if (_isNil(departureRunwayModel)) {
            console.error('Expected route to have a valid departure runway');

            return;
        }

        this.setDepartureRunway(departureRunwayModel);
    }

    /**
     * Verify that this FMS's route contains at least two waypoints, or throw an error
     *
     * This is an expectation on spawn so we can point the aircraft somewhere,
     * but OTHER than on spawn, there is no reason an aircraft cannot be assigned
     * a single-fix route (such as "forget everything else, just go direct to the airport!").
     *
     * @for Fms
     * @method _verifyRouteContainsMultipleWaypoints
     * @private
     */
    _verifyRouteContainsMultipleWaypoints() {
        if (this.waypoints.length < 2) {
            throw new TypeError('Expected flight plan route to have at least two ' +
                `waypoints, but only found ${this.waypoints.length} waypoints`);
        }
    }
}
