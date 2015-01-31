
var Model=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};

      this.name = null;
      this.icao = null;

      this.wake = null;

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
      }

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

      if(data.wake) this.wake = data.wake;

      if(data.rate) {
        this.rate         = data.rate;
        this.rate.ascent  = this.rate.ascent  / 60;
        this.rate.descent = this.rate.descent / 60;
        this.rate.turn    = radians(this.rate.turn);
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

      this.trend       = 0;

      this.history     = [];

      this.notice      = false;
      this.warning     = false;
      this.hit         = false;

      this.taxi_next     = false;
      this.taxi_start    = 0;
      this.taxi_delay    = 0;

      this.rules       = "ifr";

      this.inside_ctr = false;

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


      //requested represents the actual commands received by the tower. These
      //may be a heading, a fix and so on
      this.requested = {
        navmode:  null, // null, "fix", "heading", "hold", "rwy"
                        // where:
                        //  - null is assigned, if the plane is not actively
                        //    following an objective. This is only the case, if
                        //    a plane enters the airspace or an action has been
                        //    aborted and no new command issued
                        //  - "fix" is assigned, if the plane is heading for a
                        //    fix. In this case, the attribute request.fix is
                        //    used for navigation
                        //  - "heading" is assigned, if the plane was given
                        //    directive to follow the course set out by the
                        //    given heading. In this case, the attributes
                        //    request.heading and request.turn are used for
                        //    navigation
                        //  - "hold" is assigned, if the plane should hold its
                        //    position. As this is archieved by continuously
                        //    turning, request.turn is used in this case
                        //  - "rwy" is assigned, if the plane is heading for a
                        //    runway. This is only the case, if the plane was
                        //    issued the command to land. In this case,
                        //    request.runway is used
        heading:  null,
        turn:     null, // null, "left", or right"
        fix:      [],
        altitude: 0,
        expedite: false,
        speed:    0,
        runway:   null,
        start_speed: 0
      };

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

      this.emergency = {

      };

      this.parse(options);

      this.html = $("<li class='strip'></li>");

      this.html.append("<span class='callsign'>" + this.getCallsign() + "</span>");
      this.html.append("<span class='heading'>" + round(this.heading) + "</span>");
      this.html.append("<span class='altitude'>-</span>");
      this.html.append("<span class='aircraft'>" + this.model.icao + "</span>");
      this.html.append("<span class='speed'>-</span>");

      this.html.find(".aircraft").prop("title", this.model.name);

      if(this.category == "arrival") {
        this.html.addClass("arrival");
        this.html.prop("title", "Scheduled for arrival");
      } else {
        this.html.addClass("departure");
        this.html.prop("title", "Scheduled for departure");
      }

      if(options.message) {
        if(this.category == "arrival" && aircraft_visible(this) && !this.inside_ctr) {
          var position = "";
          var distance = round(distance2d([0, 0], this.position) * 0.62);
          position += distance + " mile" + s(distance);
          var angle = Math.atan2(this.position[0], this.position[1]);
          position += " " + radio_compass(compass_direction(angle));
          ui_log(airport_get().radio+" tower, "+aircraft.getRadioCallsign()+" in your airspace "+position+", over");
          this.inside_ctr = true;
        } else if(this.category == "departure") {
          ui_log(airport_get().radio + ', ' + this.getRadioCallsign() + ", request taxi");
        }
      }

      $("#strips").append(this.html);

      this.html.click(this, function(e) {
        input_select(e.data.getCallsign());
      });

    },
    cleanup: function() {
      this.html.remove();
    },
    matchCallsign: function(callsign) {
      callsign = callsign.toLowerCase();
      var this_callsign = this.getCallsign().toLowerCase();
      if(this_callsign.indexOf(callsign) == 0) return true;
      return false;
    },
    getCallsign: function() {
      return (this.getAirline() + this.callsign).toUpperCase();
    },
    getAirline: function() {
      var icao = airline_get(this.airline).icao;
      if(icao) return icao;
      return this.airline.toUpperCase();
    },
    getRadioCallsign: function(condensed) {
      var heavy = "";
      if(this.model.wake == "heavy") heavy = " heavy"
      if(this.model.wake == "super") heavy = " super"
      var callsign = this.callsign;
      if(condensed) {
        var length = 2;
        callsign = callsign.substr(callsign.length - length);
      }
      return airline_get(this.airline).callsign.name + " " + radio(callsign.toUpperCase()) + heavy;
    },
    COMMANDS: [
      "turn",
      "heading",

      "altitude",
      "climb",
      "clear",
      "descend",

      "speed",
      "slow",

      "hold",
      "circle",

      "fix",
      "track",
      "direct",

      "takeoff",
      "to",

      "wait",
      "taxi",

      "land",

      "abort",

      "debug"
    ],
    runCommand: function(command) {
      var s        = command.toLowerCase().split(" ")

      var strings  = [];

      for(var i=0;i<s.length;i++) {
        if(s[i]) strings.push(s[i]);
      }

      var commands = [];
      var concat   = false;
      var current  = "";
      var previous = "";

      for(var i=0;i<strings.length;i++) {
        var string = strings[i];
        var is_command = false;
        
        if(previous.indexOf("t") == 0 && (string.indexOf("l") == 0 || string.indexOf("r") == 0)) {
          // Workaround:
          // Previous command was probably "t/turn".
          // Must be followed by either a direction or a heading, so no command.
          //
          // As it also may be "to/takeoff", we also check that the current command
          // is "l/left" or "r/right" to hopefully prevent side-effects.
          //
          // If this would not be checked here, it would not be possible to use "l"
          // as a shortcut for "left", as it would be recognized as the command "land".
          //
          // Do nothing here.
        } else {
          for(var j=0;j<this.COMMANDS.length;j++) {
            if(this.COMMANDS[j].indexOf(string) == 0) {
              is_command = true;
              break;
            }
          }
        }

        if(!is_command) {
          current += " " + string;
        } else {
          if(current) {
            current = current.substr(1);
            if(commands.length != 0) {
              commands[commands.length-1].push(current);
            }
            current = "";
          }
          commands.push([string]);
        }

        previous = string;
      }
      if(current && commands.length >= 1) {
        current = current.substr(1);
        commands[commands.length-1].push(current);
        current = "";
      }

      var response = [];
      var response_end = "";

      var deferred = [];

      var DEFERRED_COMMANDS = ["takeoff", "to"];

      for(var i=0;i<commands.length;i+=1) {
        var pair    = commands[i];

        var command = pair[0];
        var data    = "";
        if(pair.length == 2) data = pair[1];

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

      if("turn".indexOf(command) == 0)          command = "heading";
      else if("heading".indexOf(command) == 0)  command = "heading";

      else if("altitude".indexOf(command) == 0) command = "altitude";
      else if("climb".indexOf(command) == 0)    command = "altitude";
      else if("clear".indexOf(command) == 0)    command = "altitude";
      else if("descend".indexOf(command) == 0)  command = "altitude";

      else if("slow".indexOf(command) == 0)     command = "speed";
      else if("speed".indexOf(command) == 0)    command = "speed";

      else if("hold".indexOf(command) == 0)     command = "hold";
      else if("circle".indexOf(command) == 0)   command = "hold";

      else if("wait".indexOf(command) == 0)     command = "wait";
      else if("taxi".indexOf(command) == 0)     command = "wait";

      else if("takeoff".indexOf(command) == 0)  command = "takeoff";
      else if("to".indexOf(command) == 0)       command = "takeoff";

      else if("land".indexOf(command) == 0)     command = "land";

      else if("fix".indexOf(command) == 0)      command = "fix";
      else if("track".indexOf(command) == 0)    command = "fix";
      else if("direct".indexOf(command) == 0)   command = "fix";

      else if("abort".indexOf(command) == 0)    command = "abort";

      else if("debug".indexOf(command) == 0)    command = "debug";

      else return ["fail", "not understood", "say again"];

      if(command == "heading")
        return this.runHeading(data);
      else if(command == "altitude")
        return this.runAltitude(data);
      else if(command == "speed")
        return this.runSpeed(data);
      else if(command == "hold")
        return this.runHold(data);
      else if(command == "fix")
        return this.runFix(data);
      else if(command == "wait")
        return this.runWait(data);
      else if(command == "takeoff")
        return this.runTakeoff(data);
      else if(command == "land")
        return this.runLanding(data);
      else if(command == "abort")
        return this.runAbort(data);
      else if(command == "debug")
        return this.runDebug(data);

    },
    runHeading: function(data) {
      var split     = data.split(" ");

      var heading   = parseInt(split[0]);
      var direction = null;

      if(split.length == 0) return ["fail", "heading not understood", "say again"];

      if(split.length >= 2) {
        direction = split[0];
        heading = parseInt(split[1]);
      }

      // translate any direction that starts with "l" or "r" to left/right
      if(direction != null) {
        if(direction.indexOf("l") == 0) direction = "left";
        if(direction.indexOf("r") == 0) direction = "right";
      }

      if(isNaN(heading)) return ["fail", "heading not understood", "say again"];

      if(this.requested.navmode == "rwy")
        this.cancelLanding();
      this.cancelFix();

      this.requested.navmode = "heading";
      this.requested.heading = radians(heading);
      this.requested.turn    = direction;
      this.requested.hold    = false;

      if(direction == null) direction  = "";
      else                    direction += " ";

      if(this.isTakeoff())
        return ['ok', 'after departure, turn ' + direction + 'heading ' + heading_to_string(this.requested.heading), ''];

      return ['ok', 'turn ' + direction + 'heading ' + heading_to_string(this.requested.heading), ''];
    },
    runAltitude: function(data) {
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
          this.requested.expedite = true;
          if(this.isTakeoff())
            return ['ok', 'after departure, ' + radio_trend('altitude', this.altitude, this.requested.altitude) + " " + this.requested.altitude + ' expedite'];

          return ['ok', radio_trend('altitude', this.altitude, this.requested.altitude) + " " + this.requested.altitude + ' expedite'];
        }
        return ["fail", "altitude not understood", "say again"];
      }

      if(this.mode == "landing")
        this.cancelLanding();

      var factor = 1;
      if(data.length <= 2) factor = 1000;

      this.requested.altitude = clamp(1000, altitude * factor, 10000);
      this.requested.expedite = expedite;

      if(expedite) expedite = " expedite";
      else         expedite = "";

      if(this.isTakeoff())
        return ['ok', 'after departure, ' + radio_trend('altitude', this.altitude, this.requested.altitude) + ' ' + this.requested.altitude + expedite];

      return ['ok', radio_trend('altitude', this.altitude, this.requested.altitude) + ' ' + this.requested.altitude + expedite];
    },
    runSpeed: function(data) {
      var speed = parseInt(data);

      if(isNaN(speed)) return ["fail", "speed not understood", "say again"];

//      if(this.mode == "landing")
//        this.cancelLanding();

      this.requested.speed = clamp(this.model.speed.min, speed, this.model.speed.max);

      return ["ok", radio_trend("speed", this.speed, this.requested.speed) + " " + this.requested.speed + " knots"];

    },
    runHold: function(data) {
      if("left".indexOf(data) == 0 && data.length >= 1) this.requested.turn = "left";
      else if("right".indexOf(data) == 0 && data.length >= 1) this.requested.turn = "right";
      else return ["fail", "hold direction not understood", "say again"];

      this.requested.navmode = "hold";

      this.cancelFix();
      if(this.mode == "landing")
        this.cancelLanding();

      if(this.isTakeoff())
        return ["ok", "after departure, will circle towards the " + this.requested.turn];

      return ["ok", "circling towards the " + this.requested.turn + " at " + this.requested.altitude + " feet"];
    },
    runFix: function(data) {
      if(data.length == 0) {
        return ["fail", "fix name not understood", "say again"];
      }

      this.cancelFix();
      if(this.mode != "waiting" && this.mode != "takeoff" && this.mode != "apron" && this.mode != "taxi"){
        this.cancelLanding();
      }

      data = data.split(/\s+/);

      for(var i=0;i<data.length;i++) {
        var fix = airport_get().getFix(data[i]);

        if(!fix) {
          this.requested.fix = [];
          return ["fail", "no fix found with name of " + data[i].toUpperCase(), "say again"];
        }

        if(i == 0) {
          this.requested.fix = [];
          this.requested.navmode = "fix";
        }

        this.requested.fix.push(data[i].toUpperCase());

      }

      return ["ok", "navigate to " + this.requested.fix.join(', ')];
    },
    runWait: function(data) {
      if(this.category != "departure") return ["fail", "inbound"];

      if(this.mode == "taxi") return ["fail", "already taxiing to " + radio_runway(this.requested.runway), "over"];

      if(this.mode == "waiting") return ["fail", "already waiting"];

      if(this.mode != "apron") return ["fail", "wrong mode"];

      if(data) {
        if(!airport_get().getRunway(data.toUpperCase())) return ["fail", "no runway " + data.toUpperCase()];
        this.selectRunway(data);
      }

      var runway = airport_get().getRunway(this.requested.runway);

      runway.addQueue(this, this.requested.runway);

      this.mode = "taxi";
      this.taxi_start = game_time();

      return ["ok", "taxi to runway " + radio_runway(this.requested.runway)];
    },
    runTakeoff: function(data) {
      if(this.category != "departure") return ["fail", "inbound", "over"];

      if(!this.isLanded()) return ["fail", "already airborne", "over"];
      if(this.mode =="apron") return ["fail", "no runway selected. taxi first", "over"];
      if(this.mode == "taxi") return ["fail", "taxi to runway " + radio_runway(this.requested.runway) + " not yet complete", "over"];

      if(this.requested.altitude <= 0) return ["fail", "no altitude clearance assigned", "over"];

      var runway = airport_get().getRunway(this.requested.runway);

      if(runway.removeQueue(this, this.requested.runway)) {
        this.mode = "takeoff";
        var wind_score = -Math.min(this.getWind(), 0)
        prop.game.score.windy_takeoff += wind_score;
        if(wind_score)
          ui_log(true, this.getCallsign() + ' taking off with a tailwind');
        if(this.requested.heading == null)
          this.requested.heading = runway.getAngle(this.requested.runway) + Math.PI;
        return ["ok", "cleared for takeoff", ""];
      } else {
        var waiting = runway.isWaiting(this, this.requested.runway);
        return ["fail", "number "+waiting+" behind "+runway.waiting[runway.getEnd(this.requested.runway)][waiting+1].getRadioCallsign(), ""];
      }

    },
    runLanding: function(data) {
      var runway = airport_get().getRunway(data);

      if(!runway) {
        if(!data) return ["fail", "runway not understood", "say again"];
        else      return ["fail", "no runway " + radio_runway(data), "say again"];
      }

      if(this.requested.runway == data.toUpperCase()) {
        return ["fail", "already landing on runway " + radio_runway(data), "over"];
      }

      this.requested.navmode = "rwy";
      this.requested.runway = data.toUpperCase();
      this.requested.turn   = null;
      //this.requested.speed  = null;

      this.requested.start_speed = this.speed;

      this.cancelFix();

      return ["ok", "land runway " + radio_runway(data) + " at " + airport_get().radio];

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
        return ["ok", "go around, hold heading " + heading_to_string(this.requested.heading) + " at " + this.requested.altitude + " feet"];
      } else if(this.mode == "cruise" && this.requested.navmode == "rwy") {
        this.cancelLanding();
        return ["ok", "continue along heading " + heading_to_string(this.requested.heading) + " at " + this.requested.altitude + " feet"];
      } else if(this.mode == "cruise" && this.requested.navmode == "fix") {
        this.cancelFix();
        return ["ok", "maintain heading " + heading_to_string(this.requested.heading) + " at " + this.requested.altitude + " feet"];
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
      if(this.requested.navmode == "fix") {
        this.requested.fix = []
        this.requested.heading = round(this.heading);
        this.updateStrip();
        this.requested.navmode = "heading";
        return true;
      }
      return false;
    },
    cancelLanding: function() {
      if(this.requested.navmode == "rwy") {
        var runway = airport_get().getRunway(this.requested.runway);
        if(this.mode == "landing") {
          this.requested.altitude = Math.max(2000, round((this.altitude / 1000)) * 1000);
          this.requested.heading = runway.getAngle(this.requested.runway) + Math.PI;
        }

        if(distance2d(runway.position, this.position) < 10) {
          console.log("aborted landing");
          ui_log(true, this.getCallsign() + " aborted landing");
          prop.game.score.abort.landing += 1;
        }

        this.requested.navmode = null;
        this.mode = "cruise";
        this.updateStrip();
        this.requested.runway = null;
        return true;
      } else {
        this.requested.runway = null;
        return false;
      }
    },
    parse: function(data) {
      if(data.position) this.position = data.position;

      if(data.model) this.model = data.model;

      if(data.airline)  this.airline = data.airline;
      if(data.callsign) this.callsign = data.callsign;

      if(data.category) this.category = data.category;

      if(!data.speed) data.speed = this.model.speed.cruise;

      if(data.heading)  this.heading = data.heading;
      if(data.altitude) this.altitude = data.altitude;
      if(data.speed)    this.speed = data.speed;

      if(data.heading)  this.requested.heading = data.heading;
      if(data.altitude) this.requested.altitude = data.altitude;
      if(data.speed)    this.requested.speed = data.speed;
      else              this.requested.speed = this.model.speed.cruise;

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
        this.requested.runway = airport_get().selectRunway(this.model.runway.takeoff).toUpperCase();
        if(!this.requested.runway) return;
      } else {
        this.requested.runway = runway.toUpperCase();
      }
      this.taxi_delay = airport_get().getRunway(this.requested.runway).taxiDelay(this.requested.runway);
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
    isLanded: function() {
      if(this.altitude < 5) return true;
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
      if(!this.requested.runway) return false;
      var runway = airport_get().getRunway(this.requested.runway);
      var waiting = runway.isWaiting(this, this.requested.runway);
      if(this.isTaxiing()) {
        if(this.mode == "waiting" && waiting == 0)
          return true;
        return false;
      }
      return true;
    },
    getWind: function() {
      if(!this.requested.runway) return 0;
      var airport = airport_get();
      var wind    = airport.wind;
      var runway  = airport.getRunway(this.requested.runway);

      var angle   =  abs(angle_offset(runway.getAngle(this.requested.runway), wind.angle));
      var head    =  crange(0, angle, Math.PI, -1, 1);

      angle       =  abs(angle_offset(runway.getAngle(this.requested.runway) - Math.PI/2, wind.angle));
      var cross   = -abs(crange(0, angle, Math.PI, 1, -1)) * 1.5;
      return (cross + head) * wind.speed;
    },
    updateTarget: function() {
      var airport = airport_get();
      var runway  = null;

      var offset = null;

      var offset_angle = null;

      var glideslope_altitude = null;
      var glideslope_window   = null;

      var angle = null;

      if(this.requested.altitude > 0) this.requested.altitude = Math.max(1000, this.requested.altitude);

      if(this.requested.navmode == "rwy") {
        airport = airport_get();
        runway  = airport.getRunway(this.requested.runway);

        offset = runway.getOffset(this.position, this.requested.runway, true);

        offset_angle = Math.atan2(offset[0], offset[1]);

        this.offset_angle = offset_angle;

        angle = runway.getAngle(this.requested.runway) + Math.PI;

        var landing_zone_offset = crange(1, runway.length, 5, 0.1, 0.5);

        glideslope_altitude = clamp(0, runway.getGlideslopeAltitude(offset[1] + landing_zone_offset, this.requested.runway), this.altitude);
        glideslope_window   = abs(runway.getGlideslopeAltitude(offset[1] + landing_zone_offset, this.requested.runway, radians(1)));

        if(this.mode == "landing")
          this.target.altitude = glideslope_altitude;

        var ils = runway.getILSDistance(this.requested.runway);
        if(!runway.getILS(this.requested.runway) || !ils) ils = 40;

        // lock  ILS if at the right angle and altitude
        if(abs(this.altitude - glideslope_altitude) < glideslope_window && abs(offset_angle) < radians(30) && offset[1] < ils) {
          //plane is on the glide slope
          var m = false;
          if(this.mode != "landing") m=true;
          this.mode = "landing";
          if(m) {
            this.updateStrip();
            this.requested.turn = null;
          }

          if(offset[1] > 0.01) {
            var xoffset = crange(0.7, this.model.rate.turn, 5, 7, 1);
            xoffset    *= crange(this.model.speed.landing, this.speed, this.model.speed.cruise, 0.7, 1);
            this.target.heading = crange(-xoffset, offset[0], xoffset, radians(45), -radians(45)) + angle;
          } else {
            this.target.heading = angle;
          }

          var s = this.target.speed;

          this.target.altitude     = glideslope_altitude;
          if(this.requested.speed > 0) this.requested.start_speed = this.requested.speed;
          this.target.speed        = crange(3, offset[1], 10, this.model.speed.landing, this.requested.start_speed);
        } else if(this.altitude >= 300 && this.mode == "landing") {
          this.updateStrip();
          this.cancelLanding();
          ui_log(this.getRadioCallsign() + " aborting landing, lost ILS");
          if(distance2d(runway.position, this.position) < 10) {
            console.log("aborted landing after ILS lost");
            prop.game.score.abort.landing += 1;
          }
        }

        //this has to be outside of the glide slope if, as the plane is no
        //longer on the glide slope once it is on the runway (as the runway is
        //behind the ILS marker)
        if(this.altitude < 10) {
          if(s > 10) {
            prop.game.score.windy_landing += -Math.min(this.getWind(), 0);
          }
          this.target.speed = 0;
        }
      } else if(this.requested.navmode == "fix") {
        var fix = airport_get().getFix(this.requested.fix[0]);
        var a = this.position[0] - fix[0];
        var b = this.position[1] - fix[1];
        if(distance2d(this.position, fix) < 0.5) {
//          ui_log(this.getRadioCallsign() + " passed over " + this.requested.fix.toUpperCase() + ", will maintain heading " + heading_to_string(this.requested.heading) + " at " + this.requested.altitude + " feet");
          if(this.requested.fix.length > 1)
            this.requested.fix.splice(0, 1);
          else
            this.cancelFix();
          this.updateStrip();
        } else {
          this.target.heading = Math.atan2(a, b) - Math.PI;
        }
      } else if(this.requested.navmode == "hold") {
        if(this.requested.turn == "right") {
          this.target.heading = this.heading + Math.PI/4;
        } else if(this.requested.turn == "left") {
          this.target.heading = this.heading - Math.PI/4;
        }
      } else {
        this.target.heading = this.requested.heading;
        this.target.turn = this.requested.turn;
      }

      if(this.mode != "landing") {
        this.target.altitude = this.requested.altitude;
        this.target.expedite = this.requested.expedite;

        this.target.altitude = Math.max(1000, this.target.altitude);

        this.target.speed = this.requested.speed;
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
        var runway = airport_get().getRunway(this.requested.runway);
        var position = runway.getPosition(this.requested.runway);

        this.position[0] = position[0];
        this.position[1] = position[1];

        this.heading     = runway.angle;
        if(runway.getEnd(this.requested.runway) == 1) this.heading += Math.PI;

        if(runway.isWaiting(this, this.requested.runway) == 0 && was_taxi == true) {
          ui_log(this.getRadioCallsign(), "ready for takeoff runway "+radio_runway(this.requested.runway));
          this.updateStrip();
        }
      }

      if(this.mode == "takeoff") {
        var runway = airport_get().getRunway(this.requested.runway);

        this.target.heading = runway.getAngle(this.requested.runway) + Math.PI;

        if(this.speed < this.model.speed.min) {
          this.target.altitude = 0;
          this.altitude = 0;
        } else {
          this.target.altitude = this.requested.altitude;
        }

        this.target.speed = this.model.speed.cruise;

        if(this.altitude > 200 && this.target.speed > this.model.speed.min) {
          this.mode = "cruise";
          this.requested.runway = null;
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

        if(this.altitude > 10) {
          var turn_amount = this.model.rate.turn * game_delta();
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
      this.position[0] += (sin(angle) * (this.speed * 0.000514)) * game_delta();
      this.position[1] += (cos(angle) * (this.speed * 0.000514)) * game_delta();

      var wind_drift = [0, 0];

      this.position[0] += (sin(angle) * (this.speed * 0.000514)) * game_delta();
      this.position[1] += (cos(angle) * (this.speed * 0.000514)) * game_delta();
    },
    updateWarning: function() {
      if(this.isTaxiing()) return;
      var notice  = false;
      var warning = false;
      var hit     = false;
      for(var i=0;i<prop.aircraft.list.length;i++) {
        var other = prop.aircraft.list[i];
        if(this == other) continue;

        var other_land = other.isLanded()  || other.altitude < 990;
        var this_land  = this.isLanded()   || this.altitude < 990;

        if((!other_land && !this_land)) {
          if((distance2d(this.position, other.position) < 5.5) &&     // closer than ~4 miles
             (abs(this.altitude - other.altitude) < 1500)) {          // less than 1.5k feet
            notice = true;
          }
          if((distance2d(this.position, other.position) < 4.8) &&     // closer than 3 miles
             (abs(this.altitude - other.altitude) < 990)) {           // less than 1k feet
            warning = true;
          }
        } else {
          var airport = airport_get();
          if((airport.getRunway(other.requested.runway) === airport.getRunway(this.requested.runway)) &&     // on the same runway
             (distance2d(this.position, other.position) < 10) &&      // closer than 10km
             (abs(angle_offset(this.heading, other.heading)) > 10)) { // different directions
            if(!this.warning) {
              console.log("too close to another aircraft");
              ui_log(true, this.getCallsign() + " is too close to " + other.getCallsign());
              prop.game.score.warning += 1;
            }
            warning = true;
          }
        }
        if((distance2d(this.position, other.position) < 0.05) &&      // closer than 50 meters
           (abs(this.altitude - other.altitude) < 50) &&
           (other.isVisible() && this.isVisible())) {
          if(!this.hit) {
            console.log("hit another aircraft");
            ui_log(true, this.getCallsign() + " hit " + other.getCallsign());
            prop.game.score.hit += 1;
          }
          hit = true;
        }
      }

      this.notice  = notice;
      this.warning = warning;
      this.hit     = hit;
    },
    updateStrip: function() {
      var heading  = this.html.find(".heading");
      var altitude = this.html.find(".altitude");
      var speed    = this.html.find(".speed");

      heading.removeClass("runway hold waiting taxi");
      altitude.removeClass("runway hold");
      speed.removeClass("runway");

      var title = "";

      if(this.requested.runway) {
        heading.addClass("runway");
        heading.text(this.requested.runway);

        speed.text(this.requested.speed);

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
            altitude.text(this.requested.altitude);

            speed.text(this.requested.speed);
          }
        }
      } else {
        heading.text(heading_to_string(this.requested.heading));
        altitude.text(this.requested.altitude);
        speed.text(this.requested.speed);
      }

      if(this.requested.navmode == "fix") {
        heading.text(this.requested.fix[0]);
        heading.addClass("hold");
      } else if(this.requested.navmode == "hold") {
        heading.text("hold "+this.requested.turn);
        heading.addClass("hold");
      }

      heading.prop("title",  title);
      altitude.prop("title", title);
      speed.prop("title", title);

    },

    updateAuto: function() {

    },

    update: function(p) {
      if(prop.aircraft.auto.enabled) {
        this.updateAuto();
      }
      this.updateTarget();
      this.updatePhysics();
    }
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
  // CESSNA
  aircraft_load("c208");

  aircraft_load("c337");

  aircraft_load("c510");

  aircraft_load("c550");

  aircraft_load("c750");

  // AIRBUS
  aircraft_load("a318");
  aircraft_load("a319");
  aircraft_load("a320");
  aircraft_load("a321");

  aircraft_load("a332");
  aircraft_load("a333");

  aircraft_load("a388");

  // BOEING
  aircraft_load("b734");
  aircraft_load("b737");
  aircraft_load("b738");
  aircraft_load("b739");

  aircraft_load("b744");

  aircraft_load("b752");
  aircraft_load("b753");

  aircraft_load("b762");
  aircraft_load("b763");
  aircraft_load("b764");

  aircraft_load("b772");
  aircraft_load("b77e");
  aircraft_load("b77w");
  aircraft_load("b788");

  // EMBRAER
  aircraft_load("e170");
  aircraft_load("e190");

  // CONCORDE...
  aircraft_load("conc");
}

