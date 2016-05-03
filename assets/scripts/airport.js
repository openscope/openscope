zlsa.atc.ArrivalFactory = function(airport, options) {
  if (options.type) {
    if (options.type == 'random')
      return new zlsa.atc.ArrivalBase(airport, options);
    if (options.type == 'cyclic')
      return new zlsa.atc.ArrivalCyclic(airport, options);
    if (options.type == 'wave')
      return new zlsa.atc.ArrivalWave(airport, options);
    throw "Unsupported arrival type: " + options.type;
  }

  return new zlsa.atc.ArrivalDefault(airport, options);
};

zlsa.atc.ArrivalDefault = Fiber.extend(function(base) {
  return {
    init: function(airport, options) {
      this.airport = airport;

      this.airlines = [];
      this.altitude = 0;
      this.frequency = [0, 0];
      this.heading = 0;
      this.waypoints = [];
      this.radial = 0;
      this.speed = null;

      this.timeout = null;

      this.parse(options);
    },
    parse: function(options) {
      this.airlines = options.airlines;

      if(typeof options.altitude == typeof 0)
        this.altitude = [options.altitude, options.altitude];
      else
        this.altitude = options.altitude;

      this.frequency = vscale(options.frequency, 60);

      if(!options.heading)
        options.heading = (options.radial + 180) % 360;

      this.heading = radians(options.heading);

      if(options.fixes) {
        options.waypoints = [];
        for (var i=0; i<options.fixes.length; i++) {
          options.waypoints.push({
            fix: options.fixes[i],
          });
        }
      }

      if (options.waypoints)
        this.waypoints = options.waypoints;

      this.radial = radians(options.radial);
      this.speed = options.speed;
    },
    // Stop this arrival from running.  Generally called when
    // switching to another airport.
    stop: function() {
      if(this.timeout)
          game_clear_timeout(this.timeout);
    },
    // Start this arrival, spawning initial aircraft as appropriate
    start: function() {
      var delay = random(this.frequency[0], this.frequency[1]);

      if(Math.random() > 0.3) {
        delay = Math.random() * 0.1;
        game_timeout(this.spawnAircraft, delay, this, [false, false]);
      }
      this.timeout =
        game_timeout(this.spawnAircraft, delay, this, [true, true]);
    },

    // Create an aircraft and schedule next arrival if appropriate
    spawnAircraft: function(args) {
      var start_flag   = args[0];
      var timeout_flag = args[1] || false;

      // Set heading within 15 degrees of specified
      var wobble   = radians(15);
      var radial   = this.radial + random(-wobble, wobble);
      var distance;
      if(start_flag) // At start, spawn aircraft closer but outside ctr_radius
        distance = this.airport.ctr_radius + random(10, 20);
      else
        distance = 2*this.airport.ctr_radius - random(2, 18);
      var position = [sin(radial) * distance, cos(radial) * distance];

      var altitude = random(this.altitude[0] / 1000,
                            this.altitude[1] / 1000);
      altitude     = round(altitude * 2) * 500;

      var message = true;
      if(game_time() - this.airport.start < 2) message = false;

      var airline = choose_weight(this.airlines);
      var fleet = null;
      var idx = airline.indexOf('/');
      if (idx > 0) {
        var arr = airline.split('/', 2);
        airline = arr[0];
        fleet = arr[1];
      }

      aircraft_new({
        category:  "arrival",
        airline:   airline,
        fleet:     fleet,
        altitude:  altitude,
        heading:   this.heading,
        waypoints: this.waypoints,
        message:   message,
        position:  position,
        speed:     this.speed
      });

      if(timeout_flag) {
        this.timeout =
          game_timeout(this.spawnAircraft,
                       this.nextInterval(),
                       this,
                       [false, true]);
      }
    },
    nextInterval: function() {
      return random(this.frequency[0] / prop.game.frequency,
                    this.frequency[1] / prop.game.frequency);
    }
  };
});

