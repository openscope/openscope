import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _has from 'lodash/has';
import _isEmpty from 'lodash/isEmpty';
import _isNil from 'lodash/isNil';
import _map from 'lodash/map';
import _pick from 'lodash/pick';
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
     *
     * @type {Object}
     */
    static ROUTE_TYPE = {
        SID: 'SID',
        STAR: 'STAR'
    };

    /**
     * @constructor
     * @param standardRouteEnum {object}
     * @param routeType {ROUTE_TYPE}
     */
    /* istanbul ignore next */
    constructor(standardRouteEnum, routeType) {
        super();

        if (typeof standardRouteEnum === 'undefined') {
            return;
        }

        if (!_has(StandardRouteCollection.ROUTE_TYPE, routeType)) {
            console.log(`Invalid ROUTE_TYPE passed to StandardRouteCollection. Expected one of ROUTE_TYPE but received: ${routeType}`);
            // throw new TypeError('Invalid ROUTE_TYPE passed to StandardRouteCollection. Expected one of ROUTE_TYPE but received: ${routeType}');
        }

        /**
         * Inherited from `BaseCollection`
         *
         * @property _items
         * @type {array}
         * @default []
         * @private
         */
        // this._items = [];

        /**
         * Inherited from `BaseCollection`
         *
         * @property length
         * @type {number}
         */
        // this.length = -1;

        /**
         *
         * @property _type
         * @type {ROUTE_TYPE}
         * @defafult ''
         * @private
         */
        this._type = routeType;

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
     * Finds a list of fixes for the entry and body segments of a given route
     *
     * Used primarily in the `SpawnPatterns` for calculating initial
     * heading of arriving aircraft
     *
     * @for StandardRouteCollection
     * @method findEntryAndBodyFixesForRoute
     * @param icao {string}
     * @param entryFixName {string}
     * @return {array}
     */
    findEntryAndBodyFixesForRoute(icao, entryFixName) {
        if (!icao) {
            return;
        }

        const route = this.findRouteByIcao(icao);

        return route.findFixesAndRestrictionsForEntryAndBody(entryFixName);
    }

    /**
     * Find a list of `StandardWaypointModel`s for a specific route
     *
     * Acts as a fascade for `_findRouteOrAddToCache`.
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

        return this._findRouteOrAddToCache(icao, entry, exit, isPreSpawn);
    }

    /**
     * Find a list of `StandardWaypointModel`s for a specific route
     *
     * @for StandardRouteCollection
     * @method generateFmsWaypointModelsForRoute
     * @param icao {string}
     * @param entry {string}
     * @param exit {string}
     * @return {array<WaypointModel>}
     */
    generateFmsWaypointModelsForRoute(icao, entry, exit) {
        const isPreSpawn = false;
        const standardRouteWaypointModels = this.findRouteWaypointsForRouteByEntryAndExit(
            icao,
            entry,
            exit,
            isPreSpawn
        );
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
     * @return {StandardRouteModel|null}
     */
    findRouteByIcao(icao = '') {
        // TODO: return the `_find()`
        let routeWithIcao = _find(this._items, { icao: icao.toUpperCase() });

        // if (_isNil(routeWithIcao)) {
        //     console.log('YESSSS');
        //     routeWithIcao = this.findRouteByIcaoWithSuffix(icao);
        // }

        return routeWithIcao;
    }

    // FIXME: deprecate
    // /**
    //  * Attempt to find a `StandardRouteModel` by an icao
    //  * that also contains a suffix
    //  *
    //  * @for StandardRouteCollection
    //  * @method findRouteByIcaoWithSuffix
    //  * @param icao {string}
    //  * @return {StandardRouteModel|null}
    //  */
    // findRouteByIcaoWithSuffix(icao = '') {
    //     for (let i = 0; i < this.length; i++) {
    //         const routeModel = this._items[i];
    //
    //         if (routeModel.hasSuffix(icao.toUpperCase())) {
    //             return routeModel;
    //         }
    //     }
    //
    //     return null;
    // }

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
            this._generateSuffixRouteModels(route);
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
     * Create additional `StandardRouteModel` objects for each suffix defined for a route
     *
     * This gives us access to a `StandardRouteModel` for each suffix and allows us
     * to use existing apis to work with each model.
     *
     * @for StandardRouteCollection
     * @method _generateSuffixRouteModels
     * @param route {object}
     */
    _generateSuffixRouteModels(route) {
        if (!_has(route, 'suffix')) {
            return;
        }

        _forEach(route.suffix, (suffix, key) => {
            // const suffixRouteProps = Object.assign(
            //     {},
            //     route,
            //     {
            //         icao: `${route.icao}${suffix}`,
            //         rwy: _pick(route.rwy, key),
            //         suffix: _pick(route.suffix, key)
            //     }
            // );
            const suffixRouteModel = new StandardRouteModel(route, key);
            // const suffixRouteModel = new StandardRouteModel(suffixRouteProps);

            this._addRouteModelToCollection(suffixRouteModel);
        });
    }

    /**
     * Find the requested route in `_cache` or find the route and add it t the cache
     *
     * Allows a route to be validated by first finding them and then adding it to the _cache.
     * Imprpves performance by not having to search for routes that have already been found.
     *
     * @for StandardRouteCollection
     * @method _findRouteOrAddToCache
     * @param icao {string}
     * @param entry {string}
     * @param exit {string}
     * @param isPreSpawn {boolean} flag used to determine if distances between waypoints should be calculated
     * @return {array<StandardRouteWaypointModel>}
     */
    _findRouteOrAddToCache(icao, entry, exit, isPreSpawn) {
        const cacheKey = this._generateCacheKey(icao, entry, exit);

        if (!_isNil(this._cache[cacheKey]) && !isPreSpawn) {
            return this._cache[cacheKey];
        }

        return this._findRouteWaypointModels(icao, entry, exit, isPreSpawn, cacheKey);
    }

    /**
     * Find a list of `StandardRouteWaypointModel` objects for a given route
     *
     * This method should only be it if the requested route doesn't already
     * exist in `#_cache`
     *
     * A route should only ever be searched for once, subsequent searches
     * should be returned from `#_cache`
     *
     * @for StandardRouteCollection
     * @method _findRouteWaypointModels
     * @param icao {string}
     * @param entry {string}
     * @param exit {string}
     * @param isPreSpawn {boolean} flag used to determine if distances between waypoints should be calculated
     * @param cacheKey {string}    the key used to store the found route in `#_cache`
     * @return {function|array<StandardRouteWaypointModel>}
     */
    _findRouteWaypointModels(icao, entry, exit, isPreSpawn, cacheKey) {
        const uppercaseIcao = icao.toUpperCase();
        const routeModel = this.findRouteByIcao(uppercaseIcao);

        if (typeof routeModel === 'undefined') {
            // TODO: there will need to be some feedback here but should still fail quietly
            return;
        }

        if (routeModel.hasSuffix(uppercaseIcao)) {
            return this._findAndCacheRouteWithSuffix(routeModel, uppercaseIcao, entry, exit, isPreSpawn);
        }

        const routeWaypoints = routeModel.findStandardRouteWaypointModelsForEntryAndExit(entry, exit, isPreSpawn);
        this._cache[cacheKey] = routeWaypoints;

        return routeWaypoints;
    }

    /**
     * Extract an `icao` and `suffix` from a passed in icao and call `._findRouteOrAddToCache()`
     *
     * An `icaoWithSuffix` will contain the icao and an exit segmentName. here we deconstruct those
     * parts and re-assign the appropriate parameters with the data we need.
     *
     * The method should be called from within `._findRouteOrAddToCache()`, or as a return
     * from another method within `._findRouteOrAddToCache()`. That way we can recurse
     * back through that method and store the route in `#_cache` correctly
     *
     * @for StandardRouteCollection
     * @method _findAndCacheRouteWithSuffix
     * @param icaoWithSuffix {string}
     * @param entry {string}
     * @param exit {string}
     * @param isPreSpawn {boolean} flag used to determine if distances between waypoints should be calculated
     * @return {function}
     */
    _findAndCacheRouteWithSuffix(routeModel, icaoWithSuffix, entry, exit, isPreSpawn) {
        let icao;

        // if (this._type === StandardRouteCollection.ROUTE_TYPE.STAR) {
        //     exit = routeModel.getSegmentNameForIcaoWithSuffix(icaoWithSuffix);
        //     icao = routeModel.icao;
        // } else {
        //     entry = routeModel.getSegmentNameForIcaoWithSuffix(icaoWithSuffix);
        //     icao = routeModel.icao;
        // }

        const cacheKey = this._generateCacheKey(icao, entry, exit);
        const routeWaypoints = routeModel.findStandardRouteWaypointModelsForEntryAndExit(entry, exit, isPreSpawn);
        this._cache[cacheKey] = routeWaypoints;

        return routeWaypoints;
    }

    /**
     * Single place to build the string used for keys in `#_cache`
     *
     * Abstracted here to contain the logic in one place.
     *
     * @for StandardRouteCollection
     * @method _generateCacheKey
     * @param icao  {string}
     * @param entry {string}
     * @param exit  {string}
     * @return {string}
     */
    _generateCacheKey(icao, entry, exit) {
        return `${icao}.${entry}.${exit}`;
    }
}
