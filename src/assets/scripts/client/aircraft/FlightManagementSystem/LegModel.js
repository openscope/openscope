import _drop from 'lodash/drop';
import RouteModel from '../../navigationLibrary/Route/RouteModel';

/**
 * A section of a flight plan containing one to many `WaypointModel` objects.
 *
 * Instantiated from a `routeString`
 *
 * A `LegModel` represents each section of a flight plan:
 * - single `WaypointModel` not included in a standard procedure and without restrictions
 * - single `WaypointModel` assigned to hold at, which can be a navaid or a position array
 * - standard procedure (sid/star/airway), which may contain many `WaypointModel` objects,
 *   each of which may specify altitude and/or speed restrictions.
 *
 * @class LegModel
 */
export default class LegModel {
    /**
     * @constructor
     * @for LegModel
     * @param routeSegment {string}
     * @param runway {string}
     * @param category {string}
     * @param navigationLibrary {NavigationLibrary}
     */
    constructor(routeSegment, runway, category, navigationLibrary) {
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
         *
         *
         * @property _isProcedure
         * @type {boolean}
         * @private
         */
        this._isProcedure = false;

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
         * @propert waypointCollection
         * @type {array}
         * @default []
         */
        this.waypointCollection = [];

        this.init(routeSegment, runway, category);
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
     * @param routeSegment
     * @param runway
     */
    init(routeSegment, runway, category) {
        this._isProcedure = RouteModel.isProcedureRouteString(routeSegment);
        this.routeString = routeSegment.toLowerCase();
        this.waypointCollection = this._buildWaypointCollection(routeSegment, runway, category);
    }

    /**
     * Reset the model's instance properties
     *
     * @for LegModel
     * @method destroy
     */
    destroy() {
        this._destroyWaypointCollection();

        this._navigationLibrary = null;
        this._isProcedure = false;
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
     * @private
     */
    _buildWaypointCollection(routeSegment, runway, category) {
        if (!this._isProcedure) {
            return this._buildWaypointForDirectRoute(routeSegment);
        }

        return this._buildWaypointCollectionForProcedureRoute(routeSegment, runway, category);
    }

    /**
     * Given a directRouteSegment, generate a `WaypointModel`.
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
     * Given a procedureRouteSegment, find the `StandardRouteWaypointModels` for the
     * route and generate `WaypointModel`s that can be consumed by the Fms.
     *
     * @for LegModel
     * @method _buildWaypointCollectionForProcedureRoute
     * @param procedureRouteSegment {string}
     * @return {array<WaypointModel>}
     * @private
     */
    _buildWaypointCollectionForProcedureRoute(procedureRouteSegment, runway, category) {
        return this._navigationLibrary.buildWaypointModelsForProcedure(procedureRouteSegment, runway, category);
    }
}
