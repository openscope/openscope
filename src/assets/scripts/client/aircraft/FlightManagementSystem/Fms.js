import _drop from 'lodash/drop';
import _find from 'lodash/find';
import _findIndex from 'lodash/findIndex';
import _isEmpty from 'lodash/isEmpty';
import _isNil from 'lodash/isNil';
import _isObject from 'lodash/isObject';
import _map from 'lodash/map';
import LegModel from './LegModel';
import { routeStringFormatHelper } from '../../navigationLibrary/Route/routeStringFormatHelper';
import {
    FLIGHT_CATEGORY,
    PROCEDURE_TYPE
} from '../../constants/aircraftConstants';

/**
 *
 *
 * @property DIRECT_ROUTE_SEGMENT_SEPARATOR
 * @type {string}
 * @default '..'
 */
const DIRECT_ROUTE_SEGMENT_SEPARATOR = '..';

/**
 *
 *
 * Is only be concerned about maintaining the flightPlan, which is
 * really just the collection of `LegModels` and their respective
 * `WaypointModel` objects.
 *
 * This class should always be instantiated from an `AircraftInstanceModel` and
 * always instantiated from some form of `spawnPatternModel`.
 *
 * @class Fms
 */
export default class Fms {
    /**
     * @constructor
     * @param aircraftInitProps {object}
     * @param initialRunwayAssignment {string}
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
        * Used to generate #flightPlan
        *
        * @property _previousRouteSegments
        * @type {array}
        * @default []
        */
        this._previousRouteSegments = [];

        /**
         * Name of the initial runway assigned for takeoff/landing.
         *
         * This value is likely to change as an aircraft moves through the airspace.
         *
         * @property _runway
         * @type {string}
         * @private
         */
        this._runwayName = initialRunwayAssignment;

        /**
        * Current flight phase of an aircraft
        *
        * Currently only supports `arrival` and `departure`
        *
        * @property currentPhase
        * @type {string}
        * @default ''
        */
        this.currentPhase = '';

        /**
         * Route expected for this flight. Will change as ATC amends it.
         *
         * @property flightPlanRoute
         * @type {string}
         * @default ''
         */
        this.flightPlanRoute = '';

        /**
         * Altitude expected for this flight. Will change as ATC amends it.
         *
         * @property flightPlanAltitude
         * @type {Object}
         * @default ''
         */
        this.flightPlanAltitude = '';

        /**
         * Collection of `LegModel` objects
         *
         * @property legCollection
         * @type {array}
         * @default []
         */
        this.legCollection = [];

        this.init(aircraftInitProps);
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
     * @return {LegModel}
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
     * @return {string}
     */
    get currentRoute() {
        const routeSegments = _map(this.legCollection, (legModel) => legModel.routeString);

        return routeSegments.join(DIRECT_ROUTE_SEGMENT_SEPARATOR);
    }

    /**
     * Flight plan as filed
     *
     * @method flightPlan
     * @return {object}
     */
    get flightPlan() {
        return {
            altitude: this.flightPlanAltitude,
            route: this.flightPlanRoute
        };
    }

    /**
     * Initialize the instance and setup initial properties
     *
     * @for Fms
     * @method init
     * @param aircraftInitProps {object}
     */
    init({ category, model, route }) {
        this.flightPlanRoute = route.toLowerCase();
        this.flightPlanAltitude = model.ceiling;
        this.currentPhase = category;
        // TODO: For aircraft not yet in flight, this should not happen until we are cleared on
        // this (or an amended) route by ATC.
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
        this._runwayName = '';
        this.flightPlanRoute = '';
        this.flightPlanAltitude = '';
        this.legCollection = [];
        this.currentPhase = '';
    }

