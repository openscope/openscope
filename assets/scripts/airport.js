
var Runway=Position.extend(function(base) {
  return {
    init: function(options) {
      if(!options) options={};
      base.init.call(this, options);

      this.name         = [null, null];
      this.name_offset  = [[0, 0], [0, 0]];
      this.length       = 1;
      this.glideslope   = [radians(3), radians(3)];
      this.angle        = 0;
      this.ils          = [false, false];
      this.ils_distance = [null, null];
      this.delay        = [2, 2];

      this.waiting      = [[], []];

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
    getILS: function(end) {
      end = this.getEnd(end);
      if(end == 0) return this.ils[0];
      return this.ils[1];
    },
    getILSDistance: function(end) {
      end = this.getEnd(end);
      if(end == 0) return this.ils_distance[0];
      return this.ils_distance[1];
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

      if(data.ils_distance) this.ils_distance = data.ils_distance;

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
      this.radio    = null;

      this.level    = null;

      this.runways  = [];

      this.runway   = null;

      this.fixes    = {};

      this.timeout  = {
        runway: null,
        departure: null
      };

      this.departures = {
        airlines: [],
        frequency: 1
      };
      this.arrivals   = [];

      this.wind     = {
        speed: 10,
        angle: 0
      };

      this.ctr_radius  = 80;

      this.parse(options);
      if(options.url) {
        this.load(options.url);
      }

    },
    getWind: function() {
      var wind = clone(this.wind);
      var s = 1;
      var angle_factor = Math.sin((s + game_time()) * 0.5) + Math.sin((s + game_time()) * 2);
      var s = 100;
      var speed_factor = Math.sin((s + game_time()) * 0.5) + Math.sin((s + game_time()) * 2);
      wind.angle += crange(-1, angle_factor, 1, radians(-4), radians(4));
      wind.speed *= crange(-1, speed_factor, 1, 0.9, 1.05);
      return wind;
    },
    parse: function(data) {
      if(data.name) this.name   = data.name;
      if(data.icao) this.icao   = data.icao;
      if(data.radio) this.radio = data.radio;
      if(data.ctr_radius) this.ctr_radius = data.ctr_radius;
      if(data.level) this.level = data.level;

      if(data.runways) {
        for(var i=0;i<data.runways.length;i++) {
          this.runways.push(new Runway(data.runways[i]));
        }
      }

      if(data.fixes) {
        for(var i in data.fixes) {
          this.fixes[i] = data.fixes[i];
        }
      }

      if(data.wind) {
        this.wind = data.wind;
        this.wind.angle = radians(this.wind.angle);
      }

      if(data.departures) {
        this.departures = data.departures;
        this.departures.frequency[0] *= 60;
        this.departures.frequency[1] *= 60;
      }

      if(data.arrivals) {
        for(var i=0;i<data.arrivals.length;i++) {
          var arrival = data.arrivals[i];
          if(!arrival.angle) arrival.angle = arrival.heading;
          arrival.heading       = radians(arrival.heading);
          arrival.frequency[0] *= 60;
          arrival.frequency[1] *= 60;

          if(typeof arrival.altitude == typeof 0)
            arrival.altitude = [arrival.altitude, arrival.altitude];

          this.arrivals.push(arrival);
        }
      }

    },
    set: function() {
      this.start = game_time();
      this.updateRunway();
      this.addAircraft();
    },
    unset: function() {
      for(var i=0;i<this.arrivals.length;i++) {
        if(this.arrivals[i].timeout)
          game_clear_timeout(this.arrivals[i].timeout);
      }
      if(this.timeout.departure) game_clear_timeout(this.timeout.departure);
      if(this.timeout.runway) game_clear_timeout(this.timeout.runway);
    },
    addAircraft: function() {
      if(this.departures) {
        var r = crange(0, Math.random(), 1, 1, 2);
        if(Math.random() > 0.9)
          r = crange(0, Math.random(), 1, 1, 6);
        for(var i=0;i<r;i++) {
          this.timeout.departure = game_timeout(this.addAircraftDeparture, Math.random() * 0.1, this, false);
        }
        this.addAircraftDeparture(true);
      }

      if(this.arrivals) {
        for(var i=0;i<this.arrivals.length;i++) {
          var arrival = this.arrivals[i];

          var delay = crange(0, Math.random(), 1, arrival.frequency[0], arrival.frequency[1]);
          if(Math.random() > 0.3) {
            delay = Math.random() * 0.1;
            game_timeout(this.addAircraftArrival, delay, this, [arrival, null, false]);
          }
          this.arrivals[i].timeout = game_timeout(this.addAircraftArrival, delay, this, [arrival, crange(0, Math.random(), 1, 0.5, 0.8), true]);
        }
      }

    },
    addAircraftDeparture: function(timeout) {
      if(timeout == undefined) timeout=false;
      var message = true;
      if(game_time() - this.start < 2) message = false;
      aircraft_new({
        category:  "departure",
        airline:   choose_weight(this.departures.airlines),
        message:   message
      });
      if(timeout)
        this.timeout.departure = game_timeout(this.addAircraftDeparture, crange(0, Math.random(), 1, this.departures.frequency[0] / prop.game.frequency, this.departures.frequency[1] / prop.game.frequency), this, true);
    },
    addAircraftArrival: function(args) {
      var arrival = args[0];
      var offset  = args[1];
      var timeout = args[2] > 0.5;
      if(timeout == undefined) timeout=false;
      if(!offset) offset = 1;

      var position = [0, 0];
      var width    = pixels_to_km((prop.canvas.size.width / 2)  - 50);
      var height   = pixels_to_km((prop.canvas.size.height / 2) - 50);
      var distance = Math.min(width, height);

      var wobble   = radians(15);

      var heading  = arrival.heading + crange(0, Math.random(), 1, -wobble, wobble);

      wobble       = crange(0, Math.random(), 1, -8, 8);
      distance     = 150;
      position[0] += sin(heading) * distance * offset + wobble;
      position[1] += cos(heading) * distance * offset + wobble;

      var altitude = crange(0, Math.random(), 1, arrival.altitude[0] / 1000, arrival.altitude[1] / 1000);
      altitude     = round(altitude * 2) * 500;

      var message = true;
      if(game_time() - this.start < 2) message = false;

      aircraft_new({
        category:  "arrival",
        position:  position,
        heading:   arrival.heading + Math.PI,
        altitude:  altitude,
        airline:   choose_weight(arrival.airlines),
        message:   message
      });

      if(timeout)
        arrival.timeout = game_timeout(this.addAircraftArrival, crange(0, Math.random(), 1, arrival.frequency[0] / prop.game.frequency, arrival.frequency[1] / prop.game.frequency), this, [arrival, null, true]);
    },
    updateRunway: function() {
      if(!length) length = 0;
      var wind = this.getWind();
      var headwind = {};
      function ra(n) {
        var deviation = radians(10);
        return n + crange(0, Math.random(), 1, -deviation, deviation);
      }
      for(var i=0;i<this.runways.length;i++) {
        var runway = this.runways[i];
        headwind[runway.name[0]] =  Math.cos(runway.angle - ra(wind.angle)) * wind.speed;
        headwind[runway.name[1]] = -Math.cos(runway.angle - ra(wind.angle)) * wind.speed;
      }
      var best_runway = "";
      var best_runway_headwind = -Infinity;
      for(var i in headwind) {
        if(headwind[i] > best_runway_headwind && this.getRunway(i).length > length) {
          best_runway = i;
          best_runway_headwind = headwind[i];
        }
      }
      this.runway = best_runway;
      this.timeout.runway = game_timeout(this.updateRunway, Math.random() * 30, this);
    },
    selectRunway: function(length) {
      return this.runway;
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
    getFix: function(name) {
      if(!name) return null;
      name = name.toLowerCase();
      for(var i in this.fixes) {
        if(i.toLowerCase() == name) return this.fixes[i];
      }
      return null;
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
  // Add your airports here

  // DEBUG AIRPORTS
  airport_load("kdbg");
  airport_load("ksra");

  // K*
  airport_load("ksfo");
  airport_load("kmsp");
  airport_load("kjfk");
//  airport_load("ksna");

  airport_load("ebbr");
  airport_load("eddh");
}

function airport_ready() {
  if(!('atc-last-airport' in localStorage) || !(localStorage['atc-last-airport'] in prop.airport.airports)) airport_set('kdbg');
  else airport_set();
}

function airport_load(icao) {
  icao = icao.toLowerCase();
  if(icao in prop.airport.airports) {
    console.log(icao + ": already loaded");
    return;
  }
  var airport=new Airport({icao: icao, url: "assets/airports/"+icao+".json"});
  airport_add(airport);
  return airport;
}

function airport_add(airport) {
  prop.airport.airports[airport.icao.toLowerCase()] = airport;
}

function airport_set(icao) {
  if(!icao) {
    if(!('atc-last-airport' in localStorage)) return;
    else icao = localStorage['atc-last-airport'];
  }
  icao = icao.toLowerCase();

  localStorage['atc-last-airport'] = icao;
  if(!(icao in prop.airport.airports)) {
    console.log(icao + ": no such airport");
    return;
  }
  if(prop.airport.current) {
    prop.airport.current.unset();
    aircraft_remove_all();
  }
  prop.airport.current = prop.airport.airports[icao];
  prop.airport.current.set();

  $('#airport').text(prop.airport.current.icao.toUpperCase());
  $('#airport').attr("title", prop.airport.current.name);

  prop.canvas.dirty = true;
}

function airport_get(icao) {
  if(!icao) return prop.airport.current;
  return prop.airport.airports[icao.toLowerCase()];
}
