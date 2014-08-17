
var Model=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};

      this.name = null;
      this.icao = null;

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

      this.warning     = false;
      this.hit         = false;

      this.taxi_start    = 0;
      this.taxi_duration = 0;

      this.category    = "arrival"; // or "departure"
      this.mode        = "cruise";  // "apron", "taxi", "waiting", "takeoff", "cruise", or "landing"

      this.requested = {
        heading:  0,
        turn:     "auto", // "left", "right", or "auto"
        hold:     false,
        altitude: 0,
        expedite: false,
        speed:    0,
        runway:   null
      };

      this.target = {
        heading:  0,
        turn:     "auto",
        altitude: 0,
        expedite: false,
        speed:    0
      };

      this.parse(options);

      this.html = $("<li class='strip'></li>");

      this.html.append("<span class='callsign'>" + this.getCallsign() + "</span>");
      this.html.append("<span class='heading'>" + round(this.heading) + "</span>");
      this.html.append("<span class='altitude'>-</span>");
      this.html.append("<span class='aircraft'>" + this.model.icao + "</span>");

      this.html.find(".aircraft").attr("title", this.model.name);

      if(this.category == "arrival") {
        this.html.addClass("arrival");
        this.html.attr("title", "Scheduled for arrival");
      } else {
        this.html.addClass("departure");
        this.html.attr("title", "Scheduled for departure");
      }

      if((this.category == "arrival") && game_time() > 2) {
//      if(this.category == "arrival") {
        ui_log(airport_get().radio+" tower, "+airline_get(this.airline).callsign.name+" "+radio(this.callsign)+", over");
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
      return (this.airline + this.callsign).toUpperCase();
    },
    getRadioCallsign: function() {
      return airline_get(this.airline).callsign.name + " " + this.callsign.toUpperCase();
    },
    runCommand: function(command) {
      var s = command.match(/\S+/g);
      if(!s) {
        return false;
      }
      var mode = "";
      var data = "";
      if(s.length >= 1) mode = s[0].toLowerCase();
      if(s.length >= 2) data = s.slice(1).join(" ").toLowerCase();
      if(mode.length < 1) {
        ui_log(this.getRadioCallsign(), "instruction not understood, say again");
        return true;
      }

      // ALTITUDE

      if("altitude".indexOf(mode) == 0 || "descend".indexOf(mode) == 0 || "ascend".indexOf(mode) == 0 || ("climb".indexOf(mode) == 0 && mode.length >= 3)) {
        var items = data.match(/\S+/g);
        var expedite = false;

        if(!items || items.length == 0) return false;

        if(items.length >= 1) data = items[0];
        if(items.length >= 2) {
          expedite = true;
        }

        if(data.length > 3) {
          ui_log(this.getRadioCallsign(), "altitude not understood, say again");
          return true;
        }

        var number = parseInt(data);
        if(isNaN(number)) {
          ui_log(this.getRadioCallsign(), "altitude not understood, say again");
          return true;
        }

        if(this.mode == "landing" || this.mode == "cruise") {
          this.mode = "cruise";
          this.requested.runway  = null;
        }
        if(data.length >= 2)
          this.requested.altitude = number * 100;
        else
          this.requested.altitude = number * 1000;
        this.requested.expedite = expedite;
        
        if(expedite) expedite = " expedite";
        else expedite = "";

        if(this.mode == "cruise") {
          if(this.requested.altitude < this.altitude)
            ui_log(this.getRadioCallsign(), "descend to "+round(this.requested.altitude)+" feet"+expedite+", roger");
          else if(this.requested.altitude > this.altitude)
            ui_log(this.getRadioCallsign(), "ascend to "+round(this.requested.altitude)+" feet"+expedite+", roger");
          else
            ui_log(this.getRadioCallsign(), "maintain "+round(this.requested.altitude)+" feet");
        } else if(this.mode == "takeoff" || this.mode == "apron" || this.mode == "waiting" || this.mode == "taxi") {
          ui_log(this.getRadioCallsign(), "altitude set "+round(this.requested.altitude)+" feet"+expedite+", roger");
        }

      } else if("hold".indexOf(mode) == 0) {
        // HOLD
        var direction = "auto";

        if(data == "l" || ("left").indexOf(data) == 0) {
          direction = "left";
        } else if(data == "r" || ("right").indexOf(data) == 0) {
          direction = "right";
        } else {
          ui_log(this.getRadioCallsign(), "hold direction not understood, say again");
          return true;
        }

        this.requested.turn = direction;
        this.requested.hold = true;
        
        ui_log(this.getRadioCallsign(), "hold "+direction+" at "+this.requested.altitude+" feet, roger");

      } else if("speed".indexOf(mode) == 0 || "slow".indexOf(mode) == 0) {
        // SPEED
        var number = parseInt(data);

        if(isNaN(number)) {
          ui_log(this.getRadioCallsign(), "airspeed not understood, say again");
          return true;
        }
        
        this.requested.speed = number;
        
        if(this.requested.speed < this.speed)
          ui_log(this.getRadioCallsign(), "reduce speed to "+this.requested.speed);
        else if(this.requested.speed > this.speed)
          ui_log(this.getRadioCallsign(), "increase speed to "+this.requested.speed);
        else
          ui_log(this.getRadioCallsign(), "maintain "+this.requested.speed+" knots");

      } else if("land".indexOf(mode) == 0) {
        // LAND

        if(this.category != "arrival") {
          ui_log(this.getRadioCallsign(), "is an outbound aircraft");
          return true;
        }

        if(this.isLanded()) {
          ui_log(this.getRadioCallsign(), "already on the ground");
          return true;
        }

        var runway = airport_get().getRunway(data);

        if(!runway) {
          ui_log(this.getRadioCallsign(), "no such runway at "+airport_get().name);
//          console.log("invalid runway '" + data + "'");
          return true;
        }

        this.requested.runway = data.toUpperCase();
        this.requested.hold    = false;
        
        ui_log(this.getRadioCallsign(), "landing on runway "+radio_runway(this.requested.runway)+", roger");

      } else if("wait".indexOf(mode) == 0) {
        // WAIT

        if(this.category != "departure") {
          ui_log(this.getRadioCallsign(), ", we are inbound");
          return true;
        }

        if(!this.isLanded()) {
          console.log("attempted to re-takeoff an aircraft");
          return true;
        }

        var runway = airport_get().getRunway(this.requested.runway);

        runway.addQueue(this, this.requested.runway);

        this.mode = "taxi";

        this.taxi_start = game_time();

        ui_log(this.getRadioCallsign(), "line up and wait runway "+radio_runway(this.requested.runway)+", roger");

      } else if("takeoff".indexOf(mode) == 0) {
        // TAKEOFF

        if(this.category != "departure") {
          ui_log(this.getRadioCallsign(), "already airborne");
          return true;
        }

        if(!this.isLanded()) {
          ui_log(this.getRadioCallsign(), "already airborne");
          return true;
        }

        if(this.mode != "waiting") {
          ui_log(this.getRadioCallsign(), "still taxiing to runway");
          return true;
        }

        if(this.requested.altitude <= 0) {
          ui_log(this.getRadioCallsign(), "awaiting altitude assignment before departure");
          return true;
        }

        var runway = airport_get().getRunway(this.requested.runway);

        if(runway.removeQueue(this, this.requested.runway)) {
          this.mode = "takeoff";
        } else {
          var waiting = runway.isWaiting(this, this.requested.runway);
          ui_log(this.getRadioCallsign(), "number "+waiting+" behind "+runway.waiting[runway.getEnd(this.requested.runway)][waiting+1].getCallsign());
          return true;
        }

        ui_log(this.getRadioCallsign(), "takeoff runway "+radio_runway(this.requested.runway)+", altitude "+this.requested.altitude+", roger");

      } else if("clear".indexOf(mode) == 0 || "heading".indexOf(mode) == 0 || "turn".indexOf(mode) == 0) {
      // CLEARED TO HEADING
        var items = data.match(/\S+/g);
        var turn = "auto";

        if(!items || items.length == 0) return false;

        var swap=false;

        if(items.length >= 1) data = items[0];
        if(items.length >= 2) {
          if(items[1] == "l" || ("left").indexOf(items[1]) == 0) {
            turn = "left";
          } else if(items[1] == "r" || ("right").indexOf(items[1]) == 0) {
            turn = "right";
          } else if(items[0] == "l" || ("left").indexOf(items[0]) == 0) {
            turn = "left";
            swap = true;
          } else if(items[0] == "r" || ("right").indexOf(items[0]) == 0) {
            turn = "right";
            swap = true;
          } else {
            ui_log(this.getRadioCallsign(), "heading not understood, say again");
            return true;
          }
        }

        if(swap) data = items[1];

        if(data.length > 3) {
          ui_log(this.getRadioCallsign(), "heading not understood, say again");
          return true;
        }

        var number = parseInt(data);
        if(isNaN(number)) {
          ui_log(this.getRadioCallsign(), "heading not understood, say again");
          return true;
        }

        if(this.mode == "landing" || this.mode == "cruise") {
          this.mode = "cruise";
        }
        this.requested.heading = radians(number);
        this.requested.turn    = turn;
        this.requested.hold    = false;

        var direction = "";
        if(turn != "auto")
          direction = " towards the "+turn;

        if(this.mode == "cruise")
          ui_log(this.getRadioCallsign(), "turn heading "+heading_to_string(this.requested.heading)+direction+", roger");
        else if(this.isTaxiing() || this.mode == "takeoff")
          ui_log(this.getRadioCallsign(), "turn heading "+heading_to_string(this.requested.heading)+direction+" after takeoff");

      } else if("goaround".indexOf(mode) == 0) {
        // GO AROUND
        if(this.mode == "landing") {
          var runway = airport_get().getRunway(this.requested.runway);
          this.requested.heading = runway.getAngle(this.requested.runway) + Math.PI;
          ui_log(this.getRadioCallsign(), "going around, maintain heading " + heading_to_string(this.requested.heading)+" at "+this.requested.altitude+" feet");
          this.requested.runway   = null;
        } else if(this.mode == "takeoff") {
          
        }
      } else {
        ui_log(this.getRadioCallsign(), "say again");
      }

      return true;
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
    },
    selectRunway: function() {
      this.requested.runway = airport_get().selectRunway(this.model.runway.takeoff).toUpperCase();
      if(!this.requested.runway) return;
      this.taxi_delay = airport_get().getRunway(this.requested.runway).taxiDelay(this.requested.runway);
    },
    pushHistory: function() {
      this.history.push([this.position[0], this.position[1]]);
      if(this.history.length > 10) {
        this.history.splice(0, this.history.length-10);
      }
    },
    moveForward: function() {
      this.mode = "taxi";
      this.taxi_delay = 50;
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
    updateTarget: function() {
      var airport = airport_get();
      var runway  = null;

      var offset = null;

      var offset_angle = null;
      
      var glideslope_altitude = null;
      var glideslope_window   = null;

      var angle = null;

      if(this.requested.altitude > 0) this.requested.altitude = Math.max(1000, this.requested.altitude);

      if(this.requested.runway) {
        if((this.mode == "landing" || this.mode == "cruise") && this.category == "arrival") {
          airport = airport_get();
          runway  = airport.getRunway(this.requested.runway);
          
          offset = runway.getOffset(this.position, this.requested.runway, true);

          offset_angle = Math.atan2(offset[0], offset[1]);

          angle = runway.getAngle(this.requested.runway) + Math.PI;

          var landing_zone_offset = 0.5;

          glideslope_altitude = clamp(runway.getGlideslopeAltitude(offset[1] + landing_zone_offset, this.requested.runway), 5000);
          glideslope_window   = abs(runway.getGlideslopeAltitude(offset[1] + landing_zone_offset, this.requested.runway, radians(1)));

          if((abs(this.altitude - glideslope_altitude) < glideslope_window) && (offset_angle < radians(20))) {
            this.mode = "landing";
          } else if(this.altitude < 50 && this.mode == "landing") {
            this.mode = "landing";
          } else {
            this.mode = "cruise";
          }
        }
      } else if(this.mode == "landing" || this.mode == "cruise") {
        this.mode = "cruise";
      }

      if(this.mode == "landing") {
        if(offset[1] > 0.05) this.target.heading  = -(offset_angle - angle);
        else this.target.heading = -angle;

        if(offset[1] > 0.05) {
          this.target.heading = crange(-2, offset[0], 2, radians(45), -radians(45)) + angle;
        } else {
          this.target.heading = angle;
        }
//        this.target.heading = angle;

        this.target.altitude     = glideslope_altitude;
        this.target.expedite     = true;
        this.target.speed        = this.model.speed.landing;
        if(this.altitude < 10) this.target.speed = 0;
      }
      var was_taxi = false;
      if(this.mode == "taxi") {
        var elapsed = game_time() - this.taxi_start;
        if(elapsed > this.taxi_delay) {
          this.mode = "waiting";
          was_taxi = true;
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
          ui_log(this.getCallsign(), "ready for takeoff runway "+radio_runway(this.requested.runway));
        }
      }
      if(this.mode == "cruise") {
        this.target.heading = this.requested.heading;
        this.target.turn = this.requested.turn;

        this.target.altitude = this.requested.altitude;
        this.target.expedite = this.requested.expedite;

        this.target.speed = this.requested.speed;
        this.target.speed = clamp(this.model.speed.min, this.target.speed, this.model.speed.max);

        this.target.altitude = Math.max(1000, this.target.altitude);

        if(this.speed < this.model.speed.min) this.target.altitude = 0;
      }
      if(this.requested.hold) {
        if(this.requested.turn == "right") {
          this.target.heading = this.heading + Math.PI/4;
        } else if(this.requested.turn == "left") {
          this.target.heading = this.heading - Math.PI/4;
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
          } else if((offset < 0 && this.target.turn == "auto") || this.target.turn == "left") {
            this.heading -= turn_amount;
          } else if((offset > 0 && this.target.turn == "auto") || this.target.turn == "right") {
            this.heading += turn_amount;
          }
        }

        // ALTITUDE

        var distance = null;
        var expedite_factor = 1.7;
        this.trend = 0;
        if(this.target.altitude < this.altitude - 0.02) {
          distance = -this.model.rate.descent * game_delta() / expedite_factor;
          this.trend -= 1;
        } else if(this.target.altitude > this.altitude + 0.02) {
          distance =  this.model.rate.ascent  * game_delta() / expedite_factor;
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
          if(this.isLanded()) difference *= 2;
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
      var angle = this.heading;
      this.position[0] += (sin(angle) * (this.speed * 0.000514)) * game_delta();
      this.position[1] += (cos(angle) * (this.speed * 0.000514)) * game_delta();

      var wind_drift = [0, 0];

      this.position[0] += (sin(angle) * (this.speed * 0.000514)) * game_delta();
      this.position[1] += (cos(angle) * (this.speed * 0.000514)) * game_delta();
    },
    updateWarning: function() {
      if(this.isTaxiing()) return;
      var warning = false;
      for(var i=0;i<prop.aircraft.list.length;i++) {
        var other = prop.aircraft.list[i];
        if(this == other) continue;

        var other_land = other.isLanded();
        var this_land  = this.isLanded();

        if((!other_land && !this_land)) {
          if((distance2d(this.position, other.position) < 4.8) &&      // closer than 3 miles
             (abs(this.altitude - other.altitude) < 990)) {           // less than 1k feet
            warning = true;
          }
        } else {
          var airport = airport_get();
          if((airport.getRunway(other.requested.runway) === airport.getRunway(this.requested.runway)) &&     // on the same runway
             (distance2d(this.position, other.position) < 10) &&      // closer than 10km
             (abs(angle_offset(this.heading, other.heading)) > 10)) { // different directions
            warning = true;
          }
        }
        if((distance2d(this.position, other.position) < 0.05) &&      // closer than 50 meters
           (abs(this.altitude - other.altitude) < 50) &&
           (other.isVisible() && this.isVisible())) {           // less than 50 feet
          this.hit = true;
        }
      }
      this.warning = warning;
    },
    updateStrip: function() {
      var heading  = this.html.find(".heading");
      var altitude = this.html.find(".altitude");
      heading.removeClass("runway hold waiting taxi");
      altitude.removeClass("runway");

      heading.attr("title", "");

      if(this.isTaxiing() || this.mode == "landing") {
        heading.text(this.requested.runway);

        heading.addClass("runway");
        heading.attr("title", "On the ground pending taxi clearance");
        altitude.text("waiting");
        altitude.addClass("runway");

        if(this.mode == "taxi") {
          heading.addClass("taxi");
          heading.attr("title", "Taxi to runway "+this.requested.runway+" in progress");
        }
        if(this.mode == "waiting") {
          heading.addClass("waiting");
          heading.attr("title", "Waiting for takeoff clearance");
        }

        if(this.mode == "landing") {
          altitude.text(degrees(runway.glideslope[runway.getEnd(this.requested.runway)]).toFixed(2));
        }

      } else if(this.requested.hold) {
        heading.text("hold "+this.requested.turn);
        heading.addClass("hold");
        heading.attr("title", "Maintaining hold circle");

        altitude.text(degrees(runway.glideslope[runway.getEnd(this.requested.runway)]).toFixed(2));
      } else {
        var hdg = heading_to_string(this.requested.heading);
        heading.html(hdg + "&deg;");
        heading.attr("title", "Holding "+hdg+" degrees");

        altitude.text(round(this.requested.altitude));
      }
    },
    update: function() {
      this.updateTarget();
      this.updatePhysics();
      this.updateStrip();
    }
  };
});

