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
     * @property drawSids
     * @return
     */
    get drawSids() {
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

    hasStarRoute(routeName) {
        return this._starCollection.hasRoute(routeName);
    }

    hasSidRoute(routeName) {
        return this._sidCollection.hasRoute(routeName);
    }

    findStarRouteByIcao(icao) {
        this._starCollection.findRouteByIcao(icao);
    }

    findSidRouteByIcao(icao) {
        this._sidCollection.findRouteByIcao(icao);
    }

    /**
     * Fascade Method
     *
     *
     */
    getFixPositionCoordinates(fixName) {
        return FixCollection.getFixPositionCoordinates(fixName);
    }

    /**
     * Fascade Method
     *
     *
     */
    findEntryAndBodyFixesForRoute(routeName, entryFixName) {
        return this._starCollection.findEntryAndBodyFixesForRoute(routeName, entryFixName);
    }
}
