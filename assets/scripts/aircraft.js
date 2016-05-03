zlsa.atc.Conflict = Fiber.extend(function() {
  return {
    init: function(first, second) {
      this.aircraft = [first, second];

      this.distance = vlen(vsub(first.position, second.position));
      this.distance_delta = 0;
      this.altitude = abs(first.altitude - second.altitude);

      this.collided = false;

      this.conflicts = {};
      this.violations = {};

      this.aircraft[0].addConflict(this, second);
      this.aircraft[1].addConflict(this, first);

      this.update();
    },

    /**
     * Is there anything which should be brought to the controllers attention
     *
     * @returns {Array of Boolean} First element true if any conflicts/warnings,
     *                             Second element true if any violations.
     */
    hasAlerts: function() {
      return [this.hasConflict(), this.hasViolation()];
    },

    /**
     *  Whether any conflicts are currently active
     */
    hasConflict: function() {
      for (var i in this.conflicts) {
        if (this.conflicts[i])
          return true;
      }
      return false;
    },

    /**
     *  Whether any violations are currently active
     */
    hasViolation: function() {
      for (var i in this.violations) {
        if (this.violations[i])
          return true;
      }
      return false;
    },

    /**
     * Update conflict and violation checks, potentially removing this conflict.
     */
    update: function() {
      // Avoid triggering any more conflicts if the two aircraft have collided
      if (this.collided) return;

      var d = this.distance;
      this.distance = vlen(vsub(this.aircraft[0].position, this.aircraft[1].position));
      this.distance_delta = this.distance - d;
      this.altitude = abs(this.aircraft[0].altitude - this.aircraft[1].altitude);

      // Check if the separation is now beyond the bounding box check
      if (this.distance > 14.816) { // 14.816km = 8nm (max possible sep minmum)
        this.remove();
        return;
      }

      this.checkCollision();
      this.checkRunwayCollision();

      // Ignore aircraft below about 1000 feet
      if ((this.aircraft[0].altitude < 990) ||
          (this.aircraft[1].altitude < 990))
        return;

      // Ignore aircraft in the first minute of their flight
      if ((game_time() - this.aircraft[0].takeoffTime < 60) ||
          (game_time() - this.aircraft[0].takeoffTime < 60)) {
        return;
      }

      this.checkProximity();
    },

    /**
     * Remove conflict for both aircraft
     */
    remove: function() {
      this.aircraft[0].removeConflict(this.aircraft[1]);
      this.aircraft[1].removeConflict(this.aircraft[0]);
    },

    /**
     * Check for collision
     */
    checkCollision: function() {
      // Collide within 160 feet
      if (((this.distance < 0.05) && (this.altitude < 160)) &&
          (this.aircraft[0].isVisible() && this.aircraft[1].isVisible()))
      {
        this.collided = true;
        ui_log(true,
               this.aircraft[0].getCallsign() + " collided with "
               + this.aircraft[1].getCallsign());
        prop.game.score.hit += 1;
        this.aircraft[0].hit = true;
        this.aircraft[1].hit = true;

        // If either are in runway queue, remove them from it
        for(var i in airport_get().runways) {
          var rwy = airport_get().runways[i];
          // Primary End of Runway
          var queue = rwy[0].queue;
          for(var j in queue) {
            if(queue[j] == this.aircraft[0])
              rwy[0].removeQueue(this.aircraft[0], rwy[0], true);
            if(queue[j] == this.aircraft[1])
              rwy[0].removeQueue(this.aircraft[1], rwy[0], true);
          }
          // Secondary End of Runway
          queue = rwy[1].queue
          for(var j in queue) {
            if(queue[j] == this.aircraft[0])
              rwy[1].removeQueue(this.aircraft[0], rwy[1], true);
            if(queue[j] == this.aircraft[1])
              rwy[1].removeQueue(this.aircraft[1], rwy[1], true);
          }
        }
      }
    },

    /**
     * Check for a potential head-on collision on a runway
     */
    checkRunwayCollision: function() {
      // Check if the aircraft are on a potential collision course
      // on the runway
      var airport = airport_get();

      // Check for the same runway, different ends and under about 6 miles
      if ((!this.aircraft[0].isTaxiing() && !this.aircraft[1].isTaxiing()) &&
          (this.aircraft[0].fms.currentWaypoint().runway != null) &&
          (this.aircraft[0].fms.currentWaypoint().runway !=
           this.aircraft[1].fms.currentWaypoint().runway) &&
          (airport.getRunway(this.aircraft[1].fms.currentWaypoint().runway) ===
           airport.getRunway(this.aircraft[0].fms.currentWaypoint().runway)) &&
          (this.distance < 10))
      {
        if (!this.conflicts.runwayCollision) {
          this.conflicts.runwayCollision = true;
          ui_log(true, this.aircraft[0].getCallsign()
                 + " appears on a collision course with "
                 + this.aircraft[1].getCallsign()
                 + " on the same runway");
          prop.game.score.warning += 1;
        }
      }
      else {
        this.conflicts.runwayCollision = false;
      }
    },

    /**
     * Check for physical proximity and trigger crashes if necessary
     */
    checkProximity: function() {
      // No conflict or warning if vertical separation is present
      if (this.altitude >= 1000) {
        this.conflicts.proximityConflict = false;
        this.conflicts.proximityViolation = false;
        return;
      }

      var conflict = false;
      var violation = false;
      var a1 = this.aircraft[0], a2 = this.aircraft[1];


      // Standard Basic Lateral Separation Minimum
      var applicableLatSepMin = 5.556;  // 3.0nm


      // Established on precision guided approaches
      if ( (a1.isPrecisionGuided() && a2.isPrecisionGuided()) &&
           (a1.fms.currentWaypoint().runway != a2.fms.currentWaypoint().runway)) { // both are following different instrument approaches
        var runwayRelationship = airport_get().metadata.rwy[a1.fms.currentWaypoint().runway][a2.fms.currentWaypoint().runway];
        if (runwayRelationship.parallel) {
          // Determine applicable lateral separation minima for conducting
          // parallel simultaneous dependent approaches on these runways:
          var feetBetween = km_ft(runwayRelationship.lateral_dist);
          if(feetBetween < 2500)  // Runways separated by <2500'
            var applicableLatSepMin = 5.556;  // 3.0nm
          else if(2500 <= feetBetween && feetBetween <= 3600) // 2500'-3600'
            var applicableLatSepMin = 1.852;  // 1.0nm
          else if(3600 <  feetBetween && feetBetween <= 4300) // 3600'-4300'
            var applicableLatSepMin = 2.778   // 1.5nm
          else if(4300 <  feetBetween && feetBetween <= 9000) // 4300'-9000'
            var applicableLatSepMin = 3.704;  // 2.0nm
          else if(feetBetween > 9000) // Runways separated by >9000'
            var applicableLatSepMin = 5.556;  // 3.0nm
          // Note: The above does not take into account the (more complicated)
          // rules for dual/triple simultaneous parallel dependent approaches as
          // outlined by FAA JO 7110.65, para 5-9-7. Users playing at any of our
          // airports that have triple parallels may be able to "get away with"
          // the less restrictive rules, whilst their traffic may not be 100%
          // legal. It's just complicated and not currently worthwhile to add
          // rules for running trips at this point... maybe later. -@erikquinn
          // Reference: FAA JO 7110.65, section 5-9-6
        }
      }


      // Considering all of the above cases,...
      conflict  = (this.distance < applicableLatSepMin + 1.852);  // +1.0nm
      violation = (this.distance < applicableLatSepMin);


      // "Passing & Diverging" Rules (the "exception" to all of the above rules)
      if(conflict) { // test the below only if separation is currently considered insufficient
        var hdg_difference = abs(angle_offset(a1.groundTrack, a2.groundTrack));
        if (hdg_difference >= radians(15)) {
          if (hdg_difference > radians(165)) {  // 'opposite' courses
            if (this.distance_delta > 0) {  // OKAY IF the distance is increasing
              conflict = false;
              violation = false;
            }
          }
          else {  // 'same' or 'crossing' courses
            // Ray intersection from http://stackoverflow.com/a/2932601
            var ad = vturn(a1.groundTrack);
            var bd = vturn(a2.groundTrack);
            var dx = a2.position[0] - a1.position[0];
            var dy = a2.position[1] - a1.position[1];
            var det = bd[0] * ad[1] - bd[1] * ad[0];
            var u = (dy * bd[0] - dx * bd[1]) / det;  // a1's distance from point of convergence
            var v = (dy * ad[0] - dx * ad[1]) / det;  // a2's distance from point of convergence
            if ((u < 0) || (v < 0)) { // check if either a/c has passed the point of convergence
              conflict  = false;  // targets are diverging
              violation = false;  // targets are diverging
            }
            // Reference: FAA JO 7110.65, section 5-5-7-a-1:
            // (a) Aircraft are on opposite/reciprocal courses and you have observed
            // that they have passed each other; or aircraft are on same or crossing
            // courses/assigned radar vectors and one aircraft has crossed the
            // projected course of the other, and the angular difference between
            // their courses/assigned radar vectors is at least 15 degrees.
          }
        }
      }

      // Update Conflicts
      if (conflict) this.conflicts.proximityConflict = true;
      else this.conflicts.proximityConflict = false;      
      if (violation) this.violations.proximityViolation = true;
      else this.violations.proximityViolation = false;
    }
  };
});

var Model=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};

      this.name = null;
      this.icao = null;

      this.engines = null;
      this.weightclass = null;
      this.category = null;

      this.rate = {
        turn:       0, // radians per second
        climb:      0, // feet per second
        descent:    0,
        accelerate: 0, // knots per second
        decelerate: 0,
      };

      this.runway = {
        takeoff: 0, // km needed to takeoff
        landing: 0,
      };

      this.speed = {
        min:     0,
        max:     0,
        landing: 0,
        cruise:  0
      };

      this.parse(options);

      if(options.url) this.load(options.url);

    },
    parse: function(data) {
      if(data.name) this.name = data.name;
      if(data.icao) this.icao = data.icao;

      if(data.engines) this.engines = data.engines;
      if(data.weightclass) this.weightclass = data.weightclass;
      if(data.category) this.category = data.category;
      if(data.ceiling) this.ceiling = data.ceiling;
      if(data.rate) {
        this.rate         = data.rate;
        this.rate.climb  = this.rate.climb;
        this.rate.descent = this.rate.descent;
      }

      if(data.runway) this.runway = data.runway;

      if(data.speed) this.speed = data.speed;
    },
    load: function(url) {
      this.content = new Content({
        type: "json",
        url: url,
        that: this,
        callback: function(status, data) {
          if(status == "ok") {
            this.parse(data);
          }
        }
      });
    },
  };
});

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
 */
