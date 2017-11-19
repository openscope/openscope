import _chunk from 'lodash/chunk';
import _first from 'lodash/first';
import _isString from 'lodash/isString';
import _last from 'lodash/last';
import _map from 'lodash/map';
import _reduce from 'lodash/reduce';
import LegModel from './LegModel';
import BaseModel from '../../base/BaseModel';
import NavigationLibrary from '../../navigationLibrary/NavigationLibrary';
import { INVALID_INDEX } from '../../constants/globalConstants';
import {
    DIRECT_SEGMENT_DIVIDER,
    PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER
} from '../../constants/routeConstants';

/**
 * Representation of an aircraft's flight plan route
 *
 * This object contains all of the legs and waypoints the FMS will use to navigate.
 * Each instance of an Aircraft has an FMS with a `RouteModel`, that it is able
 * to modify, including adding/removing legs/waypoints, adding/removing waypoint
 * restrictions, absorbing another `RouteModel`, etc.
 *
 * @class RouteModel
 */
export default class RouteModel extends BaseModel {
    /**
     * @for RouteModel
     * @constructor
     * @param navigationLibrary {NavigationLibrary}
     * @param routeString {string}
     */
    constructor(navigationLibrary, routeString) {
        if (!(navigationLibrary instanceof NavigationLibrary)) {
            throw new TypeError(`Expected valid navigationLibrary, but received ${typeof navigationLibrary}`);
        }

        super();

        /**
         * Array of `LegModel`s on the route
         *
         * @for RouteModel
         * @property _legCollection
         * @type {array<LegModel>}
         * @private
         */
        this._legCollection = [];

        /**
         * Local reference to NavigationLibrary
         *
         * @for RouteModel
         * @property _navigationLibrary
         * @type {NavigationLibrary}
         * @private
         */
        this._navigationLibrary = navigationLibrary;

        this.init(routeString);
    }

    /**
     * Iterate through the `#_legCollection` and generate a route string
     * representative of those legs.
     *
     * @for RouteModel
     * @property routeString
     * @type {string}
     */
    get routeString() {
        const legRouteStrings = _map(this._legCollection, (legModel) => legModel.routeString);
        const directRouteSegments = [_first(legRouteStrings)];

        for (let i = 1; i < legRouteStrings.length; i++) {
            const exitOfPreviousLeg = _last(legRouteStrings[i - 1].split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER));
            const leg = legRouteStrings[i];
            const legEntry = _first(leg.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER));

            if (legEntry === exitOfPreviousLeg) {
                const indexOfPreviousLeg = directRouteSegments.length - 1;
                const legRouteStringWithoutEntry = leg.replace(legEntry, '');
                directRouteSegments[indexOfPreviousLeg] += legRouteStringWithoutEntry;

                continue;
            }

            directRouteSegments.push(leg);
        }

        return directRouteSegments.join(DIRECT_SEGMENT_DIVIDER);
    }

    /**
     * Return an array of all waypoints in all legs of the route
     *
     * @for RouteModel
     * @property waypoints
     * @type {array<WaypointModel>}
     */
    get waypoints() {
        return _reduce(this._legCollection, (waypointList, legModel) => {
            return waypointList.concat(legModel.waypoints);
        }, []);
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Initialize class properties
     *
     * @for RouteModel
     * @method init
     * @param routeString {string}
     * @chainable
     */
    init(routeString) {
        this._legCollection = this._generateLegsFromRouteString(routeString);
        this._verifyRouteContainsMultipleWaypoints();

        return this;
    }

    /**
     * Reset class properties
     *
     * @for RouteModel
     * @method reset
     * @chainable
     */
    reset() {
        this._legCollection = [];

        return this;
    }

    // ------------------------------ PUBLIC ------------------------------

    // FIXME: COMPLETE THIS METHOD
    /**
     * Merge the provided route model into this route model, if possible
     *
     * @for RouteModel
     * @method absorbRouteModel
     * @param routeModel {RouteModel}
     */
    absorbRouteModel(/* routeModel */) {
        //
    }

    /**
     * Calculate the heading from the first waypoint to the second waypoint
     *
     * This is used to determine the heading of newly spawned aircraft
     *
     * @for RouteModel
     * @method calculateSpawnHeading
     * @return {number} heading, in radians
     */
    calculateSpawnHeading() {
        const firstWaypointPositionModel = this.waypoints[0].positionModel;
        const secondWaypointPositionModel = this.waypoints[1].positionModel;
        const heading = firstWaypointPositionModel.bearingToPosition(secondWaypointPositionModel);

        return heading;
    }

    /**
     * Return `#routeString` with spaces between elements instead of dot notation
     *
     * @for RouteModel
     * @method getRouteStringWithSpaces
     * @return {string}
     */
    getRouteStringWithSpaces() {
        return this.routeString.replace(DIRECT_SEGMENT_DIVIDER, ' ').replace(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER, ' ');
    }

    // ------------------------------ PRIVATE ------------------------------

    /**
     * Divide a long route string into segments that can be individually represented by a `LegModel`
     *
     * @for RouteModel
     * @method _divideRouteStringIntoSegments
     * @param routeString {string}
     * @return {array<string>}
     * @private
     */
    _divideRouteStringIntoSegments(routeString) {
        if (!_isString(routeString)) {
            throw new TypeError(`Expected routeString's type to be string, but received '${typeof routeString}'`);
        }

        if (routeString.indexOf(' ') !== INVALID_INDEX) {
            throw new TypeError(`Expected a route string that does not contain spaces, but received '${routeString}'`);
        }

        const chainedRouteStrings = routeString.split(DIRECT_SEGMENT_DIVIDER);
        const segmentRouteStrings = [];

        // deal with chained route strings (eg 'KSFO28R.OFFSH9.SXC.V458.IPL')
        for (let i = 0; i < chainedRouteStrings.length; i++) {
            const chainedRouteString = chainedRouteStrings[i];
            const elementsInChain = chainedRouteString.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER);
            const firstSegment = elementsInChain.splice(0, 3);
            const segments = [
                firstSegment,
                ..._chunk(elementsInChain, 2)
            ];

            segmentRouteStrings.push(firstSegment.join(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER));

            for (let j = 1; j < segments.length; j++) {
                const exitOfPreviousSegment = _last(segments[j - 1]);
                const procedureAndExitOfSegment = segments[j].join(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER);

                segmentRouteStrings.push(`${exitOfPreviousSegment}.${procedureAndExitOfSegment}`);
            }
        }

        return segmentRouteStrings;
    }

    /**
     * Generate an array of `LegModel`s according to the provided route string
     *
     * @for RouteModel
     * @method _generateLegsFromRouteString
     * @param routeString {string}
     * @return {array<LegModel>}
     * @private
     */
    _generateLegsFromRouteString(routeString) {
        const segments = this._divideRouteStringIntoSegments(routeString);
        const legs = _map(segments, (segmentRouteString) => {
            return new LegModel(this._navigationLibrary, segmentRouteString);
        });

        return legs;
    }

    /**
     * Verify that this route's legs collectively have at least two waypoints, or throw an error
     *
     * @for RouteModel
     * @method _verifyRouteContainsMultipleWaypoints
     * @private
     */
    _verifyRouteContainsMultipleWaypoints() {
        if (this.waypoints.length < 2) {
            throw new TypeError('Expected RouteModel to have at least two waypoints, but ' +
                `only found ${this.waypoints.length} waypoints`
            );
        }
    }
}
