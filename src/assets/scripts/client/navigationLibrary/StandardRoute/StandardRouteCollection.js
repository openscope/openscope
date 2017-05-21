import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _isEmpty from 'lodash/isEmpty';
import _isNil from 'lodash/isNil';
import _map from 'lodash/map';
import _random from 'lodash/random';
import BaseCollection from '../../base/BaseCollection';
import StandardRouteModel from './StandardRouteModel';

/**
 * Accept `sids` or `stars` data from an airport json file and create a collection of model objects.
 *
 * Provides and interface to reason about a `StandardRoute`, defined as either a SID or STAR.
 * Creates a `StandardRouteModel` for each route defined in the StandardRoute.
 *
 * @class StandardRouteCollection
 */
export default class StandardRouteCollection extends BaseCollection {
    /**
     * @constructor
     * @param standardRouteEnum {object}
     */
    /* istanbul ignore next */
    constructor(standardRouteEnum) {
        super();

        if (typeof standardRouteEnum === 'undefined') {
            return;
        }

        /**
         * Current cache of found routes, organized by `ICAO.ENTRY.EXIT` strings
         *
         * By leveraging this cache, we are able to pre-find routes for verification,
         * but also store them so subsequent finds return from the cache.
         *
         * @property _cache
         * @type {Object}
         * @default {}
         */
        this._cache = {};

        return this._init(standardRouteEnum);
    }

    // TODO: refactor into a reusable class that can be fed an `item` and will be consumed by the `CanvasController`
    /**
     * Return an identifier and a list of fixes in the order in which they should be drawn.
     *
     * Pulled directly from an airport json `draw` definition per route.
     *
     * @property draw
     * @return {array}
     */
    get draw() {
        return _map(this._items, (item) => {
            const sidForCanvas = {};
            sidForCanvas.identifier = item.icao;

            if (!_isEmpty(item.draw)) {
                sidForCanvas.draw = item.draw;
            }

            return sidForCanvas;
        });
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for StandardRouteCollection
     * @method _init
     * @param standardRouteEnum {object}
     * @private
     */
    _init(standardRouteEnum) {
        this._addRouteListToCollection(standardRouteEnum);

        return this;
    }

    /**
     * Destroy the current instance
     *
     * @for StandardRouteCollection
     * @method destroy
     */
    destroy() {
        this._items = [];

        return this;
    }

    /**
     * Find a list of `StandardWaypointModel`s for a specific route
     *
     * Acts as a fascade for `_findOrAddRouteToCache`.
     *
     * @for StandardRouteCollection
     * @method findRouteWaypointsForRouteByEntryAndExit
     * @param icao {string}
     * @param entry {string}
     * @param exit {string}
     * @param isPreSpawn {boolean} flag used to determine if distances between waypoints should be calculated
     * @return {array<StandardRouteWaypointModel>}
     */
    findRouteWaypointsForRouteByEntryAndExit(icao, entry, exit, isPreSpawn) {
        if (!icao) {
            return;
        }

        return this._findOrAddRouteToCache(icao, entry, exit, isPreSpawn);
    }

    /**
     * Find a list of `StandardWaypointModel`s for a specific route
     *
     * @for StandardRouteCollection
     * @method findRouteWaypointsForRouteByEntryAndExit
     * @param icao {string}
     * @param entry {string}
     * @param exit {string}
     * @return {array<WaypointModel>}
     */
    generateFmsWaypointModelsForRoute(icao, entry, exit) {
        const isPreSpawn = false;
        const standardRouteWaypointModels = this.findRouteWaypointsForRouteByEntryAndExit(icao, entry, exit, isPreSpawn);
        const result = _map(standardRouteWaypointModels, (model) => model.toWaypointModel());

        return result;
    }

    /**
     * Find a random name of an `exitPoint` segment that exists within the collection.
     *
     * @deprecated
     * @for StandardRouteCollection
     * @method findRandomExitPointForSIDIcao
     * @param icao {string}
     * @return {string}
     */
    findRandomExitPointForSIDIcao(icao) {
        const sid = this.findRouteByIcao(icao);

        // if sid doesnt have any exit points it ends at fix for which the SID is named
        if (!sid.hasExitPoints()) {
            return sid.icao;
        }

        // if has exitPoints, return a randomly selected one from a list of exitFixNames
        const exitPointIcaos = sid.gatherExitPointNames();
        const maxIndex = exitPointIcaos.length - 1;
        const randomIndex = _random(0, maxIndex);

        return exitPointIcaos[randomIndex];
    }

    /**
     * Find a `StandardRouteModel` within the collection given an `icao`
     *
     * @for StandardRouteCollection
     * @method findRouteByIcao
     * @param icao {string}
     * @return {StandardRouteModel|undefined}
     */
    findRouteByIcao(icao) {
        return _find(this._items, { icao: icao.toUpperCase() });
    }

    /**
     * @for StandardRouteCollection
     * @method hasRoute
     * @param routeName {string}
     * @return {boolean}
     */
    hasRoute(routeName) {
        return !_isNil(this.findRouteByIcao(routeName));
    }

    /**
     * Add a list of sids to the collection
     *
     * @for StandardRouteCollection
     * @method _addRouteListToCollection
     * @param routeList {object}
     * @private
     */
    _addRouteListToCollection(routeList) {
        _forEach(routeList, (route) => {
            const routeModel = new StandardRouteModel(route);

            this._addRouteModelToCollection(routeModel);
        });

        return this;
    }

    /**
     * Add a `StandardRouteModel` to the collection and update length.
     *
     * @for StandardRouteCollection
     * @method _addRouteModelToCollection
     * @param routeModel {StandardRouteModel}
     * @private
     */
    _addRouteModelToCollection(routeModel) {
        if (!(routeModel instanceof StandardRouteModel)) {
            // eslint-disable-next-line max-len
            throw new TypeError(`Expected routeModel to be an instance of StandardRouteModel, instead received ${routeModel}`);
        }

        this._items.push(routeModel);

        return this;
    }

    /**
     * Find the requested route in `_cache` or find the route and add it t the cache
     *
     * Allows a route to be validated by first finding them and then adding it to the _cache.
     * Imprpves performance by not having to search for routes that have already been found.
     *
     * @for StandardRouteCollection
     * @method findRouteWaypointsForRouteByEntryAndExit
     * @param icao {string}
     * @param entry {string}
     * @param exit {string}
     * @param isPreSpawn {boolean} flag used to determine if distances between waypoints should be calculated
     * @return {array<StandardRouteWaypointModel>}
     */
    _findOrAddRouteToCache(icao, entry, exit, isPreSpawn) {
        const cacheKey = `${icao}.${entry}.${exit}`;

        if (!_isNil(this._cache[cacheKey]) && !isPreSpawn) {
            return this._cache[cacheKey];
        }

        const routeModel = this.findRouteByIcao(icao);

        if (typeof routeModel === 'undefined') {
            // TODO: there will need to be some feedback here but should still fail quietly
            return;
        }

        const routeWaypoints = routeModel.findStandardRouteWaypointModelsForEntryAndExit(entry, exit, isPreSpawn);
        this._cache[cacheKey] = routeWaypoints;

        return routeWaypoints;
    }
}
