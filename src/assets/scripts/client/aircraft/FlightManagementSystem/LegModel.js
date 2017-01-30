import RouteModel from '../../navigationLibrary/Route/RouteModel';

/**
 *
 *
 */
export default class LegModel {
    constructor(routeSegment, runway, navigationLibrary) {
        this._navigationLibrary = navigationLibrary;
        this._runway = runway;
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
        this.waypointCollection = [];
    }

    /**
     *
     *
     */
    _buildWaypointCollection(routeSegment) {
        if (!RouteModel.isProcedureRouteString(routeSegment)) {
            return this._buildWaypointForDirectRoute(routeSegment);
        }

        return this._buildWaypointCollectionForProcedureRoute(routeSegment);
    }

    /**
     *
     *
     */
    _buildWaypointForDirectRoute(directRouteSegment) {
        console.log('isWaypoint', directRouteSegment);
        const fixModel = this._navigationLibrary.findFixByName(directRouteSegment);

        // create waypoint from FixModel with FixModel. something like:
        // return fixModel.generateFmsWaypoint();
    }

    /**
     *
     *
     */
    _buildWaypointCollectionForProcedureRoute(procedureRouteSegment) {
        console.log('ProcedureRoute', procedureRouteSegment);
        // TODO: this logic should really live in the _navigationLibrary. send it the procedureRouteSegment
        // and the runway and accept a list of FixModels or StandardRouteWaypointModels in return.
        const routeModel = new RouteModel(procedureRouteSegment);
        const sidOrStarCollectionName = this._navigationLibrary.getRouteTypeForProcedureName(routeModel.procedure);
        const procedureRouteCollection = this._navigationLibrary[sidOrStarCollectionName];

        let fixModelsForProcedure;
        if (sidOrStarCollectionName === '_sidCollection') {
            fixModelsForProcedure = procedureRouteCollection.findFixModelsForRouteByEntryAndExit(
                routeModel.procedure,
                this._runway,
                routeModel.exit
            );
        } else {
            fixModelsForProcedure = procedureRouteCollection.findFixModelsForRouteByEntryAndExit(
                routeModel.procedure,
                routeModel.entry,
                this._runway
            );
        }


        // console.log(fixModelsForProcedure);
    }
}
