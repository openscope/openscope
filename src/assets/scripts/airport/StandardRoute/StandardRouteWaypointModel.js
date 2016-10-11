import _uniqId from 'lodash/uniqueId';

/**
 * @property NAME_INDEX
 * @type {number}
 * @final
 */
const NAME_INDEX = 0;

/**
 * @property RESTRICTION_INDEX
 * @type {number}
 * @final
 */
const RESTRICTION_INDEX = 1;

/**
 * @class StandardRouteWaypointModel
 */
export default class StandardRouteWaypointModel {
    /**
     * Expects `routeWaypoint` to be in one of these forms:
     * - ["FRAWG", "A80+|S210"]
     * - ["FRAWG", "A80-|S210"]
     * - ["FRAWG", "A80"]
     * - ["FRAWG", "S210"]
     * - "FRAWG"
     *
     * @constructor
     * @param routeWaypoint {array|string}
     */
    constructor(routeWaypoint) {
        if (typeof routeWaypoint === 'undefined') {
            return this;
        }

        this._id = _uniqId();

        this._name = '';
        // using null here to match current api. should be an empty string.
        this._restrictions = null;
        this._alititude = -1000;
        this._alititudeConstraint = ''
        this._speed = -1;

        return this._init(routeWaypoint)
    }

    /**
     * @for StandardRouteWaypointModel
     * @method _init
     * @param routeWaypoint {array|string}
     * @private
     */
    _init(routeWaypoint) {
        if (typeof routeWaypoint === 'string') {
            this._name = routeWaypoint;

            return this;
        }

        this._name = routeWaypoint[NAME_INDEX];
        // temporary property. should end up as a getter that wraps private methods.
        this._restrictions = routeWaypoint[RESTRICTION_INDEX];

        this._parseWaypointRestrictions(routeWaypoint[RESTRICTION_INDEX]);

        return this;
    }

    /**
     * @for StandardRouteWaypointModel
     * @method _parseWaypointRestrictions
     * @param waypointRestrictions {string}
     * @private
     */
    _parseWaypointRestrictions(waypointRestrictions) {
        // console.log('restriction: ', waypointRestrictions);
        return this;
    }
}
