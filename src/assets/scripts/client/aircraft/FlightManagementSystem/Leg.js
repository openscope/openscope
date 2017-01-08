import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _has from 'lodash/has';
import _map from 'lodash/map';
import Waypoint from './Waypoint';
import RouteModel from '../../airport/Route/RouteModel';
import { FP_LEG_TYPE } from '../../constants/aircraftConstants';
import { LOG } from '../../constants/logLevel';

/**
  * This class acts as a collection of Waypoint model objects.
  *
  * @class Leg
  */
export default class Leg {
    /**
     *
     * @for Leg
     * @constructor
     * @param data
     * @param {object} route:           "KSFO.OFFSH9.SXC", either a fix, or with format 'start.procedure.end', or
     *                                  "[RNAV/GPS]" for custom positions
     *                 type: "sid",     can be 'sid', 'star', 'iap', 'awy', 'fix'
     *                 firstIndex: 0    the position (index) in fms.legs to insert this leg
     */
    constructor(data = {}, fms) {
        /**
         * String representation of a route.
         *
         * May be a single fix or a route expressed in dot notation. ex:
         * - `KSFO.OFFSH9.SXC`
         * - `FAITH`
         *
         * @property route
         * @type {string}
         * @default ''
         */
        this.route = '';

        /**
         * @property type
         * @type {string}
         * @default ''
         */
        this.type = '';

        // TODO: possibly implement as a waypointCollection
        /**
         * A collection of Waypoint instances
         *
         * @property waypoints
         * @type {Array}
         * @default []
         */
        this.waypoints = [];

        this.parse(data, fms);
    }

    /**
     * Parse input data and apply to this leg
     *
     * @for Leg
     * @method parse
     * @param data {object}
     * @param fms {AircraftFlightManagementSystem}
     */
    parse(data, fms) {
        // TODO: move radar vectors to constants file
        this.route = _get(data, 'route', '[radar vectors]');
        this.type = _get(data, 'type', FP_LEG_TYPE.MANUAL);
        this.waypoints = _get(data, 'waypoints', []);

        if (this.waypoints.length === 0) {
            this.generateWaypoints(data, fms);
        }
    }

    /**
     * Adds Waypoint objects to this Leg based on the route type
     *
     * @for Leg
     * @method generateWaypoints
     * @param data {object}
     * @param fms {AircraftFlightManagementSystem}
     */
    generateWaypoints(data, fms) {
        if (!this.type) {
            return;
        }

        const airport = window.airportController.airport_get();

        switch (this.type) {
            case FP_LEG_TYPE.SID:
                // TODO: this is gross. we instantiate route with a string and new mutate it here to a RouteModel.
                this.route = new RouteModel(data.route);
                this._generateWaypointsForSid(data, fms);

                break;
            case FP_LEG_TYPE.STAR:
                // TODO: this is gross. we instantiate route with a string and new mutate it here to a RouteModel.
                this.route = new RouteModel(data.route);
                this._generateWaypointsForStar(data, fms);

                break;
            case FP_LEG_TYPE.IAP:
                // FUTURE FUNCTIONALITY
                this._generateWaypointsForIap(data, airport);

                break;
            case FP_LEG_TYPE.AWY:
                // TODO: this is gross. we instantiate route with a string and new mutate it here to a RouteModel.
                this.route = new RouteModel(data.route);
                this._generateWaypointsForAirway(data, airport);

                break;
            case FP_LEG_TYPE.FIX:
                this._generateWaypointForFix(airport);

                break;
            case FP_LEG_TYPE.MANUAL:
                this._generateManualWaypoint(data, airport);

                break;
            default:
                this._generateEmptyWaypoint(airport);

                break;
        }
    }

    /**
     * Add a new Waypoint to the collection
     *
     * @method addWaypointToLeg
     * @param waypointToAdd {Waypoint}
     */
    addWaypointToLeg(waypointToAdd) {
        if (!(waypointToAdd instanceof Waypoint)) {
            throw new TypeError('Invalid parameter, expecte waypointToAdd to be an instanceof the Waypoint class');
        }

        this.waypoints.push(waypointToAdd);
    }