zlsa.atc.ArrivalBase = Fiber.extend(function(base) {
  return {
    init: function(airport, options) {
      this.airport = airport;

      this.airlines = [];
      this.altitude = [1000, 1000];
      this.frequency = [0, 0];
      this.heading = null;
      this.waypoints = [];
      this.radial = [0, 0];
      this.speed = 200;

      this.timeout = null;

      this.parse(options);
    },
    // Supported Arrival options
    // airlines: {array of array} List of airlines with weight for each
    // altitude: {array or integer} Altitude in feet or range of altitudes
    // frequency: {array or integer} Frequency in aircraft/hour or range of frequencies
    // heading: {array or integer} Heading in degrees or range of headings
    // fixes: {array} Set of fixes to traverse (eg. for STARs)
    // radial: {array or integer} Radial in degrees or range of radials
    // speed: {integer} Speed in knots of spawned aircraft
    parse: function(options) {
      this.airlines = options.airlines;

      if(typeof options.altitude == typeof 0)
        this.altitude = [options.altitude, options.altitude];
      else
        this.altitude = options.altitude;

      if (typeof options.frequency == typeof 0)
        this.frequency = [options.frequency, options.frequency]
      else
        this.frequency = options.frequency;

      if (typeof options.heading == typeof 0)
        this.heading = [radians(options.heading), radians(options.heading)];
      else if (options.heading) {
        this.heading[0] = radians(options.heading[0]);
        this.heading[1] = radians(options.heading[1]);
      }

      if(options.fixes) {
        options.waypoints = [];
        for (var i=0; i<options.fixes.length; i++) {
          options.waypoints.push({
            fix: options.fixes[i],
          });
        }
      }

      if (options.waypoints)
        this.waypoints = options.waypoints;

      if (typeof options.radial == typeof 0)
        this.radial = [radians(options.radial), radians(options.radial)];
      else {
        this.radial[0] = radians(options.radial[0]);
        this.radial[1] = radians(options.radial[1]);
      }

      if (options.speed)
        this.speed = options.speed;
    },
    // Stop this arrival from running.  Generally called when
    // switching to another airport.
    stop: function() {
      if(this.timeout)
          game_clear_timeout(this.timeout);
    },
    // Start this arrival, spawning initial aircraft as appropriate
    start: function() {
      var delay = random(0, 3600 / this.frequency[0]);

      if(Math.random() > 0.3) {
        delay = Math.random() * 0.1;
        game_timeout(this.spawnAircraft, delay, this, [false, false]);
      }
      this.timeout =
        game_timeout(this.spawnAircraft, delay, this, [true, true]);
    },

    // Create an aircraft and schedule next arrival if appropriate
    spawnAircraft: function(args) {
      var start_flag   = args[0];
      var timeout_flag = args[1] || false;

      // Set heading within 15 degrees of specified
      var radial   = random(this.radial[0], this.radial[1])

      var heading = null;
      if (this.heading)
        heading = random(this.heading[0], this.heading[1]);
      else
        heading = radial + Math.PI;
      var distance;
      if(start_flag) // At start, spawn aircraft closer but outside ctr_radius
        distance = this.airport.ctr_radius + random(10, 20);
      else
        distance = 2*this.airport.ctr_radius - 2;
      var position = [sin(radial) * distance, cos(radial) * distance];

      var altitude = random(this.altitude[0] / 1000,
                            this.altitude[1] / 1000);
      altitude     = round(altitude * 2) * 500;

      var message = true;
      if(game_time() - this.airport.start < 2) message = false;

      var airline = choose_weight(this.airlines);
      var fleet = null;
      var idx = airline.indexOf('/');
      if (idx > 0) {
        var arr = airline.split('/', 2);
        airline = arr[0];
        fleet = arr[1];
      }

      aircraft_new({
        category:  "arrival",
        airline:   airline,
        fleet:     fleet,
        altitude:  altitude,
        heading:   heading,
        waypoints: this.waypoints,
        message:   message,
        position:  position,
        speed:     this.speed
      });

      if(timeout_flag) {
        this.timeout =
          game_timeout(this.spawnAircraft,
                       this.nextInterval(),
                       this,
                       [null, true]);
      }
    },
    nextInterval: function() {
      return random((3600 / this.frequency[1]) * prop.game.frequency,
                    (3600 / this.frequency[0]) * prop.game.frequency);
    }
  };
});