    /**
     * Add a new `LegModel` to the left side of the `legCollection`
     *
     * @for Fms
     * @method prependLeg
     * @param routeString
     */
    prependLeg(routeString) {
        const legModel = new LegModel(routeString, this._runwayName, this.currentPhase, this._navigationLibrary);

        this.legCollection.unshift(legModel);
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
        this._previousRouteSegments.push(this.currentLeg.routeString);

        if (!this.currentLeg.hasNextWaypoint()) {
            this._moveToNextLeg();
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

        this.flightPlanRoute = routeString;
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

        this._collectRouteStringsForLegsToBeDropped(legIndex);

        this.legCollection = _drop(this.legCollection, legIndex);
        this.currentLeg.skipToWaypointAtIndex(waypointIndex);
    }

    /**
     * Get the position of the next waypoint in the flightPlan.
     *
     * Currently only Used in `calculateTurnInitiaionDistance()` helper function
     *
     * @for Fms
     * @method getNextWaypointPosition
     * @return waypointPosition {array|null}
     */
    getNextWaypointPosition() {
        let waypointPosition;

        if (!this.hasNextWaypoint()) {
            return null;
        }

        waypointPosition = this.currentLeg.nextWaypoint.position;

        if (!this.currentLeg.hasNextWaypoint()) {
            waypointPosition = this.legCollection[1].currentWaypoint.position;
        }

        return waypointPosition;
    }

    /**
     * Find the departure procedure (if it exists) within the `#legCollection` and
     * reset it with a new departure procedure.
     *
     * This method does not remove any `LegModel`s. It instead finds and updates a
     * `LegModel` with a new routeString. If a `LegModel` without a departure
     * procedure cannot be found, then we create a new `LegModel` and place it
     * first in the `#legCollection`
     *
     * @for Fms
     * @method replaceDepartureProcedure
     * @param routeString {string}
     * @param departureRunway {string}
     */
    replaceDepartureProcedure(routeString, departureRunway) {
        // this is the same procedure that is already set, no need to continue
        if (this.hasLegWithRouteString(routeString)) {
            return;
        }

        const procedureLegIndex = this._findLegIndexForProcedureType(PROCEDURE_TYPE.SID);

        this._replaceLegAtIndexWithRouteString(procedureLegIndex, routeString);
    }

    /**
     *
     *
     * @for Fms
     * @method replaceArrivalProcedure
     * @param routeString {string}
     * @param arrivalRunway {string}
     */
    replaceArrivalProcedure(routeString, arrivalRunway) {
        // this is the same procedure that is already set, no need to continue
        if (this.hasLegWithRouteString(routeString)) {
            return;
        }

        const procedureLegIndex = this._findLegIndexForProcedureType(PROCEDURE_TYPE.STAR);

        this._replaceLegAtIndexWithRouteString(procedureLegIndex, routeString);
    }

    /**
     *
     *
     */
    isValidProcedureRoute(routeModel, runway, flightPhase) {
        if (this.hasLegWithRouteString(routeModel.routeCode)) {
            return true;
        }

        if (flightPhase === FLIGHT_CATEGORY.ARRIVAL) {
            const routeWaypoints = this._navigationLibrary.starCollection.findRouteWaypointsForRouteByEntryAndExit(
                routeModel.procedure,
                routeModel.entry,
                runway
            );

            return typeof routeWaypoints !== 'undefined';
        }

        const routeWaypoints = this._navigationLibrary.sidCollection.findRouteWaypointsForRouteByEntryAndExit(
            routeModel.procedure,
            runway,
            routeModel.exit
        );

        return typeof routeWaypoints !== 'undefined';
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
     *
     *
     */
    hasLegWithRouteString(routeString) {
        const previousProcedureLeg = this._findLegByRouteString(routeString);

        return typeof previousProcedureLeg !== 'undefined';
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
     * @return {}
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
     * @return {}
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
     * @return
     */
    findRandomExitPointForSidProcedureId(procedureId) {
        return this._navigationLibrary.sidCollection.findRandomExitPointForSIDIcao(procedureId);
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
            (routeSegment) => this._buildLegModelFromRouteSegment(routeSegment));

        return legsForRoute;
    }

    /**
     *
     *
     * @for Fms
     * @method _buildLegModelFromRouteSegment
     * @param routeSegment {string}  a segment of a `routeString`
     */
    _buildLegModelFromRouteSegment(routeSegment) {
        return new LegModel(routeSegment, this._runwayName, this.currentPhase, this._navigationLibrary);
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
        let waypointIndex = -1;

        for (legIndex = 0; legIndex < this.legCollection.length; legIndex++) {
            const legModel = this.legCollection[legIndex];
            waypointIndex = _findIndex(legModel.waypointCollection, { name: waypointName.toLowerCase() });

            if (waypointIndex !== -1) {
                break;
            }
        }

        return {
            legIndex,
            waypointIndex
        };
    }

    /**
     *
     *
     */
    _findLegIndexForProcedureType(procedureType) {
        return _findIndex(this.legCollection, { _isProcedure: true, procedureType: procedureType });
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
     */
    _findLegByRouteString(routeString) {
        return _find(this.legCollection, { routeString: routeString.toLowerCase() });
    }

    /**
     *
     *
     */
    _replaceLegAtIndexWithRouteString(legIndex, routeString) {
        // a procedure does not exist in the flight plan, so we must create a new one
        if (legIndex === -1) {
            this.prependLeg(routeString);

            return;
        }

        const legModel = this.legCollection[legIndex];

        legModel.destroy();
        legModel.init(routeString, this._runwayName, this.currentPhase);
    }
}
