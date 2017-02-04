import RouteModel from '../../navigationLibrary/Route/RouteModel';

/**
 *
 *
 * @class LegModel
 */
export default class LegModel {
    constructor(routeSegment, runway, category, navigationLibrary) {
        this._navigationLibrary = navigationLibrary;
        this._isProcedure = RouteModel.isProcedureRouteString(routeSegment);
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
     * @for LegModel
     * @method init
     * @param routeSegment
     * @param runway
     */
    init(routeSegment, runway, category) {
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
        this.waypointCollection = [];
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
