import _get from 'lodash/get';
import _has from 'lodash/has';
import _map from 'lodash/map';
import Waypoint from './Waypoint';
import { LOG } from '../constants/logLevel';

// can be 'sid', 'star', 'iap', 'awy', 'fix', '[manual]'
/**
 * Enumeration of possibl FLight Plan Leg types.
 *
 * @property FP_LEG_TYPE
 * @type {Object}
 * @final
 */
export const FP_LEG_TYPE = {
    SID: 'sid',
    STAR: 'star',
    IAP: 'iap',
    AWY: 'awy',
    FIX: 'fix',
    MANUAL: '[manual]'
};

/**
  * Build a 'leg' of the route (contains series of waypoints)
  *
  * @param {object} data = {route: "KSFO.OFFSH9.SXC", either a fix, or with format 'start.procedure.end', or
  *                                                   "[RNAV/GPS]" for custom positions
  *                         type: "sid",              can be 'sid', 'star', 'iap', 'awy', 'fix'
  *                         firstIndex: 0}            the position in fms.legs to insert this leg
  */
export default class Leg {
    /**
     * @constructor
     */
    constructor(data = {}, fms) {
        this.route = ''; // eg 'KSFO.OFFSH9.SXC' or 'FAITH'
        this.type = '';
        // TODO: possibly implement as waypointCollection
        this.waypoints = []; // an array of zlsa.atc.Waypoint objects to follow

        // // Fill data with default Leg properties if they aren't specified (prevents wp constructor from getting confused)
        // if (!data.route) {
        //     data.route = this.route;
        // }
        //
        // if (!data.type) {
        //     data.type = this.type;
        // }
        //
        // if (!data.waypoints) {
        //     data.waypoints = this.waypoints;
        // }

        this.parse(data, fms);
    }

    /**
     * Parse input data and apply to this leg
     */
    parse(data, fms) {
        this.route = _get(data, 'route', '[radar vectors]');
        this.type = _get(data, 'type', FP_LEG_TYPE.MANUAL);
        this.waypoints = _get(data, 'waypoints', []);

        if (this.waypoints.length === 0) {
            this.generateWaypoints(data, fms);

            if (this.waypoints.length === 0) {
                this.waypoints = [new Waypoint({ route: '' }, fms)];
            }
        }
    }

    /**
     * Adds Waypoint objects to this Leg, based on the route & type
     */
    generateWaypoints(data, fms) {
        if (!this.type) {
            return;
        }

        switch (this.type) {
            case FP_LEG_TYPE.SID:
                this._generateWaypointsForSid(data, fms);

                break;
            case FP_LEG_TYPE.STAR:
                this._generateWaypointsForStar(data, fms);

                break;
            case FP_LEG_TYPE.IAP:
                // FUTURE FUNCTIONALITY
                this._generateWaypointsForIap(data, fms);

                break;
            case FP_LEG_TYPE.AWY:
                this._generateWaypointsForAirway(data, fms);

                break;
            case FP_LEG_TYPE.FIX:
                this._generateWaypointForFix(fms);

                break;
            default:
                this._generateManualWaypoint(fms);

                break;

        }
    }

    _generateWaypointsForSid(data, fms) {
        if (!fms) {
            log('Attempted to generate waypoints for SID, but cannot because fms ref not passed!', LOG.WARNING);

            return;
        }

        const apt = this.route.split('.')[0];
        const sid = this.route.split('.')[1];
        const exit = this.route.split('.')[2];
        const rwy = fms.my_aircraft.rwy_dep;
        this.waypoints = [];

        // Generate the waypoints
        if (!rwy) {
            const isWarning = true;
            window.uiController.ui_log(
                `${fms.my_aircraft.getCallsign()} unable to fly SID, we haven't been assigned a departure runway!`,
                isWarning
            );

            return;
        }

        const pairs = window.airportController.airport_get(apt).getSID(sid, exit, rwy);

        // Remove the placeholder leg (if present)
        if (fms.my_aircraft.wow() && fms.legs.length > 0
            && fms.legs[0].route === window.airportController.airport_get().icao && pairs.length > 0
        ) {
            // remove the placeholder leg, to be replaced below with SID Leg
            fms.legs.splice(0, 1);
        }

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


    _generateWaypointsForStar(data, fms) {
        if (!fms) {
            log('Attempted to generate waypoints for STAR, but cannot because fms ref not passed!', LOG.WARNING);

            return;
        }

        const entry = this.route.split('.')[0];
        const star = this.route.split('.')[1];
        const apt = this.route.split('.')[2];
        const rwy = fms.my_aircraft.rwy_arr;
        this.waypoints = [];

        // Generate the waypoints
        const pairs = window.airportController.airport_get(apt).getSTAR(star, entry, rwy);

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
        this.waypoints = _map(fixes, (f) => new Waypoint({ fix: f }, fms));
    }


    _generateWaypointForFix(fms) {
        this.waypoints = [];
        this.waypoints.push(new Waypoint({ fix: this.route }, fms));
    }


    _generateManualWaypoint(fms) {
        this.waypoints.push(new Waypoint(this.route, fms));
    }
}
