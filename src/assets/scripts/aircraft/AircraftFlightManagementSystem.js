import $ from 'jquery';
import _find from 'lodash/find';
import _last from 'lodash/last';
import _map from 'lodash/map';
import _isNil from 'lodash/isNil';
import Waypoint from './Waypoint';
import Leg from './Leg';
import RouteModel from '../airport/Route/RouteModel';
import { clamp } from '../math/core';
import {
    FP_LEG_TYPE,
    FLIGHT_CATEGORY,
    WAYPOINT_NAV_MODE
} from '../constants/aircraftConstants';
import { LOG } from '../constants/logLevel';

/**
 * Enumeration of the Leg index in `this.current`
 *
 * @property
 * @type {number}
 * @final
 */
const LEG = 0;

/**
 * Enumeration of the Waypoint within leg index in `this.current`
 *
 * @property
 * @type {number}
 * @final
 */
const WAYPOINT_WITHIN_LEG = 1;

/**
  * Manage current and future aircraft waypoints
  *
  * waypoint navmodes
  * -----------------
  * May be one of null, "fix", "heading", "hold", "rwy"
  *
  * * null is assigned, if the plane is not actively following an
  *    objective. This is only the case, if a plane enters the airspace
  *    or an action has been aborted and no new command issued
  *
  * * "fix" is assigned, if the plane is heading for a fix. In this
  *    case, the attribute request.fix is used for navigation
  *
  * * "heading" is assigned, if the plane was given directive to follow
  *    the course set out by the given heading. In this case, the
  *    attributes request.heading and request.turn are used for
  *    navigation
  *
  * * "hold" is assigned, if the plane should hold its position. As
  *    this is archieved by continuously turning, request.turn is used
  *    in this case
  *
  * * "rwy" is assigned, if the plane is heading for a runway. This is
  *    only the case, if the plane was issued the command to land. In
  *    this case, request.runway is used
  *
  * @class AircraftFlightManagementSystem
 */
export default class AircraftFlightManagementSystem {
    /**
     * @for AircraftFlightManagementSystem
     * @constructor
     * @param options {object}
     */
    constructor(options) {
        /**
         * @property may_aircrafts_eid
         * @type {number}
         * @default options.aircraft.eid
         */
        this.my_aircrafts_eid = options.aircraft.eid;

        // TODO: we should remove this reference and instead supply methods that the aircraft can call via the fms
        /**
         * @property my_aircraft
         * @type {AircrafInstanceModel}
         * @default options.aircraft
         */
        this.my_aircraft = options.aircraft;

        /**
         * @property legs
         * @type {array}
         * @default []
         */
        this.legs = [];

        /**
         * Current indicies for Leg and Waypoint within that Leg.
         *
         * [current_Leg, current_Waypoint_within_that_Leg]
         *
         * @property current
         * @type {array}
         * @default [0, 0]
         */
        this.current = [0, 0];

        // TODO: possible model object here
        /**
         * @property fp
         * @type {object}
         */
        this.fp = {
            altitude: null,
            route: []
        };

        // TODO: possible model object here
        /**
         * @property following
         * @type {object}
         */
        this.following = {
            sid: null,         // Standard Instrument Departure Procedure
            star: null,        // Standard Terminal Arrival Route Procedure
            iap: null,         // Instrument Approach Procedure (like ILS, GPS, RNAV, VOR-A, etc)
            awy: null,         // Airway (V, J, T, Q, etc.)
            tfc: null,         // Traffic (another airplane)
            anything: false    // T/F flag for if anything is being "followed"
        };

        // TODO: this doesn't belong in the constructor
        // TODO: enumerate the magic numbers
        // set initial altitude
        this.fp.altitude = clamp(1000, options.model.ceiling, 60000);

        if (options.aircraft.category === FLIGHT_CATEGORY.ARRIVAL) {
            this.prependLeg({ route: 'UNASSIGNED' });
        } else if (options.aircraft.category === FLIGHT_CATEGORY.DEPARTURE) {
            this.prependLeg({ route: window.airportController.airport_get().icao });
        }

        this.update_fp_route();
    }

    /** ***************** FMS FLIGHTPLAN CONTROL FUNCTIONS *******************/

