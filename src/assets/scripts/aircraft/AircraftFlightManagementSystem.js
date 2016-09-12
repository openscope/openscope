import $ from 'jquery';
import Fiber from 'fiber';
import _clamp from 'lodash/clamp'
import Waypoint from './Waypoint';
import Leg from './Leg';
import { Log } from '../constants/logLevel';

/**
 * Manage current and future aircraft waypoints
  *
  * waypoint navmodes
  * -----------------
  * May be one of null, "fix", "heading", "hold", "rwy"
  *
  * * null is assigned, if the plane is not actively following an
  *   objective. This is only the case, if a plane enters the airspace
  *   or an action has been aborted and no new command issued
  * * "fix" is assigned, if the plane is heading for a fix. In this
  *    case, the attribute request.fix is used for navigation
  * * "heading" is assigned, if the plane was given directive to follow
  *    the course set out by the given heading. In this case, the
  *    attributes request.heading and request.turn are used for
  *    navigation
  * * "hold" is assigned, if the plane should hold its position. As
  *    this is archieved by continuously turning, request.turn is used
  *    in this case
  * * "rwy" is assigned, if the plane is heading for a runway. This is
  *    only the case, if the plane was issued the command to land. In
  *    this case, request.runway is used
  *
  * @class AircraftFlightManagementSystem
  * @extends Fiber
 */