function aircraft_init_pre() {
  prop.aircraft = {};
  prop.aircraft.models = {};
  prop.aircraft.callsigns = [];
  prop.aircraft.list = [];
  prop.aircraft.current  = null;
}

function aircraft_init() {
  aircraft_load("b734");
  aircraft_load("b738");

  aircraft_load("b744");

  aircraft_load("b772");
  aircraft_load("b77e");
  aircraft_load("b77w");
  aircraft_load("b788");

  aircraft_load("conc");
}

function aircraft_complete() {
  var start = [
    [[-60, 0],   90,  3000],
    [[60, 0],   270,  3000],
    [[-20, -20], 45,  2000],
  ];
  for(var i=0;i<start.length;i++) {
    break;
//    if(Math.random() > 0.2) continue;
    aircraft_new({
      icao: "B738",
      position: start[i][0],
      heading: radians(start[i][1]),
      speed: 200,
      category: "arrival",
      altitude: start[i][2]
    });
  }
  aircraft_add_departing();
}

function aircraft_add_departing() {
  return;
  aircraft_new({
    icao: "CONC",
    category: "departure",
  });
  game_timeout(aircraft_add_departing, crange(0, Math.random(), 1, 60, 120));
}

function aircraft_airline_new() {
  var airlines = [
    "UAL",
    "BAW",
  ];
  return choose(airlines);
}