zlsa.atc.AircraftFlightManagementSystem = Fiber.extend(function() {
  return {
    init: function(options) {
      this.my_aircrafts_eid = options.aircraft.eid;
      this.waypoints = [];
      this.waypoints_past = [];
      this.fp = { altitude: null, route: [] };
      this.following = {
        sid:  null,   // Standard Instrument Departure Procedure
        star: null,   // Standard Terminal Arrival Route Procedure
        iap:  null,   // Instrument Approach Procedure (like ILS, GPS, RNAV, VOR-A, etc)
        tfc:  null,   // Traffic (another airplane)
        anything:  false   // T/F flag for if anything is being "followed"
      };
      
      // set initial
      this.appendWaypoint();
      this.fp.altitude = clamp(1000, options.model.ceiling, 60000);
      if(options.aircraft.category == "arrival") 
        this.fp.route.push("KDBG",airport_get().icao);
      else if(options.aircraft.category == "departure") 
        this.fp.route.push(airport_get().icao,"KDBG");
    },

    /** Return this fms's parent aircraft
     */
    my_aircraft: function() {
      return aircraft_get(this.my_aircrafts_eid);
    },

    /** Build a waypoint object
     ** Note that .prependWaypoint() or .appendWaypoint() or .insertWaypoint()
     ** should be called in order to add waypoints to the fms, based on which
     ** you want. This function serves only to build the waypoint object; it is
     ** placed by one of the other three functions.
     */
    addWaypoint: function(data) {
      if (data === undefined)
        data = {};

      var wp = {
        altitude: null,
        name:     'unnamed',
        navmode:  null,
        heading:  null,
        turn:     null,
        location: null,
        expedite: false,
        speed:    null,
        runway:   null,
        hold: {
          dirTurns  : null,
          fixName   : null,
          fixPos    : null,
          inboundHdg: null,
          legLength : null,
          timer     : 0
        },
        fixRestrictions: {
          alt: null,
          spd: null
        }
      };

      if (data.fix) {
        wp.navmode = 'fix';
        wp.name = data.fix;
        wp.location = airport_get().getFix(data.fix);
      }

      for (var f in data) {
        wp[f] = data[f];
      }

      return wp;
    },

    /** Insert a waypoint at the front of fms.waypoints
     */
    prependWaypoint: function (data) {
      this.waypoints.unshift(this.addWaypoint(data));
    },

    /** Insert a waypoint at the end of fms.waypoints
     */
    appendWaypoint: function(data) {
      this.waypoints.push(this.addWaypoint(data));
    },

    /** Insert a waypoint at a particular position within fms.waypoints
     */
    insertWaypoint: function(data, position) {
      this.waypoints.splice(position, 0, this.addWaypoint(data));
    },

    /** Return the current waypoint
     */
    currentWaypoint: function() {
      if(this.waypoints.length < 1) return null;
      else return this.waypoints[0];
    },

    /** True if waypoint of the given name exists
     */
    hasWaypoint: function(name) {
      for (var j=0; j<this.waypoints.length; j++) {
        if (this.waypoints[j].name == name) {
          return true;
        }
      }
      return false;
    },

    /** Switch to the next waypoint
     */
    nextWaypoint: function() {
      var last = this.waypoints.shift();

      if (this.waypoints.length == 0) {
        this.appendWaypoint({
          navmode: 'heading',
          heading: last.heading,
          speed: last.speed,
          altitude: last.altitude,
        });
      }

      if (this.waypoints[0].speed == null)
        this.waypoints[0].speed = last.speed;

      if (this.waypoints[0].altitude == null)
        this.waypoints[0].altitude = last.altitude;
    },

    /** Remove all waypoints except the current one
     */
    removeWaypoints: function() {
      this.waypoints = [this.waypoints[0]];
    },

    /** Modify all waypoints
     */
    setAll: function(data) {
      for (var i=0; i<this.waypoints.length; i++) {
        for (var k in data) {
          this.waypoints[i][k] = data[k];
        }
      }
    },

    /** Modify the current waypoint
     */
    setCurrent: function(data) {
      for (var i in data) {
        this.waypoints[0][i] = data[i];
      }
    },

    /** Reset waypoints as a list of fixes
     */
    setFixes: function(fixes) {
      var current = this.waypoints[0];
      this.waypoints = [];
      for (var i=0;i< fixes.length;i++) {
        var f = fixes[i];
        this.appendWaypoint({
          name: f,
          navmode: 'fix',
          location: airport_get().getFix(f),
        });
      }

      // Restore existing clearances
      this.waypoints[0].altitude = current.altitude;
      this.waypoints[0].speed = current.speed;
      this.waypoints[0].expedite = current.expedite;
      this.waypoints[0].runway = current.runway;
    },

    /** Invokes flySID() for the SID in the flightplan (fms.fp.route)
     */
    clearedAsFiled: function() {
      aircraft_get(this.my_aircrafts_eid).runSID(aircraft_get(this.my_aircrafts_eid).destination);
      this.setAll({altitude:airport_get().initial_alt});
      return true;
    },

    /** Calls various task-based functions and sets 'fms.following' flags
     */
    follow: function(type, thingToFollow, /*optional*/ data) {
      this.stopFollowing(); // remove any current follows
      if(type == "sid") {
        this.following.anything = true;
        this.following.sid = thingToFollow;
        this.flySID(data);
      }
      else if(type == "star") {   // **FUTURE FUNCTIONALITY**
        this.following.anything = true;
        this.following.star = thingToFollow;    // full STARs NOT YET IMPLEMENTED
        // call function to fly the STAR
      }
      else if(type == "iap") {
        this.following.anything = true;
        this.following.iap = thingToFollow;
        this.flyApproach(data[0], data[1]);
      }
      else if(type == "tfc") {    // **FUTURE FUNCTIONALITY**
        this.following.anything = true;
        this.following.tfc = thingToFollow.eid; // EID of the traffic we're following
        // call function to follow another aircraft
      }
      else if(type == "airway") { // **FUTURE FUNCTIONALITY**
        this.following.anything = true;
        this.following.airway = thingToFollow;  // airways NOT YET IMPLEMENTED
        // call function to fly along airway
      }
      else {
        console.log("Unable to follow '" + type + "' called '" + thingToFollow + "'");
      }
    },

    /** Terminates any current follows and updates the 'fms.following' flags
     */
    stopFollowing: function() {
      var f = this.following;
      var wp = this.waypoints;
      if(f.sid) {
        this.skipToWaypoint(this.fp.route[1].split(".")[1]);  // remove all sid waypoints
        f.sid = false;
      }
      else if(f.star) {   // **FUTURE FUNCTIONALITY**
        // remove all star waypoints
      }
      else if(f.iap) {
        this.my_aircraft().cancelLanding();
        f.iap = false;
      }
      else if(f.tfc) {    // **FUTURE FUNCTIONALITY**
        // stop following traffic
      }
      else if(f.airway) { // **FUTURE FUNCTIONALITY**
        // stop following airway
      }

      if(!f.sid && !f.star && !f.iap && !f.tfc)
        f.anything = false;
    },

    /** Join an instrument approach (eg. ILS/GPS/RNAV/VOR/LAAS/etc)
     ** @param {string} type - the type of approach (like "ils")
     ** @param {Runway} rwy - the Runway object the approach ends into
     ** @param {string} variant - (optional) for stuff like "RNAV-Z 17L"
     */
    flyApproach: function(type, rwy, /*optional*/ variant) {
      if(type == "ils") {
        this.my_aircraft().cancelFix();
        this.setCurrent({
          navmode: "rwy",
          runway: rwy.toUpperCase(),
          turn: null,
          start_speed: this.my_aircraft().speed,
        });
      }
      // if-else all the other approach types here...
      // ILS, GPS, RNAV, VOR, NDB, LAAS/WAAS, MLS, etc...
    },

    /** Adds a series of fixes w/ altitudes to the fms waypoints list
     */
    flySID: function(fixes_n_alts_n_speeds) {
      var current = this.waypoints[0];
      this.waypoints = [];
      for (var i=0; i< fixes_n_alts_n_speeds.length; i++) {
        var f = fixes_n_alts_n_speeds[i][0];
        var a = null, s = null;
        if(fixes_n_alts_n_speeds[i][1]) {
          var a_n_s = fixes_n_alts_n_speeds[i][1].toUpperCase().split("|");
          for(var j in a_n_s) {
            if(a_n_s[j][0] == "A") a = a_n_s[j].substr(1);
            else if(a_n_s[j][0] == "S") s = a_n_s[j].substr(1);
          }
        }

        // add waypoint to fms
        this.appendWaypoint({
          name: f,
          navmode: 'fix',
          location: airport_get().getFix(f),
          fixRestrictions: {alt:a, spd:s}
        });
      }

      // Restore existing clearances
      this.waypoints[0].altitude = current.altitude;
      this.waypoints[0].speed = current.speed;
      this.waypoints[0].expedite = current.expedite;
      this.waypoints[0].runway = current.runway;
    },

    /** Climbs aircraft in compliance with the SID they're following
     ** Adds altitudes and speeds to each waypoint that are as high as 
     ** possible without exceeding any the following:
     **    - (alt) airspace ceiling ('ctr_ceiling')
     **    - (alt) filed cruise altitude
     **    - (alt) waypoint's altitude restriciton
     **    - (spd) 250kts when under 10k ft
     **    - (spd) waypoint's speed restriction
     */
    climbViaSID: function() {
      var wp = this.waypoints;  // copy current waypoints
      var cruise_alt = this.fp.altitude;
      var cruise_spd = this.my_aircraft().model.speed.cruise;

      for(var i=0; i<wp.length; i++) {
        var a = wp[i].fixRestrictions.alt;
        var s = wp[i].fixRestrictions.spd;

        // Altitude Control
        if(a) {
          if(a.indexOf("+") != -1) {  // at-or-above altitude restriction
            var minAlt = parseInt(a.replace("+","")) * 100;
            var alt = Math.min(airport_get().ctr_ceiling, cruise_alt);
          }
          else if(a.indexOf("-") != -1) {
            var maxAlt = parseInt(a.replace("-","")) * 100;
            var alt = Math.min(maxAlt, cruise_alt) // climb as high as restrictions permit
          }
          else var alt = parseInt(a); // cross AT this altitude
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
      this.waypoints = wp;
      return true;
    },

    /** Skips waypoints intermediate to the given waypoint
     */
    skipToWaypoint: function(name) {
      var current = this.waypoints[0];
      var i = -1;
      for (var j=0; j<this.waypoints.length; j++) {
        if (this.waypoints[j].name == name) {
          i = j;
          break;
        }
      }

      if (i > 0) {
        var current = this.waypoints[0];

        this.waypoints = this.waypoints.slice(i);

        // Restore existing clearances
        this.waypoints[0].altitude = current.altitude;
        this.waypoints[0].speed = current.speed;
        this.waypoints[0].expedite = current.expedite;
        this.waypoints[0].runway = current.runway;
      }

      return i;
    },

    /** Returns a (deep) copy of a waypoint.
     ** By default, when pushing an object (like a waypoint) to an array
     ** in js, the value of the object itself is not copied, but rather
     ** just a reference (pointer) to the object. This results in pushing
     ** the correct value to the array, and then when the source value
     ** changes, it is also changed in the array, despite the fact that
     ** you would have thought you had 'saved' the old value.
     ** 
     ** This function will manually build a copy of the waypoint object,
     ** and return the ACTUAL value, that will not be changed when the
     ** fms is updated.
     */
    deepCopyWaypoint: function(wp) {
      if(!wp) wp = this.currentWaypoint();
      var copy = {
        altitude: null,
        name:     'unnamed',
        navmode:  null,
        heading:  null,
        turn:     null,
        location: null,
        expedite: false,
        speed:    null,
        runway:   null,
        fixRestrictions: {
          alt: null,
          spd: null
        }
      };
      for(var i in wp) copy[i] = wp[i];
      for(var i in wp.fixRestrictions) copy.fixRestrictions[i] = wp.fixRestrictions[i];
      return copy;
    }
  };
});

var Aircraft=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};
      this.eid          = prop.aircraft.list.length;  // entity ID
      this.position     = [0, 0];     // Aircraft Position, in km, relative to airport position
      this.model        = null;       // Aircraft type
      this.airline      = "";         // Airline Identifier (eg. 'AAL')
      this.callsign     = "";         // Flight Number ONLY (eg. '551')
      this.heading      = 0;          // Magnetic Heading
      this.altitude     = 0;          // Altitude, ft MSL
      this.speed        = 0;          // Indicated Airspeed (IAS), knots
      this.groundSpeed  = 0;          // Groundspeed (GS), knots
      this.groundTrack  = 0;          // 
      this.ds           = 0;          // 
      this.takeoffTime  = 0;          // 
      this.approachOffset = 0;        // Distance laterally from the approach path
      this.approachDistance = 0;      // Distance longitudinally from the threshold
      this.radial       = 0;          // Angle from airport center to aircraft
      this.distance     = 0;          // 
      this.destination  = null;       // Destination they're flying to
      this.trend        = 0;          // Indicator of descent/level/climb (1, 0, or 1)
      this.history      = [];         // Array of previous positions
      this.restricted   = {list:[]};  // 
      this.notice       = false;      // Whether aircraft 
      this.warning      = false;      // 
      this.hit          = false;      // Whether aircraft has crashed
      this.taxi_next    = false;      // 
      this.taxi_start   = 0;          // 
      this.taxi_delay   = 0;          // 
      this.rules        = "ifr";      // Either IFR or VFR (Instrument/Visual Flight Rules)
      this.inside_ctr   = false;      // Inside ATC Airspace
      this.datablockDir = -1;         // Direction the data block points (-1 means to ignore)
      this.conflicts    = {};         // List of aircraft that MAY be in conflict (bounding box)
      
      if (prop.airport.current.terrain) {
        var terrain = prop.airport.current.terrain;
        this.terrain_ranges = {};
        this.terrain_level = 0;
        for (var k in terrain) {
          this.terrain_ranges[k] = {};
          for (var j in terrain[k]) {
            this.terrain_ranges[k][j] = Infinity;
          }
        }
      } else {
        this.terrain_ranges = false;
      }
      
      // Set to true when simulating future movements of the aircraft
      // Should be checked before updating global state such as score
      // or HTML.
      this.projected = false;

      this.position_history = [];

      this.category = options.category; // or "departure"
      this.mode     = "cruise";  // "apron", "taxi", "waiting", "takeoff", "cruise", or "landing"
      // where:
      // - "apron" is the initial status of a new departing plane. After
      //   the plane is issued the "taxi" command, the plane transitions to
      //   "taxi" mode
      // - "taxi" describes the process of getting ready for takeoff. After
      //   a delay, the plane becomes ready and transitions into "waiting" mode
      // - "waiting": the plane is ready for takeoff and awaits clearence to
      //   take off
      // - "takeoff" is assigned to planes in the process of taking off. These
      //   planes are still on the ground or have not yet reached the minimum
      //   altitude
      // - "cruse" describes, that a plane is currently in flight and
      //   not following an ILS path. Planes of category "arrival" entering the
      //   playing field also have this state. If an ILS path is picked up, the
      //   plane transitions to "landing"
      // - "landing" the plane is following an ILS path or is on the runway in
      //   the process of stopping. If an ILS approach or a landing is aborted,
      //   the plane reenters "cruise" mode

      /*
       * the following diagram illustrates all allowed mode transitions:
       *
       * apron -> taxi -> waiting -> takeoff -> cruise <-> landing
       *   ^                                       ^
       *   |                                       |
       * new planes with                      new planes with
       * category "departure"                 category "arrival"
       */


      // Initialize the FMS
      this.fms = new zlsa.atc.AircraftFlightManagementSystem({
        aircraft: this, model:options.model
      });

      //target represents what the pilot makes of the tower's commands. It is
      //most important when the plane is in a 'guided' situation, that is it is
      //not given a heading directly, but has a fix or is following an ILS path
      this.target = {
        heading:  null,
        turn:     null,
        altitude: 0,
        expedite: false,
        speed:    0
      };

      this.emergency = {};

      // Setting up links to restricted areas 
      var ra = prop.airport.current.restricted_areas; 
      for (var i in ra) {
        this.restricted.list.push({
          data: ra[i], range: null, inside: false});
      }


      this.parse(options);

      this.html = $("<li class='strip'></li>");

      this.html.append("<span class='callsign'>" + this.getCallsign() + "</span>");
      this.html.append("<span class='heading'>" + round(this.heading) + "</span>");
      this.html.append("<span class='altitude'>-</span>");
      this.html.append("<span class='aircraft'>" + this.model.icao + "</span>");
      if (this.destination) {
        if(typeof this.destination == "number")
          this.html.append("<span class='destination'>" + round(degrees(this.destination)) + "</span>");
        else if(typeof this.destination == "string")
          this.html.append("<span class='destination'>" + this.destination + "</span>");
      }
      else this.html.append("<span class='destination'></span>");
      this.html.append("<span class='speed'>-</span>");

      this.html.find(".aircraft").prop("title", this.model.name);

      if(this.category == "arrival") {
        this.takeoffTime = game_time();
        this.html.addClass("arrival");
        this.html.prop("title", "Scheduled for arrival");
      } else {
        this.takeoffTime = null;
        this.html.addClass("departure");
        this.html.prop("title", "Scheduled for departure");
      }

      if(options.message) {
        if(this.category == "arrival" && aircraft_visible(this) && !this.inside_ctr) {
          this.callUp();
          this.inside_ctr = true;
        } else if(this.category == "departure") {
          this.callUp();
        }
      }

      // var scrollPos = $("#strips")[0].scrollHeight - $("#strips").scrollTop();
      var scrollPos = $("#strips").scrollTop();
      $("#strips").prepend(this.html);
      $("#strips").scrollTop(scrollPos + 45);  // shift scroll down one strip's height

      this.html.click(this, function(e) {
        input_select(e.data.getCallsign());
      });

      this.html.dblclick(this, function (e) {
        prop.canvas.panX = 0 - round(km_to_px(e.data.position[0]));
        prop.canvas.panY = round(km_to_px(e.data.position[1]));
        prop.canvas.dirty = true;
      });
      if (this.category == "arrival")
        this.html.hide(0);
      if (this.category == "departure")
        this.inside_ctr = true;
    },
    // Ignore waypoints further away from the origin than the aircraft
    setArrivalWaypoints: function(waypoints) {
      for (var i=0; i<waypoints.length; i++) {
        this.fms.appendWaypoint(waypoints[i]);
      }
      this.fms.nextWaypoint(); // Remove the default waypoint

      var aircraft_dist = vlen(this.position);
      while (vlen(this.fms.currentWaypoint().location) > aircraft_dist)
      {
        this.fms.nextWaypoint();
        if (!this.fms.currentWaypoint().location)
          break;
      }

      if (this.fms.currentWaypoint().navmode == 'heading') {
        this.fms.setCurrent({
          heading: vradial(this.position) + Math.PI,
        });
      }
    },
    cleanup: function() {
      this.html.remove();
    },
    // Called when the aircraft crosses the center boundary
    crossBoundary: function(inbound) {
      this.inside_ctr = inbound;
      if (this.projected)
        return;
      // Crossing into the center
      if (inbound) {
        this.showStrip();
        this.callUp();
      }
      // Leaving the center
      else {
        this.hideStrip();

        if (this.category == "departure") {
          if(this.destination == "number") {
            // Within 5 degrees of destination heading
            if (abs(this.radial - this.destination) < 0.08726) {
              this.radioCall("switching to center, good day", "dep");
              prop.game.score.departure += 1;
            }
            else {
              this.radioCall("leaving radar coverage outside departure window", "dep", true);
              prop.game.score.departure -= 1;
            }
          }
          else { // following a Standard Instrument Departure procedure
            var ok = false;
            if(!ok) for(var i in this.fms.waypoints_past)
              if(this.fms.waypoints_past[i].name == this.fms.fp.route[1].split(".")[1]) {ok = true; break;}
            if(!ok) for(var i in this.fms.waypoints)
              if(this.fms.waypoints[i].name == this.fms.fp.route[1].split(".")[1]) {ok = true; break;}
            if(ok) {
              this.radioCall("switching to center, good day", "dep");
              prop.game.score.departure += 1;
            }
            else {
              this.radioCall("leaving radar coverage without being cleared to " + 
                this.fms.fp.route[1].split(".")[1],"dep",true)
              prop.game.score.departure -= 1;
            }
          }
          this.fms.setCurrent({altitude:this.fms.fp.altitude, speed:this.model.speed.cruise});
        }
        if (this.category == "arrival") {
          this.radioCall("leaving radar coverage as arrival", "app", true);
          prop.game.score.failed_arrival += 1;
        }
      }
    },
    matchCallsign: function(callsign) {
      if( callsign === '*')
        return true;
      callsign = callsign.toLowerCase();
      var this_callsign = this.getCallsign().toLowerCase();
      if(this_callsign.indexOf(callsign) == 0) return true;
      return false;
    },
    getCallsign: function() {
      return (this.getAirline().icao + this.callsign).toUpperCase();
    },
    getAirline: function() {
      return airline_get(this.airline);
    },
    getRadioCallsign: function(condensed) {
      var heavy = "";
      if(this.model.weightclass == "H") heavy = " heavy"
      if(this.model.weightclass == "U") heavy = " super"
      var callsign = this.callsign;
      if(condensed) {
        var length = 2;
        callsign = callsign.substr(callsign.length - length);
      }
      var cs = airline_get(this.airline).callsign;
      if(cs == "November") cs += " " + radio_spellOut(callsign) + heavy;
      else cs += " " + groupNumbers(callsign, this.airline) + heavy;
      return cs;
    },
    getClimbRate: function() {
      var a = this.altitude;
      var r = this.model.rate.climb;
      var c = this.model.ceiling;
      if(this.model.engines.type == "J") var serviceCeilingClimbRate = 500;
      else var serviceCeilingClimbRate = 100;
      if(this.altitude < 36152) { // in troposphere
        var cr_uncorr = r*420.7* ((1.232*Math.pow((518.6 - 0.00356*a)/518.6, 5.256)) / (518.6 - 0.00356*a));
        var cr_current = cr_uncorr - (a/c*cr_uncorr) + (a/c*serviceCeilingClimbRate);
      }
      else { // in lower stratosphere
        //re-do for lower stratosphere
        //Reference: https://www.grc.nasa.gov/www/k-12/rocket/atmos.html 
        //also recommend using graphing calc from desmos.com
        return this.model.rate.climb; // <-- NOT VALID! Just a placeholder!
      }
      return cr_current;
    },
    getClimbRate: function() {
      var a = this.altitude;
      var r = this.model.rate.climb;
      var c = this.model.ceiling;
      if(this.model.engines.type == "J") var serviceCeilingClimbRate = 500;
      else var serviceCeilingClimbRate = 100;
      if(this.altitude < 36152) { // in troposphere
        var cr_uncorr = r*420.7* ((1.232*Math.pow((518.6 - 0.00356*a)/518.6, 5.256)) / (518.6 - 0.00356*a));
        var cr_current = cr_uncorr - (a/c*cr_uncorr) + (a/c*serviceCeilingClimbRate);
      }
      else { // in lower stratosphere
        //re-do for lower stratosphere
        //Reference: https://www.grc.nasa.gov/www/k-12/rocket/atmos.html 
        //also recommend using graphing calc from desmos.com
        return this.model.rate.climb; // <-- NOT VALID! Just a placeholder!
      }
      return cr_current;
    },
    hideStrip: function() {
      this.html.hide(600);
    },

    COMMANDS: {
        /*
        command name: {
          func: ['name of function to call'],
          shortkey: [list of shortKeys],
              //Note: normal command/synonyms require format 'command arg'. Shortkeys
              //instead are meant to NOT have the space that is required to properly
              //parse the command. Shortkeys take the format of (shortkey character)
              //followed by (command argument). Note that shortkeys MUST ALL HAVE FIRST
              //CHARACTERS THAT ARE UNIQUE from each other, as that is how they are 
              //currently being identified. Examples of valid commands:
              //'<250', '^6', '^6000', '.DUMBA'
            synonyms: [list of synonyms]},
              //Note: synonyms can be entered into the command bar by users and they 
              //have the same effect as typing the actual command, and use the same
              //format as the full command. Examples of valid commands:
              //'altitude 5'=='c 5', land 16'=='l 16', 'fix DUMBA'='f DUMBA'
        */
        abort: {func: 'runAbort'},

        altitude: {
          func: 'runAltitude',
          shortKey: ['\u2B61', '\u2B63'],
          synonyms: ['a', 'c', 'climb', 'd', 'descend']},

        clearedasfiled: {
          func: 'runClearedAsFiled',
          synonyms: ['caf']},

        climbviasid: {
          func: 'runClimbViaSID',
          synonyms: ['cvs']},

        debug: {func: 'runDebug'},

        direct: {
          func: 'runDirect',
          synonyms: ['dct']},

        fix: {
          func: 'runFix',
          synonyms: ['f', 'track']},

        heading: {
          func: 'runHeading',
          shortKey: ['\u2BA2','\u2BA3','fh'],
          synonyms: ['t', 'h', 'turn']},

        hold: {
          func: 'runHold'},

        land: {
          func: 'runLanding',
          shortKey: ['\u2B50'],
          synonyms: ['l', 'ils', 'i']},

        moveDataBlock: {
          func: 'runMoveDataBlock',
          shortKey: ['`']},

        proceed: {
          func: 'runProceed',
          synonyms: ['pr']},

        sid: {func: 'runSID'},

        speed: {
          func: 'runSpeed',
          shortKey: ['+', '-'],
          synonyms: ['slow', 'sp']},

        takeoff: {
          func: 'runTakeoff',
          synonyms: ['to', 'cto']},

        wait: {
          func: 'runWait',
          synonyms: ['w', 'taxi']}
      },
    
    runCommand: function(command) {
      if (!this.inside_ctr)
        return true;
      var user_input = $.map(command.toLowerCase().split(" "), function(v) {if (v.length > 0) return v; });
      var commands = [];
      var commandArguments  = "";
      var previous = "";
      var longCmdName = "";
      var thisStringAlreadyDone = false;


      for(var i in user_input) {  //fill commands[] based on user input
        var string = user_input[i];
        var is_command = false;
        var is_shortCommand = false;
        var skip = false;

        if(thisStringAlreadyDone) { //bugfix
          thisStringAlreadyDone = false;
          continue;
        }

        if(previous.indexOf("t") == 0 && (string.indexOf("l") == 0 || string.indexOf("r") == 0)) {  //bugfix
          //Prevents conflicts between use of "l" as in takeoff's synonym vs "turn left 310"
          commands[commands.length-1].push(string + " " + user_input[(parseInt(i)+1).toString()]); //push both arguments to heading() together
          thisStringAlreadyDone = true; //to we don't attempt to do anything with the next string on the next iteration, because we've just now done it already
          continue;
        }

        if (commands.length > 0 && commands[commands.length-1][0] == "altitude" && string.indexOf("e") == 0) {  //expedite option for altitude changes (bugfix)
          commands[commands.length-1][1] += " " + string; //push both arguments to heading() together
        }

        if(string.substr(0,2) == "fh") {  //bugfix
          //Command is a shortkey, eg 'fh270' and not a 'fix sassu'. Will skip detection of 'fix' or 'f' below.
          is_shortCommand = true;
          longCmdName = "heading";
        }
        else if(!skip) {  //normal logic
          for(var k in this.COMMANDS) { 
            if(k == string) {  //input command is a valid command name (eg 'altitude')
              is_command = true;
              break;
            }
            else if(this.COMMANDS[k].synonyms && this.COMMANDS[k].synonyms.indexOf(string) != -1) {  //input command is a valid command synonym
              is_command = true;
              break;
            }
            else {  //check for shortKey
              for(var m in this.COMMANDS[k].shortKey) {
                if(string.substr(0,1) == this.COMMANDS[k].shortKey[m].substr(0,1)) {  //first character of input command is a command's shortkey)
                  if(this.COMMANDS[k].shortKey[m].length == 1) { //single character shortKey, matches input command
                    is_shortCommand = true;
                    longCmdName = k;
                    break;
                  }
                  else 
                  {
                    if(this.COMMANDS[k].shortKey[m].length > 1 && this.COMMANDS[k].shortKey[m] == string.substr(0,this.COMMANDS[k].shortKey[m].length)) { //multi-char shortKey, matches input command
                      is_shortCommand = true;
                      longCmdName = k;
                      break;
                    }
                  }
                }
              }
            }
            if(is_shortCommand) break;
          }
          if(!(is_command || is_shortCommand)) {  //string neither command nor shortKey. Must be a command argument.
            commandArguments += string;
          }
        }

        if(is_shortCommand) {
          commands.push([longCmdName,string]);    //push whole string (it is a full short-command, eg '>350')
        }
        else if (is_command) {
          commands.push([string]);      //push NAME/SYNONYM of command into commands array (eg 't')
        }
        else if(commandArguments) {
          if(commands.length != 0) commands[commands.length-1].push(commandArguments); //append the arguments to previous command
          commandArguments = "";  //clear out commandArguments
        }
        previous = string;
      }
      //End of creating 'commands[]'

      var response = [];
      var response_end = "";
      var deferred = [];
      var DEFERRED_COMMANDS = ["takeoff", "to"];

      for(var i=0;i<commands.length;i+=1) {
        var pair    = commands[i];

        var command = pair[0];
        var data    = "";

        if(pair.length == 2) data = pair[1];
        if(pair.length > 2) {
          data = pair.splice(1).join(" ");
        }

        if(DEFERRED_COMMANDS.indexOf(command) == 0) {
          deferred.push(pair);
          continue;
        }

        var retval  = this.run(command, data);
        if(retval) {
          if(!retval[1].hasOwnProperty("log") || !retval[1].hasOwnProperty("say")) {
            retval = [retval[0],{log:retval[1], say:retval[1]}];
          }
          response.push(retval[1]);
          if(retval[2]) response_end = retval[2];
        }

      }

      for(var i=0;i<deferred.length;i+=1) {
        var pair    = deferred[i];

        var command = pair[0];
        var data    = "";
        if(pair.length == 2) data = pair[1];
        var retval  = this.run(command, data);
        if(retval) {
          if(retval[1].length != null) { // true if array, and not log/say object
            retval[1] = {say:retval[1], log:retval[1]};  // make into log/say object
          }
            response.push(retval[1]);
        }

      }

      if(commands.length == 0) {
        response     = [{say:"not understood", log:"not understood"}];
        response_end = "say again";
      }

      if(response.length >= 1) {
        if(response_end) response_end = ", " + response_end;

        var r_log = function f(){var x = [];for(var i=0;i<response.length;i++){x.push(response[i].log)}return x;};
        var r_say = function f(){var x = [];for(var i=0;i<response.length;i++){x.push(response[i].say)}return x;};

        ui_log(this.getCallsign() + ", " + r_log().join(", ") + response_end);
        speech_say([ {type:"callsign", content:this}, {type:"text", content:r_say().join(", ") + response_end} ]);
      }

      this.updateStrip();

      return true;
    },
    run: function(command, data) {
      var call_func;

      if (this.COMMANDS[command]) {
        call_func = this.COMMANDS[command].func;
      }
      else {
        $.each(this.COMMANDS, function(k, v) {
          if (v.synonyms && v.synonyms.indexOf(command) != -1) { call_func = v.func; }
        });
      }

      if (!call_func) 
        return ["fail", "not understood"];

      return this[call_func].apply(this, [data]);
    },
    runHeading: function(data) {
      var split     = data.split(" ");
      var heading = null;
      var direction = null;
      var instruction = null;
      var incremental = false, amount = 0;
      switch(split.length) {  //number of elements in 'data'
        case 1: 
          if(isNaN(parseInt(split))) {  //probably using shortKeys
            if(split[0][0] == "\u2BA2") { //using '<250' format
              direction = "left";
              heading = split[0].substr(1); //remove shortKey
              if(heading.length < 3) incremental = true;
            }
            else if (split[0][0] == "\u2BA3") {  //using '>250' format
              direction = "right";
              heading = split[0].substr(1); //remove shortKey
              if(heading.length < 3) incremental = true;
            }
            else if(split[0].substr(0,2).toLowerCase() == "fh") { //using 'fh250' format
              heading = split[0].substr(2); //remove shortKey
            }
            else {  //input is invalid
              return ["fail", "heading not understood"];
            }
          }
          else {  //using 'turn 250' format (no direction specified)
            heading = parseInt(split);
          }
          break;

        case 2: //using 'turn r 250' format
          if(split[0] === "l") direction = "left";
          else if (split[0] === "r" ) direction = "right";
          heading = split[1];
          if(heading.length < 3) incremental = true;
          break;

        default:  //input formatted incorrectly
          return ["fail", "heading not understood"];
          break;
      }
      if(isNaN(heading)) return ["fail", "heading not understood"];

      // for incremental turns
      if(incremental) { // eg 'turn twenty degrees left'
        if(direction == "left") {
          amount = parseInt(heading);
          heading = degrees(this.heading) - amount;
        }
        else if(direction == "right") {
          amount = parseInt(heading);
          heading = degrees(this.heading) + amount;
        }
      }

      //Stop doing what you're doing
      if(this.fms.currentWaypoint().navmode == "rwy")
        this.cancelLanding();
      this.cancelFix();

      // Set the heading in the FMS
      this.fms.setCurrent({
        navmode: "heading",
        heading: radians(heading),
        turn: direction,
        hold: false,
      });

      // Construct the readback
      if(direction) instruction = "turn " + direction + " heading ";
      else instruction = "fly heading ";
      if(incremental) 
        var readback = {
          log: "turn " + amount + " degrees " + direction,
          say: "turn " + groupNumbers(amount) + " degrees " + direction};
      else var readback = {
          log: instruction + heading_to_string(this.fms.currentWaypoint().heading),
          say: instruction + radio_heading(heading_to_string(this.fms.currentWaypoint().heading))};
      return ['ok', readback];
    },
    runAltitude: function(data) {
      if(data[0] == "\u2B61" || data[0] == "\u2B63") {  //shortKey 'v' or '^' in use
        data = data.substr(1);  //remove shortKey
      }

      var split     = data.split(" ");
      var altitude = parseInt(split[0]);
      var expedite = false;
      data = split[0];

      function isExpedite(s) {
        if((s.length >= 1 && "expedite".indexOf(s) == 0) || s == "x") return true;
        return false;
      }

      if(split.length >= 2 && isExpedite(split[1])) {
        expedite = true;
      }

      if(isNaN(altitude)) {
        if(isExpedite(split[0])) {
          this.setCurrent({expedite: true});
          return ['ok', radio_trend('altitude', this.altitude, this.fms.currentWaypoint().altitude) + " " + this.fms.currentWaypoint().altitude + ' expedite'];
        }
        return ["fail", "altitude not understood"];
      }

      if(this.mode == "landing")
        this.cancelLanding();

      var ceiling = airport_get().ctr_ceiling;
      if (prop.game.option.get('softCeiling') == 'yes')
        ceiling += 1000;

      altitude *= 100;

      this.fms.setAll({
        altitude: clamp(1000, altitude, ceiling),
        expedite: expedite,
      })

      if(expedite) expedite = " and expedite";
      else         expedite = "";

      var readback = {
        log: radio_trend('altitude', this.altitude, this.fms.currentWaypoint().altitude) + " " + this.fms.currentWaypoint().altitude + expedite,
        say: radio_trend('altitude', this.altitude, this.fms.currentWaypoint().altitude) + " " + radio_altitude(this.fms.currentWaypoint().altitude) + expedite
      };
      return ['ok', readback];
    },
    runClearedAsFiled: function() {
      if(this.fms.clearedAsFiled()) {
        return ['ok',
          {log: "cleared to destiantion via the " + airport_get().sids[this.destination].icao + 
            " departure, then as filed" + ". Climb and maintain " + airport_get().initial_alt + 
            ", expect " + this.fms.fp.altitude + " 10 minutes after departure",
          say: "cleared to destination via the " + airport_get().sids[this.destination].name +
            " departure, then as filed" + ". Climb and maintain " + radio_altitude(
            airport_get().initial_alt) + ", expect " + radio_altitude(this.fms.fp.altitude) + 
            "," + radio_spellOut(" 10 ") + "minutes after departure"}];
      }
      else return [true, "unable to clear as filed"];
    },
    runClimbViaSID: function() {
      if(this.fms.climbViaSID())
      return ['ok', {log: "climb via the " + this.destination + " departure",
        say: "climb via the " + airport_get().sids[this.destination].name + " departure"}];
      else ui_log(true, this.getCallsign() + ", unable to climb via SID");
    },
    runSpeed: function(data) {
      if(data[0] == "+" || data[0] == "-") {  //shortKey '+' or '-' in use
        data = data.substr(1);  //remove shortKey
      }

      var speed = parseInt(data);
      if(isNaN(speed)) return ["fail", "speed not understood"];

      this.fms.setAll({speed: clamp(this.model.speed.min,
                                    speed,
                                    this.model.speed.max)});
      var readback = {
        log: radio_trend("speed", this.speed, this.fms.currentWaypoint().speed) + " " + this.fms.currentWaypoint().speed,
        say: radio_trend("speed", this.speed, this.fms.currentWaypoint().speed) + " " + radio_spellOut(this.fms.currentWaypoint().speed)
      };
      return ["ok", readback];
    },
    runHold: function(data) {
      var data = data.split(" ");

      // Set direction of turns
      var dirTurns = "right";   // standard for holding patterns is right-turns
      if(data.indexOf("right") != -1) data.splice(data.indexOf("right"),1);
      if(data.indexOf("left") != -1) {
        dirTurns = "left";
        data.splice(data.indexOf("left"),1);
      }

      // Set leg length
      var legLength = "1min";
      for(var i=0; i<data.length; i++) {
        if(data[i].includes("min") || data[i].includes("nm")) {
        legLength = data[i];
        data.splice(i,1); break;
        }
      }

      // Set hold's base position
      var hold_fix = null, hold_fix_location = null;
      if(data.length > 0) { // if anything still remains...
        for(var i=0; i<data.length; i++) {
          var fix = airport_get().getFix(data[i]);    // attempt to find data[i] as a fix
          if(fix) { 
            hold_fix = data[i].toUpperCase(); // if is a valid fix, set as the holding fix
            hold_fix_location = fix; break;   // if is a valid fix, set as the holding fix
          }
        }
      }

      // Determine whether or not to immediately start the turn to outbound
      if(hold_fix) { // holding over a specific fix (currently only able to do so on inbound course)
        var holding_wp_index = 1;
        this.fms.prependWaypoint({navmode:"fix", name:hold_fix, location:hold_fix_location,
          altitude: this.fms.currentWaypoint().altitude, speed: this.fms.currentWaypoint().speed});
        var inboundHdg = vradial(vsub(this.position, hold_fix_location));
      }
      else {  // holding over present position (currently only able to do so on present course)
        var holding_wp_index = 0;
        hold_fix_location = this.position; // make a/c hold over their present position
        var inboundHdg = this.heading;
      }

      
      if(this.isTakeoff() && !hold_fix)
        return ["fail", "where do you want us to hold?"];

      var hold_wp = {navmode:"hold", speed: this.fms.currentWaypoint().speed,  altitude: this.fms.currentWaypoint().altitude, fix: null,
        hold: { fixName: hold_fix,          fixPos: hold_fix_location,
                dirTurns: dirTurns,         legLength: legLength,
                inboundHdg: inboundHdg,     timer: 1, }};  // Force the initial turn to outbound heading when entering the hold
      this.fms.insertWaypoint(hold_wp, holding_wp_index);

      var inboundDir = radio_cardinalDir_names[getCardinalDirection(fix_angle(inboundHdg + Math.PI)).toLowerCase()];
      if(hold_fix) return ["ok", "proceed direct " + hold_fix + " and hold inbound, " + dirTurns + " turns, " + legLength + " legs"];
      else return ["ok", "hold " + inboundDir + " of present position, " + dirTurns + " turns, " + legLength + " legs"];
    },
    runDirect: function(data) {
      if(data.length == 0) {
        return ["fail", "say again the fix name?"];
      }

      var fixname = data.toUpperCase(),
          fix = airport_get().getFix(fixname);

      if (!fix) {
        return ["fail", "unable to find fix called " + fixname];
      }

      // can issue this command if not in fix mode, then will run exactly as with "fix"
      // or with multiple fixes, then the sequence is rewritten
      if (this.fms.currentWaypoint().navmode != "fix" || fixname.indexOf(' ').length > 0) {
        return this.runFix(data);
      }

      var fix_pos = this.fms.skipToWaypoint(fixname);
      if (fix_pos == -1) {
        return ["fail", "unable to go to " + fixname];
      }

      if (fix_pos == 0) {
        return ["fail", "already going direct " + fixname];
      }

      return ["ok", "proceed direct " + fixname];
    },
    runFix: function(data) {
      if(data[0] == ".") { //shortkey '.' in use
        data = data.substr(1);  //remove shortKey
      }
      if(data.length == 0) {
        return ["fail", "say again the fix name?"];
      }

      data = data.toUpperCase().split(/\s+/);
      
      var last_fix, fail,  
          fixes = $.map(data, function(fixname) {
            var fix = airport_get().getFix(fixname);
            if(!fix) {
              fail = ["fail", "unable to find fix called " + fixname];
              return;
            }
            
            // to avoid repetition, compare name with the previous fix
            if (fixname == last_fix) return;
            last_fix = fixname;
            return fixname;
          });

      if (fail) return fail;

      this.cancelFix();
      if(this.mode != "waiting" && this.mode != "takeoff" && this.mode != "apron" && this.mode != "taxi"){
        this.cancelLanding();
      }

      this.fms.setFixes(fixes);

      return ["ok", "proceed direct " + fixes.join(', ')];
    },
    runSID: function(data) {
      if(this.category != "departure") {
        return ["fail", "unable to fly SID, we are an inbound"];
      }
      if(data.length == 0) {
        return ["fail", "SID name not understood"];
      }
      var sid_id = data.toUpperCase();
      if(!airport_get().sids.hasOwnProperty(sid_id)) {
        return ["fail", "SID name not understood"];
      }
      
      var sid_name = airport_get().sids[sid_id].name;
      var rwy = this.fms.currentWaypoint().runway;
      var trxn = airport_get().getSIDTransition(sid_id);
      this.fms.fp.route.splice(1,0,airport_get().getSIDid(sid_id, rwy) + "." + trxn); //insert SID & trxn after departure airport
      var fixes = airport_get().getSID(sid_id, trxn, rwy);
      
      if(!fixes) return ["fail", sid_id + " SID not valid from runway " + rwy];
      
      this.cancelFix();
      this.fms.follow("sid", sid_id, fixes);

      return ["ok", {log:"cleared to destination via the " + sid_id + " departure, then as filed",
                  say:"cleared to destination via the " + sid_name + " departure, then as filed"}];
    },
    runMoveDataBlock: function(dir) {
      dir = dir.replace('`','');  // remove shortKey
      var positions = {8:360,9:45,6:90,3:135,2:180,1:225,4:270,7:315,5:"ctr"};
      if(!positions.hasOwnProperty(dir)) return;
      else this.datablockDir = positions[dir];
    },
    runProceed: function(data) {
      var lastWaypoint = this.fms.waypoints[this.fms.waypoints.length - 1];
      if (this.fms.currentWaypoint().navmode != "fix") {
        return ["fail", "not navigating to any fix"];
      }

      if(data.length == 0) {
        return ["fail", "fix name not understood"];
      }

      data = data.toUpperCase().split(/\s+/);
      for (var i=0; i<data.length; i++) {
        if (this.fms.hasWaypoint(data[i])) {
          return ["fail", "already navigating to " + data[i]];
        }
      }

      for (var i=0; i<data.length; i++) {
        if (!airport_get().getFix(data[i])) {
          return ["fail", "unable to find fix " + data[i]];
        }
      }

      for (var i=0; i<data.length; i++) {
        this.fms.appendWaypoint({
          name: data[i],
          navmode: 'fix',
          location: airport_get().getFix(data[i]),
        });
      }

      return ["ok", "cleared to proceed to "
          + data.join(' ') + " after " + lastWaypoint.name];
    },
    runWait: function(data) {
      if(this.category != "departure") return ["fail", "inbound"];

      if(this.mode == "taxi") return ["fail", "already taxiing to " + radio_runway(this.fms.currentWaypoint().runway)];

      if(this.mode == "waiting") return ["fail", "already waiting"];

      if(this.mode != "apron") return ["fail", "wrong mode"];

      if(data) {
        if(!airport_get().getRunway(data.toUpperCase())) return ["fail", "no runway " + data.toUpperCase()];
        this.selectRunway(data);
      }

      var runway = airport_get().getRunway(this.fms.currentWaypoint().runway);

      runway.addQueue(this, this.fms.currentWaypoint().runway);

      this.mode = "taxi";
      this.taxi_start = game_time();

      var readback = {
        log: "taxi to runway " + this.fms.currentWaypoint().runway,
        say: "taxi to runway " + radio_runway(this.fms.currentWaypoint().runway)
      };
      return ["ok", readback];
    },
    runTakeoff: function(data) {
      if(this.category != "departure") return ["fail", "inbound"];

      if(!this.isLanded()) return ["fail", "already airborne"];
      if(this.mode =="apron") return ["fail", "unable, we're still in the parking area"];
      if(this.mode == "taxi") return ["fail", "taxi to runway " + radio_runway(this.fms.currentWaypoint().runway) + " not yet complete"];

      if(this.fms.currentWaypoint().altitude <= 0) return ["fail", "no altitude assigned"];

      var runway = airport_get().getRunway(this.fms.currentWaypoint().runway);

      if(runway.removeQueue(this, this.fms.currentWaypoint().runway)) {
        this.mode = "takeoff";
        prop.game.score.windy_takeoff += this.scoreWind('taking off');
        this.takeoffTime = game_time();

        if(this.fms.currentWaypoint().heading == null)
          this.fms.setCurrent({heading: runway.angle});
        //
        var wind = airport_get().getWind();
        var wind_dir = round(degrees(wind.angle));
        var readback = {
          log: "wind " + round(wind_dir/10)*10 + " at " + round(wind.speed) + ", runway " + this.fms.currentWaypoint().runway + ", cleared for takeoff",
          say: "wynd " + radio_spellOut(round(wind_dir/10)*10) + " at " + radio_spellOut(round(wind.speed)) + ", run way " + radio_runway(this.fms.currentWaypoint().runway) + ", cleared for take off",
        };
        return ["ok", readback];
      } else {
        var waiting = runway.isWaiting(this, this.fms.currentWaypoint().runway);
        return ["fail", "number "+waiting+" behind "+runway.queue[runway.getEnd(this.fms.currentWaypoint().runway)][waiting-1].getRadioCallsign(), ""];
      }
    },
    runLanding: function(data) {
      if(data[0] == "\u2B50") { //shortkey '*' in use
        data = data.substr(1);  //remove shortKey
      }

      var runway = airport_get().getRunway(data);
      if(!runway) {
        if(!data) return ["fail", "runway not understood"];
        else      return ["fail", "there is no runway " + radio_runway(data)];
      }

      if(this.fms.currentWaypoint().runway == data.toUpperCase()) {
        return ["fail", "already landing on runway " + radio_runway(data)];
      }

      this.fms.follow("iap", data.toUpperCase(), ["ils", data]); // tell fms to follow ILS approach

      var readback = {log:"cleared ILS runway " + this.fms.currentWaypoint().runway + " approach",
                      say:"cleared ILS runway " + radio_runway(this.fms.currentWaypoint().runway) + " approach"};
      return ["ok", readback];
    },
    runAbort: function(data) {
      if(this.mode == "taxi") {
        this.mode = "apron";
        this.taxi_start = 0;
        console.log("aborted taxi to runway");
        ui_log(true, this.getCallsign() + " aborted taxi to runway");
        prop.game.score.abort.taxi += 1;
        return ["ok", "taxiing back to terminal"];
      } else if(this.mode == "waiting") {
        return ["fail", "unable to return to the terminal"];
      } else if(this.mode == "landing") {
        this.cancelLanding();
        var readback = {
          log: "go around, fly present heading, maintain " + this.fms.currentWaypoint().altitude,
          say: "go around, fly present heading, maintain " + radio_altitude(this.fms.currentWaypoint().altitude)
        };
        return ["ok", readback];
      } else if(this.mode == "cruise" && this.fms.currentWaypoint().navmode == "rwy") {
        this.cancelLanding();
        var readback = {
          log: "cancel approach clearance, fly present heading, maintain " + this.fms.currentWaypoint().altitude,
          say: "cancel approach clearance, fly present heading, maintain " + radio_altitude(this.fms.currentWaypoint().altitude),
        };
        return ["ok", readback];
      } else if(this.mode == "cruise" && this.fms.currentWaypoint().navmode == "fix") {
        this.cancelFix();
        if(this.category == "arrival") return ["ok", "fly present heading, vector to final approach course"];
        else if(this.category == "departure") return ["ok", "fly present heading, vector for entrail spacing"];
      } else { //modes "apron", "takeoff", ("cruise" for some navmodes)
        return ["fail", "unable to abort"];
      }
    },
    runDebug: function(data) {
      if(data == "log") {
        window.aircraft = this;
        return ["ok", {log:"in the console, look at the variable &lsquo;aircraft&rsquo;", say:""}];
      }
    },
    cancelFix: function() {
      if(this.fms.currentWaypoint().navmode == "fix") {
        this.fms.setCurrent({
          name: "undefined",
          navmode: 'heading',
          heading: this.heading,
          location: null,
        });
        this.fms.removeWaypoints();
        this.updateStrip();
        return true;
      }
      return false;
    },
    cancelLanding: function() {
      if(this.fms.currentWaypoint().navmode == "rwy") {
        var runway = airport_get().getRunway(this.fms.currentWaypoint().runway);
        if(this.mode == "landing") {
          this.fms.setCurrent({
            altitude: Math.max(2000, round((this.altitude / 1000)) * 1000),
            heading: runway.angle,
          });
        }

        this.fms.setCurrent({
          navmode: "heading",
          runway: null,
        });
        this.mode = "cruise";
        this.updateStrip();
        return true;
      } else {
        this.fms.setCurrent({runway: null});
        return false;
      }
    },
    parse: function(data) {
      var keys = 'position model airline callsign category heading altitude destination'.split(' ');
      for (var i in keys) {
        if (data[keys[i]]) this[keys[i]] = data[keys[i]];
      }

      if(data.speed) this.speed = data.speed;

      if(data.heading)  this.fms.setCurrent({heading: data.heading});
      if(data.altitude) this.fms.setCurrent({altitude: data.altitude});
      this.fms.setCurrent({speed: data.speed || this.model.speed.cruise});

      if (data.waypoints && data.waypoints.length > 0)
        this.setArrivalWaypoints(data.waypoints);

      if(this.category == "departure" && this.isLanded()) {
        this.speed = 0;
        this.mode = "apron";
      }
    },
    complete: function(data) {
      if(this.category == "departure" && this.isLanded()) {
        this.selectRunway();
      }
      this.updateStrip();
    },
    selectRunway: function(runway) {
      if(!runway) {
        runway = airport_get().selectRunway(this.model.runway.takeoff).toUpperCase();
        if(!runway) return;
      }
      this.fms.setCurrent({runway: runway.toUpperCase()});

      this.taxi_delay = airport_get().getRunway(this.fms.currentWaypoint().runway).taxiDelay(this.fms.currentWaypoint().runway);
      this.updateStrip();
    },
    pushHistory: function() {
      this.history.push([this.position[0], this.position[1]]);
      if(this.history.length > 10) {
        this.history.splice(0, this.history.length-10);
      }
    },
    moveForward: function() {
      this.mode = "taxi";
      this.taxi_next  = true;
      this.taxi_delay = 60;
      this.taxi_start = game_time();
    },

    /**
     ** Aircraft is established on FINAL APPROACH COURSE
     */
    isEstablished: function() {
      if (this.mode != "landing")
        return false;
      return (this.approachOffset <= 0.048); // 160 feet or 48 meters
    },

    /**
     ** Aircraft is on the ground (can be a departure OR arrival)
     */
    isLanded: function() {
      if(this.altitude < 5) return true;
    },

    /**
     ** Aircraft is actively following an instrument approach
     */
    isPrecisionGuided: function() {
      // Whether this aircraft is elegible for reduced separation
      //
      // If the game ever distinguishes between ILS/MLS/LAAS
      // approaches and visual/localizer/VOR/etc. this should
      // distinguish between them.  Until then, presume landing is via
      // ILS with appropriate procedures in place.
      return (this.mode == "landing");
    },
    isStopped: function() {
      if(this.isLanded() && this.speed < 5) return true;
    },
    isTaxiing: function() {
      if(this.mode == "apron"   ||
         this.mode == "taxi"    ||
         this.mode == "waiting") {
        return true;
      }
      return false;
    },
    isTakeoff: function() {
      if(this.isTaxiing() ||
         this.mode == "takeoff") {
        return true;
      }
      return false;
    },
    isVisible: function() {
      if(this.mode == "landing" || this.mode == "cruise") return true;
      if(!this.fms.currentWaypoint().runway) return false;
      var runway = airport_get().getRunway(this.fms.currentWaypoint().runway);
      var waiting = runway.isWaiting(this, this.fms.currentWaypoint().runway);
      if(this.isTaxiing()) {
        if(this.mode == "waiting" && waiting == 0)
          return true;
        return false;
      }
      return true;
    },
    getWind: function() {
      if (!this.fms.currentWaypoint().runway) return {cross: 0, head: 0};
      var airport = airport_get();
      var wind    = airport.wind;
      var runway  = airport.getRunway(this.fms.currentWaypoint().runway);

      var angle   =  abs(angle_offset(runway.angle, wind.angle));

      return {
        cross: Math.sin(angle) * wind.speed,
        head: Math.cos(angle) * wind.speed
      };
    },
    radioCall: function(msg, sectorType, alert) {
      if (this.projected) return;
      var call = "",
        callsign_L = this.getCallsign(),
        callsign_S = this.getRadioCallsign();
      if(sectorType) call += airport_get().radio[sectorType];
      // call += ", " + this.getCallsign() + " " + msg;
      if (alert)
        ui_log(true, airport_get().radio[sectorType] + ", " + callsign_L + " " + msg);
      else
        ui_log(airport_get().radio[sectorType] + ", " + callsign_L + " " + msg);
      speech_say([{type:"text", content:(airport_get().radio[sectorType] + ", " + callsign_S + " " + msg)}]);
    },
    callUp: function() {
      if(this.category == "arrival") {
        var altdiff = this.altitude - this.fms.currentWaypoint().altitude;
        if(Math.abs(altdiff) > 200) {
          if(altdiff > 0) {
            var alt_log = "descending through " + this.altitude + " for " + this.requested.altitude;
            var alt_say = "descending through " + radio_altitude(this.altitude) + " for " + radio_altitude(this.requested.altitude);
          }
          else if(altdiff < 0) {
            var alt_log = " climbing through " + this.altitude + " for " + this.requested.altitude;
            var alt_say = " climbing through " + radio_altitude(this.altitude) + " for " + radio_altitude(this.requested.altitude);
          }
        }
        else {
          var alt_log = "at " + this.altitude;
          var alt_say = "at " + radio_altitude(this.altitude);
        }
        ui_log(airport_get().radio.app + ", " + this.getCallsign() + " with you " + alt_log);
        speech_say([ {type:"text", content:airport_get().radio.app+", "}, {type:"callsign", content:this}, {type:"text", content:"with you " + alt_say} ]);
      }
      if(this.category == "departure") {
        ui_log(airport_get().radio.twr + ', ' + this.getCallsign() + ", ready to taxi");
        speech_say( [{type:"text", content: airport_get().radio.twr}, {type:"callsign", content:this}, {type:"text", content:", ready to taxi"}] );
      }
    },
    scoreWind: function(action) {
      var score = 0;
      var components = this.getWind();
      if (components.cross >= 20) {
        score += 2;
        ui_log(true, this.getCallsign()+' '+action+' with major crosswind');
      }
      else if (components.cross >= 10) {
        score += 1;
        ui_log(true, this.getCallsign()+' '+action+' with crosswind');
      }

      if (components.head <= -10) {
        score += 2;
        ui_log(true, this.getCallsign()+' '+action+' with major tailwind');
      }
      else if (components.head <= -1) {
        score += 1;
        ui_log(true, this.getCallsign()+' '+action+' with tailwind');
      }
      return score;
    },
    showStrip: function() {
      this.html.detach();
      // var scrollPos = $("#strips")[0].scrollHeight - $("#strips").scrollTop();
      var scrollPos = $("#strips").scrollTop();
      $("#strips").prepend(this.html);
      this.html.show();
      $("#strips").scrollTop(scrollPos + 45);  // shift scroll down one strip's height
    },
    updateTarget: function() {
      var airport = airport_get();
      var runway  = null;
      var offset = null;
      var offset_angle = null;
      var glideslope_altitude = null;
      var glideslope_window   = null;
      var angle = null;

      if(this.fms.currentWaypoint().altitude > 0)
        this.fms.setCurrent({altitude: Math.max(1000,
                                                this.fms.currentWaypoint().altitude)});
      if(this.fms.currentWaypoint().navmode == "rwy") {
        airport = airport_get();
        runway  = airport.getRunway(this.fms.currentWaypoint().runway);
        offset = runway.getOffset(this.position, this.fms.currentWaypoint().runway);
        offset_angle = vradial(offset);
        this.offset_angle = offset_angle;
        this.approachOffset = abs(offset[0]);
        this.approachDistance = offset[1];
        angle = runway.angle;
        if (angle > (2*Math.PI)) angle -= 2*Math.PI;

        glideslope_altitude = clamp(0, runway.getGlideslopeAltitude(offset[1]), this.altitude);
        glideslope_window   = abs(runway.getGlideslopeAltitude(offset[1], radians(1)));

        if(this.mode == "landing")
          this.target.altitude = glideslope_altitude;

        var ils = runway.ils.loc_maxDist;
        if(!runway.ils.enabled || !ils) ils = 40;

        // lock  ILS if at the right angle and altitude
        if ((abs(this.altitude - glideslope_altitude) < glideslope_window)
            && (abs(offset_angle) < radians(10))
            && (offset[1] < ils)) {
          if(abs(offset[0]) < 0.05 && this.mode != "landing") {
            this.mode = "landing";
            if (!this.projected && (abs(angle_offset(this.fms.currentWaypoint().heading,
                  radians(parseInt(this.fms.currentWaypoint().runway.substr(0,2))*10))) > radians(30))) {
              ui_log(true, this.getRadioCallsign() +
                      " approach course intercept angle was greater than 30 degrees");
              prop.game.score.violation += 1;
            }
            this.updateStrip();
            this.target.turn = null;
          }

          // Intercept localizer and glideslope and follow them inbound
          var angle_diff = angle_offset(angle, this.heading);
          var turning_time = Math.abs(degrees(angle_diff)) / 3;  // time to turn angle_diff degrees at 3 deg/s
          var turning_radius = km(this.speed) / 3600 * turning_time;  // dist covered in the turn, km
          var dist_to_localizer = offset[0]/Math.sin(angle_diff);  // dist from the localizer intercept point, km
          if(dist_to_localizer <= turning_radius || dist_to_localizer < 0.5) {
            // Steer to within 3m of the centerline while at least 200m out
            if(offset[1] > 0.2 && abs(offset[0]) > 0.003 )
              this.target.heading = clamp(radians(-30), -12 * offset_angle, radians(30)) + angle;
            else this.target.heading = angle;
            
            // Follow the glideslope
            this.target.altitude = glideslope_altitude;
          }

          // Speed control on final approach
          if(this.fms.currentWaypoint().speed > 0)
            this.fms.setCurrent({start_speed: this.fms.currentWaypoint().speed});
          this.target.speed        = crange(3, offset[1], 10, this.model.speed.landing, this.fms.currentWaypoint().start_speed);
        } else if(this.altitude >= 300 && this.mode == "landing") {
          this.updateStrip();
          this.cancelLanding();
          if (!this.projected)
          {
            ui_log(true, this.getRadioCallsign() + " aborting landing, lost ILS");
            speech_say([ {type:"callsign", content:this}, {type:"text", content:" going around"} ])
            prop.game.score.abort.landing += 1;
          }
        } else if(this.altitude >= 300) {
          this.target.heading = this.fms.currentWaypoint().heading;
          this.target.turn = this.fms.currentWaypoint().turn;
        }

        //this has to be outside of the glide slope if, as the plane is no
        //longer on the glide slope once it is on the runway (as the runway is
        //behind the ILS marker)
        if(this.altitude < 10) {
          this.target.speed = 0;
        }
      } else if(this.fms.currentWaypoint().navmode == "fix") {
        var fix = this.fms.currentWaypoint().location,
            vector_to_fix = vsub(this.position, fix),
            distance_to_fix = distance2d(this.position, fix);
        if((distance_to_fix < 0.5) ||
          ((distance_to_fix < 10) && (distance_to_fix < aircraft_turn_initiation_distance(this, fix)))) {
          if(this.fms.waypoints.length > 1) {
            this.fms.waypoints_past.push(this.fms.currentWaypoint());
            this.fms.nextWaypoint();
          }
          else {
            this.fms.waypoints_past.push(this.fms.deepCopyWaypoint());
            this.cancelFix();
          }
          this.updateStrip();
        } else {
          this.target.heading = vradial(vector_to_fix) - Math.PI;
          this.target.turn = null;
        }
      } else if(this.fms.currentWaypoint().navmode == "hold") {

        var hold = this.fms.currentWaypoint().hold;
        var angle_off_of_leg_hdg = abs(angle_offset(this.heading, this.target.heading));
        if(angle_off_of_leg_hdg < 0.087) { // within ~5° of upwd/dnwd
          // this.target.turn = null;
          if(!hold.timer) hold.timer = prop.game.time;  // record time started the leg
          else {  // if timer is running
            if(hold.legLength.includes("min")) {  // time-based hold legs
              if(prop.game.time >= hold.timer + parseInt(hold.legLength.replace("min",""))*60) { // time to turn
                this.target.heading += Math.PI;   // turn to other leg
                this.target.turn = hold.dirTurns;
                hold.timer = 0; // reset the timer
              }
            else if(hold.legLength.includes("nm")) {  // distance-based hold legs
              // not yet implemented
            }
          }
        }
      }

      } else {
        this.target.heading = this.fms.currentWaypoint().heading;
        this.target.turn = this.fms.currentWaypoint().turn;
      }

      if(this.mode != "landing") {
        this.target.altitude = this.fms.currentWaypoint().altitude;
        this.target.expedite = this.fms.currentWaypoint().expedite;

        this.target.altitude = Math.max(1000, this.target.altitude);

        this.target.speed = this.fms.currentWaypoint().speed;
        this.target.speed = clamp(this.model.speed.min, this.target.speed, this.model.speed.max);
      }

      if(this.speed < this.model.speed.min) this.target.altitude = 0;

      //finally, taxi overrides everything
      var was_taxi = false;
      if(this.mode == "taxi") {
        var elapsed = game_time() - this.taxi_start;
        if(elapsed > this.taxi_delay) {
          this.mode = "waiting";
          was_taxi = true;
          this.updateStrip();
        }
      }
      if(this.mode == "waiting") {
        var runway = airport_get().getRunway(this.fms.currentWaypoint().runway);
        var position = runway.position;

        this.position[0] = position[0];
        this.position[1] = position[1];
        this.heading     = runway.angle;

        if (!this.projected &&
            (runway.isWaiting(this, this.fms.currentWaypoint().runway) == 0) &&
            (was_taxi == true))
        {
          ui_log(this.getCallsign(), " holding short of runway "+this.fms.currentWaypoint().runway);
          speech_say([ {type:"callsign", content:this}, {type:"text", content:"holding short of runway "+radio_runway(this.fms.currentWaypoint().runway)} ]);
          this.updateStrip();
        }
      }
      if(this.mode == "takeoff") {
        var runway = airport_get().getRunway(this.fms.currentWaypoint().runway);

        if(runway) this.target.heading = runway.angle;

        if(this.speed < this.model.speed.min) {
          this.target.altitude = 0;
          this.altitude = 0;
        } else {
          this.target.altitude = this.fms.currentWaypoint().altitude;
        }

        this.target.speed = this.model.speed.cruise;

        if(this.altitude > 200 && this.target.speed > this.model.speed.min) {
          this.mode = "cruise";
          this.fms.setCurrent({runway: null});
          this.updateStrip();
        }
      }

      if(this.altitude < 10000 && this.mode != "landing") this.target.speed = Math.min(this.fms.currentWaypoint().speed, 250);
    },
    updatePhysics: function() {
      if(this.isTaxiing()) return;
      if(this.hit) {
        this.altitude -= 90 * game_delta(); // 90fps fall rate?...
        this.speed    *= 0.99;
        return;
      } else {

        // TURNING

        if(this.altitude > 10 && this.heading != this.target.heading) {
          // Perform standard turns 3 deg/s or 25 deg bank, whichever
          // requires less bank angle.
          // Formula based on http://aviation.stackexchange.com/a/8013
          var turn_rate = clamp(0, 1 / (this.speed / 8.883031), 0.0523598776);
          var turn_amount = turn_rate * game_delta();
          var offset = angle_offset(this.target.heading, this.heading);
          if(abs(offset) < turn_amount) {
            this.heading = this.target.heading;
          } else if((offset < 0 && this.target.turn == null) || this.target.turn == "left") {
            this.heading -= turn_amount;
          } else if((offset > 0 && this.target.turn == null) || this.target.turn == "right") {
            this.heading += turn_amount;
          }
        }

        // ALTITUDE

        var distance = null;
        var expedite_factor = 1.5;
        this.trend = 0;
        if(this.target.altitude < this.altitude - 0.02) {
          distance = -this.model.rate.descent/60 * game_delta();
          if(this.mode == "landing") distance *= 3;
          this.trend -= 1;
        } else if(this.target.altitude > this.altitude + 0.02) {
          var climbrate = this.getClimbRate();
          distance = climbrate/60 * game_delta();
          if(this.mode == "landing") distance *= 1.5;
          this.trend = 1;
        }
        if(distance) {
          if(this.target.expedite) distance *= expedite_factor;
          var offset = this.altitude - this.target.altitude;

          if(abs(offset) < abs(distance)) this.altitude = this.target.altitude;
          else this.altitude += distance;
        }

        if(this.isLanded()) this.trend = 0;

        // SPEED

        var difference = null;
        if(this.target.speed < this.speed - 0.01) {
          difference = -this.model.rate.decelerate * game_delta() / 2;
          if(this.isLanded()) difference *= 3.5;
        } else if(this.target.speed > this.speed + 0.01) {
          difference  = this.model.rate.accelerate * game_delta() / 2;
          difference *= crange(0, this.speed, this.model.speed.min, 2, 1);
        }
        if(difference) {
          var offset = this.speed - this.target.speed;

          if(abs(offset) < abs(difference)) this.speed = this.target.speed;
          else this.speed += difference;
        }
      }

      if(!this.position) return;

      // Trailling
      if(this.position_history.length == 0) this.position_history.push([this.position[0], this.position[1], game_time()/game_speedup()]);
      else if(abs((game_time()/game_speedup()) - this.position_history[this.position_history.length-1][2]) > 4/game_speedup()) {
        this.position_history.push([this.position[0], this.position[1], game_time()/game_speedup()]);
      }

      var angle = this.heading;
      var scaleSpeed = this.speed * 0.000514444 * game_delta(); // knots to m/s
      if (prop.game.option.get('simplifySpeeds') == 'no') {
        // Calculate the true air speed as indicated airspeed * 1.6% per 1000'
        scaleSpeed *= 1 + (this.altitude * 0.000016);

        // Calculate movement including wind assuming wind speed
        // increases 2% per 1000'
        var wind = airport_get().wind;
        var vector;
        if (this.isLanded()) {
          vector = vscale([sin(angle), cos(angle)], scaleSpeed);
        }
        else {
          var crab_angle = 0;

          // Compensate for crosswind while tracking a fix or on ILS
          if (this.fms.currentWaypoint().navmode == "fix" || this.mode == "landing")
          {
            var offset = angle_offset(this.heading, wind.angle + Math.PI);
            crab_angle = Math.asin((wind.speed * Math.sin(offset)) /
                                   this.speed);
          }
          vector = vadd(vscale(vturn(wind.angle + Math.PI),
                               wind.speed * 0.000514444 * game_delta()),
                        vscale(vturn(angle + crab_angle),
                               scaleSpeed));
        }
        this.ds = vlen(vector);
        this.groundSpeed = this.ds / 0.000514444 / game_delta();
        this.groundTrack = vradial(vector);
        this.position = vadd(this.position, vector);
      }
      else {
        this.ds = scaleSpeed;
        this.groundSpeed = this.speed;
        this.groundTrack = this.heading;
        this.position = vadd(this.position, vscale([sin(angle), cos(angle)], scaleSpeed));
      }

      this.distance = vlen(this.position);
      this.radial = vradial(this.position);
      if (this.radial < 0) this.radial += Math.PI*2;

      if(airport_get().perimeter) { // polygonal airspace boundary
        var inside = point_in_area(this.position, airport_get().perimeter);
        if (inside != this.inside_ctr) this.crossBoundary(inside);
      }
      else {  // simple circular airspace boundary
        var inside = (this.distance <= airport_get().ctr_radius &&
                      this.altitude <= airport_get().ctr_ceiling);
        if (inside != this.inside_ctr) this.crossBoundary(inside); 
      }
    },
    updateWarning: function() {
      // Ignore other aircraft while taxiing
      if (this.isTaxiing()) return;

      var warning = false;

      // restricted areas
      // players are penalized for each area entry
      if (this.position) {
        for (i in this.restricted.list) {
          /*
          Polygon matching procedure:

          1. Filter polygons by aircraft altitude
          2. For other polygons, measure distance to it (distance_to_poly), then
          substract travelled distance every turn
              If distance is about less than 10 seconds of flight,
              assign distance equal to 10 seconds of flight,
              otherwise planes flying along the border of entering at shallow angle
              will cause too many checks.
          3. if distance has reached 0, check if the aircraft is within the poly.
              If not, redo #2.
          */
          var area = this.restricted.list[i];

          // filter only those relevant by height
          if (area.data.height < this.altitude) {
            area.range = null;
            area.inside = false;
            continue;
          }

          // count distance untill the next check
          if (area.range) {
            area.range -= this.ds;
          }

          // recalculate for new areas or those that should be checked
          if (!area.range || area.range <= 0) {
            var new_inside = point_in_poly(this.position, area.data.coordinates);
            // ac has just entered the area: .inside is still false, but st is true
            if (new_inside && !area.inside) {
              prop.game.score.restrictions += 1;
              area.range = this.speed * 1.85 / 3.6 * 50 / 1000; // check in 50 seconds
              // speed is kts, range is km.
              // if a plane got into restricted area, don't check it too often
            }
            else {
              // don't calculate more often than every 10 seconds
              area.range = Math.max(
                this.speed * 1.85 / 36 / 1000 * 10,
                distance_to_poly(this.position, area.data.coordinates));
            }
            area.inside = new_inside;
          }
        }
        // raise warning if in at least one restricted area
        $.each(this.restricted.list, function(k, v) {
          warning = warning || v.inside;
        })
      } 
      
      if (this.terrain_ranges && !this.isLanded()) {
        var terrain = prop.airport.current.terrain,
            prev_level = this.terrain_ranges[this.terrain_level],

            ele = ceil(this.altitude, 1000),
            curr_ranges = this.terrain_ranges[ele];

        if (ele != this.terrain_level) {
          for (var lev in prev_level) {
            prev_level[lev] = Infinity;
          }
          this.terrain_level = ele;
        }
        
        for (var id in curr_ranges) {
          curr_ranges[id] -= this.ds;
          //console.log(curr_ranges[id]);

          if (curr_ranges[id] < 0 || curr_ranges[id] == Infinity) {
            var area = terrain[ele][id],
                status = point_to_mpoly(this.position, area, id);
            if (status.inside) {
              this.altitude = 0;
              if (!this.hit) {
                this.hit = true;
                console.log("hit terrain");
                ui_log(true, this.getCallsign() + " collided with terrain in controlled flight");
                speech_say([ {type:"callsign", content:this}, {type:"text", content:", we're going down!"} ]);
                prop.game.score.hit += 1;
              }
            } else {
              curr_ranges[id] = Math.max(.2, status.distance);
              // console.log(this.getCallsign(), 'in', curr_ranges[id], 'km from', id, area[0].length);
            }
          }
        }
      }

      this.warning = warning;
    },
    updateStrip: function() {
      if (this.projected) return;
      var heading  = this.html.find(".heading");
      var altitude = this.html.find(".altitude");
      var destination = this.html.find(".destination");
      var speed    = this.html.find(".speed");

      heading.removeClass("runway hold waiting taxi lookingGood allSet");
      altitude.removeClass("runway hold waiting taxi lookingGood allSet");
      destination.removeClass("runway hold waiting taxi lookingGood allSet");
      speed.removeClass("runway hold waiting taxi lookingGood allSet");

      var wp = this.fms.currentWaypoint();

      // default values
      heading.text(heading_to_string(wp.heading));
      if(wp.altitude) altitude.text(wp.altitude);
      else altitude.text("-");
      destination.text(this.destination);
      speed.text(wp.speed);

      if(wp.runway) {
        // heading.addClass("runway");
        if(this.category == "arrival") {
          if(this.mode == "landing") {
            heading.addClass("allSet");
            heading.text("on ILS");
            altitude.addClass("allSet");
            altitude.text("GS");
            destination.addClass("allSet");
            destination.text(this.fms.fp.route[this.fms.fp.route.length-1] + " " + wp.runway);
            speed.addClass("allSet");
          } else {
            heading.addClass("lookingGood");
            heading.text("intercept");
            altitude.addClass("lookingGood");
            destination.addClass("lookingGood");
            destination.text(this.fms.fp.route[this.fms.fp.route.length-1] + " " + wp.runway);
            speed.addClass("lookingGood");
          }
        } else {  // departures
          if(this.mode == "apron") {
            heading.addClass("runway");
            heading.text("apron");
            if(wp.altitude) altitude.addClass("runway");
            if(this.fms.following.sid) destination.addClass("runway");
            speed.addClass("runway");

          } else if(this.mode == "taxi") {
            heading.addClass("runway");
            heading.text("taxi");
            if(wp.altitude) altitude.addClass("runway");
            if(this.fms.following.sid) destination.addClass("runway");
            speed.addClass("runway");
            if(this.taxi_next) altitude.text("ready");

          } else if(this.mode == "waiting") {
            heading.addClass("runway");
            heading.text("ready");
            if(wp.altitude) altitude.addClass("runway");
            if(this.fms.following.sid) destination.addClass("runway");
            speed.addClass("runway");

          } else if(this.mode == "takeoff") {
            heading.text("takeoff");
            if(this.fms.following.sid) destination.addClass("lookingGood");

          }
        }
      } else {  // not using a runway
        if(wp.navmode == "fix") {
          heading.text(wp.name);
          if(this.fms.following.sid) {
            heading.addClass("allSet");
            altitude.addClass("allSet");
            destination.addClass("allSet");
            speed.addClass("allSet");
          }
        } else if(wp.navmode == "hold") {
          heading.text("hold " + wp.turn);
          heading.addClass("hold");
        }
      } 
    },
    updateAuto: function() {
    },
    update: function() {
      if(prop.aircraft.auto.enabled) {
        this.updateAuto();
      }
      this.updateTarget();
      this.updatePhysics();
    },
    addConflict: function(conflict, other) {
      this.conflicts[other.getCallsign()] = conflict;
    },
    checkConflict: function(other) {
      if (this.conflicts[other.getCallsign()]) {
        this.conflicts[other.getCallsign()].update();
        return true;
      }
      return false;
    },
    hasAlerts: function() {
      var a = [false, false];
      var c = null;
      for (var i in this.conflicts) {
        c = this.conflicts[i].hasAlerts();
        a[0] = (a[0] || c[0]);
        a[1] = (a[1] || c[1]);
      }
      return a;
    },
    removeConflict: function(other) {
      delete this.conflicts[other.getCallsign()];
    },
  };
});

