import _compact from 'lodash/compact';
import _isArray from 'lodash/isArray';
import _isObject from 'lodash/isObject';
import _uniqId from 'lodash/uniqueId';
import RouteSegmentCollection from './RouteSegmentCollection';
import RouteSegmentModel from './RouteSegmentModel';
import StandardRouteWaypointModel from './StandardRouteWaypointModel';

/**
 * @class SidModel
 */
export default class SidModel {
    /**
     * @constructor
     * @param sid {object}
     */
    constructor(sid) {
        if (!_isObject(sid) || _isArray(sid)) {
            throw new TypeError(`Expected sid to be an object, instead received ${typeof sid}`);
        }

        this._id = _uniqId();
        this.icao = '';
        this.name = '';
        this.draw = [];
        this.rwy = [];
        this._runwayCollection = null;
        this.body = [];
        this._bodyCollection = null;
        this.exitPoints = [];
        this._exitCollection = null;

        return this._init(sid);
    }

    /**
     * @for SidModel
     * @method _init
     * @param sid {object}
     * @private
     */
    _init(sid) {
        this.icao = sid.icao;
        this.name = sid.name;
        this.draw = sid.draw;
        this.rwy = sid.rwy;
        this._runwayCollection = this._buildSegmentCollection(sid.rwy);
        this.body = sid.body;
        this._bodySegment = this._buildBodySegment(sid.body);
        this.exitPoints = sid.exitPoints;
        this._exitCollection = this._buildSegmentCollection(sid.exitPoints);
    }

    /**
     * @for SidModel
     * @method destroy
     */
    destroy() {
        this._id = '';
        this.icao = '';
        this.name = '';
        this.rwy = [];
        this._runwayCollection = null;
        this.body = [];
        this._bodySegment = null;
        this.exitPoints = [];
        this._exitCollection = null;
        this.draw = [];

        return this;
    }

    /**
     * Public method that returns an 2d array in the shape of [[FIXNAME, FIX_RESTRICTIONS], [FIXNAME, FIX_RESTRICTIONS]]
     *
     * This method gathers the fixes from all the route segments.
     *
     * @for SidModel
     * @method findFixesAndRestrictionsForRunwayWithExit
     * @param runwayName {string}
     * @param exitFixName {string}
     * @return {array}
     */
    findFixesAndRestrictionsForRunwayWithExit(runwayName, exitFixName) {
        return this._findFixListForSegmentByName(runwayName, exitFixName);
    }

    /**
     *
     *
     * @for SidModel
     * @method _buildBodySegment
     * @param segmentFixeList {array}
     * @return {SegmentModel}
     */
    _buildBodySegment(segmentFixeList) {
        const segmentModel = new RouteSegmentModel('body', segmentFixeList);

        return segmentModel;
    }

    /**
     *
     *
     * @for SidModel
     * @method _buildSegmentCollection
     * @param segment {object}
     * @return segmentCollection {SegmentCollection}
     * @private
     */
    _buildSegmentCollection(segment) {
        const segmentCollection = new RouteSegmentCollection(segment);

        return segmentCollection;
    }

    /**
     *
     *
     * @for SidModel
     * @method _findFixListForSegmentByName
     * @param runwayName {string}
     * @param exitFixName {string}
     * @return fixList {array}
     */
    _findFixListForSegmentByName(runwayName, exitFixName) {
        // in the event that one of these functions doesnt find a result set it will return null. we leverage
        // `lodash.compact()`` below to remove any falsy values from the array before returning the `fixList`
        const fixList = [
            ...this._findRunwayFixList(runwayName),
            ...this._findBodyFixList(),
            ...this._findExitFixList(exitFixName)
        ];

        return _compact(fixList);
    }

    /**
     *
     *
     * @for SidModel
     * @method _findRunwayFixList
     * @param runwayName {string}
     * @return {array|null}
     */
    _findRunwayFixList(runwayName) {
        if (typeof runwayName === 'undefined') {
            return null;
        }

        return this._runwayCollection.findFixesForSegmentName(runwayName)
    }

    /**
     *
     *
     * @for SidModel
     * @method _findBodyFixList
     * @return {array|null}
     */
    _findBodyFixList() {
        if (this.body.length === 0) {
            return null;
        }

        return this._bodySegment.findWaypointsForSegment();
    }

    /**
     *
     * 
     * @for SidModel
     * @method _findExitFixList
     * @param exitFixName {string}
     * @return {array|null}
     * @private
     */
    _findExitFixList(exitFixName) {
        if (typeof exitFixName === 'undefined') {
            return null;
        }

        return this._exitCollection.findFixesForSegmentName(exitFixName);
    }
}
