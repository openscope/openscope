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
      if (this.collided)
        return;

      var d = this.distance;
      this.distance = vlen(vsub(this.aircraft[0].position,
                                this.aircraft[1].position));
      this.distance_delta = this.distance - d;

      this.altitude = abs(this.aircraft[0].altitude - this.aircraft[1].altitude);

      // Check if the separation is now beyond the bounding box check
      if (this.distance > 14.2) {
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
      }
    },

    /**
     * Check for a potential head-on collision on a runway
     */
    checkRunwayCollision: function() {
      // Check if the aircraft are on a potential collision course
      // on the runway
      var airport = airport_get();

      // Check for the same runway, headings differing by more
      // than 30 degrees and under about 6 miles
      if ((!this.aircraft[0].isTaxiing() && !this.aircraft[1].isTaxiing()) &&
          (this.aircraft[0].fms.currentWaypoint().runway != null) &&
          (airport.getRunway(this.aircraft[1].fms.currentWaypoint().runway) ===
           airport.getRunway(this.aircraft[0].fms.currentWaypoint().runway)) &&
          (abs(angle_offset(this.aircraft[0].heading, this.aircraft[1].heading)) > 0.5236) &&
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

      // Reduced horizontal separation minima during precision
      // guided approaches while established
      if ((this.aircraft[0].isPrecisionGuided() && this.aircraft[0].isEstablished()) &&
          (this.aircraft[1].isPrecisionGuided() && this.aircraft[1].isEstablished()))
      {
        if (this.aircraft[0].fms.currentWaypoint().runway != this.aircraft[1].fms.currentWaypoint().runway)
        {
          var ap = airport_get();
          var separation = Math.max(ap.getRunway(this.aircraft[0].fms.currentWaypoint().runway),
                                    ap.getRunway(this.aircraft[1].fms.currentWaypoint().runway));
          conflict = (this.distance < separation);
          violation = (this.distance < (0.85 * separation)); // 3000 feet
        }
        else
        {
          conflict = (this.distance < 5.2); // 2.8nm
          violation = (this.distance < 4.6); // 2.5nm
        }
      }
      // Standard separation
      /* 7110.65, section 5-5-7-a-1:
         (a) Aircraft are on opposite/reciprocal
         courses and you have observed that they have passed
         each other; or aircraft are on same or crossing
         courses/assigned radar vectors and one aircraft has
         crossed the projected course of the other, and the
         angular difference between their courses/assigned
         radar vectors is at least 15 degrees.
      */
      else {
        var offset = abs(angle_offset(this.aircraft[0].groundTrack,
                                      this.aircraft[1].groundTrack));

        // Check for diverging separation based on heading difference
        // and being close enough that it may apply.
        if ((this.distance <= 7.4) && (offset >= radians(15)))
        {
          // Opposing courses simply check the distance is increasing
          if (offset > radians(165)) {
            if (this.distance_delta <= 0) {
              conflict = true;
              violation = (this.distance < 5.6); // 3nm
            }
          }
          else {
            // Ray intersection from http://stackoverflow.com/a/2932601
            var ad = vturn(this.aircraft[0].groundTrack);
            var bd = vturn(this.aircraft[1].groundTrack);
            var dx = this.aircraft[1].position[0] - this.aircraft[0].position[0];
            var dy = this.aircraft[1].position[1] - this.aircraft[0].position[1];
            var det = bd[0] * ad[1] - bd[1] * ad[0];
            // Calculate intersection distance in direction of flight
            var u = (dy * bd[0] - dx * bd[1]) / det;
            var v = (dy * ad[0] - dx * ad[1]) / det;

            // Check if both aircraft still have to fly a positive distance
            if ((u >= 0) && (v >= 0)) {
              conflict = true;
              violation = (this.distance < 5.6); // 3nm
            }
          }
        }
        else {
          conflict = (this.distance < 7.4); // 4nm
          violation = (this.distance < 5.6); // 3nm
        }
      }

      if (conflict)
        this.conflicts.proximityConflict = true;
      else
        this.conflicts.proximityConflict = false;

      if (violation)
        this.violations.proximityViolation = true;
      else
        this.violations.proximityViolation = false;

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
        ascent:     0, // feet per second
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

      if(data.rate) {
        this.rate         = data.rate;
        this.rate.ascent  = this.rate.ascent  / 60;
        this.rate.descent = this.rate.descent / 60;
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
      this.aircraft = options.aircraft;

      this.waypoints = [];
      this.addWaypoint();
    },

    parse: function(options) {
    },

    /**
     * Add a waypoint
     */
    addWaypoint: function(data) {
      if (data === undefined)
        data = {};

      var wp = {
        name: 'unnamed',
        navmode: null,
        heading: null,
        turn: null,
        location: null,
        altitude: null,
        expedite: false,
        speed:    null,
        runway:   null,
      };

      if (data.fix) {
        wp.navmode = 'fix';
        wp.name = data.fix;
        wp.location = airport_get().getFix(data.fix);
      }

      for (var f in data) {
        wp[f] = data[f];
      }

      this.waypoints.push(wp);
    },

    /**
     * Return the current waypoint
     */
    currentWaypoint: function() {
      return this.waypoints[0];
    },

    /**
     * True if waypoint of the given name exists
     */
    hasWaypoint: function(name) {
      for (var j=0; j<this.waypoints.length; j++) {
        if (this.waypoints[j].name == name) {
          return true;
        }
      }
      return false;
    },

    /**
     * Switch to the next waypoint
     */
    nextWaypoint: function() {
      var last = this.waypoints.shift();

      if (this.waypoints.length == 0) {
        this.addWaypoint({
          navmode: 'heading',
          heading: this.aircraft.heading,
          speed: last.speed,
          altitude: last.altitude,
        });
      }

      if (this.waypoints[0].speed == null)
        this.waypoints[0].speed = last.speed;

      if (this.waypoints[0].altitude == null)
        this.waypoints[0].altitude = last.altitude;
    },

    /**
     * Remove all waypoints except the current one
     */
    removeWaypoints: function() {
      this.waypoints = [this.waypoints[0]];
    },

    /**
     * Modify all waypoints
     */
    setAll: function(data) {
      for (var i=0; i<this.waypoints.length; i++) {
        for (var k in data) {
          this.waypoints[i][k] = data[k];
        }
      }
    },

    /**
     * Modify the current waypoint
     */
    setCurrent: function(data) {
      for (var i in data) {
        this.waypoints[0][i] = data[i];
      }
    },

    /**
     * Reset waypoints as a list of fixes
     */
    setFixes: function(fixes) {
      var current = this.waypoints[0];
      this.waypoints = [];
      for (var i=0;i< fixes.length;i++) {
        var f = fixes[i];
        this.addWaypoint({
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

    /**
     * Skips waypoints intermediate to the given waypoint
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
  };
});

var Aircraft=Fiber.extend(function() {

  return {
    init: function(options) {
      if(!options) options={};
      this.position    = [0, 0];

      this.model       = null;

      this.airline     = "";
      this.callsign    = "";

      this.heading     = 0;
      this.altitude    = 0;
      this.speed       = 0;
      this.groundSpeed = 0;
      this.groundTrack = 0;
      this.ds          = 0;

      this.takeoffTime = 0;

      // Distance laterally from the approach path
      this.approachOffset = 0;
      // Distance longitudinally from the threshold
      this.approachDistance = 0;

      this.radial      = 0;
      this.distance    = 0;
      this.destination = null;

      this.trend       = 0;

      this.history     = [];

      this.restricted = {list: []};
      
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
      
      this.notice      = false;
      this.warning     = false;
      this.hit         = false;

      this.taxi_next     = false;
      this.taxi_start    = 0;
      this.taxi_delay    = 0;

      this.rules       = "ifr";

      this.inside_ctr = false;

      this.conflicts = {};

      // Set to true when simulating future movements of the aircraft
      // Should be checked before updating global state such as score
      // or HTML.
      this.projected = false;

      this.position_history = [];

      this.category    = "arrival"; // or "departure"
      this.mode        = "cruise";  // "apron", "taxi", "waiting", "takeoff", "cruise", or "landing"
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
        aircraft: this,
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
      if (this.destination)
        this.html.append("<span class='destination'>" +
                         heading_to_string(this.destination) +
                         "</span>");
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
          var position = "";
          var distance = round(vlen(this.position) * 0.62);
          position += distance + " mile" + s(distance);
          var angle = vradial(this.position);
          position += " " + radio_cardinalDir(getCardinalDirection(angle));
          ui_log(airport_get().radio+" tower, "+this.getRadioCallsign()+" in your airspace "+position+", over");
          this.inside_ctr = true;
        } else if(this.category == "departure") {
          ui_log(airport_get().radio + ', ' + this.getRadioCallsign() + ", request taxi");
        }
      }

      $("#strips").append(this.html);

      this.html.click(this, function(e) {
        input_select(e.data.getCallsign());
      });

      this.html.dblclick(this, function (e) {
        prop.canvas.panX = 0 - round(km(e.data.position[0]));
        prop.canvas.panY = round(km(e.data.position[1]));
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
        this.fms.addWaypoint(waypoints[i]);
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
        if (this.category == "arrival") {
          var position = "";
          var distance = round(this.distance * 0.62);
          position += distance + " mile" + s(distance);
          position += " " + radio_cardinalDir(getCardinalDirection(this.radial));
          var altitude = " ";
          if (abs(this.altitude - this.fms.currentWaypoint().altitude) > 100) {
            altitude += "leaving " + (Math.floor(this.altitude / 100) * 100) +
              " for " + (Math.floor(this.fms.currentWaypoint().altitude / 100) * 100);
          } else {
            altitude += "at " + (Math.floor(this.altitude / 100) * 100);
          }
          this.radioCall(position + altitude);
        }
      }
      // Leaving the center
      else {
        this.hideStrip();

        // Fly away!
        this.fms.setCurrent({
          navmode: "heading",
          heading: this.radial,
          turn: null,
          hold: false,
          altitude: 20000,
          speed: 330,
        });

        if (this.category == "departure") {
          // Within 5 degrees of destination heading
          if (abs(this.radial - this.destination) < 0.08726) {
            this.radioCall("leaving radar coverage");
            prop.game.score.departure += 1;
          }
          else {
            this.radioCall("leaving radar coverage outside departure window", true);
            prop.game.score.departure -= 1;
          }
        }
        if (this.category == "arrival") {
          this.radioCall("leaving radar coverage as arrival", true);
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
      return airline_get(this.airline).callsign + " " + radio_spellOut(callsign) + heavy;
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
          func: 'runHold',
          synonyms: ['circle']},

        land: {
          func: 'runLanding',
          shortKey: ['\u2B50'],
          synonyms: ['l', 'ils']},

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
          response.push(retval[1]);
          if(retval[2]) response_end = retval[2];
        }

      }

      if(commands.length == 0) {
        response     = ["not understood"];
        response_end = "say again";
      }

      if(response.length >= 1) {
        if(response_end) response_end = ", " + response_end;
        ui_log(this.getRadioCallsign() + ", " + response.join(", ") + response_end);
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
        return ["fail", "not understood", "say again"];

      return this[call_func].apply(this, [data]);
    },
    runHeading: function(data) {
      var split     = data.split(" ");
      var heading = null;
      var direction = null;
      switch(split.length) {  //number of elements in 'data'
        case 1: 
          if(isNaN(parseInt(split))) {  //probably using shortKeys
            if(split[0][0] == "\u2BA2") { //using '<250' format
              direction = "left";
              heading = split[0].substr(1); //remove shortKey
            }
            else if (split[0][0] == "\u2BA3") {  //using '>250' format
              direction = "right";
              heading = split[0].substr(1); //remove shortKey
            }
            else if(split[0].substr(0,2).toLowerCase() == "fh") { //using 'fh250' format
              heading = split[0].substr(2); //remove shortKey
            }
            else {  //input is invalid
              return ["fail", "heading not understood", "say again"];
            }
          }
          else {  //using 'turn 250' format (no direction specified)
            heading = parseInt(split);
          }
          break;

        case 2: //using 'turn r 250' format
          if(split[0] === "l") direction = "left";
          else if (split[0] === "r" ) direction = "right";
          heading = parseInt(split[1]);
          break;

        default:  //input formatted incorrectly
          return ["fail", "heading not understood", "say again"];
          break;
      }

      if(isNaN(heading)) return ["fail", "heading not understood", "say again"];

      //Stop doing what you're doing
      if(this.fms.currentWaypoint().navmode == "rwy")
        this.cancelLanding();
      this.cancelFix();

      this.fms.setCurrent({
        navmode: "heading",
        heading: radians(heading),
        turn: direction,
        hold: false,
      });

      if(direction == null) direction  = "";
      else direction += " ";

      if(this.isTakeoff())
        return ['ok', 'after departure, turn ' + direction + 'heading ' + heading_to_string(this.fms.currentWaypoint().heading), ''];

      return ['ok', 'turn ' + direction + 'heading ' + heading_to_string(this.fms.currentWaypoint().heading), ''];
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
          if(this.isTakeoff())
            return ['ok', 'after departure, ' + radio_trend('altitude', this.altitude, this.fms.currentWaypoint().altitude) + " " + this.fms.currentWaypoint().altitude + ' expedite'];
          return ['ok', radio_trend('altitude', this.altitude, this.fms.currentWaypoint().altitude) + " " + this.fms.currentWaypoint().altitude + ' expedite'];
        }
        return ["fail", "altitude not understood", "say again"];
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

      if(expedite) expedite = " expedite";
      else         expedite = "";

      if(this.isTakeoff())
        return ['ok', 'after departure, ' + radio_trend('altitude', this.altitude, this.fms.currentWaypoint().altitude) 
          + ' ' + radio_altitude(this.fms.currentWaypoint().altitude) + expedite];
      return ['ok', radio_trend('altitude', this.altitude, this.fms.currentWaypoint().altitude) + ' ' + radio_altitude(this.fms.currentWaypoint().altitude) + expedite];
    },
    runSpeed: function(data) {
      if(data[0] == "+" || data[0] == "-") {  //shortKey '+' or '-' in use
        data = data.substr(1);  //remove shortKey
      }

      var speed = parseInt(data);

      if(isNaN(speed)) return ["fail", "speed not understood", "say again"];

//      if(this.mode == "landing")
//        this.cancelLanding();

      this.fms.setAll({speed: clamp(this.model.speed.min,
                                    speed,
                                    this.model.speed.max)});

      return ["ok", radio_trend("speed", this.speed, this.fms.currentWaypoint().speed) + " " + this.fms.currentWaypoint().speed + " knots"];

    },
    runHold: function(data) {
      var turn = '';
      if("left".indexOf(data) == 0 && data.length >= 1) turn = "left";
      else if("right".indexOf(data) == 0 && data.length >= 1) turn = "right";
      else return ["fail", "hold direction not understood", "say again"];

      this.fms.setCurrent({
        navmode: 'hold',
        turn: turn,
      });

      this.cancelFix();
      if(this.fms.currentWaypoint().navmode == "rwy")
        this.cancelLanding();

      if(this.isTakeoff())
        return ["ok", "after departure, will circle towards the " + this.fms.currentWaypoint().turn];

      return ["ok", "circling towards the " + this.fms.currentWaypoint().turn + " at " + this.fms.currentWaypoint().altitude + " feet"];
    },
    runDirect: function(data) {
      if(data.length == 0) {
        return ["fail", "fix name not understood"];
      }

      var fixname = data.toUpperCase(),
          fix = airport_get().getFix(fixname);

      if (!fix) {
        return ["fail", "no fix found with name of " + fixname, "say again"];
      }

      // can issue this command if not in fix mode, then will run exactly as with "fix"
      // or with multiple fixes, then the sequence is rewritten
      if (this.fms.currentWaypoint().navmode != "fix" || fixname.indexOf(' ').length > 0) {
        return this.runFix(data);
      }

      var fix_pos = this.fms.skipToWaypoint(fixname);
      if (fix_pos == -1) {
        return ["fail", "not navigating to fix " + fixname];
      }

      if (fix_pos == 0) {
        return ["fail", "already going to "+ fixname];
      }

      return ["ok", "cleared direct " + fixname];
    },
    runFix: function(data) {
      if(data[0] == ".") { //shortkey '.' in use
        data = data.substr(1);  //remove shortKey
      }
      if(data.length == 0) {
        return ["fail", "fix name not understood", "say again"];
      }

      data = data.toUpperCase().split(/\s+/);
      
      var last_fix, fail,  
          fixes = $.map(data, function(fixname) {
            var fix = airport_get().getFix(fixname);
            if(!fix) {
              fail = ["fail", "no fix found with name of " + fixname, "say again"];
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

      return ["ok", "navigate to " + fixes.join(', ')];
    },
    runSID: function(data) {
      if(this.category != "departure") {
        return ["fail", "inbound", "over"];
      }
      if(data.length == 0) {
        return ["fail", "SID name not understood", "say again"];
      }
      
      var sid_name = data.toUpperCase(),
          fixes = airport_get().getSID(sid_name);
      
      if(!fixes) {
        return ["fail", "no SID found with name of " + sid_name, "say again"];
      }
      
      this.cancelFix();
      this.fms.setFixes(fixes);

      return ["ok", "cleared to destination via " + sid_name];
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
        this.fms.addWaypoint({
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

      if(this.mode == "taxi") return ["fail", "already taxiing to " + radio_runway(this.fms.currentWaypoint().runway), "over"];

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

      return ["ok", "taxi to runway " + radio_runway(this.fms.currentWaypoint().runway)];
    },
    
    runTakeoff: function(data) {
      if(this.category != "departure") return ["fail", "inbound", "over"];

      if(!this.isLanded()) return ["fail", "already airborne", "over"];
      if(this.mode =="apron") return ["fail", "no runway selected. taxi first", "over"];
      if(this.mode == "taxi") return ["fail", "taxi to runway " + radio_runway(this.fms.currentWaypoint().runway) + " not yet complete", "over"];

      if(this.fms.currentWaypoint().altitude <= 0) return ["fail", "no altitude clearance assigned", "over"];

      var runway = airport_get().getRunway(this.fms.currentWaypoint().runway);

      if(runway.removeQueue(this, this.fms.currentWaypoint().runway)) {
        this.mode = "takeoff";
        prop.game.score.windy_takeoff += this.scoreWind('taking off');
        this.takeoffTime = game_time();

        if(this.fms.currentWaypoint().heading == null)
          this.fms.setCurrent({heading: runway.getAngle(this.fms.currentWaypoint().runway)});
        //
        var wind = airport_get().getWind();
        var wind_dir = round(degrees(wind.angle));
        return ["ok", "winds " + wind_dir + " at " + round(wind.speed) +
            " knots, runway " + radio_runway(this.fms.currentWaypoint().runway) + " cleared for takeoff"];
      } else {
        var waiting = runway.isWaiting(this, this.fms.currentWaypoint().runway);
        return ["fail", "number "+waiting+" behind "+runway.waiting[runway.getEnd(this.fms.currentWaypoint().runway)][waiting-1].getRadioCallsign(), ""];
      }

    },
    runLanding: function(data) {
      if(data[0] == "\u2B50") { //shortkey '*' in use
        data = data.substr(1);  //remove shortKey
      }

      var runway = airport_get().getRunway(data);
      if(!runway) {
        if(!data) return ["fail", "runway not understood", "say again"];
        else      return ["fail", "no runway " + radio_runway(data), "say again"];
      }

      if(this.fms.currentWaypoint().runway == data.toUpperCase()) {
        return ["fail", "already landing on runway " + radio_runway(data), "over"];
      }
      this.cancelFix();
      this.fms.setCurrent({
        navmode: "rwy",
        runway: data.toUpperCase(),
        turn: null,
        start_speed: this.speed,
      });

      var wind = airport_get().getWind();
      var wind_dir = round(degrees(wind.angle));
      return ["ok", "winds " + wind_dir + " at " + round(wind.speed) +
          " knots, runway " + radio_runway(this.fms.currentWaypoint().runway) + " cleared to land" ];
    },
    runAbort: function(data) {
      if(this.mode == "taxi") {
        this.mode = "apron";
        this.taxi_start = 0;
        console.log("aborted taxi to runway");
        ui_log(true, this.getCallsign() + " aborted taxi to runway");
        prop.game.score.abort.taxi += 1;
        return ["ok", "taxi back to terminal"];
      } else if(this.mode == "waiting") {
        return ["fail", "cannot taxi back to terminal"];
      } else if(this.mode == "landing") {
        this.cancelLanding();
        return ["ok", "go around, hold heading " + heading_to_string(this.fms.currentWaypoint().heading) + " at " + this.fms.currentWaypoint().altitude + " feet"];
      } else if(this.mode == "cruise" && this.fms.currentWaypoint().navmode == "rwy") {
        this.cancelLanding();
        return ["ok", "continue along heading " + heading_to_string(this.fms.currentWaypoint().heading) + " at " + this.fms.currentWaypoint().altitude + " feet"];
      } else if(this.mode == "cruise" && this.fms.currentWaypoint().navmode == "fix") {
        this.cancelFix();
        return ["ok", "maintain heading " + heading_to_string(this.fms.currentWaypoint().heading) + " at " + this.fms.currentWaypoint().altitude + " feet"];
      } else { //modes "apron", "takeoff", ("cruise" for some navmodes)
        return ["fail", "nothing to abort"];
      }

    },
    runDebug: function(data) {

      if(data == "log") {
        window.aircraft = this;
        return ["ok", "in the console, look at the variable &lsquo;aircraft&rsquo;", "over"];
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
            heading: runway.getAngle(this.fms.currentWaypoint().runway),
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
     * aircraft is stable on the approach centerline
     */
    isEstablished: function() {
      if (this.mode != "landing")
        return false;
      return (this.approachOffset <= 0.048); // 160 feet or 48 meters
    },

    isLanded: function() {
      if(this.altitude < 5) return true;
    },
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

      var angle   =  abs(angle_offset(runway.getAngle(this.fms.currentWaypoint().runway), wind.angle));

      return {
        cross: Math.sin(angle) * wind.speed,
        head: Math.cos(angle) * wind.speed
      };
    },
    radioCall: function(msg, alert) {
      if (this.projected) return;
      var call = airport_get().radio + " tower, " +
        this.getRadioCallsign() + " " +msg;
      if (alert)
        ui_log(true, call);
      else
        ui_log(call);
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
      $("#strips").append(this.html);
      this.html.show(600);
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

        offset = runway.getOffset(this.position, this.fms.currentWaypoint().runway, true);

        offset_angle = vradial(offset);
        
        this.offset_angle = offset_angle;

        this.approachOffset = abs(offset[0]);
        this.approachDistance = offset[1];

        angle = runway.getAngle(this.fms.currentWaypoint().runway);
        if (angle > (2*Math.PI)) angle -= 2*Math.PI;

        var landing_zone_offset = crange(1, runway.length, 5, 0.1, 0.5);

        glideslope_altitude = clamp(0, runway.getGlideslopeAltitude(offset[1] + landing_zone_offset, this.fms.currentWaypoint().runway), this.altitude);
        glideslope_window   = abs(runway.getGlideslopeAltitude(offset[1] + landing_zone_offset, this.fms.currentWaypoint().runway, radians(1)));

        if(this.mode == "landing")
          this.target.altitude = glideslope_altitude;

        var ils = runway.getILSDistance(this.fms.currentWaypoint().runway);
        if(!runway.getILS(this.fms.currentWaypoint().runway) || !ils) ils = 40;

        // lock  ILS if at the right angle and altitude
        if ((abs(this.altitude - glideslope_altitude) < glideslope_window)
            && (abs(offset_angle) < radians(10))
            && (offset[1] < ils)) {
          //plane is on the glide slope
          if(this.mode != "landing") {
            this.mode = "landing";
            if (!this.projected &&
                (abs(angle_offset(this.fms.currentWaypoint().heading, angle)) > radians(30)))
            {
              ui_log(true,
                     this.getRadioCallsign() +
                       " landing intercept vector was greater than 30 degrees");
              prop.game.score.violation += 1;
            }
            this.updateStrip();
            this.fms.setCurrent({
              turn: null,
              heading: angle,
            });
            this.target.turn = null;
          }

          // Steer to within 3m of the centerline while at least 200m out
          if(offset[1] > 0.2 && abs(offset[1]) > 0.003) {
            this.target.heading = clamp(radians(-30),
                                        -12 * offset_angle,
                                        radians(30)) + angle;
          } else {
            this.target.heading = angle;
          }

          var s = this.target.speed;

          this.target.altitude     = glideslope_altitude;
          if(this.fms.currentWaypoint().speed > 0)
            this.fms.setCurrent({start_speed: this.fms.currentWaypoint().speed});
          this.target.speed        = crange(3, offset[1], 10, this.model.speed.landing, this.fms.currentWaypoint().start_speed);
        } else if(this.altitude >= 300 && this.mode == "landing") {
          this.updateStrip();
          this.cancelLanding();
          if (!this.projected)
          {
            ui_log(true,
                   this.getRadioCallsign() + " aborting landing, lost ILS");
            prop.game.score.abort.landing += 1;
          }
        } else {
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
//          ui_log(this.getRadioCallsign() + " passed over " + this.fms.currentWaypoint().name.toUpperCase() + ", will maintain heading " + heading_to_string(this.fms.currentWaypoint().heading) + " at " + this.fms.currentWaypoint().altitude + " feet");
          if(this.fms.waypoints.length > 1)
            this.fms.nextWaypoint();
          else
            this.cancelFix();
          this.updateStrip();
        } else {
          this.target.heading = vradial(vector_to_fix) - Math.PI;
          this.target.turn = null;
        }
      } else if(this.fms.currentWaypoint().navmode == "hold") {
        if(this.fms.currentWaypoint().turn == "right") {
          this.target.heading = this.heading + Math.PI/4;
        } else if(this.fms.currentWaypoint().turn == "left") {
          this.target.heading = this.heading - Math.PI/4;
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
        var position = runway.getPosition(this.fms.currentWaypoint().runway);

        this.position[0] = position[0];
        this.position[1] = position[1];
        this.heading     = runway.getAngle(this.fms.currentWaypoint().runway);

        if (!this.projected &&
            (runway.isWaiting(this, this.fms.currentWaypoint().runway) == 0) &&
            (was_taxi == true))
        {
          ui_log(this.getRadioCallsign(), "ready for departure runway "+radio_runway(this.fms.currentWaypoint().runway));
          this.updateStrip();
        }
      }

      if(this.mode == "takeoff") {
        var runway = airport_get().getRunway(this.fms.currentWaypoint().runway);

        this.target.heading = runway.getAngle(this.fms.currentWaypoint().runway);

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
        var expedite_factor = 1.7;
        this.trend = 0;
        if(this.target.altitude < this.altitude - 0.02) {
          distance = -this.model.rate.descent * game_delta() / expedite_factor;
          if(this.mode == "landing") distance *= 3;
          this.trend -= 1;
        } else if(this.target.altitude > this.altitude + 0.02) {
          distance =  this.model.rate.ascent  * game_delta() / expedite_factor;
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
          vector = vsum(vscale(vturn(wind.angle + Math.PI),
                               wind.speed * 0.000514444 * game_delta()),
                        vscale(vturn(angle + crab_angle),
                               scaleSpeed));
        }
        this.ds = vlen(vector);
        this.groundSpeed = this.ds / 0.000514444 / game_delta();
        this.groundTrack = vradial(vector);
        this.position = vsum(this.position, vector);
      }
      else {
        this.ds = scaleSpeed;
        this.groundSpeed = this.speed;
        this.groundTrack = this.heading;
        this.position = vsum(this.position, vscale([sin(angle), cos(angle)], scaleSpeed));
      }

      this.distance = vlen(this.position);
      this.radial = vradial(this.position);
      if (this.radial < 0) this.radial += Math.PI*2;

      var inside = (this.distance <= airport_get().ctr_radius &&
                    this.altitude <= airport_get().ctr_ceiling);
      if (inside != this.inside_ctr)
        this.crossBoundary(inside);

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
      var speed    = this.html.find(".speed");

      heading.removeClass("runway hold waiting taxi");
      altitude.removeClass("runway hold");
      speed.removeClass("runway");

      if(this.fms.currentWaypoint().runway) {
        heading.addClass("runway");
        heading.text(this.fms.currentWaypoint().runway);

        speed.text(this.fms.currentWaypoint().speed);

        if(this.category == "arrival") {
          if(this.mode == "landing") {
            altitude.text("ILS locked");
            altitude.addClass("runway");

            speed.text("-");
            speed.addClass("runway");
          } else {
            altitude.text("no ILS");
            altitude.addClass("hold");
          }
        } else {
          if(this.mode == "apron") {
            heading.text("apron");

            altitude.text("ready");
            altitude.addClass("runway");

            speed.text("-");
            speed.addClass("runway");
          } else if(this.mode == "taxi") {
            altitude.text("taxi");
            altitude.addClass("runway");

            if(this.taxi_next) {
              altitude.text("waiting");
            }

            speed.text("-");
            speed.addClass("runway");
          } else if(this.mode == "waiting") {
            altitude.text("waiting");
            altitude.addClass("runway");

            speed.text("-");
            speed.addClass("runway");
          } else if(this.mode == "takeoff") {
            altitude.text(this.fms.currentWaypoint().altitude);

            speed.text(this.fms.currentWaypoint().speed);
          }
        }
      } else {
        heading.text(heading_to_string(this.fms.currentWaypoint().heading));
        altitude.text(this.fms.currentWaypoint().altitude);
        speed.text(this.fms.currentWaypoint().speed);
      }

      if(this.fms.currentWaypoint().navmode == "fix") {
        heading.text(this.fms.currentWaypoint().name);
        heading.addClass("hold");
      } else if(this.fms.currentWaypoint().navmode == "hold") {
        heading.text("hold "+this.fms.currentWaypoint().turn);
        heading.addClass("hold");
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
  //ATR
  aircraft_load("at43");
  aircraft_load("at72");

  // CESSNA
  aircraft_load("c172");
  aircraft_load("c182");
  aircraft_load("c208");
  aircraft_load("c337");
  aircraft_load("c510");
  aircraft_load("c550");
  aircraft_load("c750");

  // ANTONOV
  aircraft_load("a124");
  aircraft_load("an12");
  aircraft_load("an24");
  aircraft_load("an72");

  // AIRBUS
  aircraft_load("a306");
  aircraft_load("a318");
  aircraft_load("a319");
  aircraft_load("a320");
  aircraft_load("a321");
  aircraft_load("a332");
  aircraft_load("a333");

  aircraft_load("a343");
  aircraft_load("a346");

  aircraft_load("a388");

  // BOEING
  aircraft_load("b733");
  aircraft_load("b734");
  aircraft_load("b735");
  aircraft_load("b736");
  aircraft_load("b737");
  aircraft_load("b738");
  aircraft_load("b739");

  aircraft_load("b744");
  aircraft_load("b748");


  aircraft_load("b752");
  aircraft_load("b753");

  aircraft_load("b762");
  aircraft_load("b763");
  aircraft_load("b764");

  aircraft_load("b772");
  aircraft_load("b77e");
  aircraft_load("b773");
  aircraft_load("b77w");
  aircraft_load("b788");

  // EMBRAER
  aircraft_load("e110");
  aircraft_load("e120");
  aircraft_load("e170");
  aircraft_load("e50p");
  aircraft_load("e55p");
  aircraft_load("e135");
  aircraft_load("e545");
  aircraft_load("e190");

  // CONCORDE...
  aircraft_load("conc");

  // DOUGLAS
  aircraft_load("md11");
	aircraft_load("dc10");

 // FOKKER
	aircraft_load("f100");


  // MISC
  aircraft_load("be36");
  aircraft_load("c130");
  aircraft_load("c5");
  aircraft_load("il76");
  aircraft_load("il96");
  aircraft_load("l410");
  aircraft_load("p28a");
  aircraft_load("t154");
  aircraft_load("t204");
  aircraft_load("rj85");
  aircraft_load("c130");
  aircraft_load("c5");
  aircraft_load("dh8d");
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
  var hit = false;
  while(true) {
    var callsign = aircraft_generate_callsign(airline);
    hit=false;
    for(var i=0;i<prop.aircraft.callsigns.length;i++) {
      if(prop.aircraft.callsigns[i] == callsign) {
        callsign = aircraft_callsign_new(airline);
        hit=true;
        break;
      }
    }
    if(!hit) break;
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

      // Fast 2D bounding box check, there are no conflicts over 10km apart
      // no violation can occur in this case.
      // Variation of:
      // http://gamedev.stackexchange.com/questions/586/what-is-the-fastest-way-to-work-out-2d-bounding-box-intersection
      var dx = Math.abs(that.position[0] - other.position[0]);
      var dy = Math.abs(that.position[1] - other.position[1]);
      if ((dx > 10) || (dy > 10)) {
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
      ui_log(aircraft.getRadioCallsign() + " switching to ground, good day");
      prop.game.score.arrival += 1;
      console.log("arriving aircraft no longer moving");
      remove = true;
    }
    if(aircraft.hit && aircraft.isLanded()) {
      ui_log("Lost radar contact with "+aircraft.getCallsign());
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
      prop.aircraft.list.splice(i, 1);
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