function aircraft_generate_callsign(airline) {
  var callsign_length = airline_get(airline).callsign.length;
  var alpha           = airline_get(airline).callsign.alpha;
  var callsign        = "";

  var list = "0123456789";

  callsign += choose(list.substr(1));
  if(alpha) {
    for(var i=0;i<callsign_length - 3;i++) callsign += choose(list)
    list = "abcdefghijklmnopqrstuvwxyz";
    for(var i=0;i<2;i++) callsign += choose(list)
  } else {
    for(var i=0;i<callsign_length - 1;i++) callsign += choose(list)
  }
  return callsign;
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
    options.icao = airline_get_aircraft(options.airline);
  }
  var icao = options.icao.toLowerCase();

  options.model = prop.aircraft.models[icao];

  var aircraft = new Aircraft(options);

  aircraft.complete();

  prop.aircraft.list.push(aircraft);

  console.log("adding " + options.category + " aircraft, callsign " + aircraft.getCallsign());
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
  if((Math.pow(aircraft.position[0],2) + Math.pow(aircraft.position[1], 2)) < Math.pow((airport_get().ctr_radius * factor), 2))
    return true;
  return false;
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
  }
  for(var i=prop.aircraft.list.length-1;i>=0;i--) {
    var remove = false;
    var aircraft = prop.aircraft.list[i];
    if(!aircraft_visible(aircraft) && aircraft.category == "departure" && aircraft.inside_ctr) {
      ui_log(aircraft.getRadioCallsign() + " leaving radar coverage");
      prop.game.score.departure += 1;
      console.log("departing aircraft no longer visible");
      aircraft.inside_ctr = false;
    }
    if(!aircraft_visible(aircraft) && aircraft.category == "arrival" && aircraft.inside_ctr) {
      ui_log(aircraft.getRadioCallsign() + " leaving radar coverage");
      console.log("arriving aircraft no longer visible. YU FAIL");
      aircraft.inside_ctr = false;
    }
    if(aircraft.category == "arrival" && aircraft_visible(aircraft) && !aircraft.inside_ctr) {
      var position = "";
      var distance = round(distance2d([0, 0], aircraft.position) * 0.62);
      position += distance + " mile" + s(distance);
      var angle = Math.atan2(aircraft.position[0], aircraft.position[1]);
      position += " " + radio_compass(compass_direction(angle));
      ui_log(airport_get().radio+" tower, "+aircraft.getRadioCallsign()+" in your airspace "+position+", over");
      aircraft.inside_ctr = true;
    }
    if(aircraft.isStopped() && aircraft.category == "arrival") {
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
        prop.game.score.failed_arrival += 1;
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
