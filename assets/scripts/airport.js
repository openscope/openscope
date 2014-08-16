
var Runway=Position.extend(function(base) {
  return {
    init: function(options) {
      if(!options) options={};
      base.init.call(this, options);

      this.name        = [null, null];
      this.name_offset = [[0, 0], [0, 0]];
      this.length      = 1;
      this.glideslope  = [radians(3), radians(3)];
      this.angle       = 0;
      this.ils         = [false, false];
      this.delay       = [2, 2];

      this.waiting     = [[], []];

      this.parse(options);

    },
    addQueue: function(aircraft, end) {
      end = this.getEnd(end);
      this.waiting[end].push(aircraft);
    },
    removeQueue: function(aircraft, end) {
      end = this.getEnd(end);
      if(this.waiting[end][0] == aircraft) {
        this.waiting[end].shift(aircraft);
        if(this.waiting[end].length >= 1) {
          this.waiting[end][0].moveForward();
        }
        return true;
      }
      return false;
    },
    isWaiting: function(aircraft, end) {
      end = this.getEnd(end);
      return this.waiting[end].indexOf(aircraft);
    },
    taxiDelay: function(aircraft, end) {
      end = this.getEnd(end);
      return this.delay[end] + Math.random() * 3;
    },
    getOffset: function(position, end, length) {
      end = this.getEnd(end);
      position = [position[0], position[1]];

      position[0] -= this.position[0];
      position[1] -= this.position[1];

      var offset = [0, 0];
      offset[0]  = (-cos(this.angle) * position[0]) + (sin(this.angle) * position[1]);
      offset[1]  = ( sin(this.angle) * position[0]) + (cos(this.angle) * position[1]);
//      offset[1] *= -1;

      if(end == 0) {
        offset[0] *= -1;
        offset[1] *= -1;
      }

      if(length) {
        offset[1] -= this.length / 2;
      }
      return offset;

    },
    getAngle: function(end) {
      end = this.getEnd(end);
      if(end == 0) return this.angle + Math.PI;
      return this.angle;
    },
    getGlideslopeAltitude: function(distance, end, glideslope) {
      end = this.getEnd(end);
      if(!glideslope) glideslope = this.glideslope[end];
      glideslope = abs(glideslope);
      distance = Math.max(0, distance);
      var rise = tan(glideslope);
      return rise * distance * 3280;
    },
    getEnd: function(name) {
      if(typeof name == typeof 0) return name;
      if(typeof name == typeof "") {
        if(this.name[0].toLowerCase() == name.toLowerCase()) return 0;
        if(this.name[1].toLowerCase() == name.toLowerCase()) return 1;
      }
      return 0;
    },
    getPosition: function(end) {
      end = this.getEnd(end);
      var offset = [this.position[0], this.position[1]];
      if(end == 0) {
        offset[0] -= sin(this.angle) * (this.length / 2);
        offset[1] -= cos(this.angle) * (this.length / 2);
      } else {
        offset[0] += sin(this.angle) * (this.length / 2);
        offset[1] += cos(this.angle) * (this.length / 2);
      }
      return offset;
    },
    parse: function(data) {
      if(data.position) this.position = data.position;

      if(data.name) this.name = data.name;
      if(data.name_offset) this.name_offset = data.name_offset;

      if(data.length) this.length = data.length;
      if(data.angle) this.angle   = radians(data.angle);

      if(data.glideslope) this.glideslope = [radians(data.glideslope[0]), radians(data.glideslope[1])];

      if(data.ils) this.ils = data.ils;

      if(data.delay) this.delay = data.delay;
    },
  };
});

var Airport=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};

      this.name     = null;
      this.icao     = null;
      this.runways  = [];

      this.departures = [];
      this.arrivals   = [];

      this.wind     = {
        speed: 10,
        angle: 0
      };
      
      this.parse(options);
      if(options.url) {
        this.load(options.url);
      }

    },
    getWind: function() {
      return this.wind;
    },
    parse: function(data) {
      if(data.name) this.name = data.name;
      if(data.icao) this.icao = data.icao;

      if(data.runways) {
        for(var i=0;i<data.runways.length;i++) {
          this.runways.push(new Runway(data.runways[i]));
        }
      }

      if(data.departures) this.departures = data.departures;

      if(data.arrivals) {
        for(var i=0;i<data.arrivals.length;i++) {
          var arrival = data.arrivals[i];
          arrival.angle      = radians(arrival.angle);
          arrival.heading    = radians(arrival.heading);
          arrival.frequency *= 60;
          game_interval(this.addAircraftArrival, arrival.frequency, arrival);
          this.arrivals.push(arrival);
        }
      }
    },
    addAircraftArrival: function(arrival) {
      var position = [0, 0];
      var width    = pixels_to_km((prop.canvas.size.width / 2)  - 100);
      var height   = pixels_to_km((prop.canvas.size.height / 2) - 100);
      var distance = Math.min(width, height);
      position[0] += sin(arrival.angle) * distance;
      position[1] += cos(arrival.angle) * distance;

      distance    += Math.max(width, height) + pixels_to_km(200);
      position[0] += sin(arrival.heading) * distance;
      position[1] += cos(arrival.heading) * distance;
      aircraft_new({
        position:  position,
        heading:   arrival.heading + Math.PI,
        altitude:  arrival.altitude,
        airline:   choose(arrival.airlines),
      });
    },
    selectRunway: function(length) {
      if(!length) length = 0;
      var wind = this.getWind();
      var headwind = {};
      for(var i=0;i<this.runways.length;i++) {
        var runway = this.runways[i];
        headwind[runway.name[0]] =  Math.cos(runway.angle - wind.angle) * wind.speed;
        headwind[runway.name[1]] = -Math.cos(runway.angle - wind.angle) * wind.speed;
      }
      var best_runway = "";
      var best_runway_headwind = -Infinity;
      for(var i in headwind) {
        if(headwind[i] > best_runway_headwind && this.getRunway(i).length > length) {
          best_runway = i;
          best_runway_headwind = headwind[i];
        }
      }
      return best_runway;
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
    getRunway: function(name) {
      if(!name) return null;
      name = name.toLowerCase();
      for(var i=0;i<this.runways.length;i++) {
        if(this.runways[i].name[0].toLowerCase() == name) return this.runways[i];
        if(this.runways[i].name[1].toLowerCase() == name) return this.runways[i];
      }
      return null;
    }
  };
});

function airport_init_pre() {
  prop.airport = {};
  prop.airport.airports = {};
  prop.airport.current  = null;
}

function airport_init() {
  airport_load("kdbg");
  airport_set("kdbg");
}

function airport_load(icao) {
  icao = icao.toLowerCase();
  var airport=new Airport({icao: icao, url: "assets/airports/"+icao+".json"});
  airport_add(airport);
  return airport;
}

function airport_add(airport) {
  prop.airport.airports[airport.icao.toLowerCase()] = airport;
}

function airport_set(icao) {
  prop.airport.current = prop.airport.airports[icao.toLowerCase()];
}

function airport_get(icao) {
  if(!icao) return prop.airport.current;
  return prop.airport.airports[icao.toLowerCase()];
}
