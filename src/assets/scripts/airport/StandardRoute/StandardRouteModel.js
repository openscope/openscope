import _compact from 'lodash/compact';
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _uniqId from 'lodash/uniqueId';
import RouteSegmentCollection from './RouteSegmentCollection';
import RouteSegmentModel from './RouteSegmentModel';
import { distance2d } from '../../math/distance';
import { nm } from '../../utilities/unitConverters';

/**
 * Accepts a single route belonging to a SID or STAR and provides methods to reason about its contents.
 *
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
         * Collection of `exitPoints` route segments
         *
         * This property should only be defined for SIDs and null for STAR routes
         *
         * @property _exitCollection
         * @type {RouteSegmentCollection}
         * @default null
         * @private
         */
        this._exitCollection = null;

        /**
         * Collection of the `entryPoints` route segments.
         *
         * This property should only be defined for STARs and null for SID routes
         * @type {RouteSegmentCollection}
         * @default null
         * @private
         */
        this._entryCollection = null;

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
        this.exitPoints = _get(sid, 'exitPoints', {});
        this.entryPoints = _get(sid, 'entryPoints', {});
        this._runwayCollection = this._buildSegmentCollection(sid.rwy);
        this._bodySegmentModel = this._buildSegmentModel(sid.body);
        this._exitCollection = this._buildSegmentCollection(sid.exitPoints);
        this._entryCollection = this._buildSegmentCollection(sid.entryPoints);
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
        this._entryCollection = null;

        return this;
    }

    /**
     * Public method that returns an 2d array in the shape of [[FIXNAME, FIX_RESTRICTIONS], [FIXNAME, FIX_RESTRICTIONS]]
     *
     * This method gathers the fixes from all the route segments.
     *
     * @for StandardRouteModel
     * @method findFixesAndRestrictionsForRunwayAndExit
     * @param runwayName {string}
     * @param exitFixName {string}
     * @return {array}
     */
    findFixesAndRestrictionsForRunwayAndExit(runwayName = '', exitFixName = '') {
        return this._findFixListForSidByRunwayAndExit(runwayName, exitFixName);
    }

    /**
     *
     * This method gathers the fixes from all the route segments.
     *
     * @for StandardRouteModel
     * @method findFixesAndRestrictionsForEntryAndRunway
     * @param entryFixName {string}
     * @param runwayName {string}
     * @return {array}
     */
    findFixesAndRestrictionsForEntryAndRunway(entryFixName = '', runwayName = '') {
        return this._findFixListForStarByEntryAndRunway(entryFixName, runwayName);
    }

    /**
     *
     *
     * @for StandardRouteModel
     * @method findFixModelsForEntryAndExit
     * @param entry {string}
     * @parma exit {string}
     * @return waypointList {array<StandardWaypointModel>}
     */
    findFixModelsForEntryAndExit(entry, exit) {
        const waypointList = this._findStandardWaypointModelsForRoute(entry, exit);

        _forEach(waypointList, (waypoint, i) => {
            let previousWaypoint = waypointList[i - 1];
            if (i === 0) {
                previousWaypoint = waypoint;
            }

            const distance = this.calculateDistanceBetweenWaypoints(waypoint.position, previousWaypoint.position);
            waypoint.distanceFromPreviousWaypoint = distance;
            waypoint.previousFixName = previousWaypoint.name;
        });

        return waypointList;
    }

    /**
     * Given two `StandardWaypointModel` objects, calculate the distance in `nm` between them
     *
     * @for StandardRouteModel
     * @method calculateDistanceBetweenWaypoints
     * @param waypoint {StandardWaypointModel}
     * @param previousWaypoint {StandardWaypointModel}
     * @return distance {number}
     */
    calculateDistanceBetweenWaypoints(waypoint, previousWaypoint) {
        const distance = distance2d(previousWaypoint, waypoint);

        return nm(distance);
    }

    /**
     * Return the fixnames for the `_exitCollection`
     *
     * @for StandardRouteModel
     * @method gatherExitPointNames
     * @return {array}
     */
    gatherExitPointNames() {
        if (!this.hasExitPoints()) {
            return [];
        }

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
        return this._exitCollection !== null && this._exitCollection.length > 0;
    }

    /**
     * Build a new RouteSegmentModel for a segmentFixList
     *
     * `body` segment is expected to be an array, so instead of creating a collection like with `rwy` and
     * `exitPoints`, here we just create a model.  This provides the same methods the collections use, only
     * without the collection layer.
     *
     * @for StandardRouteModel
     * @method _buildSegmentModel
     * @param segmentFixList {array}
     * @return segmentModel {SegmentModel}
     * @private
     */
    _buildSegmentModel(segmentFixList) {
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
        // SIDS have `exitPoints` while STARs have `entryPoints`. one or the other will be `undefined`
        // depending on the route type.
        if (typeof segment === 'undefined' || _isEmpty(segment)) {
            return null;
        }

        const segmentCollection = new RouteSegmentCollection(segment);

        return segmentCollection;
    }

    /**
     * Given three functions, spread their result in an array then return the compacted result.
     *
     * This method expects to receive arrays as results from the three methods passed in.
     * This wrapper method is provided to maintain a consistent interface while allowing for a varying set
     * of methods to be called in the place of each parameter.
     *
     * @for StandardRouteModel
     * @method _generateFixList
     * @param originSegment {function}
     * @param bodySegment {function}
     * @param destinationSegment {function}
     * @return {array}
     * @private
     */
    _generateFixList = (originSegment, bodySegment, destinationSegment) => {
        // in the event that one of these functions doesnt find a result set it will return an empty array.
        // we leverage then `lodash.compact()` below to remove any empty values from the array before
        // returning the `fixList`.
        // These functions are called synchronously and order of operation is very important here.
        const fixList = [
            ...originSegment,
            ...bodySegment,
            ...destinationSegment
        ];

        return _compact(fixList);
    };

    /**
     * Given a `runwayName` and `exitFixName`, find a list of fixes for the `rwy`, `body` and `exitPoints` segments.
     *
     * @for StandardRouteModel
     * @method _findFixListForSidByRunwayAndExit
     * @param runwayName {string}
     * @param exitFixName {string}
     * @return fixList {array}
     * @private
     */
    _findFixListForSidByRunwayAndExit = (runwayName, exitFixName) => this._generateFixList(
        this._findFixListForRunwayName(runwayName),
        this._findBodyFixList(),
        this._findFixListForExitFixName(exitFixName)
    );

    /**
     * Given an `entryFixName` and/or a `runwayName`, find a list of fixes for the `entryPoints`, `body` and `rwy` segments.
     *
     * @for StandardRouteModel
     * @method _findFixListForStarByEntryAndRunway
     * @param entryFixName {string}
     * @param runwayName {string} (optional)
     * @return {array}
     */
    _findFixListForStarByEntryAndRunway = (entryFixName, runwayName) => this._generateFixList(
        this._findFixListForEntryFixName(entryFixName),
        this._findBodyFixList(),
        this._findFixListForRunwayName(runwayName)
    );

    /**
     * Find list of waypoints for the `body` segment
     *
     * @for StandardRouteModel
     * @method _findBodyFixList
     * @return {array}
     */
    _findBodyFixList() {
        if (typeof this.body === 'undefined' || this.body.length === 0) {
            return [];
        }

        return this._bodySegmentModel.findWaypointsForSegment();
    }

    // TODO: simplify these next three functions into a single function. they are doing exactly the same thing
    // only with a different collection object.
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
        if (typeof this.rwy === 'undefined' || !this._runwayCollection || runwayName === '') {
            return [];
        }

        return this._runwayCollection.findFixesForSegmentName(runwayName);
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
        if (typeof this.exitPoints === 'undefined' || !this._exitCollection || exitFixName === '') {
            return [];
        }

        return this._exitCollection.findFixesForSegmentName(exitFixName);
    }

    /**
     * Find a list of fixes in the `entryPoint` segment given an `entryFixName`
     *
     * @for StandardRouteModel
     * @method _findFixListForEntryFixName
     * @param entryFixName {string}
     * @return {array}
     * @private
     */
    _findFixListForEntryFixName(entryFixName) {
        // specifically checking for an empty string here because this param gets a default of '' when
        // it is received in to the public method
        if (typeof this.entryPoints === 'undefined' || !this._entryCollection || entryFixName === '') {
            return [];
        }

        return this._entryCollection.findFixesForSegmentName(entryFixName);
    }

    /**
     * Gather a list of `StandardWaypointModel` objects for a particular route.
     *
     * @for StandardRouteModel
     * @method _findStandardWaypointModelsForRoute
     * @param entry {string}
     * @param exti {string}
     * @return waypointModelList {array<StandardWaypointModel>}
     */
    _findStandardWaypointModelsForRoute(entry, exit) {
        // TODO: this is icky, do something different with this
        let entrySegmentItems = [];
        if (this._entryCollection) {
            const entrySegment = this._entryCollection.findSegmentByName(entry);
            entrySegmentItems = entrySegment.items;
        }

        let exitSegmentItems = [];
        if (this._runwayCollection) {
            const exitSegment = this._runwayCollection.findSegmentByName(exit);
            exitSegmentItems = exitSegment.items;
        }

        const waypointModelList = [
            ...entrySegmentItems,
            ...this._bodySegmentModel.items,
            ...exitSegmentItems
        ];

        return _compact(waypointModelList);
    }
}