function aircraft_generate_callsign(airline) {
  var callsign_length = airline_get(airline).callsign.length;
  var callsign = "";
  callsign += round((Math.random() * 8) + 1) + "";
  for(var i=0;i<callsign_length - 1;i++) callsign += round((Math.random() * 9)) + "";
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
  if(!options.airline) options.airline = aircraft_airline_new();
  if(!options.callsign) options.callsign = aircraft_callsign_new(options.airline);

  if(!options.icao) {
    options.icao = airline_get_aircraft(options.airline);
  }
  var icao = options.icao.toLowerCase();

  options.model = prop.aircraft.models[icao];

  var aircraft = new Aircraft(options);

  aircraft.complete();
  
  prop.aircraft.list.push(aircraft);
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
  var width2  = pixels_to_km((prop.canvas.size.width / 2)  + 80)*factor;
  var height2 = pixels_to_km((prop.canvas.size.height / 2) + 80)*factor;
  if(((aircraft.position[0] < -width2  || aircraft.position[0] > width2)) ||
     ((aircraft.position[1] < -height2 || aircraft.position[1] > height2))) {
    return false;
  }
  return true;
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
    if(!aircraft_visible(aircraft) && aircraft.category == "departure") {
      ui_log(aircraft.getCallsign() + " leaving radar coverage");
      console.log("departing aircraft no longer visible");
      remove = true;
    }
    if(!aircraft_visible(aircraft, 3) && aircraft.category == "arrival") {
      ui_log(aircraft.getCallsign() + " leaving radar coverage");
      console.log("arriving aircraft no longer visible. YU FAIL");
      remove = true;
    }
    if(aircraft.isStopped() && aircraft.category == "arrival") {
      ui_log(aircraft.getCallsign() + " switching to ground, good day");
      console.log("arriving aircraft no longer moving");
      remove = true;
    }
    if(aircraft.hit && aircraft.isLanded()) {
      ui_log("Lost radar contact with "+aircraft.getCallsign());
      console.log("aircraft hit and on the ground");
      remove = true;
    }
    if(remove) {
      aircraft.cleanup();
      prop.aircraft.list.splice(i, 1);
      i-=1;
    }
  }
}
