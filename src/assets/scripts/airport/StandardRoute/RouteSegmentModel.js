import _map from 'lodash/map';
import _uniqId from 'lodash/uniqueId';
import StandardRouteWaypointModel from './StandardRouteWaypointModel';

/**
 * @class RouteSegmentModel
 */
export default class RouteSegmentModel {
    /**
     * @constructor
     * @param name {string}
     * @param segmentWaypoints {array}
     */
    constructor(name, segmentWaypoints) {
        if (typeof segmentWaypoints === 'undefined') {
            throw new TypeError(`Expected segmentWaypoints to be defined. Instead received ${typeof segmentWaypoints}`);
        }

        this._id = _uniqId();
        this.name = '';
        this._items = [];
        this.length = 0;

        return this._init(name, segmentWaypoints);
    }

    /**
     * @for RouteSegmentModel
     * @method _init
     * @param name {string}
     * @param segmentWaypoints {array}
     * @private
     */
    _init(name, segmentWaypoints) {
        this.name = name;

        _map(segmentWaypoints, (fixAndRestrictions) => {
            const waypointModel = new StandardRouteWaypointModel(fixAndRestrictions)

            this._addWaypointToCollection(waypointModel);
        });
    }

    /**
     * @for destroy
     * @method destroy
     */
    destroy() {
        this._id = '';
        this.name = '';
        this._items = [];
        this.length = -1;
    }

    /**
     * @for RouteSegmentModel
     * @method findWaypointsForSegment
     * @return {array}
     */
    findWaypointsForSegment() {
        const waypoints = _map(this._items, (waypoint) => waypoint.fix);

        return waypoints;
    }

    /**
     * @for RouteSegmentModel
     * @method _addWaypointToCollection
     * @param waypoint {StandardRouteWaypointModel}
     * @private
     */
    _addWaypointToCollection(waypoint) {
        this._items.push(waypoint);
        this.length = this._items.length;
    }
}