const AircraftFlightManagementSystem = Fiber.extend(function() {
  return {
    init: function(options) {
      this.my_aircrafts_eid = options.aircraft.eid;
      this.my_aircraft = options.aircraft;
      this.legs = [];
      this.current = [0,0]; // [current_Leg, current_Waypoint_within_that_Leg]
      this.fp = { altitude: null, route: [] };
      this.following = {
        sid:  null,   // Standard Instrument Departure Procedure
        star: null,   // Standard Terminal Arrival Route Procedure
        iap:  null,   // Instrument Approach Procedure (like ILS, GPS, RNAV, VOR-A, etc)
        awy:  null,   // Airway (V, J, T, Q, etc.)
        tfc:  null,   // Traffic (another airplane)
        anything:  false   // T/F flag for if anything is being "followed"
      };

      // set initial
      this.fp.altitude = _clamp(1000, options.model.ceiling, 60000);
      if(options.aircraft.category == "arrival")
        this.prependLeg({route:"KDBG"});
      else if(options.aircraft.category == "departure")
        this.prependLeg({route:airport_get().icao});
      this.update_fp_route();
    },

    /** ***************** FMS FLIGHTPLAN CONTROL FUNCTIONS *******************/

    /**
     * Insert a Leg at the front of the flightplan
     */
    prependLeg: function (data) {
      var prev = this.currentWaypoint();
      this.legs.unshift(new Leg(data, this));
      this.update_fp_route();

      // Verify altitude & speed not null
      var curr = this.currentWaypoint();
      if(prev && !curr.altitude) curr.altitude = prev.altitude;
      if(prev && !curr.speed) curr.speed = prev.speed;
    },

    /**
     * Insert a waypoint at current position and immediately activate it
     */
    insertWaypointHere: function(data) {
      var prev = this.currentWaypoint();
      this.currentLeg().waypoints.splice(this.current[1], 0, new Waypoint(data, this));
      this.update_fp_route();

      // Verify altitude & speed not null
      var curr = this.currentWaypoint();
      if(prev && !curr.altitude) curr.altitude = prev.altitude;
      if(prev && !curr.speed) curr.speed = prev.speed;
    },

    /**
     * Insert a Leg at a particular position in the flightplan
     * Note: if no position passed in, defaults to add to the end
     */
    insertLeg: function(data) {
      if(data.firstIndex == null) data.firstIndex = this.legs.length;
      var prev = this.currentWaypoint();
      this.legs.splice(data.firstIndex, 0, new Leg(data, this));
      this.update_fp_route();

      // Adjust 'current'
      if(this.current[0] >= data.firstIndex) this.current[1] = 0;

      // Verify altitude & speed not null
      var curr = this.currentWaypoint();
      if(prev && !curr.altitude) curr.altitude = prev.altitude;
      if(prev && !curr.speed) curr.speed = prev.speed;
    },

    /**
     * Insert a Leg at current position immediately activate it
     */
    insertLegHere: function(data) {
      data.firstIndex = this.current[0];  // index of current leg
      this.insertLeg(data); // put new Leg at current position
      this.current[1] = 0;  // start at first wp in this new leg
    },

    /**
     *  Insert a Leg at the end of the flightplan
     */
    appendLeg: function(data) {
      this.legs.push(new Leg(data, this));
      this.update_fp_route();
    },

    /**
     *  Insert a waypoint after the *current* waypoint
     */
    appendWaypoint: function(data) {
      this.currentLeg().waypoints.splice(this.current[1] + 1, 0, new Waypoint(data, this));
      this.update_fp_route();
    },

    /**
     *  Switch to the next waypoint
     */
    nextWaypoint: function() {
      var prev = this.currentWaypoint();
      var leg = this.current[0];
      var wp = this.current[1];
      if(wp+1 < this.legs[leg].waypoints.length) {
        this.current[1]++;  // look to next waypoint in current leg
      }
      else if(leg+1 < this.legs.length) {
        this.current[0]++;  // look to the next leg
        this.current[1]=0;  // look to the first waypoint of that leg
      }

      // Replace null values with current values
      var curr = this.currentWaypoint();
      if(prev && !curr.altitude) curr.altitude = prev.altitude;
      if(prev && !curr.speed) curr.speed = prev.speed;
      if(!curr.heading && curr.navmode == "heading") curr.heading = prev.heading;
    },

    /**
     *  Switch to the next Leg
     */
    nextLeg: function() {
      var prev = this.currentWaypoint();
      this.current[0]++;
      this.current[1] = 0;

      // Replace null values with current values
      var curr = this.currentWaypoint();
      if(prev && !curr.altitude) curr.altitude = prev.altitude;
      if(prev && !curr.speed) curr.speed = prev.speed;
      if(!curr.heading && curr.navmode == "heading") curr.heading = prev.heading;
    },

    /**
     * Skips to the given waypoint
     * @param {string} name - the name of the fix to skip to
     */
    skipToFix: function(name) {
      var prev = this.currentWaypoint();
      for(var l=0; l<this.legs.length; l++) {
        for(var w=0; w<this.legs[l].waypoints.length; w++) {
          if(this.legs[l].waypoints[w].fix == name) {
            this.current = [l,w];

            // Verify altitude & speed not null
            var curr = this.currentWaypoint();
            if(prev && !curr.altitude) curr.altitude = prev.altitude;
            if(prev && !curr.speed) curr.speed = prev.speed;

            return true;
          }
        }
      }
      return false;
    },

    /**
     * Modify all waypoints
     */
    setAll: function(data) {
      for (var i = 0; i < this.legs.length; i++) {
        for(var j = 0; j < this.legs[i].waypoints.length; j++) {
          for (var k in data) {
            this.legs[i].waypoints[j][k] = data[k];
          }
        }
      }
    },

    /**
     * Modify the current waypoint
     */
    setCurrent: function(data) {
      for (var i in data) {
        this.currentWaypoint()[i] = data[i];
      }
    },

    /**
     * Updates fms.fp.route to correspond with the fms Legs
     */
    update_fp_route: function() {
      var r = [];
      // TODO: simplify this
      for(var l in this.legs) {
        if(!this.legs[l].type) continue;
        else if(this.legs[l].type == 'sid') {
          r.push(this.legs[l].route.split('.')[0]); // departure airport
          r.push(this.legs[l].route.split('.')[1] + '.' + this.legs[l].route.split('.')[2]);  // 'sidname.exitPoint'
        }
        else if(this.legs[l].type == 'star') {
          r.push(this.legs[l].route.split('.')[0] + '.' + this.legs[l].route.split('.')[1]);  // 'entryPoint.starname.exitPoint'
          r.push(this.legs[l].route.split('.')[2]); // arrival airport
        }
        else if(this.legs[l].type == 'iap') {
          continue; // no need to include these in flightplan (because wouldn't happen in real life)
        }
        else if(this.legs[l].type == 'awy') {
          if(r[r.length-1] != this.legs[l].route.split('.')[0])
            r.push(this.legs[l].route.split('.')[0]); // airway entry fix
          r.push(this.legs[l].route.split('.')[1]); // airway identifier
          r.push(this.legs[l].route.split('.')[2]); // airway exit fix
        }
        else if(this.legs[l].type == 'fix') {
          r.push(this.legs[l].route);
        }
        else if(this.legs[l].type == '[manual]') {
          continue; // no need to include these in flightplan (because wouldn't happen in real life)
        }
      }
      if(r.length == 0) r.push(this.legs[0].route);
      this.fp.route = r;
    },

    /**
     * Calls various task-based functions and sets 'fms.following' flags
     */
    followCheck: function() {
      var leg = this.currentLeg();
      if(leg.type == "sid") {
        this.following.anything = true;
        this.following.sid = leg.route.split('.')[1];
      }
      else if(leg.type == "star") {
        this.following.anything = true;
        this.following.star = leg.route.split('.')[1];
      }
      else if(leg.type == "iap") {
        this.following.anything = true;
        // this.following.iap = ;  // *******NEEDS TO BE FINISHED***************************
      }
      else if(leg.type == "tfc") {    // **FUTURE FUNCTIONALITY**
        // this.following.anything = true;
        // this.following.tfc = // EID of the traffic we're following
      }
      else if(leg.type == "awy") { // **FUTURE FUNCTIONALITY**
        this.following.anything = true;
        this.following.awy = leg.route.split('.')[1];
      }
      else {
        this.followClear();
        return false;
      }
      return this.following;
    },

    /**
     * Clears any current follows by updating the 'fms.following' flags
     */
    followClear: function() {
      this.following = {
        sid:  null,
        star: null,
        iap:  null,
        awy:  null,
        tfc:  null,
        anything: false
      };
    },

    /**
     * Join an instrument approach (eg. ILS/GPS/RNAV/VOR/LAAS/etc)
     * @param {string} type - the type of approach (like "ils")
     * @param {Runway} rwy - the Runway object the approach ends into
     * @param {string} variant - (optional) for stuff like "RNAV-Z 17L"
     */
    followApproach: function(type, rwy, variant) {
      // Note: 'variant' is set up to pass to this function, but is not used here yet.
      if (type == 'ils') {
        this.my_aircraft.cancelFix();
        this.setCurrent({
          navmode: 'rwy',
          runway: rwy.toUpperCase(),
          turn: null,
          start_speed: this.my_aircraft.speed,
        });
      }
      // if-else all the other approach types here...
      // ILS, GPS, RNAV, VOR, NDB, LAAS/WAAS, MLS, etc...
    },

    /**
     * Inserts the SID as the first Leg in the fms's flightplan
     */
    followSID: function(route) {
      for(var i = 0; i < this.legs.length; i++) {
        if(this.legs[i].route === airport_get().icao)  // sid assigned after taking off without SID
          this.legs.splice(i, 1);  // remove the manual departure leg
        else if(this.legs[i].type === "sid") // check to see if SID already assigned
          this.legs.splice(i, 1);  // remove the old SID
      }
      // Add the new SID Leg
      this.prependLeg({type:'sid', route:route})
      this.setAll({altitude:Math.max(airport_get().initial_alt,this.my_aircraft.altitude)});
    },

    /**
     * Inserts the STAR as the last Leg in the fms's flightplan
     */
    followSTAR: function(route) {
      for(var i=0; i<this.legs.length; i++) {
        if(this.legs[i].type == "star") // check to see if STAR already assigned
          this.legs.splice(i,1);  // remove the old STAR
      }
      // Add the new STAR Leg
      this.appendLeg({type:"star", route:route})
    },

    /**
     * Takes a single-string route and converts it to a semented route the fms can understand
     * Note: Input Data Format : "KSFO.OFFSH9.SXC.V458.IPL.J2.JCT..LLO..ACT..KACT"
     *       Return Data Format: ["KSFO.OFFSH9.SXC", "SXC.V458.IPL", "IPL.J2.JCT", "LLO", "ACT", "KACT"]
     */
    formatRoute: function(data) {
      // Format the user's input
      var route = [], ap = airport_get, fixOK = ap().getFix;
      if (data.indexOf(' ') !== -1) return; // input can't contain spaces
      data = data.split('..'); // split apart "direct" pieces
      for(var i = 0; i < data.length; i++) {  // deal with multilinks (eg 'KSFO.OFFSH9.SXC.V458.IPL')
        if (data[i].split('.').length == 1) {
          if (!fixOK(data[i])) return;
          route.push(data[i]); // just a fix/navaid
          continue;
        } else {  // is a procedure, eg SID, STAR, IAP, airway, etc.
          if(data[i].split('.').length % 2 != 1) return;  // user either didn't specify start point or end point
          else {
            var pieces = data[i].split('.');
            var a = [pieces[0] + '.' + pieces[1] + '.' + pieces[2]];
            for(var j = 3; j < data[i].split('.').length; j+2) { // chop up the multilink
              if(!fixOK(pieces[0]) || !fixOK(pieces[2])) return;  // invalid join/exit points
              if(!Object.keys(ap().sids).indexOf(pieces[1])
                || !Object.keys(ap().airways).indexOf(pieces[1])) return; // invalid procedure
              a.push(pieces[j - 1] + '.' + pieces[j] + pieces[j + 1]);
            }
          }
        }
        route = route.concat(a);  // push the properly reformatted multilink
      }
      return route;
    },

    /**
     * Take an array of leg routes and build the legs that will go into the fms
     * @param {array} route - an array of properly formatted route strings
     *                        Example: ["KSFO.OFFSH9.SXC", "SXC.V458.IPL",
     *                                 "IPL.J2.JCT", "LLO", "ACT", "KACT"]
     * @param {boolean} fullRouteClearance - set to true IF you want the provided route to completely
     *                                       replace the current contents of 'this.legs'
     */
    customRoute: function(route, fullRouteClearance) {
      var legs = [];
      var curr = this.currentWaypoint(); // save the current waypoint
      for(var i=0; i<route.length; i++) {
        if(route[i].split('.').length == 1) { // just a fix/navaid
          legs.push(new Leg({type:"fix", route:route[i]}, this));
        }
        else if(route[i].split('.').length == 3) {  // is an instrument procedure
          var pieces = route[i].split('.');
          if(Object.keys(airport_get().sids).indexOf(pieces[1]) > -1) {  // it's a SID!
            legs.push(new Leg({type:"sid", route:route[i]}, this));
          }
          else if(Object.keys(airport_get().stars).indexOf(pieces[1]) > -1) { // it's a STAR!
            legs.push(new Leg({type:"star", route:route[i]}, this));
          }
          else if(Object.keys(airport_get().airways).indexOf(pieces[1]) > -1) { // it's an airway!
            legs.push(new Leg({type:"awy", route:route[i]}, this));
          }
        }
        else {  // neither formatted like "JAN" nor "JAN.V18.MLU"
          log("Passed invalid route to fms. Unable to create leg from input:" + route[i], LOG.WARNING);
          return false;
        }
      }

      if (!fullRouteClearance) { // insert user's route to the legs
        // Check if user's route hooks up to the current Legs anywhere
        var pieces = legs[legs.length-1].route.split('.');
        var last_fix = pieces[pieces.length-1];
        var continuity = this.indexOfWaypoint(last_fix);
        if(continuity) {  // user route connects with existing legs
          var inMiddleOfLeg = continuity.lw[1] != this.legs[continuity.lw[0]].waypoints.length-1;
          var legsToRemove = Math.max(0,continuity.lw[0]-inMiddleOfLeg - this.current[0]);
          if(inMiddleOfLeg) { // change the existing leg @ merge point
            this.legs[continuity.lw[0]].waypoints.splice(0, continuity.lw[1]);  // Remove the waypoints before the merge point
            var r = this.legs[continuity.lw[0]].route.split('.');
            this.legs[continuity.lw[0]].route = last_fix + '.' + r[1] + '.' + r[2]; // Update the leg's route to reflect the change
          }
          this.legs.splice.apply(this.legs, [Math.max(0,continuity.lw[0]-legsToRemove), legsToRemove].concat(legs)); // remove old legs before the point where the two routes join
          // move to the newly inserted Leg
          this.current[0] = Math.max(0,continuity.lw[0]-legsToRemove);
          this.current[1] = 0;
        } else {  // no route continuity... just adding legs
          this.legs.splice.apply(this.legs, [this.current[0]+1, 0].concat(legs));  // insert the legs after the active Leg
          this.nextLeg();
        }
      } else {  // replace all legs with the legs we've built here in this function
        this.legs = legs;
        this.current = [0,0]; // look to beginning of route
      }
      this.update_fp_route();

      // Maintain old speed and altitude
      if(this.currentWaypoint().altitude == null) this.setCurrent({altitude: curr.altitude});
      if(this.currentWaypoint().speed == null) this.setCurrent({speed:curr.speed});

      return true;
    },

    /** Invokes flySID() for the SID in the flightplan (fms.fp.route)
     */
    clearedAsFiled: function() {
      var retval = this.my_aircraft.runSID([aircraft_get(this.my_aircrafts_eid).destination]);
      var ok = !(Array.isArray(retval) && retval[0]=="fail");
      return ok;
    },

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
    climbViaSID: function() {
      if(!this.currentLeg().type == 'sid') return;
      var wp = this.currentLeg().waypoints;
      var cruise_alt = this.fp.altitude;
      var cruise_spd = this.my_aircraft.model.speed.cruise;

      for(var i=0; i<wp.length; i++) {
        var a = wp[i].fixRestrictions.alt;
        var s = wp[i].fixRestrictions.spd;

        // Altitude Control
        if(a) {
          if(a.indexOf('+') != -1) {  // at-or-above altitude restriction
            var minAlt = parseInt(a.replace('+','')) * 100;
            var alt = Math.min(airport_get().ctr_ceiling, cruise_alt);
          }
          else if(a.indexOf('-') != -1) {
            var maxAlt = parseInt(a.replace('-','')) * 100;
            var alt = Math.min(maxAlt, cruise_alt) // climb as high as restrictions permit
          }
          else var alt = parseInt(a) * 100; // cross AT this altitude
        }
        else var alt = Math.min(airport_get().ctr_ceiling, cruise_alt);
        wp[i].altitude = alt; // add altitudes to wp

        // Speed Control
        if(s) {
          if(s.indexOf("+") != -1) {  // at-or-above speed restriction
            var minSpd = parseInt(s.replace("+",""));
            var spd = Math.min(minSpd, cruise_spd);
          }
          else if(s.indexOf("-") != -1) {
            var maxSpd = parseInt(s.replace("-",""));
            var spd = Math.min(maxSpd, cruise_spd) // go as fast as restrictions permit
          }
          else var spd = parseInt(s); // cross AT this speed
        }
        else var spd = cruise_spd;
        wp[i].speed = spd;  // add speeds to wp
      }

      // change fms waypoints to wp (which contains the altitudes and speeds)
      this.legs[this.current[0]].waypoints = wp;
      return true;
    },

    /**
     * Descends aircraft in compliance with the STAR they're following
     * Adds altitudes and speeds to each waypoint in accordance with the STAR
     */
    descendViaSTAR: function() {
      // Find the STAR leg
      var wp, legIndex;
      for(var l in this.legs) {
        if(this.legs[l].type == "star") {
          legIndex = l;
          wp = this.legs[l].waypoints; break;
        }
      }
      if(!wp) return;

      var start_alt = this.currentWaypoint().altitude || this.my_aircraft.altitude;
      var start_spd = this.currentWaypoint().speed || this.my_aircraft.model.speed.cruise;

      for(var i = 0; i < wp.length; i++) {
        if(i >= 1) {
          start_alt = wp[i-1].altitude;
          start_spd = wp[i-1].speed;
        }
        var a = wp[i].fixRestrictions.alt;
        var s = wp[i].fixRestrictions.spd;

        // Altitude Control
        if (a) {
          if(a.indexOf("+") != -1) {  // at-or-above altitude restriction
            var minAlt = parseInt(a.replace("+","")) * 100;
            var alt = Math.max(minAlt, start_alt);
          }
          else if(a.indexOf("-") != -1) {
            var maxAlt = parseInt(a.replace("-","")) * 100;
            var alt = Math.min(maxAlt, start_alt) // climb as high as restrictions permit
          }
          else var alt = parseInt(a) * 100; // cross AT this altitude
        }
        else var alt = start_alt;
        wp[i].altitude = alt; // add altitudes to wp

        // Speed Control
        if (s) {
          if (s.indexOf("+") != -1) {  // at-or-above speed restriction
            var minSpd = parseInt(s.replace("+",""));
            var spd = Math.min(minSpd, start_spd);
          }
          else if (s.indexOf("-") != -1) {
            var maxSpd = parseInt(s.replace("-",""));
            var spd = Math.min(maxSpd, start_spd) // go as fast as restrictions permit
          }
          else var spd = parseInt(s); // cross AT this speed
        }
        else var spd = start_spd;
        wp[i].speed = spd;  // add speeds to wp
      }

      // change fms waypoints to wp (which contains the altitudes and speeds)
      this.legs[legIndex].waypoints = wp;
      return true;
    },


    /** ************************ FMS QUERY FUNCTIONS **************************/

    /**
     * True if waypoint of the given name exists
     */
    hasWaypoint: function(name) {
      for (let i = 0; i < this.legs.length; i++) {
        for (let j = 0; j < this.legs[i].waypoints.length; j++) {
          if (this.legs[i].waypoints[j].fix == name) return true;
        }
      }
      return false;
    },

    /**
     * Returns object's position in flightplan as object with 2 formats
     * @param {string} fix - name of the fix to look for in the flightplan
     * @returns {wp: "position-of-fix-in-waypoint-list",
     *           lw: "position-of-fix-in-leg-wp-matrix"}
     */
    indexOfWaypoint: function(fix) {
      let wp = 0;
      for (let l = 0; l < this.legs.length; l++) {
        for (let w = 0; w < this.legs[l].waypoints.length; w++) {
          if(this.legs[l].waypoints[w].fix == fix) {
            return {wp:wp, lw:[l,w]};
          }
          else {
            wp++;
          }
        }
      }
      return false;
    },

    /**
     * Returns currentWaypoint's position in flightplan as object with 2 formats
     * @returns {wp: "position-of-fix-in-waypoint-list",
     *           lw: "position-of-fix-in-leg-wp-matrix"}
     */
    indexOfCurrentWaypoint: function() {
      var wp = 0;
      for(var i=0; i<this.current[0]; i++) wp += this.legs[i].waypoints.length;  // add wp's of completed legs
      wp += this.current[1];

      return {wp:wp, lw:this.current};
    },


    /** ************************* FMS GET FUNCTIONS ***************************/

    /**
     * Return the current leg
     */
    currentLeg: function() {
      return this.legs[this.current[0]];
    },

    /**
     * Return the current waypoint
     */
    currentWaypoint: function() {
      if(this.legs.length < 1) return null;
      else return this.legs[this.current[0]].waypoints[this.current[1]];
    },

    /**
     * Returns an array of all fixes along the flightplan route
     */
    fixes: function() {
      return $.map(this.waypoints(),function(w){return w.fix;});
    },

    /**
     * Return this fms's parent aircraft
     */
    my_aircraft: function() {
      return aircraft_get(this.my_aircrafts_eid);
    },

    /**
     * Returns a waypoint at the provided position
     * @param {array or number} pos - position of the desired waypoint. May be
     *                          provided either as an array showing the leg and
     *                          waypoint within the leg (eg [l,w]), or as the
     *                          number representing the position of the desired
     *                          waypoint in the list of all waypoints (running
     *                          this.waypoints() will return the list)
     * @returns {Waypoint} - the Waypoint object at the specified location
     */
    waypoint: function(pos) {
      if (Array.isArray(pos)) {  // input is like [leg,waypointWithinLeg]
        return this.legs[pos[0]].waypoints[pos[1]];
      } else if(typeof pos == "number") { // input is a position of wp in list of all waypoints
        var l = 0;
        while(pos >= 0) {  // count up to pos to locate the waypoint
          if(this.legs[l].waypoints.length <= pos) {
            pos -= this.legs[l].waypoints.length;
            l++;
          }
          else return this.legs[l].waypoints[pos];
        }
      }
      else return;
    },

    /**
     * Returns all waypoints in fms, in order
     */
    waypoints: function() {
      return $.map(this.legs,function(v){return v.waypoints});
    },

    atLastWaypoint: function() {
      return this.indexOfCurrentWaypoint().wp == this.waypoints().length-1;
    }
  };
});

export default AircraftFlightManagementSystem;
