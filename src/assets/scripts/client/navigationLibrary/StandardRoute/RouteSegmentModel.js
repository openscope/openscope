import _forEach from 'lodash/forEach';
import _map from 'lodash/map';
import _isArray from 'lodash/isArray';
import BaseModel from '../../base/BaseModel';
import StandardRouteWaypointModel from './StandardRouteWaypointModel';

/**
 * Provides an interface for dealing with a list of `StandardRouteWaypointModel`s that make up a given route segment.
 *
 * @class RouteSegmentModel
 */
export default class RouteSegmentModel extends BaseModel {
    /**
     * segmentWaypoints should come in a similar shape to:
     * - ["_NAPSE068", "NAPSE", ["RIOOS", "A130+"], "COMPS"]
     *
     * @constructor
     * @param name {string}  Icao of particular waypoint
     * @param segmentWaypoints {array}  a mixed array of strings or arrays of strings
     */
    /* istanbul ignore next */
    constructor(name, segmentWaypoints = []) {
        super();

        /**
         * Name of the RouteSegment
         *
         * @property name
         * @type {string}
         * @default ''
         * @private
         */
        this.name = '';

        /**
         * `StandardRouteWaypointModel`s that make up the RouteSegment
         *
         * @property _items
         * @type {array}
         * @default []
         * @private
         */
        this._items = [];

        return this._init(name, segmentWaypoints);
    }

    /**
     * Return the items in the collection
     *
     * @property items
     * @return {array}
     */
    get items() {
        return this._items;
    }

    /**
     * Convenience property to get at the current length of `_items`.
     *
     * @property length
     * @type {number}
     */
    get length() {
        return this._items.length;
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for RouteSegmentModel
     * @method _init
     * @param name {string}
     * @param segmentWaypoints {array}
     * @private
     */
    _init(name, segmentWaypoints) {
        this.name = name;

        if (_isArray(segmentWaypoints)) {
            this._createWaypointModelsFromList(segmentWaypoints);
        }

        return this;
    }

    /**
     * rest the current instance
     *
     * @for RouteSegmentModel
     * @method reset
     */
    reset() {
        this.name = '';
        this._items = [];

        return this;
    }

    /**
     * Return a list of fixes for the RouteSegment.
     *
     * This will return a normalized list of fixes, ex:
     * - [FIXNAME, null]
     * - [FIXNAME, RESTRICTIONS]
     *
     * @for RouteSegmentModel
     * @method findWaypointsForSegment
     * @return fixList {array}
     */
    findWaypointsForSegment() {
        const fixList = _map(this._items, (waypoint) => waypoint.fix);

        return fixList;
    }

    /**
     * Returns an array of fix names used by this route segment
     *
     * @for RouteSegmentModel
     * @method getAllFixNamesInUse
     * @return {array<string>} ['fixname', 'fixname', 'fixname', ...]
     */
    getAllFixNamesInUse() {
        return this._items.map((waypoint) => waypoint.name);
    }

    /**
     * @for RouteSegmentModel
     * @method _createWaypointModelsFromList
     * @param segmentWaypoints {array}
     * @return waypointModelList {array}
     */
    _createWaypointModelsFromList(segmentWaypoints) {
        _forEach(segmentWaypoints, (fixAndRestrictions) => {
            const waypointModel = new StandardRouteWaypointModel(fixAndRestrictions);

            // TODO: calculate distance here

            this._addWaypointToCollection(waypointModel);
        });
    }

    /**
     * Add a new model to the collection and update length.
     *
     * @for RouteSegmentModel
     * @method _addWaypointToCollection
     * @param waypoint {StandardRouteWaypointModel}
     * @private
     */
    _addWaypointToCollection(waypoint) {
        if (!(waypoint instanceof StandardRouteWaypointModel)) {
            throw new TypeError(`Expected waypoint to be an instance of StandardRouteWaypointModel, instead received ${waypoint}.`);
        }

        this._items.push(waypoint);
    }
}
