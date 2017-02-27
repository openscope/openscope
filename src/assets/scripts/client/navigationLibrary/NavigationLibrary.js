import _isNil from 'lodash/isNil';
import PositionModel from '../base/PositionModel';
import RouteModel from './Route/RouteModel';
import FixCollection from './Fix/FixCollection';
import StandardRouteCollection from './StandardRoute/StandardRouteCollection';

/**
 *
 *
 * @class NavigationLibrary
 */
export default class NavigationLibrary {
    /**
     * @constructor
     * @for NavigationLibrary
     * @param airportJson {object}
     */
    constructor(airportJson) {
        /**
         *
         *
         * @property _referencePosition
         * @type {PositionModel}
         * @default null
         */
        this._referencePosition = null;

        /**
         *
         *
         * @property _sidCollection
         * @type {StandardRoute}
         * @default null
         */
        this._sidCollection = null;

        /**
         *
         *
         * @property _starCollection
         * @type {StandardRoute}
         * @default null
         */
        this._starCollection = null;

        this.init(airportJson);
    }

    /**
     *
     * @property realFixes
     * @return {array<FixModel>}
     */
    get realFixes() {
        return FixCollection.findRealFixes();
    }

    /**
     *
     * @property sidLines
     * @return
     */
    get sidLines() {
        return this._sidCollection.draw;
    }

    /**
     *
     * @property sidCollection
     * @return
     */
    get sidCollection() {
        return this._sidCollection;
    }

    /**
     *
     * @property starCollection
     * @return
     */
    get starCollection() {
        return this._starCollection;
    }

    /**
     * Set initial class properties
     *
     * May be run multiple times on an instance. Subsequent calls to this method
     * should happen only after a call to `.reset()`
     *
     * @for NavigationLibrary
     * @method init
     */
    init(airportJson) {
        const { fixes, sids, stars } = airportJson;

        this._referencePosition = new PositionModel(airportJson.position, null, airportJson.magnetic_north);

        FixCollection.addItems(fixes, this._referencePosition);
        this._sidCollection = new StandardRouteCollection(sids);
        this._starCollection = new StandardRouteCollection(stars);
    }

    /**
     * Tear down the instance
     *
     * @for NavigationLibrary
     * @method reset
     */
    reset() {
        FixCollection.removeItems();

        this._referencePosition = null;
        this._sidCollection = null;
        this._starCollection = null;
    }

    /**
     * Provides a way to check the `FixCollection` for the existence
     * of a specific `fixName`.
     *
     * @for NavigationLibrary
     * @method hasFix
     * @param fixName {string}
     * @return {boolean}
     */
    hasFix(fixName) {
        const fixOrNull = this.findFixByName(fixName);

        return !_isNil(fixOrNull);
    }

    /**
     * Fascade Method
     *
     * @for NavigationLibrary
     * @method findFixByName
     * @param fixName {string}
     * @return {FixModel|undefined}
     */
    findFixByName(fixName) {
        return FixCollection.findFixByName(fixName);
    }

    /**
     * Fascade Method
     *
     * @for NavigationLibrary
     * @Method getFixPositionCoordinates
     * @param fixName {string}
     * @return {array<number>}
     */
    getFixPositionCoordinates(fixName) {
        return FixCollection.getFixPositionCoordinates(fixName);
    }

    /**
     * Find the `StandardRouteWaypointModel` objects for a given route.
     *
     * @for NavigationLibrary
     * @method findWaypointModelsForSid
     * @param id {string}
     * @param runway {string}
     * @param exit {string}
     * @return {array<StandardWaypointModel>}
     */
    findWaypointModelsForSid(id, runway, exit) {
        return this._sidCollection.findRouteWaypointsForRouteByEntryAndExit(id, runway, exit);
    }

    /**
     * Find the `StandardRouteWaypointModel` objects for a given route.
     *
     * @for NavigationLibrary
     * @method findWaypointModelsForStar
     * @param id {string}
     * @param entry {string}
     * @param runway {string}
     * @param isPreSpawn {boolean} flag used to determine if distances between waypoints should be calculated
     * @return {array<StandardWaypointModel>}
     */
    findWaypointModelsForStar(id, entry, runway, isPreSpawn = false) {
        return this._starCollection.findRouteWaypointsForRouteByEntryAndExit(id, entry, runway, isPreSpawn);
    }

    /**
     * Fascade Method
     *
     * @for NavigationLibrary
     * @method findEntryAndBodyFixesForRoute
     * @param routeName {string}
     * @param entryFixName {string}
     * @return {array<StandardRouteWaypointModel>}
     */
    findEntryAndBodyFixesForRoute(routeName, entryFixName) {
        return this._starCollection.findEntryAndBodyFixesForRoute(routeName, entryFixName);
    }

    /**
     * Finds the collectionName a given `procedureId` belongs to.
     *
     * This is useful when trying to find a particular route without
     * knowing, first, what collection it may be a part of. Like when
     * validating a user entered route.
     *
     * @for NavigationLibrary
     * @method findCollectionNameForProcedureId
     * @param procedureId {string}
     * @return collectionName {string}
     */
    findCollectionNameForProcedureId(procedureId) {
        let collectionName = '';

        if (this._sidCollection.hasRoute(procedureId)) {
            collectionName = 'sidCollection';
        } else if (this._starCollection.hasRoute(procedureId)) {
            collectionName = 'starCollection';
        }

        return collectionName;
    }

    /**
     * Given a `procedureRouteSegment`, find and assemble a list
     * of `WaypointModel` objects to be used with a `LegModel`
     * in the Fms.
     *
     * @for NavigationLibrary
     * @method buildWaypointModelsForProcedure
     * @param procedureRouteSegment {string}  of the shape `ENTRY.PROCEDURE_NAME.EXIT`
     * @param runway {string}                 assigned runway
     * @param category {string}               arrival or departure
     * @return {array<WaypointModel>}
     */
    buildWaypointModelsForProcedure(procedureRouteSegment, runway, category) {
        const routeModel = new RouteModel(procedureRouteSegment);
        let standardRouteWaypointModelList;

        if (category === 'departure') {
            standardRouteWaypointModelList = this._sidCollection.generateFmsWaypointModelsForRoute(
                routeModel.procedure,
                runway,
                routeModel.exit
            );
        } else {
            standardRouteWaypointModelList = this._starCollection.generateFmsWaypointModelsForRoute(
                routeModel.procedure,
                routeModel.entry,
                runway
            );
        }

        return standardRouteWaypointModelList;
    }
}
