import _drop from 'lodash/drop';
import _map from 'lodash/map';
import _without from 'lodash/without';
import RouteModel from '../../navigationLibrary/Route/RouteModel';
import WaypointModel from './WaypointModel';
import { extractFixnameFromHoldSegment } from '../../navigationLibrary/Route/routeStringFormatHelper';
import {
    FLIGHT_PHASE,
    PROCEDURE_TYPE
} from '../../constants/aircraftConstants';

/**
 * A section of a flight plan containing one to many `WaypointModel` objects.
 *
 * Instantiated from a `routeSegment`
 *
 * A `LegModel` represents each section of a flight plan:
 * - single `WaypointModel` will be built from a `routeSegment` not included in a standard
 *                          procedure and without restrictions
 * - single `WaypointModel` assigned to hold at, which can be a navaid or a position array
 * - standard procedure     (sid/star/airway), which may contain many `WaypointModel` objects,
 *                          each of which may specify altitude and/or speed restrictions.
 *
 * RouteSegment Examples:
 *  - directRouteSegment: 'COWBY'
 *  - holdRouteSegment: '@COWBY'
 *  - procedureRouteSegment: 'KLAS.COWBY6.DRK'
 *
 * @class LegModel
 */
export default class LegModel {
    /**
     * @constructor
     * @for LegModel
     * @param routeSegment {string}
     * @param runway {string}
     * @param flightPhase {string}
     * @param navigationLibrary {NavigationLibrary}
     * @param holdWaypointProps {object}
     */
    constructor(routeSegment, runway, flightPhase, navigationLibrary, holdWaypointProps = {}) {
        /**
         * NavigationLibrary instance
         *
         * @property _navigationLibrary
         * @type {NavigationLibrary}
         * @default navigationLibrary
         * @private
         */
        this._navigationLibrary = navigationLibrary;

        /**
         * Provide easy access to the parts of a procedureRouteString,
         * when a leg is a procedure
         *
         * @property _procedureRouteModel
         * @type {RouteModel|null}
         * @default null
         */
        this._procedureRouteModel = null;

        /**
         * Indicates the leg is for a standardRoute procedure
         *
         * @property isProcedure
         * @type {boolean}
         * @private
         */
        this.isProcedure = false;

        /**
         * Indicates the leg is for a holding pattern
         *
         * This property should only be used internally for easier
         * switching on routeStrings.
         *
         * The `WaypointModel` also has an `#isHold` property
         * that should be used to determine if a waypoint is
         * for a holding pattern.
         *
         * @property _isHold
         * @type {boolean}
         * @private
         */
        this._isHold = false;

        /**
         * When a leg is a procedure, this property describes what type of procedure
         *
         * @type {PROCEDURE_TYPE}
         * @default ''
         */
        this.procedureType = '';

        /**
         * String representation of the current routeSegment.
         *
         * A directRoute contains a single WaypointModel and is separated
         * by `..` in the routeString. In this example there are two directRoute
         * segments, thus this routeString will result in two LegModels:
         * - `FIXA..COWBY`
         *
         * A procedureRoute contains many `WaypointModel` objects and describes
         * a standardRoute (sid/star/airway). procedureRoutes are separated by
         * a single '.':
         * - `DAG.KEPEC3.KLAS`
         *
         * @for LegModel
         * @property routeString
         * @type {string}
         */
        this.routeString = '';

        /**
         * List of `WaypointModel` objects defined within a `LegModel`.
         *
         * If this leg represents a `directRoute`, there will only be one
         * `WaypointModel` contained in `#waypointCollection`.
         *
         * @propert waypointCollection
         * @type {array}
         * @default []
         */
        this.waypointCollection = [];

        this.init(routeSegment, runway, flightPhase, holdWaypointProps);
    }

    /**
     * Return the name of the procedure if this is a procedure leg
     *
     * @property procedureName
     * @type {string}
     * @return {string}
     */
    get procedureName() {
        if (!this.isProcedure) {
            return null;
        }

        return this._procedureRouteModel.procedure;
    }

