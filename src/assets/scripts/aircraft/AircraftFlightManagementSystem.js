import $ from 'jquery';
import _clamp from 'lodash/clamp';
import _last from 'lodash/last';
import _map from 'lodash/map';
import Waypoint from './Waypoint';
import Leg, { FP_LEG_TYPE } from './Leg';
import { LOG } from '../constants/logLevel';

const LEG = 0;
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
    constructor(options) {
        this.my_aircrafts_eid = options.aircraft.eid;
        this.my_aircraft = options.aircraft;
        this.legs = [];
        this.current = [0, 0]; // [current_Leg, current_Waypoint_within_that_Leg]
        this.fp = {
            altitude: null,
            route: []
        };
        this.following = {
            sid: null,         // Standard Instrument Departure Procedure
            star: null,        // Standard Terminal Arrival Route Procedure
            iap: null,         // Instrument Approach Procedure (like ILS, GPS, RNAV, VOR-A, etc)
            awy: null,         // Airway (V, J, T, Q, etc.)
            tfc: null,         // Traffic (another airplane)
            anything: false    // T/F flag for if anything is being "followed"
        };

        // set initial
        this.fp.altitude = _clamp(1000, options.model.ceiling, 60000);

        if (options.aircraft.category === 'arrival') {
            this.prependLeg({ route: 'KDBG' });
        } else if (options.aircraft.category === 'departure') {
            this.prependLeg({ route: window.airportController.airport_get().icao });
        }

        this.update_fp_route();
    }

    /** ***************** FMS FLIGHTPLAN CONTROL FUNCTIONS *******************/

    /**
     * Insert a Leg at the front of the flightplan
     */
    prependLeg(data) {
        const prev = this.currentWaypoint();

        this.legs.unshift(new Leg(data, this));
        this.update_fp_route();

        // Verify altitude & speed not null
        const curr = this.currentWaypoint();
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
        const prev = this.currentWaypoint();

        this.currentLeg().waypoints.splice(this.current[WAYPOINT_WITHIN_LEG], 0, new Waypoint(data, this));
        this.update_fp_route();

        // Verify altitude & speed not null
        const curr = this.currentWaypoint();
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
        if (data.firstIndex == null) {
            data.firstIndex = this.legs.length;
        }

        const prev = this.currentWaypoint();
        this.legs.splice(data.firstIndex, 0, new Leg(data, this));

        this.update_fp_route();

        // Adjust 'current'
        if (this.current[LEG] >= data.firstIndex) {
            this.current[WAYPOINT_WITHIN_LEG] = 0;
        }

        // Verify altitude & speed not null
        const curr = this.currentWaypoint();
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
        this.legs.push(new Leg(data, this));
        this.update_fp_route();
    }

    /**
     *  Insert a waypoint after the *current* waypoint
     */
    appendWaypoint(data) {
        this.currentLeg().waypoints.splice(this.current[WAYPOINT_WITHIN_LEG] + 1, 0, new Waypoint(data, this));
        this.update_fp_route();
    }

    /**
     *  Switch to the next waypoint
     */
    nextWaypoint() {
        const prev = this.currentWaypoint();
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

        // Replace null values with current values
        const curr = this.currentWaypoint();
        if (prev && !curr.altitude) {
            curr.altitude = prev.altitude;
        }

        if (prev && !curr.speed) {
            curr.speed = prev.speed;
        }

        if (!curr.heading && curr.navmode === 'heading') {
            curr.heading = prev.heading;
        }
    }

    /**
     *  Switch to the next Leg
     */
    nextLeg() {
        const prev = this.currentWaypoint();
        this.current[LEG]++;
        this.current[WAYPOINT_WITHIN_LEG] = 0;

        // Replace null values with current values
        const curr = this.currentWaypoint();
        if (prev && !curr.altitude) {
            curr.altitude = prev.altitude;
        }

        if (prev && !curr.speed) {
            curr.speed = prev.speed;
        }

        if (!curr.heading && curr.navmode === 'heading') {
            curr.heading = prev.heading;
        }
    }

    /**
     * Skips to the given waypoint
     * @param {string} name - the name of the fix to skip to
     */
    skipToFix(name) {
        const prev = this.currentWaypoint();

        for (let l = 0; l < this.legs.length; l++) {
            for (let w = 0; w < this.legs[l].waypoints.length; w++) {
                if (this.legs[l].waypoints[w].fix === name) {
                    this.current = [l, w];

                    // Verify altitude & speed not null
                    const curr = this.currentWaypoint();
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
        for (const i in data) {
            this.currentWaypoint()[i] = data[i];
        }
    }

    /**
     * Updates fms.fp.route to correspond with the fms Legs
     */
    update_fp_route() {
        const r = [];

        // TODO: simplify this
        // FIXME: is this.legs an array? if so this should be a for and not a for in loop.
        for (const l in this.legs) {
            if (!this.legs[l].type) {
                continue;
            }

            switch (this.legs[l].type) {
                case FP_LEG_TYPE.SID:
                    // TODO: this split logic and string building should live in helper functions
                    // departure airport
                    r.push(this.legs[l].route.split('.')[0]);
                    // 'sidname.exitPoint'
                    r.push(this.legs[l].route.split('.')[1] + '.' + this.legs[l].route.split('.')[2]);

                    break;
                case FP_LEG_TYPE.STAR:
                    // 'entryPoint.starname.exitPoint'
                    r.push(this.legs[l].route.split('.')[0] + '.' + this.legs[l].route.split('.')[1]);
                    // arrival airport
                    r.push(this.legs[l].route.split('.')[2]);

                    break;
                case FP_LEG_TYPE.IAP:
                    // no need to include these in flightplan (because wouldn't happen in real life)
                    break;
                case FP_LEG_TYPE.AWY:
                    if (r[r.length - 1] !== this.legs[l].route.split('.')[0]) {
                        r.push(this.legs[l].route.split('.')[0]); // airway entry fix
                        r.push(this.legs[l].route.split('.')[1]); // airway identifier
                        r.push(this.legs[l].route.split('.')[2]); // airway exit fix
                    }

                    break;
                case FP_LEG_TYPE.FIX:
                    r.push(this.legs[l].route);

                    break;
                case FP_LEG_TYPE.MANUAL:
                    // no need to include these in flightplan (because wouldn't happen in real life)
                    break;
                default:
                    break;
            }

            if (r.length === 0) {
                r.push(this.legs[0].route);
            }
        }

        this.fp.route = r;
    }

    /**
     * Calls various task-based functions and sets 'fms.following' flags
     */
    followCheck() {
        const leg = this.currentLeg();
        this.following.anything = true;

        switch (leg.type) {
            case FP_LEG_TYPE.SID:
                this.following.sid = leg.route.split('.')[1];
                break;
            case FP_LEG_TYPE.STAR:
                this.following.star = leg.route.split('.')[1];
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
            altitude:  Math.max(window.airportController.airport_get().initial_alt, this.my_aircraft.altitude)
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

    /**
     * Takes a single-string route and converts it to a segmented route the fms can understand
     * Note: Input Data Format : "KSFO.OFFSH9.SXC.V458.IPL.J2.JCT..LLO..ACT..KACT"
     *       Return Data Format: ["KSFO.OFFSH9.SXC", "SXC.V458.IPL", "IPL.J2.JCT", "LLO", "ACT", "KACT"]
     */
    formatRoute(data) {
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

    /**
     * Take an array of leg routes and build the legs that will go into the fms
     * @param {array} route - an array of properly formatted route strings
     *                        Example: ["KSFO.OFFSH9.SXC", "SXC.V458.IPL",
     *                                 "IPL.J2.JCT", "LLO", "ACT", "KACT"]
     * @param {boolean} fullRouteClearance - set to true IF you want the provided route to completely
     *                                       replace the current contents of 'this.legs'
     */
    customRoute(route, fullRouteClearance) {
        const legs = [];
        const curr = this.currentWaypoint(); // save the current waypoint

        for (let i = 0; i < route.length; i++) {
            let pieces;

            // just a fix/navaid
            if (route[i].split('.').length === 1) {
                legs.push(new Leg({ type: FP_LEG_TYPE.FIX, route: route[i] }, this));
            } else if (route[i].split('.').length === 3) {
                // is an instrument procedure
                pieces = route[i].split('.');

                if (Object.keys(window.airportController.airport_get().sids).indexOf(pieces[1]) > -1) {
                    // it's a SID!
                    legs.push(new Leg({ type: FP_LEG_TYPE.SID, route: route[i] }, this));
                } else if (Object.keys(window.airportController.airport_get().stars).indexOf(pieces[1]) > -1) {
                    // it's a STAR!
                    legs.push(new Leg({ type: FP_LEG_TYPE.STAR, route: route[i] }, this));
                } else if (Object.keys(window.airportController.airport_get().airways).indexOf(pieces[1]) > -1) {
                    // it's an airway!
                    legs.push(new Leg({ type: FP_LEG_TYPE.AWY, route: route[i] }, this));
                }
            } else {
                // neither formatted like "JAN" nor "JAN.V18.MLU"
                log(`Passed invalid route to fms. Unable to create leg from input: ${route[i]}`, LOG.WARNING);
                return false;
            }
        }

        // TODO: this could be simplified. there is a lot of brnaching logic here that makes this block
        // tough to follow.
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
            // replace all legs with the legs we've built here in this function
            this.legs = legs;
            this.current = [0, 0]; // look to beginning of route
        }

        this.update_fp_route();

        // Maintain old speed and altitude
        if (this.currentWaypoint().altitude == null) {
            this.setCurrent({ altitude: curr.altitude });
        }

        if (this.currentWaypoint().speed == null) {
            this.setCurrent({ speed: curr.speed });
        }

        return true;
    }

    /**
     * Invokes flySID() for the SID in the flightplan (fms.fp.route)
     */
    clearedAsFiled() {
        const retval = this.my_aircraft.runSID([window.aircraftController.aircraft_get(this.my_aircrafts_eid).destination]);
        // TODO: this could be the return for this method
        const ok = !(Array.isArray(retval) && retval[0] === 'fail');

        return ok;
    }

    // FIXME the logic in this method is remarkably similiar to the logic in .descendViaSID(). perhpas there
    // are opportunities for abstraction here.
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
        if (!this.currentLeg().type === FP_LEG_TYPE.SID) {
            return;
        }

        let wp = this.currentLeg().waypoints;
        let cruise_alt = this.fp.altitude;
        let cruise_spd = this.my_aircraft.model.speed.cruise;

        for (let i = 0; i < wp.length; i++) {
            let altitude = wp[i].fixRestrictions.alt;
            let speed = wp[i].fixRestrictions.spd;
            let minAlt;
            let alt;
            let maxAlt;

            // Altitude Control
            if (altitude) {
                if (altitude.indexOf('+') !== -1) {
                    // at-or-above altitude restriction
                    minAlt = parseInt(altitude.replace('+', ''), 10) * 100;
                    alt = Math.min(window.airportController.airport_get().ctr_ceiling, cruise_alt);
                } else if (altitude.indexOf('-') !== -1) {
                    maxAlt = parseInt(altitude.replace('-', ''), 10) * 100;
                    // climb as high as restrictions permit
                    alt = Math.min(maxAlt, cruise_alt);
                } else {
                     // cross AT this altitude
                    alt = parseInt(altitude, 10) * 100;
                }
            } else {
                alt = Math.min(window.airportController.airport_get().ctr_ceiling, cruise_alt);
            }

            wp[i].altitude = alt; // add altitudes to wp

            let minSpd;
            let spd = cruise_spd;
            let maxSpd;
            // Speed Control
            if (speed) {
                if (speed.indexOf('+') !== -1) {
                    // at-or-above speed restriction
                    minSpd = parseInt(speed.replace('+', ''), 10);
                    spd = Math.min(minSpd, cruise_spd);
                } else if (speed.indexOf('-') !== -1) {
                    maxSpd = parseInt(speed.replace('-', ''), 10);
                    // go as fast as restrictions permit
                    spd = Math.min(maxSpd, cruise_spd);
                } else {
                     // cross AT this speed
                    spd = parseInt(speed, 10);
                }
            }

            // add speeds to wp
            wp[i].speed = spd;
        }

        // change fms waypoints to wp (which contains the altitudes and speeds)
        this.legs[this.current[LEG]].waypoints = wp;

        return true;
    }

    // FIXME the logic in this method is remarkably similiar to the logic in .climbViaSID(). perhaps there
    // are opportunities for abstraction here.
    /**
     * Descends aircraft in compliance with the STAR they're following
     * Adds altitudes and speeds to each waypoint in accordance with the STAR
     */
    descendViaSTAR() {
        // Find the STAR leg
        let wp;
        let legIndex;

        // TODO: if this.legs is an array this should be a for and not a for/in loop
        for (const l in this.legs) {
            if (this.legs[l].type === FP_LEG_TYPE.STAR) {
                legIndex = l;
                wp = this.legs[l].waypoints;

                break;
            }
        }

        if (!wp) {
            return;
        }

        let start_alt = this.currentWaypoint().altitude || this.my_aircraft.altitude;
        let start_spd = this.currentWaypoint().speed || this.my_aircraft.model.speed.cruise;

        for (let i = 0; i < wp.length; i++) {
            if (i >= 1) {
                start_alt = wp[i - 1].altitude;
                start_spd = wp[i - 1].speed;
            }

            const a = wp[i].fixRestrictions.alt;
            const s = wp[i].fixRestrictions.spd;
            let minAlt;
            let alt;
            let maxAlt;

            // Altitude Control
            if (a) {
                if (a.indexOf('+') !== -1) {
                    // at-or-above altitude restriction
                    minAlt = parseInt(a.replace('+', ''), 10) * 100;
                    alt = Math.max(minAlt, start_alt);
                } else if (a.indexOf('-') !== -1) {
                    maxAlt = parseInt(a.replace('-', '')) * 100;
                    // climb as high as restrictions permit
                    alt = Math.min(maxAlt, start_alt);
                } else {
                    // cross AT this altitude
                    alt = parseInt(a) * 100;
                }
            } else {
                alt = start_alt;
            }

            wp[i].altitude = alt; // add altitudes to wp

            let minSpd;
            let spd;
            let maxSpd;

            // Speed Control
            if (s) {
                if (s.indexOf('+') !== -1) {
                    // at-or-above speed restriction
                    minSpd = parseInt(s.replace('+', ''));
                    spd = Math.min(minSpd, start_spd);
                } else if (s.indexOf('-') !== -1) {
                    maxSpd = parseInt(s.replace('-', ''));
                    // go as fast as restrictions permit
                    spd = Math.min(maxSpd, start_spd);
                } else {
                    // cross AT this speed
                    spd = parseInt(s);
                }
            } else {
                spd = start_spd;
            }

            // add speeds to wp
            wp[i].speed = spd;
        }

        // change fms waypoints to wp (which contains the altitudes and speeds)
        this.legs[legIndex].waypoints = wp;

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
     * @param {string} fix - name of the fix to look for in the flightplan
     * @returns {wp: "position-of-fix-in-waypoint-list",
     *           lw: "position-of-fix-in-leg-wp-matrix"}
     */
    indexOfWaypoint(fix) {
        let wp = 0;

        for (let l = 0; l < this.legs.length; l++) {
            for (let w = 0; w < this.legs[l].waypoints.length; w++) {
                if (this.legs[l].waypoints[w].fix === fix) {
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

        return {
            wp: wp,
            lw: this.current
        };
    }


    /** ************************* FMS GET FUNCTIONS ***************************/

    // TODO: this set upd methods could be used as getters instead
    // ex: `get currentLeg()` and then used like `this.fms.currentLeg`
    /**
     * Return the current leg
     */
    currentLeg() {
        return this.legs[this.current[LEG]];
    }

    /**
     * Return the current waypoint
     */
    currentWaypoint() {
        if (this.legs.length < 1) {
            return null;
        }

        const currentLeg = this.currentLeg();

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
    * Returns all waypoints in fms, in order
    */
    waypoints() {
        // TODO: there is a better way to do this with lodash
        const waypointList = $.map(this.legs, (v) => v.waypoints);

        return waypointList;
    }

    atLastWaypoint() {
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

        return `${this.following.sid}.${this.currentLeg().route.split('.')[2]}`;
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

        return `${this.following.star}.${window.airportController.airport_get().icao}`;
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
        return `${_last(this.fp.route)} ${this.currentWaypoint().runway}`;
    }

    /**
     * @for AircraftFlightManagementSystem
     * @method altitudeForCurrentWaypoint
     * @return {number|null}
     */
    altitudeForCurrentWaypoint() {
        return this.currentWaypoint().altitude;
    }
}