function aircraft_init_pre() {
  prop.aircraft = {};
  prop.aircraft.models = {};
  prop.aircraft.callsigns = [];
  prop.aircraft.list = [];
  prop.aircraft.current  = null;

  prop.aircraft.auto = {
    enabled: false,
  };

}

function aircraft_auto_toggle() {
  prop.aircraft.auto.enabled = !prop.aircraft.auto.enabled;
}

function aircraft_init() {
  // AIRBUS
  aircraft_load("a306");
  aircraft_load("a310");
  aircraft_load("a318");
  aircraft_load("a319");
  aircraft_load("a320");
  aircraft_load("a321");
  aircraft_load("a332");
  aircraft_load("a333");
  aircraft_load("a343");
  aircraft_load("a346");
  aircraft_load("a388");

  // ANTONOV
  aircraft_load("a124");
  aircraft_load("an12");
  aircraft_load("an24");
  aircraft_load("an72");

  // ATR
  aircraft_load("at43");
  aircraft_load("at72");

  // BOEING
  aircraft_load("b712");
  aircraft_load("b722");
  aircraft_load("b732");
  aircraft_load("b733");
  aircraft_load("b734");
  aircraft_load("b735");
  aircraft_load("b736");
  aircraft_load("b737");
  aircraft_load("b738");
  aircraft_load("b739");
  aircraft_load("b741");
  aircraft_load("b742");
  aircraft_load("b744");
  aircraft_load("b748");
  aircraft_load("b74s");
  aircraft_load("b752");
  aircraft_load("b753");
  aircraft_load("b762");
  aircraft_load("b763");
  aircraft_load("b764");
  aircraft_load("b772");
  aircraft_load("b77l");
  aircraft_load("b773");
  aircraft_load("b77w");
  aircraft_load("b788");
  aircraft_load("b789");

  // BOMBARDIER
  aircraft_load("crj2");
  aircraft_load("crj7");
  aircraft_load("crj9");
  aircraft_load("dh8a");
  aircraft_load("dh8c");
  aircraft_load("dh8d");

  // CESSNA
  aircraft_load("c172");
  aircraft_load("c182");
  aircraft_load("c208");
  aircraft_load("c337");
  aircraft_load("c402");
  aircraft_load("c510");
  aircraft_load("c550");
  aircraft_load("c750");
  
  // EMBRAER
  aircraft_load("e110");
  aircraft_load("e120");
  aircraft_load("e135");
  aircraft_load("e145");
  aircraft_load("e170");
  aircraft_load("e190");
  aircraft_load("e50p");
  aircraft_load("e545");
  aircraft_load("e55p");

  // FOKKER
  aircraft_load("f50" );
  aircraft_load("f100");

  // GENERAL AVIATION
  aircraft_load("be36");
  aircraft_load("bn2p");
  aircraft_load("p28a");

  // ILYUSHIN
  aircraft_load("il76");
  aircraft_load("il96");

  // LOCKHEED-MARTIN
  aircraft_load( "c5" );
  aircraft_load("c130");
  aircraft_load("l101");
  aircraft_load("l410");

  // MCDONNELL-DOUGLAS
  aircraft_load("dc10");
  aircraft_load("dc87");
  aircraft_load("dc93");
  aircraft_load("md11");
  aircraft_load("md81");
  aircraft_load("md82");
  aircraft_load("md83");
  aircraft_load("md87");
  aircraft_load("md88");
  aircraft_load("md90");

  // TUPOLEV
  aircraft_load("t154");
  aircraft_load("t204");

  // MISCELLANEOUS
  aircraft_load("conc");
  aircraft_load("rj85");
}

