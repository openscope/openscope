import _map from 'lodash/map';
import RouteModel from '../../navigationLibrary/Route/RouteModel';

/**
 *
 *
 * @class LegModel
 */
export default class LegModel {
    constructor(routeSegment, runway, navigationLibrary) {
        this._navigationLibrary = navigationLibrary;
        this._runway = runway;
        this._isProcedureRoute = RouteModel.isProcedureRouteString(routeSegment);
        this.waypointCollection = [];


        this.init(routeSegment);
    }

    get currentWaypoint() {
        return this.waypointCollection[0];
    }

    /**
     *
     *
     * @for LegModel
     * @method init
     * @param routeSegment
     */
    init(routeSegment) {
        this.waypointCollection = this._buildWaypointCollection(routeSegment);
    }

    /**
     *
     *
     * @for LegModel
     * @method destroy
     */
    destroy() {
        this._navigationLibrary = null;
        this._runway = '';
        this._isProcedureRoute = false;
        this.waypointCollection = [];
    }

    /**
     *
     *
     * @for LegModel
     * @method _buildWaypointCollection
     * @param routeSegment {string}
     * @private
     */
    _buildWaypointCollection(routeSegment) {
        if (!this._isProcedureRoute) {
            return this._buildWaypointForDirectRoute(routeSegment);
        }

        return this._buildWaypointCollectionForProcedureRoute(routeSegment);
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
    _buildWaypointCollectionForProcedureRoute(procedureRouteSegment) {
        // TODO: this logic should live in the _navigationLibrary. send it the procedureRouteSegment
        // and the runway and accept a list of FixModels or StandardRouteWaypointModels in return.
        const routeModel = new RouteModel(procedureRouteSegment);
        // TODO: use spawnPattern.category for this
        const sidOrStarCollectionName = this._navigationLibrary.getRouteTypeForProcedureName(routeModel.procedure);
        const procedureRouteCollection = this._navigationLibrary[sidOrStarCollectionName];

        let standardRouteWaypointModelList;
        if (sidOrStarCollectionName === '_sidCollection') {
            standardRouteWaypointModelList = procedureRouteCollection.generateFmsWaypointModelsForRoute(
                routeModel.procedure,
                this._runway,
                routeModel.exit
            );
        } else {
            standardRouteWaypointModelList = procedureRouteCollection.generateFmsWaypointModelsForRoute(
                routeModel.procedure,
                routeModel.entry,
                this._runway
            );
        }

        return standardRouteWaypointModelList;
    }
}