zlsa.atc.ArrivalCyclic = zlsa.atc.ArrivalBase.extend(function(base) {
  return {
    init: function(airport, options) {
      this.period = 60*60;
      this.offset = -15 * 60; // Start at the peak

      base.init.call(this, airport, options);

      this._amplitude = (3600 / this.frequency[0]) / 2;
      this._average = (3600/this.frequency[0] + 3600/this.frequency[1]) / 2;
    },
    // Additional supported options
    // period: {integer} Optionally specify the length of a cycle in minutes
    // offset: {integer} Optionally specify when the cycle peaks in minutes
    parse: function(options) {
      base.parse.call(this, options);
      if (options.period)
        this.period = options.period * 60;
      if (options.offset)
        this.offset = -this.period/4 + options.offset * 60;
    },
    nextInterval: function() {
      return (this._amplitude *
        Math.sin(Math.PI*2 * ((game_time() + this.offset)/this.period))
        + this._average) / prop.game.frequency;
    }
  };
});

zlsa.atc.ArrivalWave = zlsa.atc.ArrivalBase.extend(function(base) {
  return {
    init: function(airport, options) {
      this.period = 60*60;
      this.offset = 0;

      base.init.call(this, airport, options);

      // Average number of aircraft per hour
      this._average = (this.frequency[0] + this.frequency[1]) / 2;

      // Time in seconds for 7.5 nmi in-trail separation
      this._separation = Math.ceil(7.5/this.speed * 3600);

      // Aircraft per wave
      this._count = Math.floor(this._average/3600 * this.period);

      if ((this.period / this._separation) < this._count) {
        console.log("Reducing average arrival frequency from " +
                    this._average +
                    "/hour to maintain minimum in trail separation");
        this._count = Math.floor(3600 / this._separation);
      }

      // length of a wave in seconds
      this._waveLength = this._separation * this._count - 1;

      // Offset to have center of wave at 0 time and _offset always positive
      this._offset = this._waveLength/2;
      this._offset -= this.offset;
      while (this._offset < 0) this._offset += this.period;
    },
    // Additional supported options
    // period: {integer} Optionally specify the length of a cycle in minutes
    // offset: {integer} Optionally specify the center of the wave in minutes
    parse: function(options) {
      base.parse.call(this, options);
      if (options.period)
        this.period = options.period * 60;
      if (this.period <= 0)
        throw "Period must be greater than 0";
      if (options.offset)
        this.offset += options.offset * 60;
    },
    nextInterval: function() {
      var position = (game_time() + this._offset) % this.period;
      if (position >= this._waveLength)
        return this.period - position;
      return this._separation / prop.game.frequency;
    },
  };
});

zlsa.atc.DepartureFactory = function(airport, options) {
  if (options.type) {
    if (options.type == 'random')
      return new zlsa.atc.DepartureRandom(airport, options);
    if (options.type == 'cyclic')
      return new zlsa.atc.DepartureCyclic(airport, options);
    if (options.type == 'wave')
      return new zlsa.atc.DepartureWave(airport, options);
    throw "Unsupported departure type: " + options.type;
  }

  return new zlsa.atc.DepartureDefault(airport, options);
};