    /**
     * Insert a Leg at the front of the flightplan
     */
    prependLeg(data) {
        const prev = this.currentWaypoint;
        const legToAdd = new Leg(data, this);

        this.legs.unshift(legToAdd);
        this.update_fp_route();

        // TODO: these if blocks a repeated elsewhere, perhaps currentWaypoint can handle this logic?
        // Verify altitude & speed not null
        const curr = this.currentWaypoint;
        if (prev && !curr.altitude) {
            curr.altitude = prev.altitude;
        }

        if (prev && !curr.speed) {
            curr.speed = prev.speed;
        }
    }

    /**
     * Insert a waypoint at current position and immediately activate it
     */
    insertWaypointHere(data) {
        const airport = window.airportController.airport_get();
        const prev = this.currentWaypoint;

        // TODO: split this up into smaller chunks
        this.currentLeg.waypoints.splice(this.current[WAYPOINT_WITHIN_LEG], 0, new Waypoint(data, airport));
        this.update_fp_route();

        // TODO: these if blocks a repeated elsewhere, perhaps currentWaypoint can handle this logic?
        // Verify altitude & speed not null
        const curr = this.currentWaypoint;
        if (prev && !curr.altitude) {
            curr.altitude = prev.altitude;
        }

        if (prev && !curr.speed) {
            curr.speed = prev.speed;
        }
    }

    /**
     * Insert a Leg at a particular position in the flightplan
     * Note: if no position passed in, defaults to add to the end
     */
    insertLeg(data) {
        // TODO: reassigining data here is dangerous.
        if (data.firstIndex == null) {
            data.firstIndex = this.legs.length;
        }

        const prev = this.currentWaypoint;
        // TODO: split up into smaller chunks
        this.legs.splice(data.firstIndex, 0, new Leg(data, this));

        this.update_fp_route();

        // Adjust 'current'
        if (this.current[LEG] >= data.firstIndex) {
            this.current[WAYPOINT_WITHIN_LEG] = 0;
        }

        // TODO: these if blocks a repeated elsewhere, perhaps currentWaypoint can handle this logic?
        // Verify altitude & speed not null
        const curr = this.currentWaypoint;
        if (prev && !curr.altitude) {
            curr.altitude = prev.altitude;
        }

        if (prev && !curr.speed) {
            curr.speed = prev.speed;
        }
    }

    /**
     * Insert a Leg at current position immediately activate it
     */
    insertLegHere(data) {
        // index of current leg
        data.firstIndex = this.current[LEG];
        // put new Leg at current position
        this.insertLeg(data);
        // start at first wp in this new leg
        this.current[WAYPOINT_WITHIN_LEG] = 0;
    }

    /**
     *  Insert a Leg at the end of the flightplan
     */
    appendLeg(data) {
        // TODO: split this up into smaller chunks
        this.legs.push(new Leg(data, this));
        this.update_fp_route();
    }

    /**
     *  Insert a waypoint after the *current* waypoint
     */
    appendWaypoint(data) {
        const airport = window.airportController.airport_get();
        // TODO: split this up into smaller chunks
        this.currentLeg.waypoints.splice(this.current[WAYPOINT_WITHIN_LEG] + 1, 0, new Waypoint(data, airport));
        this.update_fp_route();
    }

    /**
     *  Switch to the next waypoint
     */
    nextWaypoint() {
        const prev = this.currentWaypoint;
        const leg = this.current[LEG];
        const wp = this.current[WAYPOINT_WITHIN_LEG] + 1;

        if (wp < this.legs[leg].waypoints.length) {
            // look to next waypoint in current leg
            this.current[WAYPOINT_WITHIN_LEG]++;
        } else if (leg + 1 < this.legs.length) {
            // look to the next leg
            this.current[LEG]++;
            this.current[WAYPOINT_WITHIN_LEG] = 0;  // look to the first waypoint of that leg
        }

        // TODO: these if blocks a repeated elsewhere, perhaps currentWaypoint can handle this logic?
        // Replace null values with current values
        const curr = this.currentWaypoint;
        if (prev && !curr.altitude) {
            curr.altitude = prev.altitude;
        }

        if (prev && !curr.speed) {
            curr.speed = prev.speed;
        }

        if (!curr.heading && curr.navmode === WAYPOINT_NAV_MODE.HEADING) {
            curr.heading = prev.heading;
        }
    }