function aircraft_generate_callsign(airline_name) {
  var airline = airline_get(airline_name);
  if(!airline) {
    console.warn("Airline not found:" + airline_name);
    return 'airline-' + airline_name + '-not-found';
  }
  return airline.generateFlightNumber();
}

function aircraft_callsign_new(airline) {
  var callsign = null;
  var hit = false;
  while(true) {
    callsign = aircraft_generate_callsign(airline);
    if (prop.aircraft.callsigns.indexOf(callsign) == -1)
      break;
  }
  prop.aircraft.callsigns.push(callsign);
  return callsign;
}

function aircraft_new(options) {
  if(!options.callsign) options.callsign = aircraft_callsign_new(options.airline);

  if(!options.icao) {
    options.icao = airline_get(options.airline).chooseAircraft(options.fleet);
  }
  var icao = options.icao.toLowerCase();

  options.model = prop.aircraft.models[icao];
  var aircraft = new Aircraft(options);

  aircraft.complete();

  prop.aircraft.list.push(aircraft);
  console.log("Spawning " + options.category + " : " + aircraft.getCallsign());
}

function aircraft_load(icao) {
  icao = icao.toLowerCase();
  var model = new Model({icao: icao, url: "assets/aircraft/"+icao+".json"});
  aircraft_add(model);
  return model;
}