zlsa.atc.DepartureBase = Fiber.extend(function(base) {
  return {
    init: function(airport, options) {
      this.airport = airport;

      this.airlines = [];
      this.destinations = [0];
      this.sids = {};
      this.frequency = [0, 0];

      this.timeout = null;

      this.parse(options);
    },
    // Supported Departure options
    // airlines: {array of array} List of airlines with weight for each
    // frequency: {array or integer} Frequency in aircraft/hour or range of frequencies
    // destinations: {array of string} List of SIDs or departure fixes for departures
    parse: function(options) {
      this.airlines = options.airlines;

      if (typeof options.frequency == typeof 0)
        this.frequency = [options.frequency, options.frequency]
      else
        this.frequency = options.frequency;

      if(options.sids) {
        this.sids = options.sids;
        for(var s in this.sids) {
          if(this.sids.hasOwnProperty(s)) {
            // Check each SID fix and log if not found in the airport fix list
            var fixList = this.sids[s];
            for(var i=0; i<fixList.length; i++) {
              var fixname = fixList[i];
              if(!this.airport.fixes[fixname])
                console.log("SID " + s + " fix not found: " + fixname);
            }
          }
        }
      }
      if (options.destinations) {
        this.destinations = [];
        for (var i=0;i<options.destinations.length;i++) {
            switch(typeof options.destinations[i]) {
              case "number":
                this.destinations.push(radians(options.destinations[i]));
              break;

              case "string":
                this.destinations.push(options.destinations[i]);
              break;

              default:
            }
        }
      }
    },
    // Stop this departure from running.  Generally called when
    // switching to another airport.
    stop: function() {
      if(this.timeout)
          game_clear_timeout(this.timeout);
    },
    // Start this departure, spawning initial aircraft as appropriate
    start: function() {
      var r = random(1, 2);
      if(Math.random() > 0.9)
        r = random(1, 6);
      for(var i=0;i<r;i++) {
        game_timeout(this.spawnAircraft, Math.random() * 0.1, this, false);
      }
      this.spawnAircraft(true);
    },

    // Create an aircraft and schedule next departure if appropriate
    spawnAircraft: function(timeout) {
      if(timeout == undefined) timeout=false;
      var message = true;
      if(game_time() - this.start < 2) message = false;

      var airline = choose_weight(this.airlines);
      var fleet = null;
      var idx = airline.indexOf('/');
      if (idx > 0) {
        var arr = airline.split('/', 2);
        airline = arr[0];
        fleet = arr[1];
      }

      aircraft_new({
        category:  "departure",
        destination: choose(this.destinations),
        airline:   airline,
        fleet:     fleet,
        message:   message
      });
      if(timeout)
        this.timeout = game_timeout(this.spawnAircraft,
                                    this.nextInterval(),
                                    this,
                                    true);
    },
    nextInterval: function() {
      // Frequency in minutes per aircraft
      return random((this.frequency[0] * 60) / prop.game.frequency,
                    (this.frequency[1] * 60) / prop.game.frequency);
    }
  };
});

zlsa.atc.DepartureDefault = zlsa.atc.DepartureBase;

zlsa.atc.DepartureRandom = zlsa.atc.DepartureBase.extend(function (base) {
  return {
    nextInterval: function () {
      return random((3600 / this.frequency[1]) / prop.game.frequency,
                    (3600 / this.frequency[0]) / prop.game.frequency);
    },
  };
});

zlsa.atc.DepartureCyclic = zlsa.atc.DepartureBase.extend(function (base) {
  return {
    init: function(airport, options) {
      this.period = 60*60;
      this.offset = -15 * 60; // Start at the peak

      base.init.call(this, airport, options);

      this._amplitude = (3600 / this.frequency[0]) / 2;
      this._average = (3600/this.frequency[0] + 3600/this.frequency[1]) / 2;
    },
    // Additional supported options
    // period: {integer} Optionally specify the length of a cycle in minutes
    // offset: {integer} Optionally specify when the cycle peaks in minutes
    parse: function(options) {
      base.parse.call(this, options);
      if (options.period)
        this.period = options.period * 60;
      if (options.offset)
        this.offset = -this.period/4 + options.offset * 60;
    },
    nextInterval: function() {
      return (this._amplitude *
        Math.sin(Math.PI*2 * ((game_time() + this.offset)/this.period))
        + this._average) / prop.game.frequency;
    },
  };
});

