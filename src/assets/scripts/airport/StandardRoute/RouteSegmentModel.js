import _map from 'lodash/map';
import _uniqId from 'lodash/uniqueId';
import StandardRouteWaypointModel from './StandardRouteWaypointModel';

/**
 * @class RouteSegmentModel
 */
export default class RouteSegmentModel {
    /**
     * @constructor
     * @param routeSegment {array}
     */
    constructor(name, segmentWaypoints) {
        if (typeof segmentWaypoints === 'undefined') {
            throw new TypeError(`Expected segmentWaypoints to be defined. Instead received ${typeof segmentWaypoints}`);
        }

        this._id = _uniqId();
        this.name = '';
        this.items = [];
        this.length = 0;

        return this._init(name, segmentWaypoints);
    }

    _init(name, segmentWaypoints) {
        this.name = name;

        _map(segmentWaypoints, (fixAndRestrictions) => {
            const waypointModel = new StandardRouteWaypointModel(fixAndRestrictions)

            this._addWaypointToCollection(waypointModel);
        });
    }

    _addWaypointToCollection(waypoint) {
        this.items.push(waypoint);
        this.length = this.items.length;
    }
}