    /**
     * Return the name of the procedure exit (airport) if this is a procedure leg
     *
     * This is used only for arrival routes and only within the `AircraftStripView`
     *
     * @property exitName
     * @type {string}
     * @return {string}
     */
    get exitName() {
        if (!this.isProcedure) {
            return null;
        }

        return this._procedureRouteModel.exit;
    }

    /**
     * Return the name and exit of the procedure if this is a procedure leg
     *
     * Will return a string in an abbreviated procedureRouteString format.
     *
     * This should only be used for the view, like the `AircraftStripView`, because
     * the output will not be valid for anything that works with a routeString
     *
     * @property procedureAndExitName
     * @type {string}
     * @return {string}
     */
    get procedureAndExitName() {
        if (!this.isProcedure) {
            return null;
        }

        return `${this._procedureRouteModel.procedure}.${this._procedureRouteModel.exit}`;
    }

    /**
     * The active `WaypointModel`.
     *
     * Assumed to always be the first item in
     * the `#waypointCollection`
     *
     * @property currentWaypoint
     * @return {WaypointModel}
     */
    get currentWaypoint() {
        return this.waypointCollection[0];
    }

    /**
     * The `WaypointModel` immediately following the `#currentWaypoint`
     * in the flightPlan
     *
     * Used when calculating headings to the next waypoint.
     *
     * @property nextWaypoint
     * @return {WaypointModel}
     */
    get nextWaypoint() {
        return this.waypointCollection[1];
    }

    /**
     * Instantiate the class properties
     *
     * @for LegModel
     * @method init
     * @param routeSegment {string}
     * @param runway {string}
     * @param holdWaypointProps {object}
     */
    init(routeSegment, runway, flightPhase, holdWaypointProps) {
        this.isProcedure = RouteModel.isProcedureRouteString(routeSegment);
        // TODO: replace with constant
        this._isHold = RouteModel.isHoldRouteString(routeSegment) || routeSegment === 'GPS';

        this.routeString = routeSegment.toLowerCase();
        this._procedureRouteModel = this._buildProcedureRouteModel(routeSegment);
        this.procedureType = this._buildProcedureType(flightPhase);
        this.waypointCollection = this._buildWaypointCollection(routeSegment, runway, flightPhase, holdWaypointProps);
    }

    /**
     * Reset the model's instance properties
     *
     * @for LegModel
     * @method destroy
     */
    destroy() {
        this._destroyWaypointCollection();

        this.isProcedure = false;
        this._isHold = false;
        this.procedureType = '';
        this.routeString = '';
        this.waypointCollection = [];
    }

    /**
     * Given an index, drop the `WaypointModel`s before that index and make `waypointIndex`
     * the next `0` index of the array.
     *
     * This is useful for skipping to a specific waypoint in the flightPlan.
     *
     * @for LegModel
     * @method skipToWaypointAtIndex
     * @param waypointIndex {number}
     */
    skipToWaypointAtIndex(waypointIndex) {
        this.waypointCollection = _drop(this.waypointCollection, waypointIndex);
    }

    /**
     * Destroy the current `WaypointModel` and remove it from the
     * `waypointCollection`.
     *
     * This puts the item that previously occupied the `1` index now
     * at `0` making it the `currentWaypoint`.
     *
     * @for LegModel
     * @method moveToNextWaypoint
     */
    moveToNextWaypoint() {
        this.currentWaypoint.destroy();
        // this is mutable
        this.waypointCollection.shift();
    }

    /**
     * Find if a Waypoint exists within `#waypointCollection`
     *
     * @for LegModel
     * @method hasWaypoint
     * @param waypointName {string}
     * @return {boolean}
     */
    hasWaypoint(waypointName) {
        // using a for loop here instead of `_find()` because this operation could happen a lot. a for
        // loop is going to be faster than `_find()` in most cases.
        for (let i = 0; i < this.waypointCollection.length; i++) {
            const waypoint = this.waypointCollection[i];

            if (waypointName.toLowerCase() === waypoint.name) {
                return true;
            }
        }

        return false;
    }

