/** Details about aircraft in close proximity in relation to 'the rules'
 */
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
      if(this.aircraft[0].isLanded() || this.aircraft[1].isLanded()) return;  // TEMPORARY FIX FOR CRASHES BTWN ARRIVALS AND TAXIIED A/C
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
          (this.aircraft[0].rwy_dep != null) &&
          (this.aircraft[0].rwy_dep !=
           this.aircraft[1].rwy_dep) &&
          (airport.getRunway(this.aircraft[1].rwy_dep) ===
           airport.getRunway(this.aircraft[0].rwy_dep)) &&
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
           (a1.rwy_dep != a2.rwy_dep)) { // both are following different instrument approaches
        var runwayRelationship = airport_get().metadata.rwy[a1.rwy_dep][a2.rwy_dep];
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

/** Definitions for characteristics of a particular aircraft type
 */
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

/** Build a waypoint object
 ** Note that .prependLeg() or .appendLeg() or .insertLeg()
 ** should be called in order to add waypoints to the fms, based on which
 ** you want. This function serves only to build the waypoint object; it is
 ** placed by one of the other three functions.
 */
zlsa.atc.Waypoint = Fiber.extend(function(data, fms) {
  return {
    /** Initialize Waypoint with empty values, then call the parser
     */
    init: function(data, fms) {
      if(data === undefined) data = {};
      this.altitude = null;
      this.fix      = null;
      this.navmode  = null;
      this.heading  = null;
      this.turn     = null;
      this.location = null;
      this.expedite = false;
      this.speed    = null;
      this.hold     = {
        dirTurns  : null,
        fixName   : null,
        fixPos    : null,
        inboundHdg: null,
        legLength : null,
        timer     : 0
      };
      this.fixRestrictions = {
        alt: null,
        spd: null
      };
      this.parse(data, fms);
    },

    /** Parse input data and apply to this waypoint
     */
    parse: function(data, fms) {
      // Populate Waypoint with data
      if (data.fix) {
        this.navmode = 'fix';
        this.fix = data.fix;
        this.location = airport_get().getFix(data.fix);
      }
      for (var f in data) {
        if(this.hasOwnProperty(f)) this[f] = data[f];
      }
      if(!this.navmode) { // for aircraft that don't yet have proper guidance (eg SID/STAR, for example)
        this.navmode = "heading";
        var apt = airport_get();
        if(data.route.split('.')[0] == apt.icao && this.heading == null) {
          this.heading = apt.getRunway(apt.runway).angle;  // aim departure along runway heading
        }
        else if(data.route.split('.')[0] == "KDBG" && this.heading == null) {
          this.heading = this.radial + Math.PI;  // aim arrival @ middle of airspace
        }
      }
    }
  };
});

/** Build a 'leg' of the route (contains series of waypoints)
 ** @param {object} data = {route: "KSFO.OFFSH9.SXC", // either a fix, or with format 'start.procedure.end', or "[RNAV/GPS]" for custom positions
 **                         type: "sid",              // can be 'sid', 'star', 'iap', 'awy', 'fix'
 **                         firstIndex: 0}            // the position in fms.legs to insert this leg
 */
zlsa.atc.Leg = Fiber.extend(function(data, fms) {
  return {
    /** Initialize leg with empty values, then call the parser
     */
    init: function(data, fms) {
      if(data === undefined) data = {};
      this.route         = "[radar vectors]"; // eg 'KSFO.OFFSH9.SXC' or 'FAITH'
      this.type          = "[manual]";        // can be 'sid', 'star', 'iap', 'awy', 'fix', '[manual]'
      this.waypoints     = [];                // an array of zlsa.atc.Waypoint objects to follow

      // Fill data with default Leg properties if they aren't specified (prevents wp constructor from getting confused)
      if(!data.route) data.route = this.route;
      if(!data.type) data.type = this.type;
      if(!data.waypoints) data.waypoints = this.waypoints;

      this.parse(data, fms);
    },

    /** Parse input data and apply to this leg
     */
    parse: function(data, fms) {
      for(var i in data) if(this.hasOwnProperty(i)) this[i] = data[i]; // Populate Leg with data
      if(this.waypoints.length == 0) this.generateWaypoints(data, fms);
      if(this.waypoints.length == 0) this.waypoints = [new zlsa.atc.Waypoint({route:""}, fms)];
    },

    /** Adds zlsa.atc.Waypoint objects to this Leg, based on the route & type
     */
    generateWaypoints: function(data, fms) {
      if(!this.type) return;
      else if(this.type == "sid") {
        if(!fms) {
          log("Attempted to generate waypoints for SID, but cannot because fms ref not passed!", LOG_WARNING);
          return;
        }
        var apt = data.route.split('.')[0];
        var sid = data.route.split('.')[1];
        var trn = data.route.split('.')[2];
        var rwy = fms.my_aircraft.rwy_dep;
        this.waypoints = [];

        // Remove the placeholder leg (if present)
        if(fms.my_aircraft.isLanded() && fms.legs.length>0 && fms.legs[0].route == airport_get().icao) {
          fms.legs.splice(0,1); // remove the placeholder leg, to be replaced below with SID Leg
        }

        // Generate the waypoints
        if(!rwy) {
          ui_log(true, fms.my_aircraft.getCallsign() + " unable to fly SID, we haven't been assigned a departure runway!");
          return;
        }
        var pairs = airport_get(apt).getSID(sid, trn, rwy);
        for (var i=0; i<pairs.length; i++) { // for each fix/restr pair
          var f = pairs[i][0];
          var a = null, s = null;
          if(pairs[i][1]) {
            var a_n_s = pairs[i][1].toUpperCase().split("|");
            for(var j in a_n_s) {
              if(a_n_s[j][0] == "A") a = a_n_s[j].substr(1);
              else if(a_n_s[j][0] == "S") s = a_n_s[j].substr(1);
            }
          }
          this.waypoints.push(new zlsa.atc.Waypoint({fix:f, fixRestrictions:{alt:a,spd:s}}, fms));
        }
        if(!this.waypoints[0].speed) this.waypoints[0].speed = fms.my_aircraft.model.speed.cruise;
      }
      else if(this.type == "star") {
        if(!fms) {
          log("Attempted to generate waypoints for STAR, but cannot because fms ref not passed!", LOG_WARNING);
          return;
        }
        var trn = data.route.split('.')[0];
        var star = data.route.split('.')[1];
        var apt = data.route.split('.')[2];
        var rwy = fms.my_aircraft.rwy_arr;
        this.waypoints = [];

        // Generate the waypoints
        var pairs = airport_get(apt).getSTAR(star, trn, rwy);
        for (var i=0; i<pairs.length; i++) { // for each fix/restr pair
          var f = pairs[i][0];
          var a = null, s = null;
          if(pairs[i][1]) {
            var a_n_s = pairs[i][1].toUpperCase().split("|");
            for(var j in a_n_s) {
              if(a_n_s[j][0] == "A") a = a_n_s[j].substr(1);
              else if(a_n_s[j][0] == "S") s = a_n_s[j].substr(1);
            }
          }
          this.waypoints.push(new zlsa.atc.Waypoint({fix:f, fixRestrictions:{alt:a,spd:s}}, fms));
        }
        if(!this.waypoints[0].speed)
          this.waypoints[0].speed = fms.my_aircraft.model.speed.cruise;
      }
      else if(this.type == "iap") {
        // FUTURE FUNCTIONALITY
      }
      else if(this.type == "awy") {
        var start  = data.route.split('.')[0];
        var airway = data.route.split('.')[1];
        var end    = data.route.split('.')[2];

        // Verify airway is valid
        var apt = airport_get();
        if(!apt.hasOwnProperty("airways") || !apt.airways.hasOwnProperty(airway)) {
          log("Airway "+airway+" not defined at "+apt.icao, LOG_WARNING);
          return;
        }

        // Verify start/end points are along airway
        var awy = apt.airways[airway];
        if(!(awy.indexOf(start) != -1 && awy.indexOf(end) != -1)) {
          log("Unable to follow "+airway+" from "+start+" to "+end, LOG_WARNING);
          return;
        }
        
        // Build list of fixes, depending on direction traveling along airway
        var fixes = [], readFwd = (awy.indexOf(end) > awy.indexOf(start));
        if(readFwd) for(var f=awy.indexOf(start); f<=awy.indexOf(end); f++) fixes.push(awy[f]);
        else for(var f=awy.indexOf(start); f>=awy.indexOf(end); f--) fixes.push(awy[f]);
        
        // Add list of fixes to this.waypoints
        this.waypoints = [];
        this.waypoints = $.map(fixes, function(f){return new zlsa.atc.Waypoint({fix:f}, fms);});
      }
      else if(this.type == "fix") {
        this.waypoints = [];
        this.waypoints.push(new zlsa.atc.Waypoint({fix:data.route}, fms));
      }
      else this.waypoints.push(new zlsa.atc.Waypoint(data, fms));
    }
  };
});

/** Manage current and future aircraft waypoints
 **
 ** waypoint navmodes
 ** -----------------
 ** May be one of null, "fix", "heading", "hold", "rwy"
 **
 ** * null is assigned, if the plane is not actively following an
 **   objective. This is only the case, if a plane enters the airspace
 **   or an action has been aborted and no new command issued
 ** * "fix" is assigned, if the plane is heading for a fix. In this
 **    case, the attribute request.fix is used for navigation
 ** * "heading" is assigned, if the plane was given directive to follow
 **    the course set out by the given heading. In this case, the
 **    attributes request.heading and request.turn are used for
 **    navigation
 ** * "hold" is assigned, if the plane should hold its position. As
 **    this is archieved by continuously turning, request.turn is used
 **    in this case
 ** * "rwy" is assigned, if the plane is heading for a runway. This is
 **    only the case, if the plane was issued the command to land. In
 **    this case, request.runway is used
 */
zlsa.atc.AircraftFlightManagementSystem = Fiber.extend(function() {
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
      this.fp.altitude = clamp(1000, options.model.ceiling, 60000);
      if(options.aircraft.category == "arrival") 
        this.prependLeg({route:"KDBG"});
      else if(options.aircraft.category == "departure") 
        this.prependLeg({route:airport_get().icao});
      this.update_fp_route();
    },

    /******************* FMS FLIGHTPLAN CONTROL FUNCTIONS *******************/

    /** Insert a Leg at the front of the flightplan
     */
    prependLeg: function (data) {
      var prev = this.currentWaypoint();
      this.legs.unshift(new zlsa.atc.Leg(data, this));
      this.update_fp_route();

      // Verify altitude & speed not null
      var curr = this.currentWaypoint();
      if(prev && !curr.altitude) curr.altitude = prev.altitude;
      if(prev && !curr.speed) curr.speed = prev.speed;
    },

    /** Insert a waypoint at current position and immediately activate it
     */
    insertWaypointHere: function(data) {
      var prev = this.currentWaypoint();
      this.currentLeg().waypoints.splice(this.current[1], 0, new zlsa.atc.Waypoint(data, this));
      this.update_fp_route();

      // Verify altitude & speed not null
      var curr = this.currentWaypoint();
      if(prev && !curr.altitude) curr.altitude = prev.altitude;
      if(prev && !curr.speed) curr.speed = prev.speed;
    },

    /** Insert a Leg at a particular position in the flightplan
     ** Note: if no position passed in, defaults to add to the end
     */
    insertLeg: function(data) {
      if(data.firstIndex == null) data.firstIndex = this.legs.length;
      var prev = this.currentWaypoint();
      this.legs.splice(data.firstIndex, 0, new zlsa.atc.Leg(data, this));
      this.update_fp_route();

      // Adjust 'current'
      if(this.current[0] >= data.firstIndex) this.current[1] = 0;

      // Verify altitude & speed not null
      var curr = this.currentWaypoint();
      if(prev && !curr.altitude) curr.altitude = prev.altitude;
      if(prev && !curr.speed) curr.speed = prev.speed;
    },

    /** Insert a Leg at current position immediately activate it
     */
    insertLegHere: function(data) {
      data.firstIndex = this.current[0];  // index of current leg
      this.insertLeg(data); // put new Leg at current position
      this.current[1] = 0;  // start at first wp in this new leg
    },

    /** Insert a Leg at the end of the flightplan
     */
    appendLeg: function(data) {
      this.legs.push(new zlsa.atc.Leg(data, this));
      this.update_fp_route();
    },

    /** Insert a waypoint after the *current* waypoint
     */
    appendWaypoint: function(data) {
      this.currentLeg().waypoints.splice(this.current[1]+1, 0, new zlsa.atc.Waypoint(data, this));
      this.update_fp_route();
    },

    /** Switch to the next waypoint
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

    /** Switch to the next Leg
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

    /** Skips to the given waypoint
     ** @param {string} name - the name of the fix to skip to
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

    /** Modify all waypoints
     */
    setAll: function(data) {
      for (var i=0; i<this.legs.length; i++) {
        for(var j=0; j<this.legs[i].waypoints.length; j++) {
          for (var k in data) {
            this.legs[i].waypoints[j][k] = data[k];
          }
        }
      }
    },

    /** Modify the current waypoint
     */
    setCurrent: function(data) {
      for (var i in data) {
        this.currentWaypoint()[i] = data[i];
      }
    },

    /** Updates fms.fp.route to correspond with the fms Legs
     */
    update_fp_route: function() {
      var r = [];
      for(var l in this.legs) {
        if(!this.legs[l].type) continue;
        else if(this.legs[l].type == "sid") {
          r.push(this.legs[l].route.split('.')[0]); // departure airport
          r.push(this.legs[l].route.split('.')[1] + '.' + this.legs[l].route.split('.')[2]);  // 'sidname.transition'
        }
        else if(this.legs[l].type == "star") {
          r.push(this.legs[l].route.split('.')[0] + '.' + this.legs[l].route.split('.')[1]);  // 'starname.transition'
          r.push(this.legs[l].route.split('.')[2]); // arrival airport
        }
        else if(this.legs[l].type == "iap") {
          continue; // no need to include these in flightplan (because wouldn't happen in real life)
        }
        else if(this.legs[l].type == "awy") {
          if(r[r.length-1] != this.legs[l].route.split('.')[0])
            r.push(this.legs[l].route.split('.')[0]); // airway entry fix
          r.push(this.legs[l].route.split('.')[1]); // airway identifier
          r.push(this.legs[l].route.split('.')[2]); // airway exit fix
        }
        else if(this.legs[l].type == "fix") {
          r.push(this.legs[l].route);
        }
        else if(this.legs[l].type == "[manual]") {
          continue; // no need to include these in flightplan (because wouldn't happen in real life)
        }
      }
      if(r.length == 0) r.push(this.legs[0].route);
      this.fp.route = r;
    },

    /** Calls various task-based functions and sets 'fms.following' flags
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

    /** Clears any current follows by updating the 'fms.following' flags
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

    /** Join an instrument approach (eg. ILS/GPS/RNAV/VOR/LAAS/etc)
     ** @param {string} type - the type of approach (like "ils")
     ** @param {Runway} rwy - the Runway object the approach ends into
     ** @param {string} variant - (optional) for stuff like "RNAV-Z 17L"
     */
    followApproach: function(type, rwy, /*optional*/ variant) {
      // Note: 'variant' is set up to pass to this function, but is not used here yet.
      if(type == "ils") {
        this.my_aircraft.cancelFix();
        this.setCurrent({
          navmode: "rwy",
          runway: rwy.toUpperCase(),
          turn: null,
          start_speed: this.my_aircraft.speed,
        });
      }
      // if-else all the other approach types here...
      // ILS, GPS, RNAV, VOR, NDB, LAAS/WAAS, MLS, etc...
    },

    /** Inserts the SID as the first Leg in the fms's flightplan
     */
    followSID: function(route) {
      for(var i=0; i<this.legs.length; i++) {
        if(this.legs[i].route == airport_get().icao)  // sid assigned after taking off without SID
          this.legs.splice(i,1);  // remove the manual departure leg
        else if(this.legs[i].type == "sid") // check to see if SID already assigned
          this.legs.splice(i,1);  // remove the old SID
      }
      // Add the new SID Leg
      this.prependLeg({type:"sid", route:route})
    },

    /** Inserts the STAR as the last Leg in the fms's flightplan
     */
    followSTAR: function(route) {
      for(var i=0; i<this.legs.length; i++) {
        if(this.legs[i].type == "star") // check to see if STAR already assigned
          this.legs.splice(i,1);  // remove the old STAR
      }
      // Add the new STAR Leg
      this.appendLeg({type:"star", route:route})
    },

    /** Takes a single-string route and converts it to a semented route the fms can understand
     ** Note: Input Data Format : "KSFO.OFFSH9.SXC.V458.IPL.J2.JCT..LLO..ACT..KACT"
     **       Return Data Format: ["KSFO.OFFSH9.SXC", "SXC.V458.IPL", "IPL.J2.JCT", "LLO", "ACT", "KACT"]
     */
    formatRoute: function(data) {
      // Format the user's input
      var route = [], ap = airport_get, fixOK = ap().getFix;
      if(data.indexOf(" ") != -1) return; // input can't contain spaces
      data = data.split('..'); // split apart "direct" pieces
      for(var i=0; i<data.length; i++) {  // deal with multilinks (eg 'KSFO.OFFSH9.SXC.V458.IPL')
        if(data[i].split('.').length == 1) {
          if(!fixOK(data[i])) return;
          route.push(data[i]); // just a fix/navaid
          continue;
        }
        else {  // is a procedure, eg SID, STAR, IAP, airway, etc.
          if(data[i].split('.').length % 2 != 1) return;  // user either didn't specify start point or end point
          else {
            var pieces = data[i].split('.');
            var a = [pieces[0] + '.' + pieces[1] + '.' + pieces[2]];
            for(var j=3; j<data[i].split('.').length; j+2) { // chop up the multilink
              if(!fixOK(pieces[0]) || !fixOK(pieces[2])) return;  // invalid join/exit points
              if(!Object.keys(ap().sids).indexOf(pieces[1])
                || !Object.keys(ap().airways).indexOf(pieces[1])) return; // invalid procedure
              a.push(pieces[j-1] + '.' + pieces[j] + pieces[j+1]);
            }
          }   
        }
        route = route.concat(a);  // push the properly reformatted multilink
      }
      return route;
    },

    /** Take an array of leg routes and build the legs that will go into the fms
     ** @param {array} route - an array of properly formatted route strings
     **                        Example: ["KSFO.OFFSH9.SXC", "SXC.V458.IPL",
     **                                 "IPL.J2.JCT", "LLO", "ACT", "KACT"]
     ** @param {boolean} fullRouteClearance - set to true IF you want the provided route to completely
     **                                       replace the current contents of 'this.legs'
     */
    customRoute: function(route, fullRouteClearance) {
      var legs = [];
      var curr = this.currentWaypoint(); // save the current waypoint
      for(var i=0; i<route.length; i++) {
        if(route[i].split('.').length == 1) { // just a fix/navaid
          legs.push(new zlsa.atc.Leg({type:"fix", route:route[i]}, this));
        }
        else if(route[i].split('.').length == 3) {  // is an instrument procedure
          var pieces = route[i].split('.');
          if(Object.keys(airport_get().sids).indexOf(pieces[1]) > -1) {  // it's a SID!
            legs.push(new zlsa.atc.Leg({type:"sid", route:route[i]}, this));
          }
          else if(Object.keys(airport_get().stars).indexOf(pieces[1]) > -1) { // it's a STAR!
            legs.push(new zlsa.atc.Leg({type:"star", route:route[i]}, this));
          }
          else if(Object.keys(airport_get().airways).indexOf(pieces[1]) > -1) { // it's an airway!
            legs.push(new zlsa.atc.Leg({type:"awy", route:route[i]}, this));
          }
        }
        else {  // neither formatted like "JAN" nor "JAN.V18.MLU"
          log("Passed invalid route to fms. Unable to create leg from input:" + route[i], LOG_WARNING);
          return false;
        }
      }

      if(!fullRouteClearance) { // insert user's route to the legs
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
        }
        else {  // no route continuity... just adding legs
          this.legs.splice.apply(this.legs, [this.current[0]+1, 0].concat(legs));  // insert the legs after the active Leg
          this.nextLeg();
        }
      }
      else {  // replace all legs with the legs we've built here in this function
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
      this.my_aircraft.runSID(aircraft_get(this.my_aircrafts_eid).destination);
      this.setAll({altitude:airport_get().initial_alt});
      return true;
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
      // Find the SID leg
      var wp, legIndex;
      for(var l in this.legs) {
        if(this.legs[l].type == "sid") {
          legIndex = l;
          wp = this.legs[l].waypoints; break;
        }
      }
      if(!wp) return;

      var cruise_alt = this.fp.altitude;
      var cruise_spd = this.my_aircraft.model.speed.cruise;

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
      this.legs[legIndex].waypoints = wp;
      return true;
    },

    /** Descends aircraft in compliance with the STAR they're following
     ** Adds altitudes and speeds to each waypoint in accordance with the STAR
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

      for(var i=0; i<wp.length; i++) {
        if(i >= 1) {
          start_alt = wp[i-1].altitude;
          start_spd = wp[i-1].speed;
        }
        var a = wp[i].fixRestrictions.alt;
        var s = wp[i].fixRestrictions.spd;

        // Altitude Control
        if(a) {
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
        if(s) {
          if(s.indexOf("+") != -1) {  // at-or-above speed restriction
            var minSpd = parseInt(s.replace("+",""));
            var spd = Math.min(minSpd, start_spd);
          }
          else if(s.indexOf("-") != -1) {
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



    /************************** FMS QUERY FUNCTIONS **************************/

    /** True if waypoint of the given name exists
     */
    hasWaypoint: function(name) {
      for(var i=0; i<this.legs.length; i++) {
        for(var j=0; j<this.legs[i].waypoints.length; j++) {
          if (this.legs[i].waypoints[j].fix == name) return true;
        }
      }
      return false;
    },

    /** Returns object's position in flightplan as object with 2 formats
     ** @param {string} fix - name of the fix to look for in the flightplan
     ** @returns {wp: "position-of-fix-in-waypoint-list",
     **           lw: "position-of-fix-in-leg-wp-matrix"}
     */
    indexOfWaypoint: function(fix) {
      var wp = 0;
      for(var l=0; l<this.legs.length; l++) {
        for(var w=0; w<this.legs[l].waypoints.length; w++) {
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

    /** Returns currentWaypoint's position in flightplan as object with 2 formats
     ** @returns {wp: "position-of-fix-in-waypoint-list",
     **           lw: "position-of-fix-in-leg-wp-matrix"}
     */
    indexOfCurrentWaypoint: function() {
      var wp = 0;
      for(var i=0; i<this.current[0]; i++) wp += this.legs[i].waypoints.length;  // add wp's of completed legs
      wp += this.current[1];

      return {wp:wp, lw:this.current};
    },

    /*************************** FMS GET FUNCTIONS ***************************/

    /** Return the current leg
     */
    currentLeg: function() {
      return this.legs[this.current[0]];
    },

    /** Return the current waypoint
     */
    currentWaypoint: function() {
      if(this.legs.length < 1) return null;
      else return this.legs[this.current[0]].waypoints[this.current[1]];
    },

    /** Returns an array of all fixes along the flightplan route
     */
    fixes: function() {
      return $.map(this.waypoints(),function(w){return w.fix;});
    },

    /** Return this fms's parent aircraft
     */
    my_aircraft: function() {
      return aircraft_get(this.my_aircrafts_eid);
    },

    /** Returns a waypoint at the provided position
     ** @param {array or number} pos - position of the desired waypoint. May be
     **                          provided either as an array showing the leg and
     **                          waypoint within the leg (eg [l,w]), or as the
     **                          number representing the position of the desired
     **                          waypoint in the list of all waypoints (running
     **                          this.waypoints() will return the list)
     ** @returns {Waypoint} - the Waypoint object at the specified location
     */
    waypoint: function(pos) {
      if(Array.isArray(pos)) {  // input is like [leg,waypointWithinLeg]
        return this.legs[pos[0]].waypoints[pos[1]];
      }
      else if(typeof pos == "number") { // input is a position of wp in list of all waypoints
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

    /** Returns all waypoints in fms, in order
     */
    waypoints: function() {
      return $.map(this.legs,function(v){return v.waypoints});
    },

    atLastWaypoint: function() {
      return this.indexOfCurrentWaypoint().wp == this.waypoints().length-1;
    }
  };
});

/** Each simulated aircraft in the game. Contains a model, fms, and conflicts.
 */
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
      this.rwy_dep      = null;       // Departure Runway (to use, currently using, or used)
      this.rwy_arr      = null;       // Arrival Runway (to use, currently using, or used)
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
      this.taxi_time    = 3;          // Time spent taxiing to the runway. *NOTE* this should be INCREASED to around 60 once the taxi vs LUAW issue is resolved (#406)
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

      // Initial Runway Assignment
      if (options.category == "arrival") this.rwy_arr = airport_get().runway;
      else if (options.category == "departure") this.rwy_dep = airport_get().runway;
      this.takeoffTime = (options.category == "arrival") ? game_time() : null;

      this.parse(options);
      this.createStrip();
      this.updateStrip();
    },
    setArrivalWaypoints: function(waypoints) {
      for (var i=0; i<waypoints.length; i++) {  // add arrival fixes to fms
        this.fms.appendLeg({type:"fix", route:waypoints[i].fix});
      }
      if (this.fms.currentWaypoint().navmode == 'heading') {
        this.fms.setCurrent({heading: vradial(this.position) + Math.PI,});  // aim aircraft at airport
      }
      if(this.fms.legs.length > 0) this.fms.nextWaypoint(); // go to the first fix!
    },
    cleanup: function() {
      this.html.remove();
    },
    /** Create the aircraft's flight strip and add to strip bay
     */
    createStrip:function() {
      this.html = $("<li class='strip'></li>");

      // Top Line Data
      this.html.append("<span class='callsign'>" + this.getCallsign() + "</span>");
      this.html.append("<span class='heading'>???</span>");
      this.html.append("<span class='altitude'>???</span>");

      // Bottom Line Data
      if(["H","U"].indexOf(this.model.weightclass) > -1)
        this.html.append("<span class='aircraft'>" + "H/" + this.model.icao  + "</span>");
      else this.html.append("<span class='aircraft'>" + this.model.icao + "</span>");
      this.html.append("<span class='destination'>" + this.destination + "</span>");
      this.html.append("<span class='speed'>???</span>");

      // Initial Styling
      if(this.category == "departure") this.html.addClass('departure');
      else this.html.addClass('arrival');

      // Strip Interactivity Functions
      this.html.find(".strip").prop("title", this.fms.fp.route.join(' '));  // show fp route on hover
      this.html.click(this, function(e) {
        input_select(e.data.getCallsign());
      });
      this.html.dblclick(this, function (e) {
        prop.canvas.panX = 0 - round(km_to_px(e.data.position[0]));
        prop.canvas.panY = round(km_to_px(e.data.position[1]));
        prop.canvas.dirty = true;
      });

      // Add the strip to the html
      var scrollPos = $("#strips").scrollTop();
      $("#strips").prepend(this.html);
      $("#strips").scrollTop(scrollPos + 45);  // shift scroll down one strip's height

      // Determine whether or not to show the strip in our bay
      if (this.category == "arrival") this.html.hide(0);
      else if (this.category == "departure") this.inside_ctr = true;
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
      // Leaving the facility's airspace
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
            // Find the desired SID transition
            var trn;
            for(var l in this.fms.legs) {
              if(this.fms.legs[l].type == "sid") {
                trn = this.fms.legs[l].waypoints[this.fms.legs[l].waypoints.length-1].fix;
                break;
              }
            }
            // Verify aircraft was cleared to departure fix
            var ok = false;
            for(var i=0; i<this.fms.waypoints().length; i++)
              if(this.fms.waypoints()[i].fix == trn) {ok = true; break;}
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

        descendViaSTAR: {
          func: 'runDescendViaSTAR',
          synonyms: ['dvs']},

        direct: {
          func: 'runDirect',
          synonyms: ['dct', 'pd']},

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

        route: {
          func: 'runRoute',
        },

        reroute: {
          func: 'runReroute',
          synonyms: ['rr']
        },

        sayRoute: {
          func: 'runSayRoute',
          synonyms: ['sr']
        },

        sid: {func: 'runSID'},

        speed: {
          func: 'runSpeed',
          shortKey: ['+', '-'],
          synonyms: ['slow', 'sp']},

        star: {func: 'runSTAR'},

        takeoff: {
          func: 'runTakeoff',
          synonyms: ['to', 'cto']},

        taxi: {
          func: 'runTaxi',
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

      // Update the FMS
      var wp = this.fms.currentWaypoint();
      var leg = this.fms.currentLeg();
      var f = this.fms.following;
      if(wp.navmode == "rwy") this.cancelLanding();
      if(['heading'].indexOf(wp.navmode) > -1) { // already being vectored or holding. Will now just change the assigned heading.
        this.fms.setCurrent({
          altitude: wp.altitude,
          navmode: "heading",
          heading: radians(heading),
          speed: wp.speed,
          turn:direction,
          hold:false
        });
      }
      else if(['hold'].indexOf(wp.navmode) > -1) {  // in hold. Should leave the hold, and add leg for vectors
        var index = this.fms.current[0] + 1;
        this.fms.insertLeg({firstIndex:index, waypoints:[new zlsa.atc.Waypoint({  // add new Leg after hold leg
          altitude: wp.altitude,
          navmode: "heading",
          heading: radians(heading),
          speed: wp.speed,
          turn:direction,
          hold:false
        },this.fms)]});
        this.fms.nextWaypoint();  // move from hold leg to vector leg.
      }
      else if(f.sid || f.star || f.awy) {
        leg.waypoints.splice(this.fms.current[1] , 0, // insert wp with heading at current position within the already active leg
          new zlsa.atc.Waypoint({
            altitude: wp.altitude,
            navmode: "heading",
            heading: radians(heading),
            speed: wp.speed,
            turn: direction,
            hold: false,
          },this.fms)
        );
      }
      else if(leg.route != "[radar vectors]") { // needs new leg added
        if(this.fms.atLastWaypoint()) {
          this.fms.appendLeg({waypoints:[new zlsa.atc.Waypoint({
            altitude: wp.altitude,
            navmode: "heading",
            heading: radians(heading),
            speed: wp.speed,
            turn:direction,
            hold:false
          },this.fms)]});
          this.fms.nextLeg();
        }
        else {
          this.fms.insertLegHere({waypoints:[new zlsa.atc.Waypoint({
            altitude: wp.altitude,
            navmode: "heading",
            heading: radians(heading),
            speed: wp.speed,
            turn:direction,
            hold:false
          },this.fms)]});
        }
      }
      wp = this.fms.currentWaypoint();  // update 'wp'

      // Construct the readback
      if(direction) instruction = "turn " + direction + " heading ";
      else instruction = "fly heading ";
      if(incremental) 
        var readback = {
          log: "turn " + amount + " degrees " + direction,
          say: "turn " + groupNumbers(amount) + " degrees " + direction};
      else var readback = {
          log: instruction + heading_to_string(wp.heading),
          say: instruction + radio_heading(heading_to_string(wp.heading))};
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
      return ['ok', {log: "descend via the " + this.destination + " departure",
        say: "climb via the " + airport_get().sids[this.destination].name + " departure"}];
      else ui_log(true, this.getCallsign() + ", unable to climb via SID");
    },
    runDescendViaSTAR: function() {
      if(this.fms.descendViaSTAR() && this.fms.following.star)
      return ['ok', {log: "descend via the " + this.fms.following.star + " arrival",
        say: "descend via the " + airport_get().stars[this.fms.following.star].name + " arrival"}];
      else ui_log(true, this.getCallsign() + ", unable to descend via STAR");
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

      if(this.isTakeoff() && !hold_fix) return ["fail", "where do you want us to hold?"];

      // Determine whether or not to enter the hold from present position
      if(hold_fix) {  // holding over a specific fix (currently only able to do so on inbound course)
        var inboundHdg = vradial(vsub(this.position, hold_fix_location));
        if(hold_fix != this.fms.currentWaypoint().fix) {  // not yet headed to the hold fix
          this.fms.insertLegHere({type:"fix", route: "[GPS/RNAV]", waypoints:[
            new zlsa.atc.Waypoint({ // proceed direct to holding fix
              fix: hold_fix,
              altitude: this.fms.currentWaypoint().altitude,
              speed: this.fms.currentWaypoint().speed
            },this.fms),
            new zlsa.atc.Waypoint({ // then enter the hold
              navmode:"hold", speed: this.fms.currentWaypoint().speed,  altitude: this.fms.currentWaypoint().altitude, fix: null,
              hold: { fixName: hold_fix,          fixPos: hold_fix_location,
                      dirTurns: dirTurns,         legLength: legLength,
                      inboundHdg: inboundHdg,     timer: null, }
            },this.fms)
          ]});
        }
        else {  // already currently going to the hold fix
          this.fms.appendWaypoint({navmode:"hold", speed: this.fms.currentWaypoint().speed,  altitude: this.fms.currentWaypoint().altitude, fix: null,
            hold: { fixName: hold_fix,          fixPos: hold_fix_location,
                    dirTurns: dirTurns,         legLength: legLength,
                    inboundHdg: inboundHdg,     timer: null, }});  // Force the initial turn to outbound heading when entering the hold
        }
      }
      else {  // holding over present position (currently only able to do so on present course)
        hold_fix_location = this.position; // make a/c hold over their present position
        var inboundHdg = this.heading;
        this.fms.insertLegHere({type:"fix", waypoints:[
          { // document the present position as the "fix" we're holding over
            navmode:"fix",
            fix: "[custom]",
            location: hold_fix_location,
            altitude: this.fms.currentWaypoint().altitude,
            speed: this.fms.currentWaypoint().speed
          },
          { // Force the initial turn to outbound heading when entering the hold
            navmode:"hold", speed: this.fms.currentWaypoint().speed,  altitude: this.fms.currentWaypoint().altitude, fix: null,
            hold: { fixName: hold_fix,          fixPos: hold_fix_location,
                    dirTurns: dirTurns,         legLength: legLength,
                    inboundHdg: inboundHdg,     timer: null, }
          }
        ]});
      }

      var inboundDir = radio_cardinalDir_names[getCardinalDirection(fix_angle(inboundHdg + Math.PI)).toLowerCase()];
      if(hold_fix) return ["ok", "proceed direct " + hold_fix + " and hold inbound, " + dirTurns + " turns, " + legLength + " legs"];
      else return ["ok", "hold " + inboundDir + " of present position, " + dirTurns + " turns, " + legLength + " legs"];
    },
    runDirect: function(data) {
      if(data.length == 0) return ["fail", "say again the fix name?"];
      var fixname = data.toUpperCase(), fix = airport_get().getFix(fixname);
      if (!fix) return ["fail", "unable to find fix called " + fixname];

      if(this.mode == "takeoff") {  // remove intermediate fixes
        this.fms.skipToFix(fixname);
      }
      else {
        if (!this.fms.skipToFix(fixname))
          return ["fail", fixname + ' is not in our flightplan'];
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
      var a = this; // necessary to keep 'this' in scope during $.each()

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

      for(var i=fixes.length-1; i>=0; i--) {
        a.fms.insertLegHere({type:"fix", route:fixes[i]})
        // $.each(fixes, function(i,v){a.fms.insertLegHere({type:"fix", route:v})});
      }

      if(a.mode != "waiting" && a.mode != "takeoff" && a.mode != "apron" && a.mode != "taxi"){
        a.cancelLanding();
      }
      return ["ok", "proceed direct " + fixes.join(', ')];
    },
    runSayRoute: function(data) {
      return ['ok', {log:'route: ' + this.fms.fp.route.join(' '), say:"here's our route"}];
    },
    runSID: function(data) {
      var apt = airport_get();
      var sid_id = data.toUpperCase();
      if(!apt.sids.hasOwnProperty(sid_id)) return;
      var sid_name = apt.sids[sid_id].name;
      var trn = apt.getSIDTransition(sid_id);
      var route = apt.icao + '.' + sid_id + '.' + trn;

      if(this.category != "departure") {
        return ["fail", "unable to fly SID, we are an inbound"];
      }
      if(data.length == 0) {
        return ["fail", "SID name not understood"];
      }
      if(!apt.sids.hasOwnProperty(sid_id)) {
        return ["fail", "SID name not understood"];
      }

      if(!this.rwy_dep) this.rwy_dep = airport_get().runway;
      this.fms.followSID(route);

      return ["ok", {log:"cleared to destination via the " + sid_id + " departure, then as filed",
                  say:"cleared to destination via the " + sid_name + " departure, then as filed"}];
    },
    runSTAR: function(data) {
      var trn = data.split('.')[0].toUpperCase();
      var star_id = data.split('.')[1].toUpperCase();
      var apt = airport_get();
      var star_name = apt.stars[star_id].name;
      var route = trn + '.' + star_id + '.' + apt.icao;

      if(this.category != "arrival") {
        return ["fail", "unable to fly STAR, we are a departure!"];
      }
      if(data.length == 0) {
        return ["fail", "STAR name not understood"];
      }
      if(!apt.stars.hasOwnProperty(star_id)) {
        return ["fail", "STAR name not understood"];
      }
      
      this.fms.followSTAR(route);

      return ["ok", {log:"cleared to the " + apt.name + " via the " + star_id + " arrival",
                  say:"cleared to the " + apt.name + " via the " + star_name + " arrival"}];
    },
    runMoveDataBlock: function(dir) {
      dir = dir.replace('`','');  // remove shortKey
      var positions = {8:360,9:45,6:90,3:135,2:180,1:225,4:270,7:315,5:"ctr"};
      if(!positions.hasOwnProperty(dir)) return;
      else this.datablockDir = positions[dir];
    },
    /** Adds a new Leg to fms with a user specified route
     ** Note: See notes on 'runReroute' for how to format input for this command
     */
    runRoute: function(data) {
      data = data.toUpperCase();  // capitalize everything
      var worked = true;
      var route = this.fms.formatRoute(data);
      if(worked && route) worked = this.fms.customRoute(route, false);  // Add to fms
      if(!route || !data || data.indexOf(" ") > -1) worked = false;

      // Build the response
      if(worked) return ['ok', {log:'rerouting to :' + this.fms.fp.route.join(' '),say:"rerouting as requested"}];
      else return ['fail', {log:'your route "' + data + '" is invalid!', say:'that route is invalid!'}];
    },
    /** Removes all legs, and replaces them with the specified route
     ** Note: Input data needs to be provided with single dots connecting all
     ** procedurally-linked points (eg KSFO.OFFSH9.SXC or SGD.V87.MOVER), and
     ** all other points that will be simply a fix direct to another fix need
     ** to be connected with double-dots (eg HLI..SQS..BERRA..JAN..KJAN)
     */
    runReroute: function(data) {
      data = data.toUpperCase();  // capitalize everything
      var worked = true;
      var route = this.fms.formatRoute(data);
      if(worked && route) worked = this.fms.customRoute(route, true);  // Reset fms
      if(!route || !data || data.indexOf(" ") > -1) worked = false;

      // Build the response
      if(worked) return ['ok', {log:'rerouting to: ' + this.fms.fp.route.join(' '),say:"rerouting as requested"}];
      else return ['fail', {log:'your route "' + data + '" is invalid!', say:'that route is invalid!'}];
    },
    runTaxi: function(data) {
      if(this.category != "departure") return ["fail", "inbound"];
      if(this.mode == "taxi") return ["fail", "already taxiing to " + radio_runway(this.rwy_dep)];
      if(this.mode == "waiting") return ["fail", "already waiting"];
      if(this.mode != "apron") return ["fail", "wrong mode"];

      // Set the runway to taxi to
      if(data) {
        if(airport_get().getRunway(data.toUpperCase())) this.rwy_dep = data.toUpperCase();
        else return ["fail", "no runway " + data.toUpperCase()];
      }

      // Start the taxi
      this.taxi_start = game_time();
      var runway = airport_get().getRunway(this.rwy_dep);
      runway.addQueue(this);
      this.mode = "taxi";

      var readback = {
        log: "taxi to runway " + runway.name,
        say: "taxi to runway " + radio_runway(runway.name)
      };
      return ["ok", readback];
    },
    runTakeoff: function(data) {
      if(this.category != "departure") return ["fail", "inbound"];

      if(!this.isLanded()) return ["fail", "already airborne"];
      if(this.mode =="apron") return ["fail", "unable, we're still in the parking area"];
      if(this.mode == "taxi") return ["fail", "taxi to runway " + radio_runway(this.rwy_dep) + " not yet complete"];

      if(this.fms.currentWaypoint().altitude <= 0) return ["fail", "no altitude assigned"];

      var runway = airport_get().getRunway(this.rwy_dep);

      if(runway.removeQueue(this, this.rwy_dep)) {
        this.mode = "takeoff";
        prop.game.score.windy_takeoff += this.scoreWind('taking off');
        this.takeoffTime = game_time();

        if(this.fms.currentWaypoint().speed == null)
          this.fms.setCurrent({speed: this.model.speed.cruise});

        var wind = airport_get().getWind();
        var wind_dir = round(degrees(wind.angle));
        var readback = {
          log: "wind " + round(wind_dir/10)*10 + " at " + round(wind.speed) + ", runway " + this.rwy_dep + ", cleared for takeoff",
          say: "wynd " + radio_spellOut(round(wind_dir/10)*10) + " at " + radio_spellOut(round(wind.speed)) + ", run way " + radio_runway(this.rwy_dep) + ", cleared for take off",
        };
        return ["ok", readback];
      } else {
        var waiting = runway.inQueue(this, this.rwy_dep);
        return ["fail", "number "+waiting+" behind "+runway.queue[runway.getEnd(this.rwy_dep)][waiting-1].getRadioCallsign(), ""];
      }
    },
    runLanding: function(data) {
      if(data[0] == "\u2B50") { //shortkey '*' in use
        data = data.substr(1);  //remove shortKey
      }
      if(isNaN(data[0])) {  // includes a variant (eg 'y28r' for 'ILS-Y RWY 28R' approach)
        var variant = data.slice(0,1).toUpperCase();
        data = data.slice(1);
      }

      var runway = airport_get().getRunway(data);
      if(!runway) return ["fail", "there is no runway " + radio_runway(data)];
      else this.rwy_arr = data.toUpperCase();

      this.fms.followApproach("ils", this.rwy_arr, variant); // tell fms to follow ILS approach

      var readback = {log:"cleared ILS runway " + this.rwy_arr + " approach",
                      say:"cleared ILS runway " + radio_runway(this.rwy_arr) + " approach"};
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
        var curr = this.fms.currentWaypoint();
        this.fms.appendLeg({
          altitude: curr.altitude,
          navmode: 'heading',
          heading: this.heading,
          speed: curr.speed
        });
        this.fms.nextLeg();
        this.updateStrip();
        return true;
      }
      return false;
    },
    cancelLanding: function() {
      if(this.fms.currentWaypoint().navmode == "rwy") {
        var runway = airport_get().getRunway(this.rwy_arr);
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
      var keys = 'position model airline callsign category heading altitude'.split(' ');
      for (var i in keys) {
        if (data[keys[i]]) this[keys[i]] = data[keys[i]];
      }
      if(this.category == "arrival") {
        if(data.waypoints.length > 0)
          this.setArrivalWaypoints(data.waypoints);
        this.destination = data.destination;
        this.rwy_arr = airport_get(this.destination).runway;
      }
      else if(this.category == "departure" && this.isLanded()) {
        this.speed = 0;
        this.mode = "apron";
        this.rwy_dep = airport_get().rwy;
        this.destination = data.destination;
      }

      if(data.speed) this.speed = data.speed;
      if(data.heading)  this.fms.setCurrent({heading: data.heading});
      if(data.altitude) this.fms.setCurrent({altitude: data.altitude});
      this.fms.setCurrent({speed: data.speed || this.model.speed.cruise});
      if(data.route) {  // filed a STAR
        this.fms.customRoute(this.fms.formatRoute(data.route), true);
        this.fms.descendViaSTAR();
      }
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
      if(this.mode == "apron" || this.mode == "taxi") return false; // hide aircraft on twys
      else if(this.isTaxiing()) { // show only the first aircraft in the takeoff queue
        var runway = airport_get().getRunway(this.rwy_dep);
        var waiting = runway.inQueue(this, this.rwy_dep);
        if(this.mode == "waiting" && waiting == 0) return true;
        else return false;
      }
      else return true;
    },
    getWind: function() {
      if (!this.rwy_dep) return {cross: 0, head: 0};
      var airport = airport_get();
      var wind    = airport.wind;
      var runway  = airport.getRunway(this.rwy_dep);

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
            var alt_log = "descending through " + this.altitude + " for " + this.target.altitude;
            var alt_say = "descending through " + radio_altitude(this.altitude) + " for " + radio_altitude(this.target.altitude);
          }
          else if(altdiff < 0) {
            var alt_log = " climbing through " + this.altitude + " for " + this.target.altitude;
            var alt_say = " climbing through " + radio_altitude(this.altitude) + " for " + radio_altitude(this.target.altitude);
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
        runway  = airport.getRunway(this.rwy_arr);
        offset = getOffset(this, runway.position, runway.angle);
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
                  radians(parseInt(this.rwy_arr.substr(0,2))*10))) > radians(30))) {
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
        if((distance_to_fix < 1) ||
          ((distance_to_fix < 10) && (distance_to_fix < aircraft_turn_initiation_distance(this, fix)))) {
          if(!this.fms.atLastWaypoint()) { // if there are more waypoints available
            this.fms.nextWaypoint();  // move to the next waypoint
          }
          else {
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
        if(angle_off_of_leg_hdg < 0.035) { // within ~2° of upwd/dnwd
          var offset = getOffset(this, hold.fixPos);
          if(hold.timer == null && offset[1] < 0 && offset[2] < 2) {  // entering hold, just passed the fix
            hold.timer = -999; // Force aircraft to enter the hold immediately
          }
          // Holding Logic
          if(hold.timer && hold.legLength.includes("min")) {  // time-based hold legs
            if(hold.timer == -1) hold.timer = prop.game.time; // save the time
            else if(prop.game.time >= hold.timer + parseInt(hold.legLength.replace("min",""))*60) { // time to turn
              this.target.heading += Math.PI;   // turn to other leg
              this.target.turn = hold.dirTurns;
              hold.timer = -1; // reset the timer
            }
          else if(hold.legLength.includes("nm")) {  // distance-based hold legs
            // not yet implemented
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

      // If stalling, make like a meteorite and fall to the earth!
      if(this.speed < this.model.speed.min) this.target.altitude = 0;

      //finally, taxi overrides everything
      var was_taxi = false;
      if(this.mode == "taxi") {
        var elapsed = game_time() - this.taxi_start;
        if(elapsed > this.taxi_time) {
          this.mode = "waiting";
          was_taxi = true;
          this.updateStrip();
        }
      }
      else if(this.mode == "waiting") {
        var runway = airport_get().getRunway(this.rwy_dep);
        var position = runway.position;

        this.position[0] = position[0];
        this.position[1] = position[1];
        this.heading     = runway.angle;

        if (!this.projected &&
            (runway.inQueue(this, this.rwy_dep) == 0) &&
            (was_taxi == true))
        {
          ui_log(this.getCallsign(), " holding short of runway "+this.rwy_dep);
          speech_say([ {type:"callsign", content:this}, {type:"text", content:"holding short of runway "+radio_runway(this.rwy_dep)} ]);
          this.updateStrip();
        }
      }
      else if(this.mode == "takeoff") {
        // Altitude Control
        if(this.speed < this.model.speed.min) this.target.altitude = 0;
        else this.target.altitude = this.fms.currentWaypoint().altitude;

        // Heading Control
        var rwyHdg = airport_get().getRunway(this.rwy_dep).angle;
        if(this.altitude<400) this.target.heading = rwyHdg;
        else {
          if(!this.fms.followCheck().sid && this.fms.currentWaypoint().heading == null) { // if no directional instructions available after takeoff
            this.fms.setCurrent({heading:rwyHdg});  // fly runway heading
          }
          this.mode = "cruise";
          this.updateStrip();
        }

        // Speed Control
        this.target.speed = this.model.speed.cruise;  // go fast!
      }

      // Limit speed to 250 knots while under 10,000 feet MSL (it's the law!)
      if(this.altitude < 10000) {
        if(this.isPrecisionGuided()) this.target.speed = Math.min(this.target.speed, 250);  // btwn 0 and 250
        else this.target.speed = Math.min(this.fms.currentWaypoint().speed, 250); // btwn scheduled speed and 250
      }
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
      var wp = this.fms.currentWaypoint();

      // Update fms.following
      this.fms.followCheck();

      // Remove all old styling
      heading.removeClass("runway hold waiting taxi lookingGood allSet");
      altitude.removeClass("runway hold waiting taxi lookingGood allSet");
      destination.removeClass("runway hold waiting taxi lookingGood allSet");
      speed.removeClass("runway hold waiting taxi lookingGood allSet");

      // Populate strip fields with default values
      heading.text(heading_to_string(wp.heading));
      (wp.altitude) ? altitude.text(wp.altitude) : altitude.text("-");
      destination.text(this.destination || airport_get().icao);
      speed.text(wp.speed);

      // When at the apron...
      if(this.mode == "apron") {
        heading.addClass("runway");
        heading.text("apron");
        if(wp.altitude) altitude.addClass("runway");
        if(this.fms.following.sid) {
          destination.text(this.fms.following.sid + '.'
            + this.fms.currentLeg().route.split('.')[2]);
          destination.addClass("runway");
        }
        speed.addClass("runway");
      }

      // When taxiing...
      else if(this.mode == "taxi") {
        heading.addClass("runway");
        heading.text("taxi");
        if(wp.altitude) altitude.addClass("runway");
        if(this.fms.following.sid) {
          destination.text(this.fms.following.sid + '.'
            + this.fms.currentLeg().route.split('.')[2]);
          destination.addClass("runway");
        }
        speed.addClass("runway");
        if(this.taxi_next) altitude.text("ready");
      }

      // When waiting in the takeoff queue
      else if(this.mode == "waiting") {
        heading.addClass("runway");
        heading.text("ready");
        if(wp.altitude) altitude.addClass("runway");
        if(this.fms.following.sid) {
          destination.text(this.fms.following.sid + '.'
            + this.fms.currentLeg().route.split('.')[2]);
          destination.addClass("runway");
        }
        speed.addClass("runway");
      }

      // When taking off...
      else if(this.mode == "takeoff") {
        heading.text("takeoff");
        if(this.fms.following.sid) {
          destination.text(this.fms.following.sid + '.'
            + this.fms.currentLeg().route.split('.')[2]);
          destination.addClass("lookingGood");
        }
      }

      // When in normal flight...
      else if(this.mode == "cruise") {
        if(wp.navmode == "fix") {
          heading.text((wp.fix[0]=='_') ? "[RNAV]" : wp.fix);
          if(this.fms.following.sid) {
            heading.addClass("allSet");
            altitude.addClass("allSet");
            destination.addClass("allSet");
            speed.addClass("allSet");
          }
          if(this.fms.following.star) {
            heading.addClass("followingSTAR");
            if(this.fms.currentWaypoint().fixRestrictions.altitude)
              altitude.addClass("followingSTAR");
            destination.text(this.fms.following.star + '.' + airport_get().icao);
            destination.addClass("followingSTAR");
            if(this.fms.currentWaypoint().fixRestrictions.speed)
              speed.addClass("followingSTAR");
          }
        }
        else if(wp.navmode == "hold") {
          heading.text("holding");
          heading.addClass("hold");
        }
        else if(wp.navmode == "rwy") {  // attempting ILS intercept
          heading.addClass("lookingGood");
          heading.text("intercept");
          altitude.addClass("lookingGood");
          destination.addClass("lookingGood");
          destination.text(this.fms.fp.route[this.fms.fp.route.length-1] + " " + wp.runway);
          speed.addClass("lookingGood");
        }
      }

      // When established on the ILS...
      else if(this.mode == "landing") {
        heading.addClass("allSet");
        heading.text("on ILS");
        altitude.addClass("allSet");
        altitude.text("GS");
        destination.addClass("allSet");
        destination.text(this.fms.fp.route[this.fms.fp.route.length-1] + " " + wp.runway);
        speed.addClass("allSet");
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
  aircraft_load("at45");
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
      remove = true;
    }
    if(aircraft.hit && aircraft.isLanded()) {
      ui_log("Lost radar contact with "+aircraft.getCallsign());
      speech_say([ {type:"callsign", content:aircraft}, {type:"text", content:", radar contact lost"} ]);
      remove = true;
    }
    // Clean up the screen from aircraft that are too far
    if((!aircraft_visible(aircraft,2) && !aircraft.inside_ctr) && !aircraft.fms.following.star){
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
  var index = a.fms.indexOfCurrentWaypoint().wp;
  if(index >= a.fms.waypoints().length-1) return 0; // if there are no subsequent fixes, fly over 'fix'
  var speed = a.speed * (463/900); // convert knots to m/s
  var bank_angle = radians(25); // assume nominal bank angle of 25 degrees for all aircraft
  var g = 9.81;                 // acceleration due to gravity, m/s*s
  var nextfix = a.fms.waypoint(a.fms.indexOfCurrentWaypoint().wp+1).location;
  if(!nextfix) return 0;
  var nominal_new_course = vradial(vsub(nextfix, fix));
  if( nominal_new_course < 0 ) nominal_new_course += Math.PI * 2;
  var current_heading = a.heading;
  if (current_heading < 0) current_heading += Math.PI * 2;
  var course_change = Math.abs(degrees(current_heading) - degrees(nominal_new_course));
  if (course_change > 180) course_change = 360 - course_change;
  course_change = radians(course_change);
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
  callsign = String(callsign);
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
