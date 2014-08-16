
var Model=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};

      this.name        = null;
      this.icao        = null;

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

      if(this.category == "arrival") this.html.addClass("arrival");
      else                           this.html.addClass("departure");

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
    runCommand: function(command) {
      var s = command.match(/\S+/g);
      if(!s) {
        return false;
      }
      var mode = "";
      var data = "";
      if(s.length >= 1) mode = s[0].toLowerCase();
      if(s.length >= 2) data = s.slice(1).join(" ").toLowerCase();
      if(mode.length != 1) {
        console.log("invalid mode '" + mode + "'");
        return false;
      }

      // CLEARED

      if(mode == "c") {
        var control = "";
        var items = data.match(/\S+/g);
        var expedite = false;
        var turn = "auto";

        if(!items || items.length == 0) return false;

        if(items.length >= 1) data = items[0];
        if(items.length >= 2) {
          if(data.length <= 2) { // altitude
            if(items[1] == "x" || ("expedite").indexOf(items[1]) == 0) {
              expedite = true;
            } else {
              console.log("expected 'x', 'ex', or 'expedite' after altitude");
              return false;
            }
          } else if(data.length == 3) { // heading
            if(items[1] == "l" || ("left").indexOf(items[1]) == 0) {
              turn = "left";
            } else if(items[1] == "r" || ("right").indexOf(items[1]) == 0) {
              turn = "right";
            } else {
              console.log("expected 'l', 'left', 'r', 'right', or nothing after heading");
              return false;
            }
          } else {
            console.log("expected an altitude");
            return false;
          }
        }

        if(data.length == 3) {
          control = "heading";
        } else if(data.length == 2 || data.length == 1) {
          control = "altitude";
        } else {
          console.log("invalid length of " + data.length + " of '" + data + "', expected 2 or 3");
          return false;
        }

        var number = parseInt(data);
        if(isNaN(number)) {
          console.log("expected a number following 'c', got '"+data+"'");
          return false;
        }

        if(control == "altitude") {
          if(this.mode == "landing" || this.mode == "cruise") {
            this.mode = "cruise";
            this.requested.runway  = null;
          }
          this.requested.altitude = number * 1000;
          this.requested.expedite = expedite;
        } else if(control == "heading") {
          if(this.mode == "landing" || this.mode == "cruise") {
            this.mode = "cruise";
          }
          this.requested.heading = radians(number);
          this.requested.turn    = turn;
        }
      }
      
      // SPEED

      if(mode == "s") {
        var number = parseInt(data);

        if(isNaN(number)) {
          console.log("expected a number following 'c', got '"+data+"'");
          return false;
        }
        
        this.requested.speed = number;
      }

      // LAND

      if(mode == "l") {

        if(this.category != "arrival") {
          console.log("attempted to land an aircraft that needs to takeoff and depart");
          return false;
        }

        if(this.isLanded()) {
          console.log("attempted to reland an aircraft");
          return false;
        }

        var runway = airport_get().getRunway(data);

        if(!runway) {
          console.log("invalid runway '" + data + "'");
          return false;
        }

        this.requested.runway = data.toLowerCase();

      }

      // WAIT

      if(mode == "w") {

        if(this.category != "departure") {
          console.log("attempted to take off an aircraft that needs to arrive");
          return false;
        }

        if(!this.isLanded()) {
          console.log("attempted to re-takeoff an aircraft");
          return false;
        }

        var runway = airport_get().getRunway(this.requested.runway);

        runway.addQueue(this, this.requested.runway);

        this.mode = "taxi";

        this.taxi_start = game_time();

      }

      if(mode == "t") {

        if(this.category != "departure") {
          console.log("attempted to take off an aircraft that needs to arrive");
          return false;
        }

        if(!this.isLanded()) {
          console.log("attempted to re-takeoff an aircraft");
          return false;
        }

        if(this.mode != "waiting") {
          console.log("attempted to takeoff from wrong mode");
          return false;
        }

        if(this.requested.altitude <= 0) {
          console.log("attempted to takeoff without setting altitude");
          return false;
        }

        var runway = airport_get().getRunway(this.requested.runway);

        if(runway.isWaiting(this, this.requested.runway) != 0) {
          console.log("attempted to skip other waiting aircraft");
          return false;
        }

        if(runway.removeQueue(this, this.requested.runway)) {
          this.mode = "takeoff";
        }

      }

      // ABORT

      if(mode == "a") {
        if(this.mode == "landing") {
          this.requested.runway   = null;
        } else if(this.mode == "takeoff") {
          
        }
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
        this.mode = "apron";
      }
     
    },
    complete: function(data) {
      if(this.category == "departure" && this.isLanded()) {
        this.selectRunway();
      }
    },
    selectRunway: function() {
      this.requested.runway = airport_get().selectRunway(this.model.runway.takeoff);
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

      if(this.requested.runway) {
        if((this.mode == "landing" || this.mode == "cruise") && this.category == "arrival") {
          airport = airport_get();
          runway  = airport.getRunway(this.requested.runway);
          
          offset = runway.getOffset(this.position, this.requested.runway, true);

          offset_angle = Math.atan2(offset[0], offset[1]);

          angle = runway.getAngle(this.requested.runway) + Math.PI;

          var landing_zone_offset = 0.5;

          glideslope_altitude = clamp(0, runway.getGlideslopeAltitude(offset[1] + landing_zone_offset, this.requested.runway), 4000);
          glideslope_window   = abs(runway.getGlideslopeAltitude(offset[1] + landing_zone_offset, this.requested.runway, radians(20)));

          if((abs(this.altitude - glideslope_altitude) < glideslope_window) && (offset_angle < radians(30))) {
            this.mode = "landing";
          } else if(this.altitude < 50 && this.mode == "landing") {
            this.mode = "landing";
          } else {
            this.mode = "cruise";
          }
          this.mode = "landing";
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
        this.target.speed        = this.model.speed.landing;
        if(this.altitude < 10) this.target.speed = 0;
      }
      if(this.mode == "taxi") {
        var elapsed = game_time() - this.taxi_start;
        if(elapsed > this.taxi_delay) {
          this.mode = "waiting";
        }
      }
      if(this.mode == "waiting") {
        var runway = airport_get().getRunway(this.requested.runway);
        var position = runway.getPosition(this.requested.runway);

        this.position[0] = position[0];
        this.position[1] = position[1];

        this.heading     = runway.angle;
        if(runway.getEnd(this.requested.runway) == 1) this.heading += Math.PI;
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
      if(this.mode == "takeoff") {
        var runway = airport_get().getRunway(this.requested.runway);

        this.target.heading = runway.angle;

        if(runway.getEnd(this.requested.runway) == 1) this.target.heading += Math.PI;
        
        this.requested.heading = this.target.heading;
        
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
          if(this.isLanded()) difference *= 1.5;
        } else if(this.target.speed > this.speed + 0.01) {
          difference =  this.model.rate.accelerate * game_delta() / 2;
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
      if(this.isTaxiing())
        this.html.find(".heading").text(this.requested.runway);
      else if(this.mode == "landing")
        this.html.find(".heading").text(this.requested.runway);
      else
        this.html.find(".heading").text(round(degrees(this.requested.heading)));
      this.html.find(".altitude").text(round(this.target.altitude));
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
  prop.aircraft.list = [];
  prop.aircraft.current  = null;
}

function aircraft_init() {
  aircraft_load("B738");
  aircraft_load("CONC");
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
    "DLH",
    "VRD",
    "VEX",
    "QFA",
    "QTR",
    "AAL",
    "AFL",
    "AIB",
    "SMX",
    "BAW",
    "MPE",
    "CLX",
    "BWA",
    "CPA",
    "GLR",
    "DAL",
    "HAL",
  ];
  return choose(airlines);
}

function aircraft_callsign_new() {
  var callsign_length = 4;
  var callsign = "";
  callsign += round((Math.random() * 8) + 1) + "";
  for(var i=0;i<callsign_length - 1;i++) callsign += round((Math.random() * 8) + 1) + "";
  return callsign;
}

function aircraft_new(options) {
  if(!options.airline) options.airline = aircraft_airline_new();
  if(!options.callsign) options.callsign = aircraft_callsign_new();

  if(!options.icao) {
    options.icao = choose(airline_get(options.airline).aircraft);
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

function aircraft_visible(aircraft) {
  var width2  = pixels_to_km((prop.canvas.size.width / 2)  + 80);
  var height2 = pixels_to_km((prop.canvas.size.height / 2) + 80);
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
    if(!aircraft_visible(prop.aircraft.list[i]) && prop.aircraft.list[i].category == "departure") {
      console.log("departing aircraft no longer visible");
      remove = true;
    }
    if(prop.aircraft.list[i].isStopped() && prop.aircraft.list[i].category == "arrival") {
      console.log("arriving aircraft no longer moving");
      remove = true;
    }
    if(prop.aircraft.list[i].hit && prop.aircraft.list[i].isLanded()) {
      console.log("aircraft hit and on the ground");
      remove = true;
    }
    if(remove) {
      prop.aircraft.list[i].cleanup();
      prop.aircraft.list.splice(i, 1);
      i-=1;
    }
  }
}
