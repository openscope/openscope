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
     * @return {FixModel|StandardRouteWaypointModel|undefined}
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
        this.legCollection = [];
        this.category = '';
    }

    /**
     *
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
}
