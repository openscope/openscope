import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
// import { routeStringFormatHelper } from '../../navigationLibrary/Route/routeStringFormatHelper';
// import {
//     FLIGHT_MODES,
//     FLIGHT_CATEGORY,
//     WAYPOINT_NAV_MODE,
//     FP_LEG_TYPE,
// } from '../../constants/aircraftConstants';

/**
 *
 * This class should always be instantiated from an `AircraftInstanceModel` and
 * always isntantiated with some form of a `spawnPatternModel`.
 *
 * @class Fms
 */
export default class Fms {
    construtor(spawnPattern, airport, navigationLibrary) {
        if (!_isObject(spawnPattern) || !_isEmpty(spawnPattern)) {
            throw new TypeError('Invalid spawnPattern passed to Fms');
        }

        this._navigationLibrary = navigationLibrary;
        this._airportModel = airport;

        this.legsCollection = [];

        // oneOf FLIGHT_CATEGORY
        this.category = '';
        this.mode = '';



        this.init(spawnPattern);
    }

    init() {
        this.category = spawnPattern.category;

        // extract direct and procedure route strings from spawnPattern
    }

    destroy() {}
}
