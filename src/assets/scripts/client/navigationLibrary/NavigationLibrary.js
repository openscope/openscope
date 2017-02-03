import PositionModel from '../base/PositionModel';
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
     *
     *
     */
    getRouteTypeForProcedureName(procedureName) {
        // TODO: the returning of string is not ok and will change as we iterate
        if (!this._sidCollection.hasRoute(procedureName) && !this._starCollection.hasRoute(procedureName)) {
            throw new Error(`Invalid procedureName. ${procedureName} was not found in the SidCollection or the StarCollection`);
        }

        if (this._sidCollection.hasRoute(procedureName)) {
            return '_sidCollection';
        }

        return '_starCollection';
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
     *
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
     *
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
}
