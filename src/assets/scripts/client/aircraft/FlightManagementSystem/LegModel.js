import RouteModel from '../../navigationLibrary/Route/RouteModel';

/**
 *
 *
 */
export default class LegModel {
    constructor(routeSegment, runway, navigationLibrary) {
        this._navigationLibrary = navigationLibrary;
        this._runway = runway;
        this._isProcedureRoute = RouteModel.isProcedureRouteString(routeSegment);
        this.waypointCollection = [];


        this.init(routeSegment);
    }

    /**
     *
     *
     */
    init(routeSegment) {
        this.waypointCollection = this._buildWaypointCollection(routeSegment);
    }

    /**
     *
     *
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
     */
    _buildWaypointForDirectRoute(directRouteSegment) {
        const fixModel = this._navigationLibrary.findFixByName(directRouteSegment);

        return fixModel;
    }

    /**
     *
     *
     */
    _buildWaypointCollectionForProcedureRoute(procedureRouteSegment) {
        // TODO: this logic should really live in the _navigationLibrary. send it the procedureRouteSegment
        // and the runway and accept a list of FixModels or StandardRouteWaypointModels in return.
        const routeModel = new RouteModel(procedureRouteSegment);
        const sidOrStarCollectionName = this._navigationLibrary.getRouteTypeForProcedureName(routeModel.procedure);
        const procedureRouteCollection = this._navigationLibrary[sidOrStarCollectionName];

        let standardRouteWaypointModelList;
        if (sidOrStarCollectionName === '_sidCollection') {
            standardRouteWaypointModelList = procedureRouteCollection.findFixModelsForRouteByEntryAndExit(
                routeModel.procedure,
                this._runway,
                routeModel.exit
            );
        } else {
            standardRouteWaypointModelList = procedureRouteCollection.findFixModelsForRouteByEntryAndExit(
                routeModel.procedure,
                routeModel.entry,
                this._runway
            );
        }

        return standardRouteWaypointModelList;
    }
}