    /**
     * Collects the `#altitudeMaximum` value from each waypoint
     * in the `#waypointCollection`, then finds the highest value
     *
     * @for LegModel
     * @method getProcedureTopAltitude
     * @return {number}
     */
    getProcedureTopAltitude() {
        const isMaximum = true;

        if (!this.isProcedure) {
            return -1;
        }

        return this._findMinOrMaxAltitudeInProcedure(isMaximum);
    }

    /**
     * Collects the `#altitudeMinimum` value from each waypoint
     * in the `#waypointCollection`, then finds the lowest value
     *
     * @for LegModel
     * @method getProcedureBottomAltitude
     * @return {number}
     */
    getProcedureBottomAltitude() {
        const isMaximum = false;

        if (!this.isProcedure) {
            return -1;
        }

        return this._findMinOrMaxAltitudeInProcedure(isMaximum);
    }

    /**
     * Encapsulation of boolean logic used to determine if it is possible
     * to move to a next waypoint.
     *
     * This is used when preparing to move to the next waypoint in the flight plan
     *
     * @for LegModel
     * @method hasNextWaypoint
     * @return {boolean}
     */
    hasNextWaypoint() {
        return this.waypointCollection.length > 1;
    }

    /**
     * Loop through each `WaypointModel` and call `.destroy()`
     *
     * This clears destroys each `WaypointModel` contained in the collection.
     *
     * TODO: implement object pooling with `WaypointModel`, this is the method
     *       where the `WaypointModel` is returned to the pool
     *
     * @for Fms
     * @method _destroyWaypointCollection
     * @private
     */
    _destroyWaypointCollection() {
        for (let i = 0; i < this.waypointCollection.length; i++) {
            const waypointModel = this.waypointCollection[i];

            waypointModel.destroy();
        }
    }

    /**
     * Create the intial `#waypointCollection` from a `routeSegment`
     *
     * Should run only on instantiation
     *
     * @for LegModel
     * @method _buildWaypointCollection
     * @param routeSegment {string}
     * @param runway {string}
     * @param flightPhase {string}
     * @param holdWaypointProps {object}
     * @private
     */
    _buildWaypointCollection(routeSegment, runway, flightPhase, holdWaypointProps) {
        if (this.isProcedure) {
            return this._buildWaypointCollectionForProcedureRoute(routeSegment, runway, flightPhase);
        } else if (this._isHold) {
            return this._buildWaypointForHoldingPattern(routeSegment, holdWaypointProps);
        }

        return this._buildWaypointForDirectRoute(routeSegment);
    }

    /**
     * Given a `directRouteSegment`, generate a `WaypointModel`.
     *
     * Returns an array eventhough there will only ever by one WaypointModel
     * for a directRouteSegment. This is because the `#waypointCollection` is
     * always assumed to be an array and the result of this method is used to
     * set `#waypointCollection`.
     *
     * @for LegModel
     * @method _buildWaypointForDirectRoute
     * @param directRouteSegment {string}
     * @return {array<WaypointModel>}
     * @private
     */
    _buildWaypointForDirectRoute(directRouteSegment) {
        const fixModel = this._navigationLibrary.findFixByName(directRouteSegment);

        return [
            fixModel.toWaypointModel()
        ];
    }

