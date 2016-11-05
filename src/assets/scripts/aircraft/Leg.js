import _get from 'lodash/get';
import _has from 'lodash/has';
import _map from 'lodash/map';
import Waypoint from './Waypoint';
import RouteModel from '../airport/Route/RouteModel';
import { FP_LEG_TYPE } from '../constants/aircraftConstants';
import { LOG } from '../constants/logLevel';

/**
  * Build a 'leg' of the route (contains series of waypoints)
  *
  */
export default class Leg {
    /**
     * @param {object} route:           "KSFO.OFFSH9.SXC", either a fix, or with format 'start.procedure.end', or
     *                                  "[RNAV/GPS]" for custom positions
     *                 type: "sid",     can be 'sid', 'star', 'iap', 'awy', 'fix'
     *                 firstIndex: 0    the position (index) in fms.legs to insert this leg
     *
     * @for Leg
     * @constructor
     * @param data
     */
    constructor(data = {}, fms) {
        /**
         *
         *
         * - 'KSFO.OFFSH9.SXC'
         * - 'FAITH'
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
         * Waypoint objects to follow
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
                this._generateWaypointsForIap(data, fms);

                break;
            case FP_LEG_TYPE.AWY:
                // TODO: this is gross. we instantiate route with a string and new mutate it here to a RouteModel.
                this.route = new RouteModel(data.route);
                this._generateWaypointsForAirway(data, fms);

                break;
            case FP_LEG_TYPE.FIX:
                this._generateWaypointForFix(fms);

                break;
            case FP_LEG_TYPE.MANUAL:
                this._generateManualWaypoint(fms);

                break;
            default:
                this._generateEmptyWaypoint(fms);

                break;
        }
    }

    _generateWaypointsForSid(data, fms) {
        if (!fms) {
            log('Attempted to generate waypoints for SID, but cannot because fms ref not passed!', LOG.WARNING);

            return;
        }

        this.waypoints = [];
        // const apt = this.route.split('.')[0];
        // const sid = this.route.split('.')[1];
        // const exit = this.route.split('.')[2];
        const rwy = fms.my_aircraft.rwy_dep;

        // Generate the waypoints
        if (!rwy) {
            const isWarning = true;
            window.uiController.ui_log(
                `${fms.my_aircraft.getCallsign()} unable to fly SID, we haven't been assigned a departure runway!`,
                isWarning
            );

            return;
        }

        const airport = window.airportController.airport_get(this.route.entry);
        const pairs = airport.getSID(this.route.procedure, this.route.exit, rwy);
        const sid = airport.findWaypointModelsForSid(this.route.procedure, this.route.exit, rwy);


        // Remove the placeholder leg (if present)
        if (fms.my_aircraft.wow() && fms.legs.length > 0
            && fms.legs[0].route === window.airportController.airport_get().icao && pairs.length > 0
        ) {
            // remove the placeholder leg, to be replaced below with SID Leg
            fms.legs.splice(0, 1);
        }

        // for each fix/restr pair
        for (let i = 0; i < pairs.length; i++) {
            // fix
            const f = pairs[i][0];
            // altitude
            let a = null;
            // speed
            let s = null;

            if (pairs[i][1]) {
                const a_n_s = pairs[i][1].toUpperCase().split('|');

                for (const j in a_n_s) {
                    if (a_n_s[j][0] === 'A') {
                        a = a_n_s[j].substr(1);
                    } else if (a_n_s[j][0] === 'S') {
                        s = a_n_s[j].substr(1);
                    }
                }
            }

            this.waypoints.push(new Waypoint(
                {
                    fix: f,
                    fixRestrictions: {
                        alt: a,
                        spd: s
                    }
                },
                fms
            ));
        }

        if (!this.waypoints[0].speed) {
            this.waypoints[0].speed = fms.my_aircraft.model.speed.cruise;
        }
    }


    _generateWaypointsForStar(data, fms) {
        if (!fms) {
            log('Attempted to generate waypoints for STAR, but cannot because fms ref not passed!', LOG.WARNING);

            return;
        }

        this.waypoints = [];
        // const entry = this.route.split('.')[0];
        // const star = this.route.split('.')[1];
        // const apt = this.route.split('.')[2];
        const rwy = fms.my_aircraft.rwy_arr;
        const airport = window.airportController.airport_get(this.route.exit);
        const pairs = airport.getSTAR(this.route.procedure, this.route.entry, rwy);
        const star = airport.findWaypointModelsForStar(this.route.procedure, this.route.entry, rwy);

        // Create a new WaypointModel for each fix found in the Star.

        // for each fix/restr pair
        for (let i = 0; i < pairs.length; i++) {
            const f = pairs[i][0];
            let a = null;
            let s = null;

            if (pairs[i][1]) {
                const a_n_s = pairs[i][1].toUpperCase().split('|');

                for (const j in a_n_s) {
                    if (a_n_s[j][0] === 'A') {
                        a = a_n_s[j].substr(1);
                    } else if (a_n_s[j][0] === 'S') {
                        s = a_n_s[j].substr(1);
                    }
                }
            }

            this.waypoints.push(new Waypoint(
                {
                    fix: f,
                    fixRestrictions: {
                        alt: a,
                        spd: s
                    }
                },
                fms
            ));
        }

        if (!this.waypoints[0].speed) {
            this.waypoints[0].speed = fms.my_aircraft.model.speed.cruise;
        }
    }


    _generateWaypointsForIap(data, fms) {
        // NOT IN USE
        return;
    }


    _generateWaypointsForAirway(data, fms) {
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

        // Add list of fixes to this.waypoints
        this.waypoints = [];
        this.waypoints = _map(fixes, (fix) => new Waypoint({ fix }, fms));
    }


    _generateWaypointForFix(fms) {
        this.waypoints = [];
        const waypointToAdd = new Waypoint({ fix: this.route }, fms);

        this.waypoints.push(waypointToAdd);
    }


    _generateManualWaypoint(fms) {
        const waypointToAdd = new Waypoint(this.route, fms);

        this.waypoints.push(waypointToAdd);
    }

    _generateEmptyWaypoint(fms) {
        const waypointToAdd = new Waypoint({ route: '' }, fms);

        this.waypoints = [waypointToAdd];
    }
}
