import _compact from 'lodash/compact';
import _get from 'lodash/get';
import _has from 'lodash/has';
import _isEmpty from 'lodash/isEmpty';
import _isNil from 'lodash/isNil';
import _pick from 'lodash/pick';
import _uniq from 'lodash/uniq';
import BaseModel from '../../base/BaseModel';
import RouteSegmentCollection from './RouteSegmentCollection';
import RouteSegmentModel from './RouteSegmentModel';
import { distance2d } from '../../math/distance';
import { nm } from '../../utilities/unitConverters';
import { isEmptyObject } from '../../utilities/validatorUtilities';

/**
 * Accepts a single route belonging to a SID or STAR and provides methods to reason about its contents.
 *
 * @class StandardRouteModel
 */
export default class StandardRouteModel extends BaseModel {
    /**
     * Expects an object in the form of (taken from `klas.sids.SHEAD9`):
     *
     *  SHEAD9: {
     *    'icao': 'SHEAD9',
     *    'name': 'Shead Nine',
     *    'suffix': {'01L': '1A'},
     *    'rwy': {
     *      '01L': [['BESSY', 'S230'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
     *      '01R': [['BESSY', 'S230'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
     *      '07L': ['WASTE', ['BAKRR', 'A70'], ['MINEY', 'A80+'], 'HITME'],
     *      '07R': ['JESJI', ['BAKRR', 'A70'], ['MINEY', 'A80+'], 'HITME'],
     *      '19L': ['FIXIX', ['ROPPR', 'A70'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
     *      '19R': ['JAKER', ['ROPPR', 'A70'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
     *      '25L': ['PIRMD', ['ROPPR', 'A70'], ['MDDOG', 'A90'], ['TARRK', 'A110']],
     *      '25R': ['RBELL', ['ROPPR', 'A70'], ['MDDOG', 'A90'], ['TARRK', 'A110']]
     *    },
     *    'body': [['SHEAD', 'A140+']],
     *    'exitPoints': {
     *      'KENNO': [['DBIGE', 'A210+'], ['BIKKR', 'A210+'], 'KENNO'],
     *      'OAL': [['DBIGE', 'A210+'], ['BIKKR', 'A210+'], 'KENNO', 'OAL']
     *    },
     *    'draw': [
     *      ['BESSY', 'MDDOG'],
     *      ['ROPPR', 'MDDOG', 'TARRK', 'SHEAD'],
     *      ['HITME', 'SHEAD', 'DBIGE', 'BIKKR', 'KENNO*'],
     *      ['KENNO', 'OAL*']
     *    ]
     *  }
     *
     * - `rwy` becomes the `_runwayCollection`. may not be included in a route definition
     * - `body` becomes the `_bodySegmentModel`. may not be included in a route definition
     * - `exitPoints` becomes the  `_exitCollection`. will only be present on SID routes
     * - `entryPoints` (not shown above) becomes the `_entryCollection`. will only be present on STAR routes
     *
     * The above can also be passed with a `suffix` property. This comes in the shape of `RUNWAY: SUFFIX`.
     * When suffixes are present, the `StandardRouteCollection` will attempt to create a `StandardRouteModel`
     * for each suffix. This simplifies the lookup logic because we then only need to search by `icao`
     * insead of having to logic the `icao` + `suffix`.
     *
     * @constructor
     * @for StandardRouteModel
     * @param standardRoute {object}
     * @param suffixKey {string}         [optional]
     */
    /* istanbul ignore next */
    constructor(standardRoute, suffixKey = '') {
        super();

        if (isEmptyObject(standardRoute)) {
            throw new TypeError(`Expected standardRoute to be an object, instead received ${typeof standardRoute}`);
        }

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
         * Key from the `suffix` object of a route model.
         *
         * Should be passed in from the `StandardRouteCollection`.
         * Is used here to determine if this is a suffix `StandardRouteCollection`
         * and to figure out which runways need to be kept for this particular route
         *
         * @property _suffixKey
         * @type {string}
         * @default ''
         * @private
         */
        this._suffixKey = suffixKey;

        /**
         * List of fixes in the order that they should be drawn
         *
         * Pulled straight from the json file.
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
         * Pulled straight from the json file.
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
         * Pulled straight from the json file.
         * Currently unused and is only a place to put the data.
         *
         * @property exitPoints
         * @type {object}
         * @default {}
         */
        this.exitPoints = {};

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

        return this._init(standardRoute);
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for StandardRouteModel
     * @method _init
     * @param standardRoute {object}
     * @private
     */
    _init(standardRoute) {
        this.icao = standardRoute.icao;
        this.name = standardRoute.name;
        this.draw = standardRoute.draw;
        this.rwy = standardRoute.rwy;
        this.body = standardRoute.body;
        this.exitPoints = _get(standardRoute, 'exitPoints', {});
        this.entryPoints = _get(standardRoute, 'entryPoints', {});
        this._bodySegmentModel = this._buildSegmentModel(standardRoute.body);

        this._buildRouteWithSuffix(standardRoute);
        this._buildEntryAndExitCollections(standardRoute);
    }

    /**
     * reset the current instance
     *
     * @for StandardRouteModel
     * @method reset
     */
    reset() {
        this.icao = '';
        this.name = '';
        this.rwy = [];
        this.body = [];
        this.exitPoints = [];
        this.draw = [];
        this._suffixKey = '';
        this._bodySegmentModel = null;
        this._exitCollection = null;
        this._entryCollection = null;

        return this;
    }

    /**
     * Gather the fixes from `entry` and `body` route segments.
     *
     * Returns a 2d array in the shape of
     * - [[FIXNAME, FIX_RESTRICTIONS], [FIXNAME, FIX_RESTRICTIONS]]
     *
     * @for StandardRouteModel
     * @method findFixesAndRestrictionsForEntryAndBody
     * @param entryFixName {string}
     * @return {array}
     */
    findFixesAndRestrictionsForEntryAndBody(entryFixName) {
        return this._findFixListForEntryAndBody(entryFixName);
    }

    /**
     * Collect all the `StandardWaypointModel` objects for a given route.
     *
     * @for StandardRouteModel
     * @method findStandardRouteWaypointModelsForEntryAndExit
     * @param entry {string}
     * @param exit {string}
     * @param isPreSpawn {boolean} flag used to determine if distances between waypoints need to be calculated. this
     *                             will only be true during preSpawn so that initial aircraft position can be calculated
     * @return waypointList {array<StandardWaypointModel>}
     */
    findStandardRouteWaypointModelsForEntryAndExit(entry, exit, isPreSpawn) {
        const waypointList = this._findStandardWaypointModelsForRoute(entry, exit);

        if (isPreSpawn) {
            this._updateWaypointsWithPreviousWaypointData(waypointList);
        }

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
     * Returns an array of unique fix names used by any portion of the procedure
     *
     * @for StandardRouteModel
     * @method getAllFixNamesInUse
     * @return {array<string>} ['fixname', 'fixname', 'fixname', ...]
     */
    getAllFixNamesInUse() {
        const allFixNames = [
            ...this._entryCollection.getAllFixNamesInUse(),
            ...this._bodySegmentModel.getAllFixNamesInUse(),
            ...this._exitCollection.getAllFixNamesInUse(),
            ...this.draw.reduce((list, fix) => list.concat(fix)).map((fixName) => fixName.replace('*', ''))
        ];
        const uniqueFixNames = _uniq(allFixNames);

        return uniqueFixNames;
    }

    /**
     * Given a procedureId that is known to be for a suffix route, this method will
     * return the segment name associated with that suffix.
     *
     * Should only be called after verifying that this is a suffix `StandardRouteModel`
     *
     * @for StandardRouteModel
     * @method getSuffixSegmentName
     * @param procedureType {string}
     * @return {string}
     */
    getSuffixSegmentName(procedureType) {
        let collection = this._exitCollection.findSegmentByName(this._suffixKey);

        if (procedureType === 'SID') {
            collection = this._entryCollection.findSegmentByName(this._suffixKey);
        }

        return collection.name;
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
     * Checks if a given `fixName` is present in the `_entryCollection` or `_exitCollection`.
     *
     * This method does not check for items within the `_bodySegmentModel`. In the future
     * this method may need to be extended to work with `_bodySegmentModel` items as well.
     *
     * @for StandardRouteModel
     * @method hasFixName
     * @param {string}
     * @return {boolean}
     */
    hasFixName(fixName) {
        return this._entryCollection && !_isNil(this._entryCollection.findSegmentByName(fixName)) ||
            this._exitCollection && !_isNil(this._exitCollection.findSegmentByName(fixName));
    }

    /**
     * Determine if this `StandardRouteModel` represents a suffix route
     *
     * @for StandardRouteModel
     * @property hasSuffix
     * @return {boolean}
     */
    hasSuffix() {
        return this._suffixKey !== '';
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
        if (typeof segment === 'undefined' || _isEmpty(segment)) {
            return null;
        }

        const segmentCollection = new RouteSegmentCollection(segment);

        return segmentCollection;
    }

    /**
     * If this represents a suffix route, update the `#icao` and `rwy` object
     *
     * This method should be run only once on instantiation.
     * This method mutates both properties before the `_buildEntryAndExitCollections()`
     * method is fired. By updating the `rwy` object, this forces the resulting collection
     * object to contain only the runway applicatble to the suffix.
     *
     * @for StandardRouteModel
     * @method _buildRouteWithSuffix
     * @param  standardRoute {object}
     */
    _buildRouteWithSuffix(standardRoute) {
        if (this._suffixKey === '') {
            return;
        }

        const suffixVal = standardRoute.suffix[this._suffixKey];
        this.icao = `${standardRoute.icao}${suffixVal}`;
        this.rwy = _pick(standardRoute.rwy, this._suffixKey);
    }

    /**
     * Determine if the `standardRoute` is a sid or a star and build the entry/exit collections
     * with the correct data.
     *
     * We evaluate `#rwy` instead of `standardRoute.rwy` here because suffix routes will
     * have transformed `#rwy` to use only the runway for the suffix. All other cases
     * will maintain the shape of `standardRoute.rwy`.
     *
     * STARS will have `entryPoints` defined so `rwy` becomes the `_exitCollection`
     * SIDS will have `exitPoints` defined so `rwy` becomes the `_entryCollection`
     *
     * @for StandardRouteModel
     * @method _buildEntryAndExitCollections
     * @param standardRoute {object}
     * @private
     */
    _buildEntryAndExitCollections(standardRoute) {
        if (_has(standardRoute, 'entryPoints')) {
            this._entryCollection = this._buildSegmentCollection(standardRoute.entryPoints);
            this._exitCollection = this._buildSegmentCollection(this.rwy);
        } else if (_has(standardRoute, 'exitPoints')) {
            this._entryCollection = this._buildSegmentCollection(this.rwy);
            this._exitCollection = this._buildSegmentCollection(standardRoute.exitPoints);
        } else if (_has(standardRoute, 'rwy')) {
            console.error(`The '${this.icao}' procedure does not contain exitPoints or entryPoints. ` +
                'If this is a SID, at least one exitPoint must be defined. If this is a STAR, at least ' +
                'one entryPoint must be defined.');

            this._entryCollection = this._buildSegmentCollection(standardRoute.rwy);
        }
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
     * @param entrySegment {function}
     * @param bodySegment {function}
     * @param exitSegment {function}
     * @return {array}
     * @private
     */
    _generateFixList = (entrySegment, bodySegment, exitSegment) => {
        // in the event that one of these functions doesnt find a result set it will return an empty array.
        // we leverage then `lodash.compact()` below to remove any empty values from the array before
        // returning the `fixList`.
        // These functions are called synchronously and order of operation is very important here.
        const fixList = [
            ...entrySegment,
            ...bodySegment,
            ...exitSegment
        ];

        return _compact(fixList);
    };

    /**
     * Given an `entryFixName`, find a list of fixes for the `entryPoints` and `body` segments.
     *
     * @for StandardRouteModel
     * @method _findFixListForEntryAndBody
     * @param entryFixName {string}
     * @return {array}
     */
    _findFixListForEntryAndBody(entryFixName) {
        const entrySegment = this._entryCollection.findSegmentByName(entryFixName);

        return [
            ...entrySegment.items,
            ...this._bodySegmentModel.items
        ];
    }

    /**
     * Gather a list of `StandardWaypointModel` objects for a particular route.
     *
     * @for StandardRouteModel
     * @method _findStandardWaypointModelsForRoute
     * @param entry {string}
     * @param exit {string}
     * @return {array<StandardWaypointModel>}
     */
    _findStandardWaypointModelsForRoute(entry, exit) {
        let entrySegmentItems = [];
        let exitSegmentItems = [];

        // TODO: this if is overly defensive. every route should have an entry, body and exit
        if (this._entryCollection) {
            const entrySegment = this._entryCollection.findSegmentByName(entry);

            if (typeof entrySegment === 'undefined') {
                console.error(`Expected 'entry' to exist in the RouteSegmentCollection, but ${this.icao} ` +
                `does not have an entry of ${entry}`);
            }

            entrySegmentItems = _get(entrySegment, 'items', []);
        }

        // TODO: this if is overly defensive. every route should have an entry, body and exit
        if (this._exitCollection) {
            const exitSegment = this._exitCollection.findSegmentByName(exit);

            if (typeof exitSegment === 'undefined') {
                console.error(`Expected 'exit' to exist in the RouteSegmentCollection, but ${this.icao} ` +
                `does not have an exit of ${exit}`);
            }

            exitSegmentItems = _get(exitSegment, 'items', []);
        }

        return this._generateFixList(
            entrySegmentItems,
            this._bodySegmentModel.items,
            exitSegmentItems
        );
    }

    /**
     * Update each `StandardRouteWaypointModel` in the list the with distance from the previous waypoint (as
     * calculated from furthest to closest to destination), and add a reference to that waypoint's name.
     *
     * @for StandardRouteModel
     * @method _updateWaypointsWithPreviousWaypointData
     * @param waypointModelList {array<StandardRouteWaypointModel>}
     * @private
     */
    _updateWaypointsWithPreviousWaypointData(waypointModelList) {
        // Starting iterations at i=1 because we need two waypoints in order to
        // ensure that there is a 'previous' waypoint from which we can measure.
        for (let i = 1; i < waypointModelList.length; i++) {
            const waypoint = waypointModelList[i];
            const previousWaypoint = waypointModelList[i - 1];
            let distance = 0;

            if (!waypoint.isVector && !previousWaypoint.isVector) {
                distance = this.calculateDistanceBetweenWaypoints(
                    waypoint.relativePosition,
                    previousWaypoint.relativePosition
                );
            }

            waypoint.distanceFromPreviousWaypoint = distance;
            waypoint.previousStandardWaypointName = previousWaypoint.name;
        }
    }
}