zlsa.atc.DepartureWave = zlsa.atc.DepartureCyclic.extend(function(base) {
  return {
    init: function(airport, options) {
      base.init.call(this, airport, options);

      // Time between aircraft in the wave
      this._separation = 10;

      // Aircraft per wave
      this._count = Math.floor(this._average/3600 * this.period);

      if ((this.period / this._separation) < this._count) {
        console.log("Reducing average departure frequency from " +
                    this._average +
                    "/hour to maintain minimum interval");
        this._count = Math.floor(3600 / this._separation);
      }

      // length of a wave in seconds
      this._waveLength = this._separation * this._count - 1;

      // Offset to have center of wave at 0 time
      this._offset = (this._waveLength - this._separation)/2 + this.offset;
    },
    nextInterval: function() {
      var position = (game_time() + this._offset) % this.period;
      if (position >= this._waveLength)
        return this.period - position;
      return this._separation / prop.game.frequency;
    },
  };
});

var Runway=Fiber.extend(function(base) {
  return {
    init: function(options, end) {
      if(!options) options={};
      this.angle          = null;
      this.delay          = 2;
      this.gps            = [];
      this.ils            = { enabled : true,
                              loc_maxDist : km(25),
                              gs_maxHeight : 9999,
                              gs_gradient : radians(3)
                            };
      this.labelPos       = [];
      this.length         = null;
      this.midfield       = [];
      this.name           = "";
      this.position       = [];
      this.queue          = [];
      this.sepFromAdjacent= km(3);

      this.parse(options, end);
    },
    addQueue: function(aircraft) {
      this.queue.push(aircraft);
    },
    removeQueue: function(aircraft, force) {
      if(this.queue[0] == aircraft || force) {
        this.queue.shift(aircraft);
        if(this.queue.length >= 1) {
          this.queue[0].moveForward();
        }
        return true;
      }
      return false;
    },
    isWaiting: function(aircraft) {
      return this.queue.indexOf(aircraft);
    },
    taxiDelay: function(aircraft) {
      return this.delay + Math.random() * 3;
    },
    getOffset: function(position, length) {
      position = [position[0], position[1]];
      position = vsub(position, this.position);
      var offset = [0, 0];
      offset[0]  = ( cos(this.angle) * position[0]) - (sin(this.angle) * position[1]);
      offset[1]  = (-sin(this.angle) * position[0]) - (cos(this.angle) * position[1]);
      return offset;
    },
    getGlideslopeAltitude: function(distance, /*optional*/ gs_gradient) {
      if(!gs_gradient) gs_gradient = this.ils.gs_gradient;
      distance = Math.max(0, distance);
      var rise = tan(abs(gs_gradient));
      return rise * distance * 3280;
    },
    parse: function(data, end) {
      if(data.delay) this.delay = data.delay[end];
      if(data.end) {
        var thisSide  = new Position(data.end[end], data.reference_position, data.magnetic_north);
        var farSide   = new Position(data.end[(end==0)?1:0], data.reference_position, data.magnetic_north);
        this.gps      = [thisSide.latitude, thisSide.longitude];       // GPS latitude and longitude position
        this.position = thisSide.position; // relative position, based on center of map
        this.length   = vlen(vsub(farSide.position, thisSide.position));
        this.midfield = vscale(vadd(thisSide.position, farSide.position), 0.5);
        this.angle    = vradial(vsub(farSide.position, thisSide.position));
      }
      if(data.ils) this.ils.enabled = data.ils[end];
      if(data.ils_distance) this.ils.loc_maxDist = data.ils_distance[end];
      if(data.ils_gs_maxHeight) this.ils.gs_maxHeight = data.ils_gs_maxHeight[end];
      if(data.glideslope) this.ils.gs_gradient = radians(data.glideslope[end]);
      if(data.name_offset) this.labelPos = data.name_offset[end];
      if(data.name) this.name = data.name[end];
      if(data.sepFromAdjacent) this.sepFromAdjacent = km(data.sepFromAdjacent[end]);
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
      this.real_fixes = {};
      this.sids     = {};
      this.restricted_areas = [];
      this.metadata = {
        rwy: {}
      };
      this.airspace = null; // array of areas under this sector's control. If null, draws circle with diameter of 'ctr_radius'
      this.perimeter= null; // area outlining the outermost lateral airspace boundary. Comes from this.airspace[0]

      this.timeout  = {
        runway: null,
        departure: null
      };

      this.departures = null;
      this.arrivals   = [];

      this.wind     = {
        speed: 10,
        angle: 0
      };

      this.ctr_radius  = 80;
      this.ctr_ceiling = 10000;
      this.initial_alt = 5000;

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
      if(data.position) this.position = new Position(data.position);
      if(data.magnetic_north) this.magnetic_north = radians(data.magnetic_north);
        else this.magnetic_north = 0;
      if(data.name) this.name   = data.name;
      if(data.icao) this.icao   = data.icao;
      if(data.radio) this.radio = data.radio;
      if(data.ctr_radius) this.ctr_radius = data.ctr_radius;
      if(data.ctr_ceiling) this.ctr_ceiling = data.ctr_ceiling;
      if(data.initial_alt) this.initial_alt = data.initial_alt;
      if(data.rr_radius_nm) this.rr_radius_nm = data.rr_radius_nm;
      if(data.rr_center) this.rr_center = data.rr_center;
      if(data.level) this.level = data.level;
      this.has_terrain = false || data.has_terrain;

      if (this.has_terrain) {
        this.loadTerrain();
      }

      if(data.airspace) { // create 3d polygonal airspace
        var areas = [];
        for(var i=0; i<data.airspace.length; i++) { // for each area
          var positions = [];
          for(var j=0; j<data.airspace[i].poly.length; j++) {  // for each point
            positions.push(new Position(data.airspace[i].poly[j],
                                        this.position, this.magnetic_north));
          }
          areas.push(new Area(positions, data.airspace[i].floor*100,
            data.airspace[i].ceiling*100, data.airspace[i].airspace_class));
        }
        this.airspace = areas;

        // airspace perimeter (assumed to be first entry in data.airspace)
        this.perimeter = areas[0];

        // change ctr_radius to point along perimeter that's farthest from rr_center
        var pos = new Position(this.perimeter.poly[0].position, this.position, this.magnetic_north);
        var len = nm(vlen(vsub(pos.position, this.position.position)));
        var apt = this;
        this.ctr_radius = Math.max(...$.map(this.perimeter.poly, function(v) {return vlen(vsub(v.position,new Position(apt.rr_center, apt.position, apt.magnetic_north).position));}));
      }
      
      if(data.runways) {
        for(var i in data.runways) {
          data.runways[i].reference_position = this.position;
          data.runways[i].magnetic_north = this.magnetic_north;
          this.runways.push( [new Runway(data.runways[i], 0),
                              new Runway(data.runways[i], 1)]);
        }
      }

      if(data.fixes) {
        for(var i in data.fixes) {
          var name = i.toUpperCase(),
              coord = new Position(data.fixes[i],
                                   this.position,
                                   this.magnetic_north);
          this.fixes[name] = coord.position;
          if (i.indexOf('_') != 0) {
            this.real_fixes[name] = coord.position;
          }
        }
      }

      if(data.sids) {
        this.sids = data.sids;
      }

      if(data.restricted) {
        var r = data.restricted,
          self = this;
        for(var i in r) {
          var obj = {};
          if (r[i].name) obj.name = r[i].name;
          obj.height = parseElevation(r[i].height);
          obj.coordinates = $.map(r[i].coordinates, function(v) {
            return [(new Position(v, self.position, self.magnetic_north)).position];
          });

          var coords = obj.coordinates,
              coords_max = coords[0],
              coords_min = coords[0];
              
          for (var i in coords) {
            var v = coords[i]; //.position;
            coords_max = [Math.max(v[0], coords_max[0]), Math.max(v[1], coords_max[1])];
            coords_min = [Math.min(v[0], coords_min[0]), Math.min(v[1], coords_min[1])];
          };

          obj.center = vscale(vadd(coords_max, coords_min), 0.5);
          self.restricted_areas.push(obj);
        }
      }

      if(data.wind) {
        this.wind = data.wind;
        this.wind.angle = radians(this.wind.angle);
      }

      if(data.departures) {
        this.departures = zlsa.atc.DepartureFactory(this, data.departures);
      }

      if(data.arrivals) {
        for(var i=0;i<data.arrivals.length;i++) {
          this.arrivals.push(zlsa.atc.ArrivalFactory(this, data.arrivals[i]));
        }
      }


      // ***** Generate Airport Metadata *****

      // Runway Metadata
      for(var rwy1 in this.runways) {
        for(var rwy1end in this.runways[rwy1]) {
          // setup primary runway object
          this.metadata.rwy[this.runways[rwy1][rwy1end].name] = {};

          for(var rwy2 in this.runways) {
            if(rwy1 == rwy2) continue;
            for(var rwy2end in this.runways[rwy2]) {
              //setup secondary runway subobject
              var r1  = this.runways[rwy1][rwy1end];
              var r2  = this.runways[rwy2][rwy2end];
              this.metadata.rwy[r1.name][r2.name] = {};

              // generate this runway pair's relationship data
              this.metadata.rwy[r1.name][r2.name].lateral_dist =
                distance2d(r1.position, r2.position);
              this.metadata.rwy[r1.name][r2.name].converging =
                raysIntersect(r1.position, r1.angle, r2.position, r2.angle);
              this.metadata.rwy[r1.name][r2.name].parallel =
                ( abs(angle_offset(r1.angle,r2.angle)) < radians(10) );
            }
          }
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
        this.arrivals[i].stop();
      }
      this.departures.stop();
      if(this.timeout.runway) game_clear_timeout(this.timeout.runway);
    },
    addAircraft: function() {
      if(this.departures) {
        this.departures.start();
      }

      if(this.arrivals) {
        for(var i=0;i<this.arrivals.length;i++) {
          this.arrivals[i].start();
        }
      }
    },
    updateRunway: function(length) {
      if(!length) length = 0;
      var wind = this.getWind();
      var headwind = {};
      function ra(n) {
        var deviation = radians(10);
        return n + crange(0, Math.random(), 1, -deviation, deviation);
      }
      for(var i=0;i<this.runways.length;i++) {
        var runway = this.runways[i];
        headwind[runway[0].name] = Math.cos(runway[0].angle - ra(wind.angle)) * wind.speed;
        headwind[runway[1].name] = Math.cos(runway[1].angle - ra(wind.angle)) * wind.speed;
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
    parseTerrain: function(data) {
      // terrain must be in geojson format
      var apt = this;
      apt.terrain = {};
      for (var i in data.features) {
        var f = data.features[i],
            ele = round(f.properties.elevation / .3048, 1000); // m => ft, rounded to 1K (but not divided)

        if (!apt.terrain[ele]) {
          apt.terrain[ele] = [];
        }

        var multipoly = f.geometry.coordinates;
        if (f.geometry.type == 'LineString') {
          multipoly = [[multipoly]];
        }
        if (f.geometry.type == 'Polygon') {
          multipoly = [multipoly];
        }

        $.each(multipoly, function(i, poly) {
          // multipoly contains several polys
          // each poly has 1st outer ring and other rings are holes
          apt.terrain[ele].push($.map(poly, function(line_string) { 
            return [
              $.map(line_string,
                function(pt) {
                  var pos = new Position(pt, apt.position, apt.magnetic_north);
                  pos.parse4326();
                  return [pos.position];
                }
              )
            ];
          }));
        });
      }
    },
    loadTerrain: function() {
      var terrain = new Content({
        type: "json",
        url:  'assets/airports/terrain/' + this.icao.toLowerCase() + '.geojson',
        that: this,
        callback: function(status, data) {
          if(status == "ok") {
            try {
              log('Parsing terrain');
              this.parseTerrain(data);
            }
            catch (e) {
              log(e.message);
            }
          }
        }
      });
    },
    load: function(url) {
      this.content = new Content({
        type: "json",
        url: url,
        that: this,
        callback: function(status, data) {
          if(status == "ok") {
            try {
              log('Parsing data');
              this.parse(data);
            }
            catch (e) {
              log(e.message);
            }
          }
        }
      });
    },
    getRestrictedAreas: function() {
      return this.restricted_areas || null;
    },
    getFix: function(name) {
      if(!name) return null;
      return this.fixes[name.toUpperCase()] || null;
    },
    getSID: function(id, trxn, rwy) {
      if(!(id && trxn && rwy)) return null;
      var fixes = [];
      var sid = this.sids[id];

      // runway portion
      if(sid.rwy.hasOwnProperty(rwy))
        for(var i=0; i<sid.rwy[rwy].length; i++) {
          if(typeof sid.rwy[rwy][i] == "string")
            fixes.push([sid.rwy[rwy][i], null]);
          else fixes.push(sid.rwy[rwy][i]);
        }
      
      // body portion
      if(sid.hasOwnProperty("body"))
        for(var i=0; i<sid.body.length; i++) {
          if(typeof sid.body[i] == "string")
            fixes.push([sid.body[i], null]);
          else fixes.push(sid.body[i]);
        }
      
      // transition portion
      if(sid.hasOwnProperty("transitions"))
        for(var i=0; i<sid.transitions[trxn].length; i++) {
          if(typeof sid.transitions[trxn][i] == "string")
            fixes.push([sid.transitions[trxn][i], null]);
          else fixes.push(sid.transitions[trxn][i]);
        }

      return fixes;
    },
    getSIDTransition: function(id) {
      // if no transitions (euro-style sid), return end fix
      if(!this.sids[id].hasOwnProperty("transitions"))
        return this.sids[id].icao;

      // if has transitions, return a randomly selected one
      var txns = Object.keys(this.sids[id].transitions);
      return txns[Math.floor(Math.random() * txns.length)];
    },
    getSIDName: function(id, rwy) {
      if(this.sids[id].hasOwnProperty("suffix"))
        return this.sids[id].name + " " + this.sids[id].suffix[rwy];
      else return this.sids[id].name;
    },
    getSIDid: function(id, rwy) {
      if(this.sids[id].hasOwnProperty("suffix"))
        return this.sids[id].icao + this.sids[id].suffix[rwy];
      else return this.sids[id].icao;
    },
    getRunway: function(name) {
      if(!name) return null;
      name = name.toLowerCase();
      for(var i=0;i<this.runways.length;i++) {
        if(this.runways[i][0].name.toLowerCase() == name) return this.runways[i][0];
        if(this.runways[i][1].name.toLowerCase() == name) return this.runways[i][1];
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
  airport_load("ebbr");
  airport_load("eddh");
  airport_load("eddm");
  airport_load("eddt");
  airport_load("eglc");
  airport_load("egll");
  airport_load("eham");
  airport_load("eidw");
  airport_load("einn");
  airport_load("engm");
  airport_load("kdca");
  airport_load("kjfk");
  airport_load("klax");
  airport_load("klax90");
  airport_load("kmsp");
  airport_load("ksan");
  airport_load("ksfo");
  airport_load("loww");
  airport_load("ltba");
  airport_load("saez");
  airport_load("sbgl");
  airport_load("sbgr");
  airport_load("uudd");
  airport_load("vhhh");
}

function airport_ready() {
  if(!('atc-last-airport' in localStorage) || !(localStorage['atc-last-airport'] in prop.airport.airports)) airport_set('ksfo');
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

  var airport = prop.airport.current;

  $('#airport')
    .text(prop.airport.current.icao.toUpperCase())
    .attr("title", airport.name);

  $('.toggle-restricted-areas').toggle(
    (prop.airport.current.restricted_areas || []).length > 0);

  $('.toggle-sids').toggle(
    !$.isEmptyObject(prop.airport.current.sids));

  prop.canvas.dirty = true;

  $('.toggle-terrain').toggle(
    !$.isEmptyObject(prop.airport.current.terrain));

  game_reset_score();
}

function airport_get(icao) {
  if(!icao) return prop.airport.current;
  return prop.airport.airports[icao.toLowerCase()];
}
