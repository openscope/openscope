import _forEach from 'lodash/forEach';
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

    _init(routeSegments) {
        _forEach(routeSegments, (routeWaypoints, key) => {
            const routeSegmentModel = new SegmentModel(key, routeWaypoints);

            this._addSegmentToCollection(routeSegmentModel);
        });
    }

    _addSegmentToCollection(segment) {
        this._items.push(segment);
        this.length = this._items.length;

        return this;
    }
}