function aircraft_get_nearest(position) {
  var nearest  = null;
  var distance = Infinity;
  for(var i=0;i<prop.aircraft.list.length;i++) {
    var d = distance2d(prop.aircraft.list[i].position, position);
    if(d < distance && prop.aircraft.list[i].isVisible() && !prop.aircraft.list[i].hit) {
      distance = d;
      nearest = i;
    }
  }
  return [prop.aircraft.list[nearest], distance];
}

function aircraft_add(model) {
  prop.aircraft.models[model.icao.toLowerCase()] = model;
}

function aircraft_visible(aircraft, factor) {
  if(!factor) factor=1;
  return (vlen(aircraft.position) < airport_get().ctr_radius * factor);
}

function aircraft_remove_all() {
  for(var i=0;i<prop.aircraft.list.length;i++) {
    prop.aircraft.list[i].cleanup();
  }
  prop.aircraft.list = [];
}

function aircraft_update() {
  for(var i=0;i<prop.aircraft.list.length;i++) {
    prop.aircraft.list[i].update();
  }
  for(var i=0;i<prop.aircraft.list.length;i++) {
    prop.aircraft.list[i].updateWarning();

    InnerLoop: for (var j=i+1;j<prop.aircraft.list.length;j++) {
      var that = prop.aircraft.list[i];
      var other = prop.aircraft.list[j];

      if (that.checkConflict(other)) {
        continue InnerLoop;
      }

      // Fast 2D bounding box check, there are no conflicts over 8nm apart (14.816km)
      // no violation can occur in this case.
      // Variation of:
      // http://gamedev.stackexchange.com/questions/586/what-is-the-fastest-way-to-work-out-2d-bounding-box-intersection
      var dx = Math.abs(that.position[0] - other.position[0]);
      var dy = Math.abs(that.position[1] - other.position[1]);
      if ((dx > 14.816) || (dy > 14.816)) {
        continue InnerLoop;
      }
      else {
        new zlsa.atc.Conflict(that, other);
      }
    }
  }
  for(var i=prop.aircraft.list.length-1;i>=0;i--) {
    var remove = false;
    var aircraft = prop.aircraft.list[i];
    var is_visible = aircraft_visible(aircraft);
    if(aircraft.isStopped() && aircraft.category == "arrival") {
      prop.game.score.windy_landing += aircraft.scoreWind('landed');
      ui_log(aircraft.getCallsign() + " switching to ground, good day");
      speech_say([ {type:"callsign", content:aircraft}, {type:"text", content:", switching to ground, good day"} ]);
      prop.game.score.arrival += 1;
      console.log("arriving aircraft no longer moving");
      remove = true;
    }
    if(aircraft.hit && aircraft.isLanded()) {
      ui_log("Lost radar contact with "+aircraft.getCallsign());
      speech_say([ {type:"callsign", content:aircraft}, {type:"text", content:", radar contact lost"} ]);
      console.log("aircraft hit and on the ground");
      remove = true;
    }
    // Clean up the screen from aircraft that are too far
    if(!aircraft_visible(aircraft,2) && !aircraft.inside_ctr){
      if(aircraft.category == "arrival") {
        remove = true;
      }
      else if(aircraft.category == "departure") {
        remove = true;
      }
    }
    if(remove) {
      aircraft.cleanup();
      prop.aircraft.callsigns.splice(prop.aircraft.callsigns.indexOf(aircraft.callsign), 1);
      prop.aircraft.list.splice(i, 1);
      update_aircraft_eids();
      i-=1;
    }
  }
}

