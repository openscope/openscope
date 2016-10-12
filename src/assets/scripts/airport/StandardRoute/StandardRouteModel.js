import _compact from 'lodash/compact';
import _isArray from 'lodash/isArray';
import _isObject from 'lodash/isObject';
import _uniqId from 'lodash/uniqueId';
import RouteSegmentCollection from './RouteSegmentCollection';
import RouteSegmentModel from './RouteSegmentModel';

/**
 * @class StandardRouteModel
 */
export default class StandardRouteModel {
    /**
     * @constructor
     * @param sid {object}
     */
    constructor(sid) {
        if (!_isObject(sid) || _isArray(sid)) {
            throw new TypeError(`Expected sid to be an object, instead received ${typeof sid}`);
        }

        /**
         * Unigue string id that can be used to differentiate this model instance from another.
         *
         * @property _id
         * @type {string}
         * @private
         */
        this._id = _uniqId();

        /**
         * Name of the fix
         *
         * @property name
         * @type {string}
         * @default ''
         */
        this.name = '';

        /**
         * SID icoa identifier
         *
         * @property icao
         * @type {string}
         * @default ''
         */
        this.icao = '';

        /**
         * List of fixes in the order that they should be drawn
         *
         * Pulled straight from the `.json` file.
         * Currently unused and is only a place to put the data.
         *
         * @property draw
         * @type {array}
         * @default
         */
        this.draw = [];

        /**
         * List of `rwy` segments and fixes
         *
         * Pulled straight from the `.json` file.
         * Currently unused and is only a place to put the data.
         *
         * @property rwy
         * @type {object}
         * @default {}
         */
        this.rwy = {};

        /**
         * @property body
         * @type {array}
         * @default []
         */
        this.body = [];

        /**
         * List of `exitPoints` segments and fixes
         *
         * Pulled straight from the `.json` file.
         * Currently unused and is only a place to put the data.
         *
         * @property exitPoints
         * @type {object}
         * @default {}
         */
        this.exitPoints = {};

        /**
         * Collection object of the `rwy` route segments
         *
         * @property _runwayCollection
         * @type {RouteSegmentCollection}
         * @default null
         * @private
         */
        this._runwayCollection = null;

        /**
         * `RouteSegmentModel` for the fixes belonging to the `body` segment
         *
         * @property _bodySegmentModel
         * @type {RouteSegmentModel}
         * @default null
         * @private
         */
        this._bodySegmentModel = null;

        /**
         * Collection object of the `exitPoints` route segments
         *
         * @property _exitCollection
         * @type {RouteSegmentCollection}
         * @default null
         * @private
         */
        this._exitCollection = null;

        return this._init(sid);
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for StandardRouteModel
     * @method _init
     * @param sid {object}
     * @private
     */
    _init(sid) {
        this.icao = sid.icao;
        this.name = sid.name;
        this.draw = sid.draw;
        this.rwy = sid.rwy;
        this.body = sid.body;
        this.exitPoints = sid.exitPoints;
        this._runwayCollection = this._buildSegmentCollection(sid.rwy);
        this._bodySegmentModel = this._buildBodySegmentModel(sid.body);
        this._exitCollection = this._buildSegmentCollection(sid.exitPoints);
    }

    /**
     * Destroy the current instance
     *
     * @for StandardRouteModel
     * @method destroy
     */
    destroy() {
        this._id = '';
        this.icao = '';
        this.name = '';
        this.rwy = [];
        this.body = [];
        this.exitPoints = [];
        this.draw = [];
        this._runwayCollection = null;
        this._bodySegmentModel = null;
        this._exitCollection = null;

        return this;
    }

    /**
     * Public method that returns an 2d array in the shape of [[FIXNAME, FIX_RESTRICTIONS], [FIXNAME, FIX_RESTRICTIONS]]
     *
     * This method gathers the fixes from all the route segments.
     *
     * @for StandardRouteModel
     * @method findFixesAndRestrictionsForRunwayWithExit
     * @param runwayName {string}
     * @param exitFixName {string}
     * @return {array}
     */
    findFixesAndRestrictionsForRunwayWithExit(runwayName = '', exitFixName = '') {
        return this._findFixListForSegmentByName(runwayName, exitFixName);
    }

    /**
     * Return the fixnames for the `_exitCollection`
     *
     * @for StandardRouteModel
     * @method gatherExitPointNames
     * @return {array}
     */
    gatherExitPointNames() {
        return this._exitCollection.gatherFixNamesForCollection();
    }

    /**
     * Does the `_exitCollection` have any exitPoints?
     *
     * @for StandardRouteModel
     * @method hasExitPoints
     * @return {boolean}
     */
    hasExitPoints() {
        return this._exitCollection.length > 0;
    }

    /**
     * Build a new RouteSegmentModel for a segmentFixList
     *
     * `body` segment is expected to be an array, so instead of creating a collection like with `rwy` and
     * `exitPoints`, here we just create a model.  This provides the same methods the collections use, only
     * without the collection layer.
     *
     * @for StandardRouteModel
     * @method _buildBodySegmentModel
     * @param segmentFixList {array}
     * @return segmentModel {SegmentModel}
     */
    _buildBodySegmentModel(segmentFixList) {
        const segmentModel = new RouteSegmentModel('body', segmentFixList);

        return segmentModel;
    }

    /**
     * Build a collection of `RouteSegmentModel`s from a segment.
     *
     * @for StandardRouteModel
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
     * Given a runwayName and exitFixName, return a list of fixes for the `rwy`, `body` and `exitPoints` segments.
     *
     * @for StandardRouteModel
     * @method _findFixListForSegmentByName
     * @param runwayName {string}
     * @param exitFixName {string}
     * @return fixList {array}
     */
    _findFixListForSegmentByName(runwayName, exitFixName) {
        // in the event that one of these functions doesnt find a result set it will return an empty array.
        // we leverage then `lodash.compact()` below to remove any empty values from the array before
        // returning the `fixList`.
        // These functions are called synchronously and order of operation is very important here.
        const fixList = [
            ...this._findFixListForRunwayName(runwayName),
            ...this._findBodyFixList(),
            ...this._findFixListForExitFixName(exitFixName)
        ];

        return _compact(fixList);
    }

    /**
     * Find list of fixes for a given `runwayName`
     *
     * @for StandardRouteModel
     * @method _findFixListForRunwayName
     * @param runwayName {string}
     * @return {array}
     */
    _findFixListForRunwayName(runwayName) {
        // specifically checking for an empty string here because this param gets a default of '' when
        // it is received in to the public method
        if (runwayName === '') {
            return [];
        }

        return this._runwayCollection.findFixesForSegmentName(runwayName);
    }

    /**
     * Find list of waypoints for the `body` segment
     *
     * @for StandardRouteModel
     * @method _findBodyFixList
     * @return {array}
     */
    _findBodyFixList() {
        if (this.body.length === 0) {
            return [];
        }

        return this._bodySegmentModel.findWaypointsForSegment();
    }

    /**
     * Find a list of fixes in the `exitPoint` segment given an `exitFixName`
     *
     * @for StandardRouteModel
     * @method _findFixListForExitFixName
     * @param exitFixName {string}
     * @return {array}
     * @private
     */
    _findFixListForExitFixName(exitFixName) {
        // specifically checking for an empty string here because this param gets a default of '' when
        // it is received in to the public method
        if (exitFixName === '') {
            return [];
        }

        return this._exitCollection.findFixesForSegmentName(exitFixName);
    }
}
