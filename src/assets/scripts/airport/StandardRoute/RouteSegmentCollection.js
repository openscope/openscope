import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _isArray from 'lodash/isArray';
import _isObject from 'lodash/isObject';
import _map from 'lodash/map';
import _uniqId from 'lodash/uniqueId';
import RouteSegmentModel from './RouteSegmentModel';

/**
 * A collection of `RouteSegment`s. These could effectively be called transitions.
 *
 * The original intent was to provide a way to deal with the different parts of a StandardProcedureRoute as
 * defined in each airport .json file. Each SID/STAR is broken up into three route segments:
 * - `rwy`
 * - `body`
 * - `exitPoints`
 *
 * This collection is meant to contain the routes for a single segment.
 *
 * @class RouteSegmentCollection
 */
export default class RouteSegmentCollection {
    /**
     * @constructor
     * @param routeSegments {object}
     */
    constructor(routeSegments) {
        if (typeof routeSegments === 'undefined' || !_isObject(routeSegments) || _isArray(routeSegments)) {
            throw new TypeError(`Expected routeSegments to be an object. Instead received ${typeof routeSegments}`);
        }

        /**
         * Unigue string id that can be used to differentiate this instance from another
         *
         * @property _id
         * @type {string}
         * @private
         */
        this._id = _uniqId();

        /**
         * Name of the RouteSegment
         *
         * @property name
         * @type {string}
         * @default ''
         */
        this.name = '';

        /**
         * An array of `RouteSegmentModel`s
         *
         * @property _items
         * @type {array}
         * @default []
         * @private
         */
        this._items = [];

        /**
         * Convenience property to get at the current length of `_items`.
         *
         * @property length
         * @type {number}
         * @default -1
         */
        this.length = -1;

        return this._init(routeSegments);
    }

    /**
     * Public getter that provides access to the contents of `_items`
     *
     * @property items
     * @return {array}
     */
    get items() {
        return this._items;
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for RouteSegmentCollection
     * @method _init
     * @param routeSegments {object}
     * @private
     */
    _init(routeSegments) {
        _forEach(routeSegments, (routeWaypoints, key) => {
            const routeSegmentModel = new RouteSegmentModel(key, routeWaypoints);

            this._addSegmentToCollection(routeSegmentModel);
        });
    }

    /**
     * Destroy the current instance
     *
     * @for RouteSegmentCollection
     * @method destroy
     */
    destroy() {
        this._id = '';
        this.name = '';
        this._items = [];
        this.length = -1;

        return this;
    }

    /**
     * Find a `RouteSegmentModel` within the collection by its name
     *
     * @for RouteSegmentCollection
     * @method findSegmentByName
     * @param segmentName {string}
     * @return {SegmentModel}
     */
    findSegmentByName(segmentName) {
        return _find(this._items, { name: segmentName });
    }

    /**
     * Find a list of fixes for a given `segmentName`
     *
     * @for RouteSegmentCollection
     * @method findFixesForSegmentName
     * @param segmentName {string}
     * @return {array}
     */
    findFixesForSegmentName(segmentName) {
        const segment = this.findSegmentByName(segmentName);

        return segment.findWaypointsForSegment();
    }

    /**
     * Return a list of fixNames for all of the `RouteSegmentModel`s in the collection
     *
     * @for RouteSegmentCollection
     * @method gatherFixNamesForCollection
     * @return {array}
     */
    gatherFixNamesForCollection() {
        return _map(this._items, (item) => item.name);
    }

    /**
     * Add a new segment to the collection
     *
     * @for RouteSegmentCollection
     * @method _addSegmentToCollection
     * @param segment {SegmentModel}
     * @private
     */
    _addSegmentToCollection(segment) {
        if (!(segment instanceof RouteSegmentModel)) {
            throw new TypeError(`Expected segment to be an instance of RouteSegmentModel, instead received ${segment}.`);
        }

        this._items.push(segment);
        this.length = this._items.length;

        return this;
    }
}