    /**
     * @for Leg
     * @method _generateWaypointsForSid
     * @param data {object}
     * @param fms {AircraftFlightManagementSystem}
     * @private
     */
    _generateWaypointsForSid(data, fms) {
        if (!fms) {
            log('Attempted to generate waypoints for SID, but cannot because fms ref not passed!', LOG.WARNING);

            return;
        }

        this._resetWaypoints();

        const rwy = fms.my_aircraft.rwy_dep;

        if (!rwy) {
            const isWarning = true;

            window.uiController.ui_log(
                `${fms.my_aircraft.getCallsign()} unable to fly SID, we haven't been assigned a departure runway!`,
                isWarning
            );

            return;
        }

        const airport = window.airportController.airport_get(this.route.entry);
        const waypointsForSid = this._navigationLibrary.sidCollection.findFixModelsForRouteByEntryAndExit(
            this.route.procedure,
            rwy,
            this.route.exit
        );

        // TODO: refactor/abstract this boolean logic
        // Remove the placeholder leg (if present)
        if (fms.my_aircraft.isOnGround() &&
            fms.legs.length > 0 &&
            fms.legs[0].route === airport.icao
        ) {
            // remove the placeholder leg, to be replaced below with SID Leg
            fms.legs.splice(0, 1);
        }

        for (let i = 0; i < waypointsForSid.length; i++) {
            const waypointToAdd = waypointsForSid[i].generateFmsWaypoint(airport);

            this.addWaypointToLeg(waypointToAdd);
        }

        if (!this.waypoints[0].speed) {
            this.waypoints[0].speed = fms.my_aircraft.model.speed.cruise;
        }
    }

    /**
     * @for Leg
     * @method _generateWaypointsForStar
     * @param data {object}
     * @param fms {AircraftFlightManagementSystem}
     * @private
     */
    _generateWaypointsForStar(data, fms) {
        if (!fms) {
            log('Attempted to generate waypoints for STAR, but cannot because fms ref not passed!', LOG.WARNING);

            return;
        }

        this._resetWaypoints();

        const rwy = fms.my_aircraft.rwy_arr;
        const airport = window.airportController.airport_get(this.route.exit);
        const waypointsForStar = fms.findWaypointModelsForStar(this.route.procedure, this.route.entry, rwy);

        for (let i = 0; i < waypointsForStar.length; i++) {
            const waypointToAdd = waypointsForStar[i].generateFmsWaypoint(airport);

            this.addWaypointToLeg(waypointToAdd);
        }

        if (!this.waypoints[0].speed) {
            this.waypoints[0].speed = fms.my_aircraft.model.speed.cruise;
        }
    }

    // NOT IN USE
    _generateWaypointsForIap(data, airport) {
        return;
    }

    // NOT IN USE
    /**
     * @for Leg
     * @method _generateWaypointsForAirway
     * @param data {object}
     * @param fms {AircraftFlightManagementSystem}
     * @private
     */
    _generateWaypointsForAirway(data, airport) {
        const start = this.route.split('.')[0];
        const airway = this.route.split('.')[1];
        const end = this.route.split('.')[2];
        // Verify airway is valid
        const apt = window.airportController.airport_get();

        if (!_has(apt, 'airways') || !_has(apt.airways, 'airway')) {
            log(`Airway ${airway} not defined at ${apt.icao}`, LOG.WARNING);
            return;
        }

        // Verify start/end points are along airway
        const awy = apt.airways[airway];
        if (!(awy.indexOf(start) !== -1 && awy.indexOf(end) !== -1)) {
            log(`Unable to follow ${airway} from ${start} to ${end}`, LOG.WARNING);
            return;
        }

        // TODO: abstract this logic
        // Build list of fixes, depending on direction traveling along airway
        const fixes = [];
        const readFwd = (awy.indexOf(end) > awy.indexOf(start));

        if (readFwd) {
            for (let f = awy.indexOf(start); f <= awy.indexOf(end); f++) {
                fixes.push(awy[f]);
            }
        } else {
            for (let f = awy.indexOf(start); f >= awy.indexOf(end); f--) {
                fixes.push(awy[f]);
            }
        }

        this._resetWaypoints();

        _forEach(fixes, (fix) => {
            const waypointToAdd = new Waypoint({ fix }, airport);

            this.addWaypointToLeg(waypointToAdd);
        });
    }

    /**
     * @for Leg
     * @method _generateWaypointForFix
     * @param airport {AirportInstanceModel}
     * @private
     */
    _generateWaypointForFix(airport) {
        this._resetWaypoints();

        const waypointToAdd = new Waypoint({ fix: this.route }, airport);

        this.addWaypointToLeg(waypointToAdd);
    }

    /**
     * @for Leg
     * @method _generateManualWaypoint
     * @param airport {AirportInstanceModel}
     * @private
     */
    _generateManualWaypoint(data, airport) {
        const waypointToAdd = new Waypoint(data, airport);

        this.addWaypointToLeg(waypointToAdd);
    }

    /**
     * @for Leg
     * @method _generateEmptyWaypoint
     * @param airport {AirportInstanceModel}
     * @private
     */
    _generateEmptyWaypoint(airport) {
        const waypointToAdd = new Waypoint({ route: '' }, airport);

        this.addWaypointToLeg(waypointToAdd);
    }

    /**
     * Reset the waypoint property to an empty array.
     *
     * Provides a single method that encapsulates common functionality that
     * can be used throughout the class.
     *
     * @for Leg
     * @method _resetWaypoints
     * @private
     */
    _resetWaypoints() {
        this.waypoints = [];
    }
}
