import _drop from 'lodash/drop';
import _find from 'lodash/find';
import _findIndex from 'lodash/findIndex';
import _flatten from 'lodash/flatten';
import _has from 'lodash/has';
import _isEmpty from 'lodash/isEmpty';
import _isNil from 'lodash/isNil';
import _isObject from 'lodash/isObject';
import _last from 'lodash/last';
import _map from 'lodash/map';
import _without from 'lodash/without';
import LegModel from './LegModel';
import RouteModel from '../../navigationLibrary/Route/RouteModel';
import {
    FLIGHT_CATEGORY,
    FLIGHT_PHASE,
    PROCEDURE_TYPE
} from '../../constants/aircraftConstants';
import {
    INVALID_INDEX,
    INVALID_NUMBER,
    REGEX
} from '../../constants/globalConstants';
import {
    routeStringFormatHelper,
    extractFixnameFromHoldSegment,
    extractHeadingFromVectorSegment
} from '../../navigationLibrary/Route/routeStringFormatHelper';

/**
 * Symbol used to separate `directRouteSegments`
 *
 * @property DIRECT_ROUTE_SEGMENT_SEPARATOR
 * @type {string}
 * @final
 */
const DIRECT_ROUTE_SEGMENT_SEPARATOR = '..';

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

        /**
        * routeSegments of legs that have been completed
        *
        * Used to generate a routeString for an entire, original, route
        *
        * @property _previousRouteSegments
        * @type {array<string>}
        * @default []
        * @private
        */
        this._previousRouteSegments = [];

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

        /**
         * @property _flightPhaseHistory
         * @type {array<string>}
         * @default []
         * @private
         */
        this._flightPhaseHistory = [];

        /**
         * Altitude expected for this flight. Will change as ATC amends it.
         *
         * @property flightPlanAltitude
         * @type {number}
         * @default INVALID_NUMBER
         */
        this.flightPlanAltitude = INVALID_NUMBER;

        /**
         * Collection of `LegModel` objects
         *
         * @property legCollection
         * @type {array}
         * @default []
         */
        this.legCollection = [];

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
        return this.currentLeg.currentWaypoint;
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
        return this.legCollection[0];
    }

    /**
     * Builds a routeString from the current legs in the `legCollection` and joins
     * each section with `..`
     *
     * A `routeString` might look like one of the following:
     * - `cowby..bikkr..dag.kepec3.klas`
     * - `cowby`
     * - `dag.kepec3.klas`
     *
     * @property currentRoute
     * @type {string}
     */
    get currentRoute() {
        const routeSegments = _map(this.legCollection, (legModel) => legModel.routeString);

        return routeSegments.join(DIRECT_ROUTE_SEGMENT_SEPARATOR);
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

    // TODO: this should move to a class method
    /**
     * Returns a flattened array of each `WaypointModel` in the flightPlan
     *
     * This is used only in the `CanvasController` when drawing the projected
     * aircraft path.
     *
     * Using a getter here to stay in line with the previous api.
     *
     * @property waypoints
     * @type {array<WaypointModel>}
     */
    get waypoints() {
        const waypointList = _map(this.legCollection, (legModel) => {
            return [
                ...legModel.waypointCollection
            ];
        });

        return _flatten(waypointList);
    }

    /**
     * Initialize the instance and setup initial properties
     *
     * @for Fms
     * @method init
     * @param aircraftInitProps {object}
     */
    init({ altitude, category, model, route }, initialRunwayAssignment) {
        this._setCurrentPhaseFromCategory(category);
        this._setInitialRunwayAssignmentFromCategory(category, initialRunwayAssignment);

        this.flightPlanAltitude = altitude;

        if (category === FLIGHT_CATEGORY.DEPARTURE) {
            this.flightPlanAltitude = model.ceiling;
        }

        this.legCollection = this._buildLegCollection(route);
    }

    /**
     * Destroy the instance and reset properties
     *
     * @for LegModel
     * @method destroy
     */
    destroy() {
        this._navigationLibrary = null;
        this._previousRouteSegments = [];
        this.currentPhase = '';
        this.departureRunwayModel = null;
        this.arrivalRunwayModel = null;
        this.flightPlanAltitude = INVALID_NUMBER;
        this.legCollection = [];
    }

    /**
     * Return an array of waypoints in the flight plan that have altitude restrictions
     *
     * @for Fms
     * @method getAltitudeRestrictedWaypoints
     * @return {array<WaypointModel>}
     */
    getAltitudeRestrictedWaypoints() {
        return this.waypoints.filter((waypoint) => waypoint.hasAltitudeRestriction);
    }

    /**
     * Collects the `.getProcedureTopAltitude()` value from each `LegModel`
     * in the `#legCollection`, then finds and returns the highest value
     *
     * @for LegModel
     * @method getTopAltitude
     * @return {number}
     */
    getTopAltitude() {
        const maxAltitudeFromLegs = _map(this.legCollection, (leg) => leg.getProcedureTopAltitude());

        return Math.max(...maxAltitudeFromLegs);
    }

    /**
     * Collects the `.getProcedureBottomAltitude()` value from each `LegModel`
     * in the `#legCollection`, then finds and returns the lowest value
     *
     * @for LegModel
     * @method getBottomAltitude
     * @return {number}
     */
    getBottomAltitude() {
        const valueToExclude = INVALID_NUMBER;
        const minAltitudeFromLegs = _without(
            _map(this.legCollection, (leg) => leg.getProcedureBottomAltitude()),
            valueToExclude
        );

        return Math.min(...minAltitudeFromLegs);
    }

    /**
     * Get the flight plan route string in dot notation
     *
     * @for Fms
     * @method getFlightPlanRouteStringWithDots
     * @return {string}
     */
    getFlightPlanRouteStringWithDots() {
        const currentRouteSegments = _map(this.legCollection, (legModel) => legModel.routeString);
        const previousAndCurrentRouteSegments = this._previousRouteSegments.concat(currentRouteSegments);

        return previousAndCurrentRouteSegments.join('..').toUpperCase();
    }

    /**
     * Get the flight plan route string with legs separated by spaces
     *
     * This is primarily meant for use in the `StripViewModel`.
     *
     * @for Fms
     * @method getFlightPlanRouteStringWithSpaces
     * @return {string}
     */
    getFlightPlanRouteStringWithSpaces() {
        return this.getFlightPlanRouteStringWithDots().replace(REGEX.DOUBLE_OR_SINGLE_DOT, ' ');
    }

    /**
     * Get the next waypoint in the flight plan, if it exists
     *
     * @for Fms
     * @method getNextWaypointModel
     * @return waypointModel {WaypointModel}
     */
    getNextWaypointModel() {
        if (!this.hasNextWaypoint()) {
            return null;
        }

        let waypointModel = this.currentLeg.nextWaypoint;

        if (!this.currentLeg.hasNextWaypoint()) {
            waypointModel = this.legCollection[1].currentWaypoint;
        }

        return waypointModel;
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
        const waypointModel = this.getNextWaypointModel();

        return waypointModel.positionModel;
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
     * @for fms
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
     * @for fms
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

    /**
     * Add a new `LegModel` to the left side of the `#legCollection`
     *
     * @for Fms
     * @method prependLeg
     * @param legModel {LegModel}
     */
    prependLeg(legModel) {
        this.legCollection.unshift(legModel);
    }

    /**
     * Add a new `LegModel` to the right side of the `#legCollection`
     *
     * @for Fms
     * @method appendLeg
     * @param legModel {LegModel}
     */
    appendLeg(legModel) {
        this.legCollection.push(legModel);
    }

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
    createLegWithHoldingPattern(inboundHeading, turnDirection, legLength, holdRouteSegment, holdPosition) {
        // TODO: replace with constant
        const isPositionHold = holdRouteSegment === 'GPS';
        const waypointProps = {
            turnDirection,
            legLength,
            isHold: true,
            inboundHeading,
            name: holdRouteSegment,
            positionModel: holdPosition,
            altitudeMaximum: INVALID_NUMBER,
            altitudeMinimum: INVALID_NUMBER,
            speedMaximum: INVALID_NUMBER,
            speedMinimum: INVALID_NUMBER
        };

        if (isPositionHold) {
            const legModel = this._createLegWithHoldWaypoint(waypointProps);

            this.prependLeg(legModel);

            return;
        }

        const waypointNameToFind = extractFixnameFromHoldSegment(holdRouteSegment);
        const { waypointIndex } = this._findLegAndWaypointIndexForWaypointName(waypointNameToFind);

        if (waypointIndex !== INVALID_NUMBER) {
            this.skipToWaypoint(waypointNameToFind);
            this.currentWaypoint.updateWaypointWithHoldProps(inboundHeading, turnDirection, legLength);

            return;
        }

        const legModel = this._createLegWithHoldWaypoint(waypointProps);

        this.prependLeg(legModel);

        return;
    }

    /**
     * Move to the next possible waypoint
     *
     * This could be the next waypoint in the current leg,
     * or the first waypoint in the next leg.
     *
     * @for LegModel
     * @method nextWaypoint
     */
    nextWaypoint() {
        if (!this.currentLeg.hasNextWaypoint()) {
            this._updatePreviousRouteSegments(this.currentLeg.routeString);
            this._moveToNextLeg();

            return;
        }

        this._moveToNextWaypointInLeg();
    }

    /**
     * Replace the current flightPlan with an entire new one
     *
     * Used when an aircraft has been re-routed
     *
     * @for Fms
     * @method replaceCurrentFlightPlan
     * @param routeString {string}
     */
    replaceCurrentFlightPlan(routeString) {
        this._destroyLegCollection();

        this.legCollection = this._buildLegCollection(routeString);
    }

    /**
     * Given a `waypointName`, find the index of that waypoint within
     * the `legsColelction`. Then make that Leg active and `waypointName`
     * the active waypoint for that Leg.
     *
     * @for Fms
     * @method skipToWaypoint
     * @param waypointName {string}
     */
    skipToWaypoint(waypointName) {
        const { legIndex, waypointIndex } = this._findLegAndWaypointIndexForWaypointName(waypointName);

        // TODO: this may be deprectaed
        this._collectRouteStringsForLegsToBeDropped(legIndex);

        this.legCollection = _drop(this.legCollection, legIndex);
        this.currentLeg.skipToWaypointAtIndex(waypointIndex);
    }

    /**
     * Find the departure procedure (if it exists) within the `#legCollection` and
     * reset it with a new departure procedure.
     *
     * This method does not remove any `LegModel`s. It instead finds and updates a
     * `LegModel` with a new routeString. If a `LegModel` with a departure
     * procedure cannot be found, then we create a new `LegModel` and place it
     * at the beginning of the `#legCollection`.
     *
     * @for Fms
     * @method replaceDepartureProcedure
     * @param routeString {string}
     * @param runwayModel {RunwayModel}
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

        const procedureLegIndex = this._findLegIndexForProcedureType(PROCEDURE_TYPE.SID);

        // a procedure does not exist in the flight plan, so we must create a new one
        if (procedureLegIndex === INVALID_NUMBER) {
            const legModel = this._buildLegModelFromRouteSegment(routeString);

            this.prependLeg(legModel);

            return;
        }

        this._replaceLegAtIndexWithRouteString(procedureLegIndex, routeString);
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

        const procedureLegIndex = this._findLegIndexForProcedureType(PROCEDURE_TYPE.STAR);

        // a procedure does not exist in the flight plan, so we must create a new one
        if (procedureLegIndex === INVALID_NUMBER) {
            const legModel = this._buildLegModelFromRouteSegment(routeString);

            this.appendLeg(legModel);

            return;
        }

        this._replaceLegAtIndexWithRouteString(procedureLegIndex, routeString);
    }

    /**
     * Removes an existing flightPlan and replaces it with a
     * brand new route.
     *
     * This is a destructive operation.
     *
     * @for Fms
     * @method replaceFlightPlanWithNewRoute
     * @param routeString {string}
     * @param runway {string}
     */
    replaceFlightPlanWithNewRoute(routeString, runway) {
        // TODO: we may need to update the runway in this method
        this._destroyLegCollection();

        this.legCollection = this._buildLegCollection(routeString);
    }

    /**
     * Replace a portion of the existing flightPlan with a new route,
     * up to a shared routeSegment.
     *
     * It is assumed that any `routeString` passed to this method has
     * already been verified to contain a shared segment with the existing
     * route. This method is not designed to handle errors for cases where
     * there are not shared routeSegments.
     *
     * @for Fms
     * @metho replaceRouteUpToSharedRouteSegment
     * @param routeString {routeString}
     */
    replaceRouteUpToSharedRouteSegment(routeString) {
        let legIndex = INVALID_NUMBER;
        let amendmentRouteString = '';
        const routeSegments = routeStringFormatHelper(routeString.toLowerCase());

        for (let i = 0; i < routeSegments.length; i++) {
            const segment = routeSegments[i];

            // with the current routeSegment, find if this same routeSegment exists already within the #legCollection
            if (this.hasLegWithRouteString(segment)) {
                legIndex = this._findLegIndexByRouteString(segment);
                // build a new routeString with only the pieces we need to create new `LegModels` for
                amendmentRouteString = routeSegments.slice(0, i);

                break;
            }
        }

        this._trimLegCollectionAtIndex(legIndex);
        this._prependLegCollectionWithRouteAmendment(amendmentRouteString);
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
     * Validate and entire route.
     *
     * This can be:
     * - a directRouteString,
     * - a procedureRouteString,
     * - or combination of both directRouteStrings and procedureRouteString
     *
     * @for fms
     * @method isValidRoute
     * @param routeString {string}
     * @param runway {string}
     * @return {boolean}
     */
    isValidRoute(routeString, runway = '') {
        const routeSegments = routeStringFormatHelper(routeString);

        if (!routeSegments) {
            return false;
        }

        for (let i = 0; i < routeSegments.length; i++) {
            let isValid = false;
            const segment = routeSegments[i];

            if (RouteModel.isProcedureRouteString(segment)) {
                isValid = this.isValidProcedureRoute(segment, runway);
            } else if (RouteModel.isHoldRouteString(segment)) {
                const fixName = extractFixnameFromHoldSegment(segment);

                isValid = this._navigationLibrary.hasFix(fixName);
            } else if (RouteModel.isVectorRouteString(segment)) {
                const heading = extractHeadingFromVectorSegment(segment);
                const isValidNumber = !isNaN(heading);
                const isThreeDigits = heading.length === 3;

                isValid = isValidNumber && isThreeDigits;
            } else {
                isValid = this._navigationLibrary.hasFix(segment);
            }

            if (!isValid) {
                return false;
            }
        }

        return true;
    }

    /**
     * Determinines if the passed `routeString` is a valid procedure route.
     *
     * This can be either a SID or a STAR.
     * A valid `procedureRouteString` is expected to be in the shape of:
     * `ENTRY.PROCEDURE_NAME.EXIT`
     *
     * @for Fms
     * @method isValidProcedureRoute
     * @param routeString {string}
     * @param runway {string}
     * @param flightPhase {string}
     * @return {boolean}
     */
    isValidProcedureRoute(routeString, runway, flightPhase = '') {
        let routeStringModel;

        // RouteModel will throw when presented with an invalid procedureRouteString,
        // we only want to capture that here and continue on our way.
        try {
            routeStringModel = new RouteModel(routeString);
        } catch (error) {
            console.error(error);

            return false;
        }

        // flightPhase is unknown or unavailable so it must be extrapolated based on the `procedureId`.
        if (flightPhase === '') {
            flightPhase = this._translateProcedureNameToFlightPhase(routeStringModel.procedure);
        }

        // a `LegModel` already exists with this routeString
        if (this.hasLegWithRouteString(routeStringModel.routeCode)) {
            return true;
        }

        // TODO: abstract this to a method or combine with if/returns below
        // find the prcedure model from the correct collection based on flightPhase
        const procedureDefinitionModel = flightPhase === FLIGHT_CATEGORY.ARRIVAL
            ? this.findStarByProcedureId(routeStringModel.procedure)
            : this.findSidByProcedureId(routeStringModel.procedure);

        if (!procedureDefinitionModel) {
            return false;
        }

        if (flightPhase === FLIGHT_CATEGORY.ARRIVAL) {
            // TODO: this is too aggressive at the moment because of inconsistencies in airport files. this should be
            // reimplemented as soon as possible.
            return procedureDefinitionModel.hasFixName(routeStringModel.entry); // && procedureDefinitionModel.hasFixName(runway);
        }

        // TODO: this is too aggressive at the moment because of inconsistencies in airport files. this should be
        // reimplemented as soon as possible.
        return procedureDefinitionModel.hasFixName(routeStringModel.exit); // && procedureDefinitionModel.hasFixName(runway);
    }

    /**
     * Given a `routeString`, find if any `routeSegments` match an existing
     * `LegModel#routeString`.
     *
     * This method will return true on only the first match.
     *
     * This method should be used before using `applyPartialRouteAmendment()`
     * to verify a `routeAmmendment` has some shared `routeSegment`.
     *
     * @for Fms
     * @method isValidRouteAmendment
     * @param routeString {string}      any `routeString` representing a future routeAmmendment
     * @return isValid {boolean}
     */
    isValidRouteAmendment(routeString) {
        let isValid = false;
        const routeSegments = routeStringFormatHelper(routeString);

        for (let i = 0; i < routeSegments.length; i++) {
            const segment = routeSegments[i];

            if (this.hasLegWithRouteString(segment)) {
                isValid = true;

                break;
            }
        }

        return isValid;
    }

    /**
     * Find if a Waypoint exists within `#legCollection`
     *
     * This will call a `.hasWaypoint` method on each `LegModel`
     *
     * @for Fms
     * @method hasWaypoint
     * @param waypointName {string}
     * @return {boolean}
     */
    hasWaypoint(waypointName) {
        // using a for loop here instead of `_find()` because this operation could happen a lot and
        // a for loop is going to be faster than `_find()` in most cases.
        for (let i = 0; i < this.legCollection.length; i++) {
            const leg = this.legCollection[i];

            if (leg.hasWaypoint(waypointName)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Encapsulation of boolean logic used to determine if there is a
     * WaypointModel available after the current one has been flown over.
     *
     * @for fms
     * @method hasNextWaypoint
     * @return {boolean}
     */
    hasNextWaypoint() {
        return this.currentLeg.hasNextWaypoint() || !_isNil(this.legCollection[1]);
    }

    /**
     * Determiens is any `LegModel` with the `#legCollection` contains
     * a specific `routeString`.
     *
     * It is assumed that if a leg matches the `routeString` provided,
     * the route is the same.
     *
     * @for Fms
     * @method hasLegWithRouteString
     * @param routeString {string}
     * @return {boolean}
     */
    hasLegWithRouteString(routeString) {
        const previousProcedureLeg = this._findLegByRouteString(routeString);

        return typeof previousProcedureLeg !== 'undefined';
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
     * Fascade method for `sidCollection.findRouteByIcao`
     *
     * Allows classes that have access to the `Aircraft`, but not the
     * navigation library, to do standardRoute building and logic.
     *
     * @for Fms
     * @method findSidByProcedureId
     * @param procedureId {string}
     * @return {array<StandardRouteWaypointModel>}
     */
    findSidByProcedureId(procedureId) {
        return this._navigationLibrary.sidCollection.findRouteByIcao(procedureId);
    }

    /**
     * Fascade method for `starCollection.findRouteByIcao`
     *
     * Allows classes that have access to the `Aircraft`, but not the
     * navigation library, to do standardRoute building and logic.
     *
     * @for Fms
     * @method findStarByProcedureId
     * @param procedureId {string}
     * @return {array<StandardRouteWaypointModel>}
     */
    findStarByProcedureId(procedureId) {
        return this._navigationLibrary.starCollection.findRouteByIcao(procedureId);
    }

    /**
     * Fascade method for `sidCollection.findRandomExitPointForSIDIcao`
     *
     * Allows classes that have access to the `Aircraft`, but not the
     * navigation library, to do standardRoute building and logic.
     *
     * @Fms
     * @method findRandomExitPointForSidProcedureId
     * @param procedureId {string}
     * @return {array<StandardRouteWaypointModel>}
     */
    findRandomExitPointForSidProcedureId(procedureId) {
        return this._navigationLibrary.sidCollection.findRandomExitPointForSIDIcao(procedureId);
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
    _buildLegCollection(routeString) {
        const routeStringSegments = routeStringFormatHelper(routeString);
        const legsForRoute = _map(routeStringSegments,
            (routeSegment) => this._buildLegModelFromRouteSegment(routeSegment)
        );

        return legsForRoute;
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
     * Make the next `WaypointModel` in the currentLeg the currentWaypoint
     *
     * @for Fms
     * @method _moveToNextWaypointInLeg
     * @private
     */
    _moveToNextWaypointInLeg() {
        this.currentLeg.moveToNextWaypoint();
    }

    /**
     * Make the next `LegModel` in the `legCollection` the currentWaypoint
     *
     * @for Fms
     * @method _moveToNextLeg
     * @private
     */
    _moveToNextLeg() {
        this.currentLeg.destroy();
        // this is mutable
        this.legCollection.shift();
    }

    /**
     * Loop through the `LegModel`s in the `#legCollection` untill
     * the `waypointName` is found, then return the location indicies
     * for the Leg and Waypoint.
     *
     * Used to adjust `currentLeg` and `currentWaypoint` values by
     * dropping items to the left of these indicies.
     *
     * @for Fms
     * @method _findLegAndWaypointIndexForWaypointName
     * @param waypointName {string}
     * @return {object}
     * @private
     */
    _findLegAndWaypointIndexForWaypointName(waypointName) {
        let legIndex;
        let waypointIndex = INVALID_NUMBER;

        for (legIndex = 0; legIndex < this.legCollection.length; legIndex++) {
            const legModel = this.legCollection[legIndex];
            // TODO: this should be made into a class method for the WaypointModel
            waypointIndex = _findIndex(legModel.waypointCollection, { name: waypointName.toLowerCase() });

            if (waypointIndex !== INVALID_NUMBER) {
                break;
            }
        }

        // TODO: what happens here if a waypoint isn't found within the collection?

        return {
            legIndex,
            waypointIndex
        };
    }

    /**
     * Given a `procedureType` this locates the array index of a leg with that `#procedureType`.
     *
     * @for Fms
     * @method _findLegIndexForProcedureType
     * @param procedureType {PROCEDURE_TYPE|string}  either `SID` or `STAR`, but can be extended to anything in the
     *                                               `PROCEDURE_TYPE` enum
     * @return {number}                              array index of a `procedureType` from the `#legCollection`
     * @private
     */
    _findLegIndexForProcedureType(procedureType) {
        return _findIndex(this.legCollection, { isProcedure: true, procedureType: procedureType });
    }

    /**
     * Locate a `LegModel` in the collection by it's `#routeString` property
     *
     * @for Fms
     * @method _findLegIndexByRouteString
     * @param routeString {string}
     * @return {number|undefined}           array index of the found `LegModel` or undefined
     */
    _findLegIndexByRouteString(routeString) {
        return _findIndex(this.legCollection, { routeString: routeString });
    }

    /**
     * Loop through the `#legCollection` up to the `legIndex` and add each
     * `routeString` to `#_previousRouteSegments`.
     *
     * Called from `.skipToWaypoint()` before the `currentLeg` is updated to the
     * `LegModel` at `legIndex`.
     *
     * @for Fms
     * @method _collectRouteStringsForLegsToBeDropped
     * @param legIndex {number}  index number of the next currentLeg
     * @private
     */
    _collectRouteStringsForLegsToBeDropped(legIndex) {
        for (let i = 0; i < legIndex; i++) {
            this._previousRouteSegments.push(this.legCollection[i].routeString);
        }
    }

    /**
     * Loop through each `LegModel` and call `.destroy()`
     *
     * This clears destroys each `WaypointModel` contained within each
     * `LegModel` in the collection.
     *
     * TODO: implement object pooling with `LegModel` and `WaypointModel`,
     *       this is the method where the `LegModel` is be returned to the pool
     *
     * @for Fms
     * @method _destroyLegCollection
     * @private
     */
    _destroyLegCollection() {
        for (let i = 0; i < this.legCollection.length; i++) {
            const legModel = this.legCollection[i];

            legModel.destroy();
        }

        this.legCollection = [];
    }

    /**
     * Find a LegModel within the collection by its route string
     *
     * @for Fms
     * @method _findLegByRouteString
     * @param routeString {string}
     * @return {LegModel|undefined}
     * @private
     */
    _findLegByRouteString(routeString) {
        return _find(this.legCollection, { routeString: routeString.toLowerCase() });
    }

    /**
     * This method will find an leg at `legIndex` in the `#legCollection` and
     * replace it with a new `routeString`.
     *
     * It is important to note that this doesn't create a new `LegModel` instance.
     * Instead, this locates the leg at `legIndex`, destroys it's properties, then
     * runs `init()` with the new `routeString`.
     *
     * @for Fms
     * @method _replaceLegAtIndexWithRouteString
     * @param legIndex {number}     array index of the leg to replace
     * @param routeString {string}  routeString to use for the replacement leg
     * @private
     */
    _replaceLegAtIndexWithRouteString(legIndex, routeString) {
        const legModel = this.legCollection[legIndex];

        legModel.destroy();
        legModel.init(routeString, this.currentRunwayName, this.currentPhase);
    }

    /**
     * Regenerate SID leg based on current runway assignment
     *
     * @for Fms
     * @method _regenerateSidLeg
     */
    _regenerateSidLeg() {
        const sidLegIndex = this._findLegIndexForProcedureType(PROCEDURE_TYPE.SID);

        if (sidLegIndex === INVALID_INDEX) {
            // would be throwing here, except that causes the initial setting of the
            // departure runway to throw. So instead will just return early.
            return;
        }

        const sidLeg = this.legCollection[sidLegIndex];

        this.replaceDepartureProcedure(sidLeg.routeString, this.departureRunwayModel);
    }

    /**
     * Regenerate STAR leg based on current runway assignment
     *
     * @for Fms
     * @method _regenerateStarLeg
     */
    _regenerateStarLeg() {
        const starLegIndex = this._findLegIndexForProcedureType(PROCEDURE_TYPE.STAR);

        if (starLegIndex === INVALID_INDEX) {
            // would be throwing here, except that causes the initial setting of the
            // arrival runway to throw. So instead will just return early.
            return;
        }

        const starLeg = this.legCollection[starLegIndex];

        this.replaceArrivalProcedure(starLeg.routeString, this.arrivalRunwayModel);
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
     * Removes `LegModel`s from index `0` to `#legIndex`.
     *
     * This method is useful for removing a specific number of `LegModel`s
     * from the left of the collection.
     *
     * @for Fms
     * @method _trimLegCollectionAtIndex
     * @param legIndex {number}
     * @private
     */
    _trimLegCollectionAtIndex(legIndex) {
        this.legCollection = this.legCollection.slice(legIndex);
    }

    // TODO: simplify this and abstract it away from `.prependLeg()`
    /**
     * Given an array of `routeSegments`, prepend each to the left of the `#legCollection`
     *
     * @for Fms
     * @method _prependLegCollectionWithRouteAmendment
     * @param routeSegments {array<string>}             direct or procedure routeStrings
     * @private
     */
    _prependLegCollectionWithRouteAmendment(routeSegments) {
        // reversing order here because we're leveraging `.prependLeg()`, which adds a single
        // leg to the left of the `#legCollection`. by reversing the array, we can ensure the
        // correct order of legs.
        const routeSegmentList = routeSegments.slice().reverse();

        for (let i = 0; i < routeSegmentList.length; i++) {
            const routeSegment = routeSegmentList[i];
            const legModel = this._buildLegModelFromRouteSegment(routeSegment);

            this.prependLeg(legModel);
        }
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

    /**
     * Adds a `routeString` to `#_previousRouteSegments` only when it is not
     * already present in the list
     *
     * @for Fms
     * @method _updatePreviousRouteSegments
     * @param routeString {string}             a valid routeString
     */
    _updatePreviousRouteSegments(routeString) {
        if (this._previousRouteSegments.indexOf(routeString) !== INVALID_INDEX) {
            return;
        }

        this._previousRouteSegments.push(routeString);
    }
}
