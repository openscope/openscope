import _has from 'lodash/has';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _last from 'lodash/last';
import LegModel from './LegModel';
import RouteModel from './RouteModel';
import {
    FLIGHT_CATEGORY,
    FLIGHT_PHASE
} from '../../constants/aircraftConstants';
import { INVALID_NUMBER } from '../../constants/globalConstants';
import { PROCEDURE_TYPE } from '../../constants/routeConstants';

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
     * @param initialRunwayAssignment {RunwayModel}
     * @param typeDefinitionModel {AircraftTypeDefinitionModel}
     * @param navigationLibrary {NavigationLibrary}
     */
    constructor(aircraftInitProps, initialRunwayAssignment, typeDefinitionModel, navigationLibrary) {
        if (!_isObject(aircraftInitProps) || _isEmpty(aircraftInitProps)) {
            throw new TypeError('Invalid aircraftInitProps passed to Fms');
        }

        /**
         * Name of runway used at arrival airport
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
         * Name of runway used at departure airport
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

        // FIXME: Do we really need this?
        /**
        * @property _flightPhaseHistory
        * @type {array<string>}
        * @default []
        * @private
        */
        this._flightPhaseHistory = [];

        /**
        * Instance of the `NavigationLibrary`
        *
        * provides access to the aiport SIDs, STARs and Fixes via collection objects and fascade methods.
        * used for route building
        *
        * @property _navigationLibrary
        * @type {NavigationLibrary}
        * @private
        */
        this._navigationLibrary = navigationLibrary;

        this.init(aircraftInitProps, initialRunwayAssignment);
    }

    /**
     * Provides access to the `RunwayModel` currently associated with the Fms
     *
     * It is assumed only an arrival or departure runway will
     * exist at any one time
     *
     * @property currentRunway
     * @return {RunwayModel}
     */
    get currentRunway() {
        return this.arrivalRunwayModel || this.departureRunwayModel;
    }

    /**
     * The name of the currently assigned runway
     *
     * // TODO: this may need to be moved to a function in the event
     *          both departure and arrival runways are supported for
     *          a single aircraft
     *
     * @property currentRunwayName
     * @type {string}
     */
    get currentRunwayName() {
        return this.currentRunway.name;
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
     * Get the flight plan route string in dot notation
     *
     * @for Fms
     * @property routeString
     * @type {string}
     */
    get routeString() {
        return this._routeModel.routeString;
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

    /**
     * Initialize the instance and setup initial properties
     *
     * @for Fms
     * @method init
     * @param aircraftInitProps {object}
     */
    init({ altitude, category, model, routeString }, initialRunwayAssignment) {
        this._setCurrentPhaseFromCategory(category);
        this._setInitialRunwayAssignmentFromCategory(category, initialRunwayAssignment);
        this._initializeFlightPlanAltitude(altitude, category, model);

        this._routeModel = new RouteModel(this._navigationLibrary, routeString);
    }

    /**
     * Destroy the instance and reset properties
     *
     * @for LegModel
     * @method destroy
     */
    destroy() {
        this._navigationLibrary = null;
        this.currentPhase = '';
        this.departureRunwayModel = null;
        this.arrivalRunwayModel = null;
        this.flightPlanAltitude = INVALID_NUMBER;
    }

    _initializeFlightPlanAltitude(altitude, category, model) {
        this.flightPlanAltitude = altitude;

        if (category === FLIGHT_CATEGORY.DEPARTURE) {
            this.flightPlanAltitude = model.ceiling;
        }
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
     * Get the position of the next waypoint in the flight plan
     *
     * Currently only used in `calculateTurnInitiaionDistance()` helper function
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
     * Encapsulates setting `#departureRunwayModel`
     *
     * @for Fms
     * @method setDepartureRunway
     * @param runwayModel {RunwayModel}
     */
    setDepartureRunway(runwayModel) {
        // TODO: this should be an `instanceof` check and should be implemented as part of (or after)
        // https://github.com/openscope/openscope/issues/93
        if (!_isObject(runwayModel)) {
            throw new TypeError(`Expected instance of RunwayModel, but received ${runwayModel}`);
        }

        if (this.departureRunwayModel && this.departureRunwayModel.name === runwayModel.name) {
            return;
        }

        this.departureRunwayModel = runwayModel;

        this._regenerateSidLeg();
    }

    /**
     * Encapsulates setting of `#arrivalRunwayModel`
     *
     * @for Fms
     * @method setArrivalRunway
     * @param runwayModel {RunwayModel}
     */
    setArrivalRunway(runwayModel) {
        // TODO: this should be an `instanceof` check and should be implemented as part of (or after)
        // https://github.com/openscope/openscope/issues/93
        if (!_isObject(runwayModel)) {
            throw new TypeError(`Expected instance of RunwayModel, but received ${runwayModel}`);
        }

        if (this.arrivalRunwayModel && this.arrivalRunwayModel.name === runwayModel.name) {
            return;
        }

        this.arrivalRunwayModel = runwayModel;

        this._regenerateStarLeg();
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
        if (!_has(FLIGHT_PHASE, phase)) {
            return new TypeError(`Expected known flight phase, but received '${phase}'`);
        }

        if (this.currentPhase === phase) {
            return;
        }

        this._addPhaseToFlightHistory(phase);

        this.currentPhase = phase;
    }

    // FIXME: This will no longer work
    // TODO: this method should be simplified
    /**
     * Create a new `LegModel` for a holding pattern at a Fix or a position
     *
     * @for Fms
     * @method createLegWithHoldingPattern
     * @param inboundHeading {number}
     * @param turnDirection {string}
     * @param legLength {number}
     * @param holdRouteSegment {string}
     * @param holdPosition {StaticPositionModel}
     */
    createLegWithHoldingPattern(/* inboundHeading, turnDirection, legLength, holdRouteSegment, holdPosition */) {
        // // TODO: replace with constant
        // const isPositionHold = holdRouteSegment === 'GPS';
        // const waypointProps = {
        //     turnDirection,
        //     legLength,
        //     isHold: true,
        //     inboundHeading,
        //     name: holdRouteSegment,
        //     positionModel: holdPosition,
        //     altitudeMaximum: INVALID_NUMBER,
        //     altitudeMinimum: INVALID_NUMBER,
        //     speedMaximum: INVALID_NUMBER,
        //     speedMinimum: INVALID_NUMBER
        // };
        //
        // if (isPositionHold) {
        //     const legModel = this._createLegWithHoldWaypoint(waypointProps);
        //
        //     this.prependLeg(legModel);
        //
        //     return;
        // }
        //
        // const waypointNameToFind = extractFixnameFromHoldSegment(holdRouteSegment);
        // const { waypointIndex } = this._findLegAndWaypointIndexForWaypointName(waypointNameToFind);
        //
        // if (waypointIndex !== INVALID_NUMBER) {
        //     this.skipToWaypointName(waypointNameToFind);
        //     this.currentWaypoint.updateWaypointWithHoldProps(inboundHeading, turnDirection, legLength);
        //
        //     return;
        // }
        //
        // const legModel = this._createLegWithHoldWaypoint(waypointProps);
        //
        // this.prependLeg(legModel);
        //
        // return;
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
        if (!this.currentLeg.hasNextWaypoint()) {
            this._updatePreviousRouteSegments(this.currentLeg.routeString);
            this._moveToNextLeg();

            return;
        }

        this.skipToNextWaypoint();
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

    /**
     * Replace departure procedure and departure runway
     *
     * @for Fms
     * @method replaceDepartureProcedure
     * @param routeString {string}
     * @param runwayModel {RunwayModel}
     * @return {boolean}
     */
    replaceDepartureProcedure(routeString, runwayModel) {
        if (this.departureRunwayModel.name !== runwayModel.name) {
            // This does result in needless recursion (since `setDepartureRunway()`
            // calls `replaceDepartureProcedure()`, but it is necessary because we
            // need to be able to both:
            //   - assign a new runway and have the SID leg regenerated
            //   - assign a new SID and have some way to prevent aircraft from
            //     attempting to use it from their current expected runway when it's
            //     invalid for that procedure
            this.setDepartureRunway(runwayModel);
        }

        return this._routeModel.replaceDepartureProcedure(routeString);
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
     * @param runwayModel {RunwayModel}
     * @return {boolean}
     */
    replaceArrivalProcedure(routeString, runwayModel) {
        if (this.arrivalRunwayModel.name !== runwayModel.name) {
            // This does result in needless recursion (since `setArrivalRunway()`
            // calls `replaceArrivalProcedure()`, but it is necessary because we
            // need to be able to both:
            //   - assign a new runway and have the STAR leg regenerated
            //   - assign a new STAR and have some way to prevent aircraft from
            //     attempting to use it from their current expected runway when it's
            //     invalid for that procedure
            this.setArrivalRunway(runwayModel);
        }

        return this._routeModel.replaceArrivalProcedure(routeString);
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
            nextRouteModel = new RouteModel(this._navigationLibrary, routeString);
        } catch (error) {
            console.error(error);

            return false;
        }

        this._routeModel = nextRouteModel;

        this.skipToWaypointName(currentWaypointName);

        return true;
    }

    /**
     * Unset `HOLD` as the `#currentPhase` only if `HOLD` is the `#currentPhase`
     *
     * @Fms
     * @method exitHoldIfHolding
     */
    leaveHoldFlightPhase() {
        if (this.currentPhase !== FLIGHT_PHASE.HOLD) {
            return;
        }

        this._setFlightPhaseToPreviousFlightPhase();
    }

    /**
     * Sets `#currentPhase` to its previous value
     *
     * This method should only be called from `.leaveHoldFlightPhase()`, which performs
     * the requisit checks for correct `#flightPhase`
     *
     * @for Fms
     * @method _setFlightPhaseToPreviousFlightPhase
     */
    _setFlightPhaseToPreviousFlightPhase() {
        this.currentPhase = _last(this._flightPhaseHistory);
    }

    /**
     * Return whether the route contains a waypoint with the specified name
     *
     * @for Fms
     * @method hasWaypoint
     * @param waypointName {string}
     * @return {boolean}
     */
    hasWaypoint(waypointName) {
        return this._routeModel.hasWaypoint(waypointName);
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
     * Returns true if the `#currentLeg` is a procedure (sid/star)
     *
     * @for Fms
     * @method isFollowingProcedure
     * @return {boolean}
     */
    isFollowingProcedure() {
        return this.currentLeg.isProcedure;
    }

    /**
     * Returns true if the `#currentLeg` is a SID procedure
     *
     * @for Fms
     * @method
     * @return {boolean}
     */
    isFollowingSid() {
        return this.isFollowingProcedure() && this.currentLeg.procedureType === PROCEDURE_TYPE.SID;
    }

    /**
     * Returns true if the `#currentLeg` is a STAR procedure
     *
     * @for Fms
     * @method
     * @return {boolean}
     */
    isFollowingStar() {
        return this.isFollowingProcedure() && this.currentLeg.procedureType === PROCEDURE_TYPE.STAR;
    }

    /**
     *
     *
     * @for Fms
     * @method isDeparture
     * @return {boolean}
     */
    isDeparture() {
        return this.currentPhase === FLIGHT_PHASE.APRON ||
            this.currentPhase === FLIGHT_PHASE.TAXI ||
            this.currentPhase === FLIGHT_PHASE.WAITING ||
            this.currentPhase === FLIGHT_PHASE.TAKEOFF ||
            this.currentPhase === FLIGHT_PHASE.CLIMB;
    }

    /**
     *
     *
     * @for Fms
     * @method isArrival
     * @return {boolean}
     */
    isArrival() {
        return this.currentPhase === FLIGHT_PHASE.CRUISE ||
            this.currentPhase === FLIGHT_PHASE.DESCENT ||
            this.currentPhase === FLIGHT_PHASE.APPROACH ||
            this.currentPhase === FLIGHT_PHASE.LANDING;
    }

    /**
     * From a routeString, find each routeString segment and create
     * new `LegModels` for each segment then retun that list.
     *
     * Used on instantiation to build the initial `legCollection`.
     *
     * @for LegModel
     * @method _buildLegCollection
     * @param routeString {string}
     * @return {array<LegModel>}
     * @private
     */
    _buildLegCollection(/* routeString */) {
        // const routeStringSegments = routeStringFormatHelper(routeString);
        // const legsForRoute = _map(routeStringSegments,
        //     (routeSegment) => this._buildLegModelFromRouteSegment(routeSegment)
        // );
        //
        // return legsForRoute;
    }

    /**
     * Build a `LegModel` instance
     *
     * This is abstracted to centralize the creation of `LegModels` so the same,
     * consistent operation can be performed from within a loop or one at a time.
     *
     * @for Fms
     * @method _buildLegModelFromRouteSegment
     * @param routeSegment {string}  a segment of a `routeString`
     * @private
     */
    _buildLegModelFromRouteSegment(routeSegment) {
        return new LegModel(routeSegment, this.currentRunwayName, this.currentPhase, this._navigationLibrary);
    }

    /**
     * Build a `LegModel` instance that contains a `WaypointModel` with hold properties
     *
     * @for Fms
     * @method _createLegWithHoldWaypoint
     * @param waypointProps {object}
     * @return legModel {LegModel}
     */
    _createLegWithHoldWaypoint(waypointProps) {
        const legModel = new LegModel(
            waypointProps.name,
            this.currentRunwayName,
            this.currentPhase,
            this._navigationLibrary,
            waypointProps
        );

        return legModel;
    }

    /**
     * Set the currentPhase with the appropriate value, based on the spawn category
     *
     * @for Fms
     * @method _setCurrentPhaseFromCategory
     * @param category {string}
     * @private
     */
    _setCurrentPhaseFromCategory(category) {
        switch (category) {
            case FLIGHT_CATEGORY.ARRIVAL:
                this.setFlightPhase(FLIGHT_PHASE.CRUISE);

                break;

            case FLIGHT_CATEGORY.DEPARTURE:
                this.setFlightPhase(FLIGHT_PHASE.APRON);

                break;

            default:
                break;
        }
    }

    /**
     * Set the appropriate runway property with the passed `RunwayModel`
     *
     * @for Fms
     * @method _setInitialRunwayAssignmentFromCategory
     * @param category {string}
     * @param runway {RunwayModel}
     * @private
     */
    _setInitialRunwayAssignmentFromCategory(category, runway) {
        // TODO: change to switch with a default throw
        if (category === FLIGHT_CATEGORY.ARRIVAL) {
            this.setArrivalRunway(runway);
        } else if (category === FLIGHT_CATEGORY.DEPARTURE) {
            this.setDepartureRunway(runway);
        }
    }

    /**
     * Given a `procedureId` find the `#collectionName` that
     * procedure belongs to, then translate that `#collectionName`
     * to a `flightPhase`.
     *
     * @for Fms
     * @method _translateProcedureNameToFlightPhase
     * @param procedureId {string}
     * @return {string}
     * @private
     */
    _translateProcedureNameToFlightPhase(procedureId) {
        const collectionToFlightPhaseDictionary = {
            sidCollection: FLIGHT_CATEGORY.DEPARTURE,
            starCollection: FLIGHT_CATEGORY.ARRIVAL
        };
        const collectionName = this._navigationLibrary.findCollectionNameForProcedureId(procedureId);

        return collectionToFlightPhaseDictionary[collectionName];
    }

    /**
     * Add the `#currentPhase` to `#_flightPhaseHistory`
     *
     * @for Fms
     * @method _addPhaseToFlightHistory
     * @private
     */
    _addPhaseToFlightHistory() {
        if (this.currentPhase === '') {
            return;
        }

        this._flightPhaseHistory.push(this.currentPhase);
    }
}
