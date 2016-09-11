import $ from 'jquery';
import Fiber from 'fiber';
import { distance2d } from '../math/distance';
import { vlen, vradial, vsub } from '../math/vector';
import { radiansToDegrees, degreesToRadians } from '../utilities/unitConverters';

/**
 * Each simulated aircraft in the game. Contains a model, fms, and conflicts.
 *
 * @class AircraftInstanceModel
 * @extends Fiber
 */
const Aircraft = Fiber.extend(function() {
  return {
    init: function(options = {}) {
      this.eid          = prop.aircraft.list.length;  // entity ID
      this.position     = [0, 0];     // Aircraft Position, in km, relative to airport position
      this.model        = null;       // Aircraft type
      this.airline      = '';         // Airline Identifier (eg. 'AAL')
      this.callsign     = '';         // Flight Number ONLY (eg. '551')
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
      if (options.category == "arrival") this.setArrivalRunway(airport_get().runway);
      else if (options.category == "departure") this.setDepartureRunway(airport_get().runway);
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
    setArrivalRunway: function(rwy) {
      this.rwy_arr = rwy;

      //Update the assigned STAR to use the fixes for the specified runway, if they exist
    },
    setDepartureRunway: function(rwy) {
      this.rwy_dep = rwy;

      // Update the assigned SID to use the portion for the new runway
      var l = this.fms.currentLeg();
      if(l.type == "sid") {
        var a = $.map(l.waypoints,function(v){return v.altitude});
        var cvs = !a.every(function(v){return v==airport_get().initial_alt;});
        this.fms.followSID(l.route);
        if(cvs) this.fms.climbViaSID();
      }
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
            // Find the desired SID exitPoint
            var exit;
            for(var l in this.fms.legs) {
              if(this.fms.legs[l].type == "sid") {
                exit = this.fms.legs[l].waypoints[this.fms.legs[l].waypoints.length-1].fix;
                break;
              }
            }
            // Verify aircraft was cleared to departure fix
            var ok = false;
            for(var i=0; i<this.fms.waypoints().length; i++)
              if(this.fms.waypoints()[i].fix == exit) {ok = true; break;}
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
      abort: 'runAbort',
      altitude: 'runAltitude',
      clearedAsFiled: 'runClearedAsFiled',
      climbViaSID: 'runClimbViaSID',
      debug: 'runDebug',
      delete: 'runDelete',
      descendViaSTAR: 'runDescendViaSTAR',
      direct: 'runDirect',
      fix: 'runFix',
      flyPresentHeading: 'runFlyPresentHeading',
      heading: 'runHeading',
      hold: 'runHold',
      land: 'runLanding',
      moveDataBlock: 'runMoveDataBlock',
      route: 'runRoute',
      reroute: 'runReroute',
      sayRoute: 'runSayRoute',
      sid: 'runSID',
      speed: 'runSpeed',
      star: 'runSTAR',
      takeoff: 'runTakeoff',
      taxi: 'runTaxi'
    },

    runCommands: function(commands) {
      if (!this.inside_ctr)
        return true;

      var response = [];
      var response_end = "";
      var deferred = [];

      for(var i=0;i<commands.length;i+=1) {
        var command = commands[i][0];
        var args = commands[i].splice(1);

        if (command == 'takeoff') {
          deferred.push([command, args]);
          continue;
        }

        var retval  = this.run(command, args);

        if(retval) {
          if(!retval[1].hasOwnProperty("log") || !retval[1].hasOwnProperty("say")) {
            retval = [retval[0],{log:retval[1], say:retval[1]}];
          }
          response.push(retval[1]);
          if(retval[2]) response_end = retval[2];
        }

      }

      for(var i=0;i<deferred.length;i+=1) {
        var command = deferred[i][0];
        var args = deferred[i][1];

        var retval  = this.run(command, args);
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
        call_func = this.COMMANDS[command];
      }

      if (!call_func)
        return ["fail", "not understood"];

      return this[call_func].apply(this, [data]);
    },
    runHeading: function(data) {
      var direction = data[0];
      var heading = data[1];
      var incremental = data[2];

      var instruction = null;
      var amount = 0;

      if(isNaN(heading)) return ["fail", "heading not understood"];

      if (incremental) {
        amount = heading;
        if(direction == "left") {
          heading = radiansToDegrees(this.heading) - amount;
        }
        else if(direction == "right") {
          heading = radiansToDegrees(this.heading) + amount;
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
          heading: degreesToRadians(heading),
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
          heading: degreesToRadians(heading),
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
            heading: degreesToRadians(heading),
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
            heading: degreesToRadians(heading),
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
            heading: degreesToRadians(heading),
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
      var altitude = data[0];
      var expedite = data[1];

      if ((altitude == null) || isNaN(altitude)) {
        if (expedite) {
          this.fms.setCurrent({expedite: true});
          return ['ok', radio_trend('altitude', this.altitude, this.fms.currentWaypoint().altitude) + " " + this.fms.currentWaypoint().altitude + ' expedite'];
        }
        return ["fail", "altitude not understood"];
      }

      if(this.mode == "landing")
        this.cancelLanding();

      var ceiling = airport_get().ctr_ceiling;
      if (prop.game.option.get('softCeiling') == 'yes')
        ceiling += 1000;

      this.fms.setAll({
        altitude: clamp(round(airport_get().elevation/100)*100 + 1000, altitude, ceiling),
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
          {log: "cleared to destination via the " + airport_get().sids[this.destination].icao +
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
      if(!(this.fms.currentLeg().type == "sid")) var fail = true;
      else if(this.fms.climbViaSID())
        return ['ok', {log: "climb via the " + this.fms.currentLeg().route.split('.')[1] + " departure",
          say: "climb via the " + airport_get().sids[this.fms.currentLeg().route.split('.')[1]].name + " departure"}];

      if(fail) ui_log(true, this.getCallsign() + ", unable to climb via SID");
    },
    runDescendViaSTAR: function() {
      if(this.fms.descendViaSTAR() && this.fms.following.star)
      return ['ok', {log: "descend via the " + this.fms.following.star + " arrival",
        say: "descend via the " + airport_get().stars[this.fms.following.star].name + " arrival"}];
      else ui_log(true, this.getCallsign() + ", unable to descend via STAR");
    },
    runSpeed: function(data) {
      var speed = data[0];
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
      var dirTurns = data[0];
      var legLength = data[1];
      var holdFix = data[2];
      var holdFixLocation = null;

      if (dirTurns == null)
        dirTurns = "right"; // standard for holding patterns is right-turns

      if (legLength == null)
        legLength = "1min";

      if (holdFix != null) {
        holdFix = holdFix.toUpperCase();
        holdFixLocation = airport_get().getFix(holdFix);
        if (!holdFixLocation) {
          return ["fail", "unable to find fix " + holdFix];
        }
      }

      if(this.isTakeoff() && !holdFix) return ["fail", "where do you want us to hold?"];

      // Determine whether or not to enter the hold from present position
      if(holdFix) {  // holding over a specific fix (currently only able to do so on inbound course)
        var inboundHdg = vradial(vsub(this.position, holdFixLocation));
        if(holdFix != this.fms.currentWaypoint().fix) {  // not yet headed to the hold fix
          this.fms.insertLegHere({type:"fix", route: "[GPS/RNAV]", waypoints:[
            new zlsa.atc.Waypoint({ // proceed direct to holding fix
              fix: holdFix,
              altitude: this.fms.currentWaypoint().altitude,
              speed: this.fms.currentWaypoint().speed
            },this.fms),
            new zlsa.atc.Waypoint({ // then enter the hold
              navmode:"hold",
              speed: this.fms.currentWaypoint().speed,
              altitude: this.fms.currentWaypoint().altitude,
              fix: null,
              hold: {
                fixName: holdFix,
                fixPos: holdFixLocation,
                dirTurns: dirTurns,
                legLength: legLength,
                inboundHdg: inboundHdg,
                timer: null,
              }
            },this.fms)
          ]});
        }
        else {  // already currently going to the hold fix
          this.fms.appendWaypoint({
            navmode:"hold",
            speed: this.fms.currentWaypoint().speed,
            altitude: this.fms.currentWaypoint().altitude,
            fix: null,
            hold: {
              fixName: holdFix,
              fixPos: holdFixLocation,
              dirTurns: dirTurns,
              legLength: legLength,
              inboundHdg: inboundHdg,
              timer: null, }});  // Force the initial turn to outbound heading when entering the hold
        }
      }
      else {  // holding over present position (currently only able to do so on present course)
        holdFixLocation = this.position; // make a/c hold over their present position
        var inboundHdg = this.heading;
        this.fms.insertLegHere({type:"fix", waypoints:[
          { // document the present position as the "fix" we're holding over
            navmode:"fix",
            fix: "[custom]",
            location: holdFixLocation,
            altitude: this.fms.currentWaypoint().altitude,
            speed: this.fms.currentWaypoint().speed
          },
          { // Force the initial turn to outbound heading when entering the hold
            navmode:"hold",
            speed: this.fms.currentWaypoint().speed,
            altitude: this.fms.currentWaypoint().altitude,
            fix: null,
            hold: {
              fixName: holdFix,
              fixPos: holdFixLocation,
              dirTurns: dirTurns,
              legLength: legLength,
              inboundHdg: inboundHdg,
              timer: null,
            }
          }
        ]});
      }

      var inboundDir = radio_cardinalDir_names[getCardinalDirection(fix_angle(inboundHdg + Math.PI)).toLowerCase()];
      if(holdFix) return ["ok", "proceed direct " + holdFix + " and hold inbound, " + dirTurns + " turns, " + legLength + " legs"];
      else return ["ok", "hold " + inboundDir + " of present position, " + dirTurns + " turns, " + legLength + " legs"];
    },
    runDirect: function(data) {
      var fixname = data[0].toUpperCase();
      var fix = airport_get().getFix(fixname);
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
      var last_fix, fail;
      var fixes = $.map(data[0], function(fixname) {
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
        this.fms.insertLegHere({type:"fix", route:fixes[i]})
      }

      if (this.mode != "waiting" && this.mode != "takeoff" && this.mode != "apron" && this.mode != "taxi"){
        this.cancelLanding();
      }
      return ["ok", "proceed direct " + fixes.join(', ')];
    },
    runFlyPresentHeading: function(data) {
      this.cancelFix();
      this.runHeading([null, radiansToDegrees(this.heading)]);
      return ["ok", "fly present heading"];
    },
    runSayRoute: function(data) {
      return ['ok', {log:'route: ' + this.fms.fp.route.join(' '), say:"here's our route"}];
    },
    runSID: function(data) {
      var apt = airport_get();
      var sid_id = data[0].toUpperCase();
      if(!apt.sids.hasOwnProperty(sid_id)) return;
      var sid_name = apt.sids[sid_id].name;
      var exit = apt.getSIDExitPoint(sid_id);
      var route = apt.icao + '.' + sid_id + '.' + exit;

      if(this.category != "departure") {
        return ["fail", "unable to fly SID, we are an inbound"];
      }
      if(data[0].length == 0) {
        return ["fail", "SID name not understood"];
      }
      if(!apt.sids.hasOwnProperty(sid_id)) {
        return ["fail", "SID name not understood"];
      }
      if(!this.rwy_dep) this.setDepartureRunway(airport_get().runway);
      if(!apt.sids[sid_id].rwy.hasOwnProperty(this.rwy_dep)) {
        return ['fail', "unable, the "+sid_name+" departure not valid from Runway "+this.rwy_dep];
      }


      this.fms.followSID(route);

      return ["ok", {log:"cleared to destination via the " + sid_id + " departure, then as filed",
                  say:"cleared to destination via the " + sid_name + " departure, then as filed"}];
    },
    runSTAR: function(data) {
      var entry = data[0].split('.')[0].toUpperCase();
      var star_id = data[0].split('.')[1].toUpperCase();
      var apt = airport_get();
      var star_name = apt.stars[star_id].name;
      var route = entry + '.' + star_id + '.' + apt.icao;

      if(this.category != "arrival") {
        return ["fail", "unable to fly STAR, we are a departure!"];
      }
      if(data[0].length == 0) {
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
      var positions = {8:360,9:45,6:90,3:135,2:180,1:225,4:270,7:315,5:"ctr"};
      if(!positions.hasOwnProperty(dir[0])) return;
      else this.datablockDir = positions[dir[0]];
    },
    /** Adds a new Leg to fms with a user specified route
     ** Note: See notes on 'runReroute' for how to format input for this command
     */
    runRoute: function(data) {
      data = data[0].toUpperCase();  // capitalize everything
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
      data = data[0].toUpperCase();  // capitalize everything
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
      if(data[0]) {
        if(airport_get().getRunway(data[0].toUpperCase())) this.setDepartureRunway(data[0].toUpperCase());
        else return ["fail", "no runway " + data[0].toUpperCase()];
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
      if(this.mode == "takeoff") return ["fail", "already taking off"];

      if(this.fms.currentWaypoint().altitude <= 0) return ["fail", "no altitude assigned"];

      var runway = airport_get().getRunway(this.rwy_dep);

      if(runway.removeQueue(this)) {
        this.mode = "takeoff";
        prop.game.score.windy_takeoff += this.scoreWind('taking off');
        this.takeoffTime = game_time();

        if(this.fms.currentWaypoint().speed == null)
          this.fms.setCurrent({speed: this.model.speed.cruise});

        var wind = airport_get().getWind();
        var wind_dir = round(radiansToDegrees(wind.angle));
        var readback = {
          log: "wind " + round(wind_dir/10)*10 + " at " + round(wind.speed) + ", runway " + this.rwy_dep + ", cleared for takeoff",
          say: "wynd " + radio_spellOut(round(wind_dir/10)*10) + " at " + radio_spellOut(round(wind.speed)) + ", run way " + radio_runway(this.rwy_dep) + ", cleared for take off",
        };
        return ["ok", readback];
      } else {
        var waiting = runway.inQueue(this);
        return ["fail", "number "+waiting+" behind "+runway.queue[waiting-1].getRadioCallsign(), ""];
      }
    },
    runLanding: function(data) {
      var variant = data[0];
      var runway = airport_get().getRunway(data[1]);

      if(!runway) return ["fail", "there is no runway " + radio_runway(data[1])];
      else this.setArrivalRunway(data[1].toUpperCase());

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
    runDebug: function() {
      window.aircraft = this;
      return ["ok", {log:"in the console, look at the variable &lsquo;aircraft&rsquo;", say:""}];
    },
    runDelete: function() {
      aircraft_remove(this);
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
      var keys = 'position model airline callsign category heading altitude speed'.split(' ');
      for (var i in keys) {
        if (data[keys[i]]) this[keys[i]] = data[keys[i]];
      }
      if(this.category == "arrival") {
        if(data.waypoints.length > 0)
          this.setArrivalWaypoints(data.waypoints);
        this.destination = data.destination;
        this.setArrivalRunway(airport_get(this.destination).runway);
      }
      else if(this.category == "departure" && this.isLanded()) {
        this.speed = 0;
        this.mode = "apron";
        this.setDepartureRunway(airport_get().runway);
        this.destination = data.destination;
      }

      if(data.heading)  this.fms.setCurrent({heading: data.heading});
      if(data.altitude) this.fms.setCurrent({altitude: data.altitude});
      this.fms.setCurrent({speed: data.speed || this.model.speed.cruise});
      if(data.route) {
        this.fms.customRoute(this.fms.formatRoute(data.route), true);
        this.fms.descendViaSTAR();
      }
      if(data.nextFix) {
        this.fms.skipToFix(data.nextFix);
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
      var runway  = airport_get().getRunway(this.rwy_arr);
      if (runway == null) {
        runway  = airport_get().getRunway(this.rwy_dep);
      }

      if (runway == null) {
        return false;
      }
      if((this.altitude - runway.elevation) < 5)
        return true;
      return false;
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
        var waiting = runway.inQueue(this);
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
        var alt = digits_decimal(this.altitude, -2);
        if(Math.abs(altdiff) > 200) {
          if(altdiff > 0) {
            var alt_log = "descending through " + alt + " for " + this.target.altitude;
            var alt_say = "descending through " + radio_altitude(alt) + " for " + radio_altitude(this.target.altitude);
          }
          else if(altdiff < 0) {
            var alt_log = " climbing through " + alt + " for " + this.target.altitude;
            var alt_say = " climbing through " + radio_altitude(alt) + " for " + radio_altitude(this.target.altitude);
          }
        }
        else {
          var alt_log = "at " + alt;
          var alt_say = "at " + radio_altitude(alt);
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
      var runway_elevation = 0;

      if (this.rwy_arr != null)
        runway_elevation = airport.getRunway(this.rwy_arr).elevation;

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
        glideslope_window   = abs(runway.getGlideslopeAltitude(offset[1], degreesToRadians(1)));

        if(this.mode == "landing")
          this.target.altitude = glideslope_altitude;

        var ils = runway.ils.loc_maxDist;
        if(!runway.ils.enabled || !ils) ils = 40;

        // lock  ILS if at the right angle and altitude
        if ((abs(this.altitude - glideslope_altitude) < glideslope_window)
            && (abs(offset_angle) < degreesToRadians(10))
            && (offset[1] < ils)) {
          if(abs(offset[0]) < 0.05 && this.mode != "landing") {
            this.mode = "landing";
            if (!this.projected && (abs(angle_offset(this.fms.currentWaypoint().heading,
                  degreesToRadians(parseInt(this.rwy_arr.substr(0,2))*10))) > degreesToRadians(30))) {
              ui_log(true, this.getRadioCallsign() +
                      " approach course intercept angle was greater than 30 degrees");
              prop.game.score.violation += 1;
            }
            this.updateStrip();
            this.target.turn = null;
          }

          // Intercept localizer and glideslope and follow them inbound
          var angle_diff = angle_offset(angle, this.heading);
          var turning_time = Math.abs(radiansToDegrees(angle_diff)) / 3;  // time to turn angle_diff degrees at 3 deg/s
          var turning_radius = km(this.speed) / 3600 * turning_time;  // dist covered in the turn, km
          var dist_to_localizer = offset[0]/Math.sin(angle_diff);  // dist from the localizer intercept point, km
          if(dist_to_localizer <= turning_radius || dist_to_localizer < 0.5) {
            // Steer to within 3m of the centerline while at least 200m out
            if(offset[1] > 0.2 && abs(offset[0]) > 0.003 )
              this.target.heading = clamp(degreesToRadians(-30), -12 * offset_angle, degreesToRadians(30)) + angle;
            else this.target.heading = angle;

            // Follow the glideslope
            this.target.altitude = glideslope_altitude;
          }

          // Speed control on final approach
          if(this.fms.currentWaypoint().speed > 0)
            this.fms.setCurrent({start_speed: this.fms.currentWaypoint().speed});
          this.target.speed        = crange(3, offset[1], 10, this.model.speed.landing, this.fms.currentWaypoint().start_speed);
        } else if((this.altitude - runway_elevation) >= 300 && this.mode == "landing") {
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
        if(this.isLanded()) {
          this.target.speed = 0;
        }
      } else if(this.fms.currentWaypoint().navmode == "fix") {
        var fix = this.fms.currentWaypoint().location;
        if(!fix) {
          console.error(this.getCallsign()+" using 'fix' navmode, but no fix location!");
          console.log(this.fms);
          console.log(this.fms.currentWaypoint());
        }
        var vector_to_fix = vsub(this.position, fix);
        var distance_to_fix = distance2d(this.position, fix);
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
        this.altitude    = runway.elevation;
        if (!this.projected &&
            (runway.inQueue(this) == 0) &&
            (was_taxi == true))
        {
          ui_log(this.getCallsign(), " holding short of runway "+this.rwy_dep);
          speech_say([ {type:"callsign", content:this}, {type:"text", content:"holding short of runway "+radio_runway(this.rwy_dep)} ]);
          this.updateStrip();
        }
      }
      else if(this.mode == "takeoff") {
        var runway = airport_get().getRunway(this.rwy_dep);
        // Altitude Control
        if(this.speed < this.model.speed.min) this.target.altitude = runway.elevation;
        else this.target.altitude = this.fms.currentWaypoint().altitude;

        // Heading Control
        var rwyHdg = airport_get().getRunway(this.rwy_dep).angle;
        if((this.altitude - runway.elevation)<400) this.target.heading = rwyHdg;
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

        if(!this.isLanded() && this.heading != this.target.heading) {
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
        for (let i = 0; i < this.restricted.list.length; i++) {
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

export default Aircraft;
