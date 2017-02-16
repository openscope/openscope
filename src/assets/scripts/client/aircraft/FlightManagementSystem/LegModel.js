import _drop from 'lodash/drop';
import RouteModel from '../../navigationLibrary/Route/RouteModel';

/**
 *
 *
 * @class LegModel
 */
export default class LegModel {
    constructor(routeSegment, runway, category, navigationLibrary) {
        this._navigationLibrary = navigationLibrary;
        this._isProcedure = false;
        this.routeString = '';
        this.waypointCollection = [];

        this.init(routeSegment, runway, category);
    }

    /**
     *
     *
     * @property currentWaypoint
     * @return {WaypointModel}
     */
    get currentWaypoint() {
        return this.waypointCollection[0];
    }

    /**
     *
     *
     * @property nextWaypoint
     * @return {WaypointModel}
     */
    get nextWaypoint() {
        return this.waypointCollection[1];
    }

    /**
     *
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
     *
     *
     * @for LegModel
     * @method destroy
     */
    destroy() {
        this._navigationLibrary = null;
        this._isProcedure = false;
        this.routeString = '';
        this.waypointCollection = [];
    }

    /**
     *
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
     *
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
     *
     *
     * @for LegModel
     * @method _buildWaypointForDirectRoute
     * @param directRouteSegment {string}
     * @private
     */
    _buildWaypointForDirectRoute(directRouteSegment) {
        const fixModel = this._navigationLibrary.findFixByName(directRouteSegment);

        return [
            fixModel.toWaypointModel()
        ];
    }

    /**
     *
     *
     * @for LegModel
     * @method _buildWaypointCollectionForProcedureRoute
     * @param procedureRouteSegment {string}
     * @private
     */
    _buildWaypointCollectionForProcedureRoute(procedureRouteSegment, runway, category) {
        return this._navigationLibrary.buildWaypointModelsForProcedure(procedureRouteSegment, runway, category);
    }
}
