import _drop from 'lodash/drop';
import _findIndex from 'lodash/findIndex';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _map from 'lodash/map';
import LegModel from './LegModel';
import { routeStringFormatHelper } from '../../navigationLibrary/Route/routeStringFormatHelper';

/**
 *
 * This class should always be instantiated from an `AircraftInstanceModel` and
 * always instantiated with some form of a `spawnPatternModel`.
 *
 * @class Fms
 */
export default class Fms {
    /**
     * @constructor
     * @param aircraftInitProps {object}
     * @param initialRunwayAssignment {string}
     * @param navigationLibrary {NavigationLibrary}
     */
    constructor(aircraftInitProps, initialRunwayAssignment, navigationLibrary) {
        if (!_isObject(aircraftInitProps) || _isEmpty(aircraftInitProps)) {
            throw new TypeError('Invalid aircraftInitProps passed to Fms');
        }

        /**
         *
         *
         * @property _navigationLibrary
         * @type {NavigationLibrary}
         * @private
         */
        this._navigationLibrary = navigationLibrary;

        /**
         *
         *
         * @property _runway
         * @type {string}
         * @private
         */
        this._runway = initialRunwayAssignment;

        /**
         *
         *
         * @property legCollection
         * @type {array}
         * @default []
         */
        this.legCollection = [];

        /**
         *
         *
         * @property category
         * @type {string}
         * @default ''
         */
        this.category = '';

        this.init(aircraftInitProps);
    }

    /**
     *
     *
     * @property currentWaypoint
     * @return {WaypointModel}
     */
    get currentWaypoint() {
        return this.legCollection[0].currentWaypoint;
    }

    /**
     *
     *
     * @property currentLeg
     * @return {LegModel}
     */
    get currentLeg() {
        return this.legCollection[0];
    }

    /**
     *
     *
     * @for Fms
     * @method init
     * @param aircraftInitProps {object}
     */
    init(aircraftInitProps) {
        this.category = aircraftInitProps.category;

        this.legCollection = this._buildInitialLegCollection(aircraftInitProps);
    }

    /**
     *
     *
     * @for LegModel
     * @method destroy
     */
    destroy() {
        this._navigationLibrary = null;
        this._runway = '';
        this.legCollection = [];
        this.category = '';
    }

    /**
     * Add a new `LegModel` to the left side of the `legCollection`
     *
     * @for Fms
     * @method addLegToBeginning
     * @param routeString
     */
    addLegToBeginning(routeString) {
        const legModel = new LegModel(routeString, this._runway, this.category, this._navigationLibrary);

        this.legCollection.unshift(legModel);
    }

    /**
     * Move to the next possible waypoint
     *
     * This could be the next waypoint in the current leg,
     * or the first waypoint in the next leg.
     *
     * @for LegModel
     * @method nextWaypoint
     */
    nextWaypoint() {
        if (!this.currentLeg.hasNextWaypoint()) {
            this._moveToNextLeg();
        }

        this._moveToNextWaypointInLeg();
    }


    /**
     * Given a `waypointName`, find where that waypoint exists within
     * the `#legsColelction` then make that Leg active and `waypointName`
     * the active waypoint for that Leg.
     *
     * @for Fms
     * @method skipToWaypoint
     * @param waypointName {string}
     */
    skipToWaypoint(waypointName) {
        const { legIndex, waypointIndex } = this._findLegAndWaypointIndexForWaypointName(waypointName);

        this.legCollection = _drop(this.legCollection, legIndex);

        this.currentLeg.skipToWaypointAtIndex(waypointIndex);
    }

    /**
     *
     *
     * @for LegModel
     * @method _buildInitialLegCollection
     * @param aircraftInitProps {object}
     * @private
     */
    _buildInitialLegCollection(aircraftInitProps) {
        const { route } = aircraftInitProps;
        const routeStringSegments = routeStringFormatHelper(route);
        const legsForRoute = _map(routeStringSegments, (routeSegment) => {
            return new LegModel(routeSegment, this._runway, this.category, this._navigationLibrary);
        });

        return legsForRoute;
    }

    /**
     *
     *
     * @for Fms
     * @method _moveToNextWaypointInLeg
     * @private
     */
    _moveToNextWaypointInLeg() {
        this.currentLeg.moveToNextWaypoint();
    }

    /**
     *
     * @for Fms
     * @method _moveToNextLeg
     */
    _moveToNextLeg() {
        this.currentLeg.destroy();
        // this is mutable
        this.legCollection.shift();
    }

    /**
     * Loop through the `LegModel`s in the `#legCollection` untill
     * the `waypointName` is found, then return the location indicies
     * for the Leg and Waypoint.
     *
     * Used to adjust `currentLeg` and `currentWaypoint` values by
     * dropping items to the left of these indicies.
     *
     * @for Fms
     * @method _findLegAndWaypointIndexForWaypointName
     * @param waypointName {string}
     * @return {object}
     * @private
     */
    _findLegAndWaypointIndexForWaypointName(waypointName) {
        let legIndex;
        let waypointIndex = -1;

        for (legIndex = 0; legIndex < this.legCollection.length; legIndex++) {
            const legModel = this.legCollection[legIndex];
            waypointIndex = _findIndex(legModel.waypointCollection, { name: waypointName.toLowerCase() });

            if (waypointIndex !== -1) {
                break;
            }
        }

        return {
            legIndex,
            waypointIndex
        };
    }
}
