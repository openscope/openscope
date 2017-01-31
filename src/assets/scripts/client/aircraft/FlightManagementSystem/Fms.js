import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _map from 'lodash/map';
import LegModel from './LegModel';
import { routeStringFormatHelper } from '../../navigationLibrary/Route/routeStringFormatHelper';
// import {
//     FLIGHT_MODES,
//     FLIGHT_CATEGORY,
//     WAYPOINT_NAV_MODE,
//     FP_LEG_TYPE,
// } from '../../constants/aircraftConstants';

/**
 *
 * This class should always be instantiated from an `AircraftInstanceModel` and
 * always instantiated with some form of a `spawnPatternModel`.
 *
 * @class Fms
 */
export default class Fms {
    /**
     *
     *
     */
    constructor(aircraftInitProps, initialRunwayAssignment, navigationLibrary) {
        if (!_isObject(aircraftInitProps) || _isEmpty(aircraftInitProps)) {
            throw new TypeError('Invalid aircraftInitProps passed to Fms');
        }

        this._navigationLibrary = navigationLibrary;
        this._runway = initialRunwayAssignment;

        this.legCollection = [];

        this.category = '';

        this.init(aircraftInitProps);
    }

    /**
     *
     *
     */
    init(aircraftInitProps) {
        this.category = aircraftInitProps.category;

        this.legCollection = this._buildInitialLegsCollection(aircraftInitProps);
    }

    /**
     *
     *
     */
    destroy() {
        this._navigationLibrary = null;
        this.legCollection = [];
        this.category = '';
    }

    /**
     *
     *
     */
    _buildInitialLegsCollection(aircraftInitProps) {
        const routeStringSegments = routeStringFormatHelper(aircraftInitProps.route);
        const legsForRoute = _map(routeStringSegments, (routeSegment) => new LegModel(routeSegment, this._runway, this._navigationLibrary));

        return legsForRoute;
    }
}