    /**
     * Given an `holdRouteSegment`, generate a `WaypointModel`.
     *
     * Returns an array eventhough there will only ever by one WaypointModel
     * for a directRouteSegment. This is because the `#waypointCollection` is
     * always assumed to be an array and the result of this method is used to
     * set `#waypointCollection`.
     *
     * @for LegModel
     * @method _buildWaypointForHoldingPattern
     * @param routeString {string}
     * @return {array<WaypointModel>}
     * @private
     */
    _buildWaypointForHoldingPattern(routeString, holdWaypointProps) {
        // TODO: replace with constant
        if (routeString === 'GPS') {
            return this._buildWaypointForHoldingPatternAtPosition(holdWaypointProps);
        }

        const isHold = true;
        const holdRouteSegment = extractFixnameFromHoldSegment(routeString);
        const fixModel = this._navigationLibrary.findFixByName(holdRouteSegment);

        if (!fixModel) {
            // TODO: Do something more helpful than this, that ends up telling the user their mistake
            return new Error(`Requested fix of '${holdRouteSegment}' could not be found!`);
        }

        return [
            fixModel.toWaypointModel(isHold, holdWaypointProps)
        ];
    }

    /**
     * Create a new `WaypointModel` for a holding pattern at a specific x/y position.
     *
     * @for LegModel
     * @method _buildWaypointForHoldingPatternAtPosition
     * @param holdWaypointProps {object}
     * @return {array<WaypointModel>}
     */
    _buildWaypointForHoldingPatternAtPosition(holdWaypointProps) {
        const waypointModel = new WaypointModel(holdWaypointProps);

        return [waypointModel];
    }

    /**
     * Given a procedureRouteSegment, find the `StandardRouteWaypointModels` for the
     * route and generate `WaypointModel`s that can be consumed by the Fms.
     *
     * @for LegModel
     * @method _buildWaypointCollectionForProcedureRoute
     * @param procedureRouteSegment {string}
     * @return {array<WaypointModel>}
     * @private
     */
    _buildWaypointCollectionForProcedureRoute(procedureRouteSegment, runway, flightPhase) {
        return this._navigationLibrary.buildWaypointModelsForProcedure(procedureRouteSegment, runway, flightPhase);
    }

    /**
     * Create a `RouteModel` for a procedureRouteString.
     *
     * This allows for easy access to the various parts of a procedureRouteString.
     * Currently these parts are accessed via getters and are used for view logic,
     * namely the `AircraftStripView`.
     *
     * @for Fms
     * @method _buildProcedureRouteModel
     * @param routeSegment {string}  current leg in routeString format
     * @return {RouteModel|null}
     * @private
     */
    _buildProcedureRouteModel(routeSegment) {
        if (!this.isProcedure) {
            return null;
        }

        return new RouteModel(routeSegment);
    }

    /**
     * Returns a string representing a `procedureType` associated with
     * this `LegModel`, if the Leg is in fact a procedure.
     *
     * @for LegModel
     * @param flightPhase {string}
     * @return {string}
     */
    _buildProcedureType(flightPhase) {
        if (!this.isProcedure) {
            return '';
        }

        // TODO: As amended, the following is probably an unsafe assumption, and should be reexamined.
        let procedureType = PROCEDURE_TYPE.STAR;

        if (flightPhase === FLIGHT_PHASE.APRON) {
            procedureType = PROCEDURE_TYPE.SID;
        }

        return procedureType;
    }

    /**
     * Finds the minimum or maximum altitude restriction in the `#waypointCollection`
     *
     * @for LegModel
     * @method _findMinOrMaxAltitudeInProcedure
     * @param isMaximum {boolean}
     * @return {number}
     * @private
     */
    _findMinOrMaxAltitudeInProcedure(isMaximum = false) {
        if (isMaximum) {
            const maximumAltitudes = _map(this.waypointCollection, (waypoint) => waypoint.altitudeMaximum);

            return Math.max(...maximumAltitudes);
        }

        const minimumAltitudes = _map(this.waypointCollection, (waypoint) => waypoint.altitudeMinimum);
        // setting this value here so we run `_without`, which might not be performant, only when we need it
        const positiveValueRestrictionList = _without(minimumAltitudes, -1);

        return Math.min(...positiveValueRestrictionList);
    }
}