// Calculate the turn initiation distance for an aircraft to navigate between two fixes.
// References:
// - http://www.ohio.edu/people/uijtdeha/ee6900_fms_00_overview.pdf, Fly-by waypoint
// - The Avionics Handbook, ch 15
function aircraft_turn_initiation_distance(a, fix) {
  if(a.fms.waypoints.length < 2) // if there are no subsequent fixes, fly over 'fix'
    return 0;
  var speed = a.speed * 0.514444; // convert knots to m/s
  var bank_angle = radians(25); // assume nominal bank angle of 25 degrees for all aircraft
  var g = 9.81;                 // acceleration due to gravity, m/s*s
  var nextfix = a.fms.waypoints[1].location;
  if(!nextfix) return 0;
  var nominal_new_course = vradial(vsub(nextfix, fix));
  if( nominal_new_course < 0 ) nominal_new_course += Math.PI * 2;
  var current_heading = a.heading;
  if (current_heading < 0) current_heading += Math.PI * 2;
  var course_change = Math.abs(degrees(current_heading) - degrees(nominal_new_course));
  if (course_change > 180) course_change = 360 - course_change;
  course_change = radians(course_change);
  //
  var turn_radius = speed*speed / (g * Math.tan(bank_angle));  // meters
  var l2 = speed; // meters, bank establishment in 1s
  var turn_initiation_distance = turn_radius * Math.tan(course_change/2) + l2;
  return turn_initiation_distance / 1000; // convert m to km
}

// Get aircraft by entity id
function aircraft_get(eid) {
  if(eid == null) return null;
  if(prop.aircraft.list.length > eid && eid >= 0) // prevent out-of-range error
    return prop.aircraft.list[eid];
  return null;
}

// Get aircraft by callsign
function aircraft_get_by_callsign(callsign) {
  for(var i=0; i<prop.aircraft.list.length; i++)
    if(prop.aircraft.list[i].callsign == callsign.toLowerCase())
      return prop.aircraft.list[i];
  return null;
}

// Get aircraft's eid by callsign
function aircraft_get_eid_by_callsign(callsign) {
  for(var i=0; i<prop.aircraft.list.length; i++)
    if(prop.aircraft.list[i].callsign == callsign.toLowerCase())
      return prop.aircraft.list[i].eid;
  return null;
}
