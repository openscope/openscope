import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _isArray from 'lodash/isArray';
import _uniqId from 'lodash/uniqueId';
import SegmentModel from './RouteSegmentModel';

/**
 * @class RouteSegmentCollection
 */
export default class RouteSegmentCollection {
    /**
     * @constructor
     * @param routeSegments {object}
     */
    constructor(routeSegments) {
        if (typeof routeSegments === 'undefined') {
            throw new TypeError(`Expected routeSegments to be defined. Instead received ${typeof routeSegments}`);
        }

        this._id = _uniqId();
        this.name = '';
        this._items = [];
        this.length = -1;

        return this._init(routeSegments);
    }

    get items() {
        return this._items;
    }

    /**
     * @for RouteSegmentCollection
     * @method _init
     * @param routeSegments {object}
     * @private
     */
    _init(routeSegments) {
        _forEach(routeSegments, (routeWaypoints, key) => {
            const routeSegmentModel = new SegmentModel(key, routeWaypoints);

            this._addSegmentToCollection(routeSegmentModel);
        });
    }

    /**
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
     * @for RouteSegmentCollection
     * @method findSegmentByName
     * @param segmentName {string}
     * @return {SegmentModel}
     */
    findSegmentByName(segmentName) {
        return _find(this._items, { name: segmentName });
    }

    /**
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
     * @for RouteSegmentCollection
     * @method _addSegmentToCollection
     * @param segment {object}
     * @private
     */
    _addSegmentToCollection(segment) {
        this._items.push(segment);
        this.length = this._items.length;

        return this;
    }
}