    /**
     *  Switch to the next Leg
     */
    nextLeg() {
        const prev = this.currentWaypoint;
        this.current[LEG]++;
        this.current[WAYPOINT_WITHIN_LEG] = 0;

        // TODO: these if blocks a repeated elsewhere, perhaps currentWaypoint can handle this logic?
        // Replace null values with current values
        const curr = this.currentWaypoint;
        if (prev && !curr.altitude) {
            curr.altitude = prev.altitude;
        }

        if (prev && !curr.speed) {
            curr.speed = prev.speed;
        }

        if (!curr.heading && curr.navmode === WAYPOINT_NAV_MODE.HEADING) {
            curr.heading = prev.heading;
        }
    }

    /**
     * Skips to the given waypoint
     * @param {string} name - the name of the fix to skip to
     */
    skipToFix(name) {
        const prev = this.currentWaypoint;

        // TODO: these nested for loops should be simplified
        for (let l = 0; l < this.legs.length; l++) {
            for (let w = 0; w < this.legs[l].waypoints.length; w++) {
                if (this.legs[l].waypoints[w].fix === name) {
                    this.current = [l, w];

                    // TODO: these if blocks a repeated elsewhere, perhaps currentWaypoint can handle this logic?
                    // Verify altitude & speed not null
                    const curr = this.currentWaypoint;
                    if (prev && !curr.altitude) {
                        curr.altitude = prev.altitude;
                    }

                    if (prev && !curr.speed) {
                        curr.speed = prev.speed;
                    }

                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Modify all waypoints
     */
    setAll(data) {
        // TODO: refactor this, what is actually happening here?
        for (let i = 0; i < this.legs.length; i++) {
            for (let j = 0; j < this.legs[i].waypoints.length; j++) {
                for (const k in data) {
                    this.legs[i].waypoints[j][k] = data[k];
                }
            }
        }
    }

    /**
     * Modify the current waypoint
     */
    setCurrent(data) {
        // TODO: refactor this, what is actually happening here?
        for (const i in data) {
            this.currentWaypoint[i] = data[i];
        }
    }

    /**
     * Updates fms.fp.route to correspond with the fms Legs
     */
    update_fp_route() {
        const flightPlanRoute = [];

        for (let i = 0; i < this.legs.length; i++) {
            const leg = this.legs[i];

            if (!leg.type) {
                continue;
            }

            // FIXME: replace the string splitting with the `RouteModel` class methods
            switch (leg.type) {
                case FP_LEG_TYPE.SID:
                    // departure airport
                    flightPlanRoute.push(leg.route.entry);
                    // 'sidname.exitPoint'
                    flightPlanRoute.push(`${leg.route.procedure}.${leg.route.exit}`);

                    break;
                case FP_LEG_TYPE.STAR:
                    // 'entryPoint.starname.exitPoint'
                    flightPlanRoute.push(`${leg.route.entry}.${leg.route.procedure}`);
                    // arrival airport
                    flightPlanRoute.push(leg.route.exit);

                    break;
                case FP_LEG_TYPE.IAP:
                    // no need to include these in flightplan (because wouldn't happen in real life)
                    break;
                case FP_LEG_TYPE.AWY:
                    const previousFlightPlanRoute = flightPlanRoute[flightPlanRoute.length - 1];

                    if (previousFlightPlanRoute !== leg.route.split('.')[0]) {
                        flightPlanRoute.push(leg.route.split('.')[0]); // airway entry fix
                        flightPlanRoute.push(leg.route.split('.')[1]); // airway identifier
                        flightPlanRoute.push(leg.route.split('.')[2]); // airway exit fix
                    }

                    break;
                case FP_LEG_TYPE.FIX:
                    // this is just a fixname
                    flightPlanRoute.push(leg.route);

                    break;
                case FP_LEG_TYPE.MANUAL:
                    // no need to include these in flightplan (because wouldn't happen in real life)
                    break;
                default:
                    break;
            }

            // TODO: this should be first and return early
            if (flightPlanRoute.length === 0) {
                flightPlanRoute.push(this.legs[0].route);
            }
        }

        this.fp.route = flightPlanRoute;
    }

    /**
     * Calls various task-based functions and sets 'fms.following' flags
     */
    followCheck() {
        const leg = this.currentLeg;
        this.following.anything = true;

        // tODO replace the string splitting with the `RouteModel`
        switch (leg.type) {
            case FP_LEG_TYPE.SID:
                this.following.sid = leg.route.procedure;
                break;
            case FP_LEG_TYPE.STAR:
                this.following.star = leg.route.procedure;
                break;
            case FP_LEG_TYPE.IAP:
                // *******NEEDS TO BE FINISHED***************************
                // this.following.iap = ;
                break;
            case 'tfc':
                // **FUTURE FUNCTIONALITY**
                // this.following.anything = true;
                // this.following.tfc = // EID of the traffic we're following
                break;
            case FP_LEG_TYPE.AWY:
                // **FUTURE FUNCTIONALITY**
                this.following.awy = leg.route.split('.')[1];
                break;
            default:
                this.followClear();
                return false;
        }

        return this.following;
    }

    // TODO: rename to something more accurate like `resetFollowingType`
    /**
     * Clears any current follows by updating the 'fms.following' flags
     */
    followClear() {
        this.following = {
            sid: null,
            star: null,
            iap: null,
            awy: null,
            tfc: null,
            anything: false
        };
    }

    /**
     * Join an instrument approach (eg. ILS/GPS/RNAV/VOR/LAAS/etc)
     *
     * @param {string} type - the type of approach (like "ils")
     * @param {Runway} rwy - the Runway object the approach ends into
     * @param {string} variant - (optional) for stuff like "RNAV-Z 17L"
     */
    followApproach(type, rwy, variant) {
      // Note: 'variant' is set up to pass to this function, but is not used here yet.
        if (type === 'ils') {
            this.my_aircraft.cancelFix();
            // TODO: this looks like a model object
            this.setCurrent({
                navmode: 'rwy',
                runway: rwy.toUpperCase(),
                turn: null,
                start_speed: this.my_aircraft.speed
            });
        }
      // if-else all the other approach types here...
      // ILS, GPS, RNAV, VOR, NDB, LAAS/WAAS, MLS, etc...
    }

    /**
     * Inserts the SID as the first Leg in the fms's flightplan
     */
    followSID(route) {
        for (let i = 0; i < this.legs.length; i++) {
            // sid assigned after taking off without SID
            if (this.legs[i].route === window.airportController.airport_get().icao) {
                // remove the manual departure leg
                this.legs.splice(i, 1);
            } else if (this.legs[i].type === FP_LEG_TYPE.SID) {
                // check to see if SID already assigned
                // remove the old SID
                this.legs.splice(i, 1);
            }
        }

        // Add the new SID Leg
        this.prependLeg({
            type: FP_LEG_TYPE.SID,
            route: route
        });

        this.setAll({
            altitude: Math.max(window.airportController.airport_get().initial_alt, this.my_aircraft.altitude)
        });
    }

    /**
     * Inserts the STAR as the last Leg in the fms's flightplan
     */
    followSTAR(route) {
        for (let i = 0; i < this.legs.length; i++) {
            if (this.legs[i].type === FP_LEG_TYPE.STAR) {
                // check to see if STAR already assigned
                this.legs.splice(i, 1);  // remove the old STAR
            }
        }

        // Add the new STAR Leg
        this.appendLeg({ type: FP_LEG_TYPE.STAR, route: route });
    }

    // TODO: move this logic to the `RouteModel`
    /**
     * Takes a single-string route and converts it to a segmented route the fms can understand
     *
     * Note: Input Data Format : "KSFO.OFFSH9.SXC.V458.IPL.J2.JCT..LLO..ACT..KACT"
     *       Return Data Format: ["KSFO.OFFSH9.SXC", "SXC.V458.IPL", "IPL.J2.JCT", "LLO", "ACT", "KACT"]
     */
    formatRoute(data) {
        const routeModel = new RouteModel(data);

        // Format the user's input
        let route = [];
        // const ap = airport_get;
        const fixOK = window.airportController.airport_get().getFix;

        if (data.indexOf(' ') !== -1) {
            return; // input can't contain spaces
        }

        // TODO: this should be reassigned and returned instead of operating on the passed in paramater
        // split apart "direct" pieces
        data = data.split('..');

        // TODO: This block needs some work. the logic could be simplified.
        // deal with multilinks (eg 'KSFO.OFFSH9.SXC.V458.IPL')
        for (let i = 0; i < data.length; i++) {
            let a;

            if (data[i].split('.').length === 1) {
                if (!fixOK(data[i])) {
                    return;
                }

                // just a fix/navaid
                route.push(data[i]);
                continue;
            } else {
                // is a procedure, eg SID, STAR, IAP, airway, etc.
                if (data[i].split('.').length % 2 !== 1) {
                    // user either didn't specify start point or end point
                    return;
                } else {
                    // TODO: this should be abstracted to another class method.
                    const pieces = data[i].split('.');
                    // FIXME: what does 'a' mean? better naming
                    a = [pieces[0] + '.' + pieces[1] + '.' + pieces[2]];

                    // chop up the multilink
                    for (let j = 3; j < data[i].split('.').length; j + 2) {
                        if (!fixOK(pieces[0]) || !fixOK(pieces[2])) {
                            return;  // invalid join/exit points
                        }

                        if (!Object.keys(ap().sids).indexOf(pieces[1]) ||
                            !Object.keys(ap().airways).indexOf(pieces[1])) {
                            // invalid procedure
                            return;
                        }

                        a.push(pieces[j - 1] + '.' + pieces[j] + pieces[j + 1]);
                    }
                }
            }

            // push the properly reformatted multilink
            route = route.concat(a);
        }

        return route;
    }

    // TODO: refactor this to use `RouteModel` and possibly a `LegsCollection` class
    /**
     * Take an array of leg routes and build the legs that will go into the fms
     * @param {array} route - an array of properly formatted route strings
     *                        Example: ["KSFO.OFFSH9.SXC", "SXC.V458.IPL",
     *                                 "IPL.J2.JCT", "LLO", "ACT", "KACT"]
     * @param {boolean} fullRouteClearance - set to true IF you want the provided route to completely
     *                                       replace the current contents of 'this.legs'
     */
    customRoute(route, fullRouteClearance) {
        // save the current waypoint
        const curr = this.currentWaypoint;

        const legs = [];

        for (let i = 0; i < route.length; i++) {
            const routeSections = route[i].split('.');

            // just a fix/navaid
            if (routeSections.length === 1) {
                const legToAdd = new Leg({ type: FP_LEG_TYPE.FIX, route: route[i] }, this);

                legs.push(legToAdd);
            } else if (routeSections.length === 3) {
                const routeModel = new RouteModel(route[i]);
                const currentAirport = window.airportController.airport_get();

                if (!_isNil(currentAirport.sidCollection.findRouteByIcao(routeModel.procedure))) {
                    // it's a SID!
                    const legToAdd = new Leg({ type: FP_LEG_TYPE.SID, route: routeModel.routeString }, this);

                    legs.push(legToAdd);
                } else if (!_isNil(currentAirport.starCollection.findRouteByIcao(routeModel.procedure))) {
                    // it's a STAR!
                    const legToAdd = new Leg({ type: FP_LEG_TYPE.STAR, route: routeModel.routeString }, this);

                    legs.push(legToAdd);
                } else if (Object.keys(window.airportController.airport_get().airways).indexOf(routeModel.procedure) > -1) {
                    // it's an airway!
                    const legToAdd = new Leg({ type: FP_LEG_TYPE.AWY, route: routeModel.routeString }, this);

                    legs.push(legToAdd);
                }
            } else {
                // neither formatted like "JAN" nor "JAN.V18.MLU"
                log(`Passed invalid route to fms. Unable to create leg from input: ${route[i]}`, LOG.WARNING);
                return false;
            }
        }

        // TODO: this should be its own method
        // TODO: this could be simplified. there is a lot of branching logic here that makes this block tough to follow.
        // insert user's route to the legs
        if (!fullRouteClearance) {
            // Check if user's route hooks up to the current Legs anywhere
            const pieces = legs[legs.length - 1].route.split('.');
            const last_fix = pieces[pieces.length - 1];
            const continuity = this.indexOfWaypoint(last_fix);

            // user route connects with existing legs
            if (continuity) {
                const inMiddleOfLeg = continuity.lw[1] !== this.legs[continuity.lw[0]].waypoints.length - 1;
                const legsToRemove = Math.max(0, continuity.lw[0] - inMiddleOfLeg - this.current[LEG]);

                if (inMiddleOfLeg) { // change the existing leg @ merge point
                    // Remove the waypoints before the merge point
                    this.legs[continuity.lw[0]].waypoints.splice(0, continuity.lw[1]);
                    const r = this.legs[continuity.lw[0]].route.split('.');

                    // TODO: this should be a helper method
                    // Update the leg's route to reflect the change
                    this.legs[continuity.lw[0]].route = last_fix + '.' + r[1] + '.' + r[2];
                }

                // remove old legs before the point where the two routes join
                this.legs.splice.apply(this.legs, [Math.max(0, continuity.lw[0] - legsToRemove), legsToRemove].concat(legs));
                // move to the newly inserted Leg
                this.current[LEG] = Math.max(0, continuity.lw[0] - legsToRemove);
                this.current[WAYPOINT_WITHIN_LEG] = 0;
            } else {
                // no route continuity... just adding legs
                // insert the legs after the active Leg
                this.legs.splice.apply(this.legs, [this.current[LEG] + 1, 0].concat(legs));
                this.nextLeg();
            }
        } else {
            // TODO: move up and return early
            // replace all legs with the legs we've built here in this function
            this.legs = legs;
            this.current = [0, 0]; // look to beginning of route
        }

        this.update_fp_route();

        // Maintain old speed and altitude
        if (this.currentWaypoint.altitude == null) {
            this.setCurrent({ altitude: curr.altitude });
        }

        if (this.currentWaypoint.speed == null) {
            this.setCurrent({ speed: curr.speed });
        }

        return true;
    }

    /**
     * Climbs aircraft in compliance with the SID they're following
     * Adds altitudes and speeds to each waypoint that are as high as
     * possible without exceeding any the following:
     *    - (alt) airspace ceiling ('ctr_ceiling')
     *    - (alt) filed cruise altitude
     *    - (alt) waypoint's altitude restriciton
     *    - (spd) 250kts when under 10k ft
     *    - (spd) waypoint's speed restriction
     */
    climbViaSID() {
        if (this.currentLeg.type !== FP_LEG_TYPE.SID) {
            return false;
        }

        const wp = this.currentLeg.waypoints;
        const cruise_alt = this.fp.altitude;
        const cruise_spd = this.my_aircraft.model.speed.cruise;

        for (let i = 0; i < wp.length; i++) {
            const waypoint = wp[i];
            const { ctr_ceiling } = window.airportController.airport_get();

            waypoint.setAltitude(ctr_ceiling, cruise_alt);
            waypoint.setSpeed(cruise_spd);
        }

        return true;
    }

    /**
     * Descends aircraft in compliance with the STAR they're following
     * Adds altitudes and speeds to each waypoint in accordance with the STAR
     */
    descendViaSTAR() {
        const waypointList = this.getStarLegWaypoints();

        // TODO: would a star leg ever not have waypoints?
        if (!waypointList) {
            return;
        }

        let start_alt = this.currentWaypoint.altitude || this.my_aircraft.altitude;
        let start_spd = this.currentWaypoint.speed || this.my_aircraft.model.speed.cruise;

        for (let i = 0; i < waypointList.length; i++) {
            const waypoint = waypointList[i];
            const previousWaypoint = waypointList[i - 1];

            if (i >= 1) {
                start_alt = previousWaypoint.altitude;
                start_spd = previousWaypoint.speed;
            }

            waypoint.setAltitude(null, start_alt);
            waypoint.setSpeed(start_spd);
        }

        return true;
    }

    /** ************************ FMS QUERY FUNCTIONS **************************/
    /**
     * True if waypoint of the given name exists
     */
    hasWaypoint(name) {
        // TODO: lodash will simplify this logic block
        for (let i = 0; i < this.legs.length; i++) {
            for (let j = 0; j < this.legs[i].waypoints.length; j++) {
                if (this.legs[i].waypoints[j].fix === name) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Returns object's position in flightplan as object with 2 formats
     *
     * @param {string} fix - name of the fix to look for in the flightplan
     * @returns {wp: "position-of-fix-in-waypoint-list",
     *           lw: "position-of-fix-in-leg-wp-matrix"}
     */
    indexOfWaypoint(fix) {
        let wp = 0;

        for (let l = 0; l < this.legs.length; l++) {
            for (let w = 0; w < this.legs[l].waypoints.length; w++) {
                if (this.legs[l].waypoints[w].fix === fix) {
                    // TODO: what do wp and lw stand for?
                    return {
                        wp: wp,
                        lw: [l, w]
                    };
                }

                wp++;
            }
        }

        return false;
    }

    /**
     * Returns currentWaypoint's position in flightplan as object with 2 formats
     * @returns {wp: "position-of-fix-in-waypoint-list",
     *           lw: "position-of-fix-in-leg-wp-matrix"}
     */
    indexOfCurrentWaypoint() {
        let wp = 0;
        for (let i = 0; i < this.current[LEG]; i++) {
            // add wp's of completed legs
            wp += this.legs[i].waypoints.length;
        }

        wp += this.current[WAYPOINT_WITHIN_LEG];

        // TODO: what do wp and lw stand for?
        return {
            wp: wp,
            lw: this.current
        };
    }

    /** ************************* FMS GET FUNCTIONS ***************************/

    get currentLeg() {
        return this.legs[this.current[LEG]];
    }

    get currentWaypoint() {
        if (this.legs.length < 1) {
            return null;
        }

        const currentLeg = this.currentLeg;

        return currentLeg.waypoints[this.current[WAYPOINT_WITHIN_LEG]];
    }

    /**
    * Returns an array of all fixes along the flightplan route
    */
    fixes() {
        return _map(this.waypoints(), (w) => w.fix);
    }

    /**
     * Return this fms's parent aircraft
     */
    my_aircraft() {
        // TODO: if we already have a ref to the current aircraft, `this.my_aircraft`, why are we getting it again here?
        return window.aircraftController.aircraft_get(this.my_aircrafts_eid);
    }

    /**
     * Returns a waypoint at the provided position
     *
     * @method waypoint
     * @param {array or number} pos - position of the desired waypoint. May be
     *                          provided either as an array showing the leg and
     *                          waypoint within the leg (eg [l,w]), or as the
     *                          number representing the position of the desired
     *                          waypoint in the list of all waypoints (running
     *                          this.waypoints() will return the list)
     * @returns {Waypoint} - the Waypoint object at the specified location
     */
    waypoint(pos) {
        // input is like [leg, waypointWithinLeg]
        if (Array.isArray(pos)) {
            return this.legs[pos[0]].waypoints[pos[1]];
        } else if (typeof pos === 'number') {
            // input is a position of wp in list of all waypoints
            let l = 0;

            // count up to pos to locate the waypoint
            while (pos >= 0) {
                if (this.legs[l].waypoints.length <= pos) {
                    pos -= this.legs[l].waypoints.length;
                    l++;
                } else {
                    return this.legs[l].waypoints[pos];
                }
            }
        }

        return;
    }

    /**
     * Find a leg with type `star` and return that leg's waypoints.
     *
     * @method getSt
     * @return {array<Waypoint>}
     */
    getStarLegWaypoints() {
        const starLeg = _find(this.legs, { type: FP_LEG_TYPE.STAR });

        return starLeg.waypoints || [];
    }

    /**
    * Returns all waypoints in fms, in order
    */
    waypoints() {
        // TODO: move to _map() or refactor
        // TODO: there is a better way to do this with lodash
        const waypointList = $.map(this.legs, (v) => v.waypoints);

        return waypointList;
    }

    atLastWaypoint() {
        // TODO: simplify
        return this.indexOfCurrentWaypoint().wp === this.waypoints().length - 1;
    }

    /**
     * Given a SID that is currently being followed, return a string of: `SID_NAME.LAST_FIX`
     *
     * ex:
     * - current SID name = OFFSH9
     * - current SID route = KSFO.OFFSH9.SXC
     *
     * Given the above current values, this function would return:
     * `OFFSH9.SXC`
     *
     * @for AircraftFlightManagementSystem
     * @method getFollowingSideText
     * @return {string|null}
     */
    getFollowingSIDText() {
        if (!this.following.sid) {
            return null;
        }

        return `${this.following.sid}.${this.currentLeg.route.exit}`;
    }

    /**
     * @for AircraftFlightManagementSystem
     * @method getFollowingSTARText
     * @return {string|null}
     */
    getFollowingSTARText() {
        if (!this.following.star) {
            return null;
        }

        const { icao } = window.airportController.airport_get();

        return `${this.following.star}.${icao.toUpperCase()}`;
    }

    /**
     * Returns a string used in the `AircraftStripView` for a landing aircraft.
     *
     * `KSFO 28L`
     *
     * @for AircraftFlightManagementSystem
     * @method getDesinationIcaoWithRunway
     * @return {string}
     */
    getDesinationIcaoWithRunway() {
        return `${_last(this.fp.route)} ${this.currentWaypoint.runway}`;
    }

    /**
     * @for AircraftFlightManagementSystem
     * @method altitudeForCurrentWaypoint
     * @return {number|null}
     */
    altitudeForCurrentWaypoint() {
        return this.currentWaypoint.altitude;
    }
}
