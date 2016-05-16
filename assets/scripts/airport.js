/**************************** AIRCRAFT GENERATION ****************************/


/** Calls constructor of the appropriate arrival type
 */
zlsa.atc.ArrivalFactory = function(airport, options) {
  if (options.type) {
    if (options.type == 'random')
      return new zlsa.atc.ArrivalBase(airport, options);
    if (options.type == 'cyclic')
      return new zlsa.atc.ArrivalCyclic(airport, options);
    if (options.type == 'wave')
      return new zlsa.atc.ArrivalWave(airport, options);
    if (options.type == 'surge')
      return new zlsa.atc.ArrivalSurge(airport, options);
    log(airport.icao + ' using unsupported arrival type "'+options.type+'"', LOG_WARNING);
  }
  else log(airport.icao + " arrival stream not given type!", LOG_WARNING);
};

/** Generate arrivals at random, averaging the specified arrival rate
 */
zlsa.atc.ArrivalBase = Fiber.extend(function(base) {
  return {
    init: function(airport, options) {
      this.airlines = [];
      this.airport = airport;
      this.altitude = [1000, 1000];
      this.frequency = 0;
      this.heading = null;
      this.radial = 0;
      this.speed = 250;
      this.timeout = null;
      this.fixes = [];
      this.route = "";

      this.parse(options);
    },
    /** Arrival Stream Settings
     ** airlines: {array of array} List of airlines with weight for each
     ** altitude: {array or integer} Altitude in feet or range of altitudes
     ** frequency: {integer} Arrival rate along this stream, in aircraft per hour (acph)
     ** heading: {integer} Heading to fly when spawned, in degrees (don't use w/ fixes)
     ** fixes: {array} Set of fixes to traverse (eg. for STARs). Spawns at first listed.
     ** radial: {integer} bearing from airspace center to spawn point (don't use w/ fixes)
     ** speed: {integer} Speed in knots of spawned aircraft
     */
    parse: function(options) {
      var params = ['airlines', 'altitude', 'frequency', 'speed'];
      for(var i in params) {  // Populate the data
        if(options[params[i]]) this[params[i]] = options[params[i]];
      }

      // Make corrections to data
      if(options.radial) this.radial = radians(options.radial);
      if(options.heading) this.heading = radians(options.heading);
      if(typeof this.altitude == "number") this.altitude = [this.altitude, this.altitude];
      if(options.route) this.route = options.route;
      else if(options.fixes) {
        for (var i=0; i<options.fixes.length; i++)
          this.fixes.push({fix: options.fixes[i]});
      }
    },
    /** Stop this arrival stream
     */
    stop: function() {
      if(this.timeout) game_clear_timeout(this.timeout);
    },
    /** Start this arrival stream
     */
    start: function() {
      var delay = random(0, 3600 / this.frequency);
      this.timeout = game_timeout(this.spawnAircraft, delay, this, [true, true]);
    },
    /** Spawn a new aircraft
     */
    spawnAircraft: function(args) {
      var start_flag   = args[0];
      var timeout_flag = args[1] || false;
      var altitude = round(random(this.altitude[0], this.altitude[1])/1000)*1000;
      var message = !(game_time() - this.airport.start < 2);
      if(this.fixes.length > 1) {  // spawn at first fix
        var position = airport_get().getFix(this.fixes[0].fix); // spawn at first fix
        var heading = vradial(vsub(airport_get().getFix(this.fixes[1].fix), position));
      }
      else if(this.route) { // STAR data is present
        var star = airport_get().getSTAR(this.route.split('.')[1],this.route.split('.')[0],airport_get().runway);
        var position = airport_get().getFix(star[0][0]);
        var heading = vradial(vsub(airport_get().getFix(star[1][0]), position));
      }
      else {  // spawn outside the airspace along 'this.radial'
        var distance = 2 * this.airport.ctr_radius;
        var position = [sin(this.radial) * distance, cos(this.radial) * distance];
        var heading = this.heading || this.radial + Math.PI;
      }
      var airline = choose_weight(this.airlines);
      if(airline.indexOf('/') > -1) {
        var fleet = airline.split('/')[1];
        airline   = airline.split('/')[0];
      }

      aircraft_new({
        category:  "arrival",
        destination:airport_get().icao,
        airline:   airline,
        fleet:     fleet,
        altitude:  altitude,
        heading:   heading,
        waypoints: this.fixes,
        route:     this.route,
        message:   message,
        position:  position,
        speed:     this.speed
      });

      if(timeout_flag) {
        this.timeout = game_timeout(this.spawnAircraft, 
          this.nextInterval(), this, [null, true]);
      }
    },
    /** Determine delay until next spawn
     */
    nextInterval: function() {
      var min_entrail = 5.5;  // nautical miles
      var min_interval = min_entrail * (3600/this.speed); // in seconds
      var tgt_interval = 3600/this.frequency;
      if(tgt_interval < min_interval) {
        tgt_interval = min_interval;
        log("Requested arrival rate of "+this.frequency+" acph overridden to " +
          "maintain minimum of "+min_entrail+" miles entrail on arrival stream " +
          "following route "+ $.map(this.fixes,function(v){return v.fix;}).join('-'), LOG_INFO);
      }
      var max_interval = tgt_interval + (tgt_interval - min_interval);
      return random(min_interval, max_interval);
    }
  };
});

/** Generate arrivals in cyclic pattern
 ** Arrival rate varies as pictured below. Rate at which the arrival rate
 ** increases or decreases remains constant throughout the cycle.
 ** |---o---------------o---------------o---------------o-----------| < - - - - - - max arrival rate
 ** | o   o           o   o           o   o           o   o         |   +variation
 ** o-------o-------o-------o-------o-------o-------o-------o-------o < - - - - - - avg arrival rate
 ** |         o   o |         o   o           o   o           o   o |   -variation
 ** |-----------o---|-----------o---------------o---------------o---| < - - - - - - min arrival rate
 ** |<---period---->|           |<---period---->|
 */
zlsa.atc.ArrivalCyclic = zlsa.atc.ArrivalBase.extend(function(base) {
  return {
    init: function(airport, options) {
      this.cycleStart = 0;  // game time
      this.offset = 0;      // Start at the average, and increasing
      this.period = 1800;   // 30 minute cycle
      this.variation = 0;   // amount to deviate from the prescribed frequency

      base.init.call(this, airport, options);
      base.parse.call(this, options);
      this.parse(options);
    },
    /** Arrival Stream Settings
     ** @param {integer} period - (optional) length of a cycle, in minutes
     ** @param {integer} offset - (optional) minutes to shift starting position in cycle
     */
    parse: function(options) {
      if(options.offset) this.offset = options.offset * 60; // min --> sec
      if(options.period) this.period = options.period * 60; // min --> sec
      if(options.variation) this.variation = options.variation;
    },
    start: function() {
      this.cycleStart = prop.game.time - this.offset;
      var delay = random(0, 3600 / this.frequency);
      this.timeout = game_timeout(this.spawnAircraft, delay, this, [true, true]);
    },
    nextInterval: function() {
      var t = prop.game.time - this.cycleStart;
      var done = t / (this.period/4); // progress in current quarter-period
      if(done >= 4) {
        this.cycleStart += this.period;
        return 3600/(this.frequency + (done-4)*this.variation);
      }
      else if(done <= 1)
        return 3600/(this.frequency + done*this.variation);
      else if(done <= 2)
        return 3600/(this.frequency + (2*(this.period - 2*t)/this.period)*this.variation);
      else if(done <= 3)
        return 3600/(this.frequency - (done-2)*this.variation);
      else if(done <  4)
        return 3600/(this.frequency - (4*(this.period - t) / this.period)*this.variation);
    }
  };
});

/** Generate arrivals in a repeating wave
 ** Arrival rate varies as pictured below. Arrival rate will increase
 ** and decrease faster when changing between the lower/higher rates.
 ** ------------o-o-o---------------------------------------+-----------o-o < - - - - - max arrival rate
 **        o             o                                  |      o      |       ^
 **    o                     o                              |  o          |  +variation
 **  o                         o                            |o            |       v
 ** o-------------------------- o---------------------------o-------------+ < - - - - - avg arrival rate
 ** |                            o                         o|             |       ^
 ** |                              o                     o  |             |  -variation
 ** |                                  o             o      |             |       v
 ** +---------------------------------------o-o-o-----------+-------------+ < - - - - - min arrival rate
 ** |                                                       |
 ** |<  -  -  -  -  -  -  -  - period -  -  -  -  -  -  -  >|
 */
zlsa.atc.ArrivalWave = zlsa.atc.ArrivalBase.extend(function(base) {
  return {
    init: function(airport, options) {
      this.cycleStart = 0;  // game time
      this.offset = 0;      // Start at the average, and increasing
      this.period = 1800;   // 30 minute cycle
      this.variation = 0;   // amount to deviate from the prescribed frequency

      base.init.call(this, airport, options);
      base.parse.call(this, options);
      this.parse(options);
      this.clampSpawnRate(5.5); // minimum of 5.5nm entrail
    },
    /** Arrival Stream Settings
     ** @param {integer} period - (optional) length of a cycle, in minutes
     ** @param {integer} offset - (optional) minutes to shift starting position in cycle
     */
    parse: function(options) {
      if(options.offset) this.offset = options.offset * 60; // min --> sec
      if(options.period) this.period = options.period * 60; // min --> sec
      if(options.variation) this.variation = options.variation;
    },
    /** Ensures the spawn rate will be at least the required entrail distance
     ** @param {number} entrail_dist - minimum distance between successive arrivals, in nm
     */
    clampSpawnRate: function(entrail_dist) {
      var entrail_interval = entrail_dist * (3600/this.speed);
      var min_interval = 3600 / (this.frequency + this.variation);

      if(min_interval < entrail_interval) {
        var diff = entrail_interval - min_interval;
        if(diff <= 3600/this.variation) {  // can reduce variation to achieve acceptable spawn rate
          log("Requested arrival rate variation of +/-"+this.variation+" acph reduced to " + 
            "maintain minimum of "+entrail_dist+" miles entrail on arrival stream following " +
            "route "+$.map(this.fixes,function(v){return v.fix;}).join('-'), LOG_WARNING);
          this.variation = this.variation - 3600/diff; // reduce the variation
        }
        else {  // need to reduce frequency to achieve acceptable spawn rate
          log("Requested arrival rate of "+this.frequency+" acph overridden to " +
            "maintain minimum of "+entrail_dist+" miles entrail on arrival stream " +
            "following route "+ $.map(this.fixes,function(v){return v.fix;}).join('-'), LOG_WARNING);
          this.variation = 0; // make spawn at constant interval
          this.frequency = 3600/entrail_interval; // reduce the frequency
        }
      }
    },
    nextInterval: function() {
      var t = prop.game.time - this.cycleStart;
      var done = t / this.period; // progress in period
      if(done >= 1) this.cycleStart += this.period;
      var rate = this.frequency + this.variation*Math.sin(done*Math.PI*2);
      return 3600/rate;
    },
    start: function() {
      var delay = random(0, 3600 / this.frequency);
      this.cycleStart = prop.game.time - this.offset + delay;
      this.timeout = game_timeout(this.spawnAircraft, delay, this, [true, true]);
    }
  };
});

/** Generate arrivals in a repeating surge
 ** Arrival rate goes from very low and steeply increases to a
 ** sustained "arrival surge" of densely packed aircraft.
 ** o o o o o o o o o o - - - - - - - - - - - o o o o o o o o o o-----+ < - - - max arrival rate (n*this.factor)
 ** o                 o                       o                 o     |         
 ** o                 o                       o                 o     |   x(this.factor)
 ** o                 o                       o                 o     |
 ** o - - - - - - - - o o o o o o o o o o o o o - - - - - - - - o o o-+ < - - - min arrival rate (n)
 ** |<--- up time --->|<----- down time ----->|<--- up time --->|
 */
zlsa.atc.ArrivalSurge = zlsa.atc.ArrivalBase.extend(function(base) {
  return {
    init: function(airport, options) {
      this.cycleStart = 0;      // game time
      this.offset = 0;          // Start at the beginning of the surge
      this.period = 1800;       // 30 minute cycle
      this.entrail = [5.5, 10]; // miles entrail during the surge [fast,slow]
      
      // Calculated
      this.uptime = 0;      // time length of surge, in minutes
      this.acph_up = 0;     // arrival rate when "in the surge"
      this.acph_dn = 0;     // arrival rate when not "in the surge"

      base.init.call(this, airport, options);
      base.parse.call(this, options);
      this.parse(options);
      this.shapeTheSurge();
    },
    /** Arrival Stream Settings
     ** @param {integer} period - Optionally specify the length of a cycle in minutes
     ** @param {integer} offset - Optionally specify the center of the wave in minutes
     ** @param {array} entrail - 2-element array with [fast,slow] nm between each
     **                          successive arrival. Note that the entrail distance on
     **                          the larger gap ("slow") will be adjusted slightly in
     **                          order to maintain the requested frequency. This is
     **                          simply due to the fact that we can't divide perfectly
     **                          across each period, so we squish the gap a tiny bit to
     **                          help us hit the mark on the aircraft-per-hour rate.
     */
    parse: function(options) {
      if(options.offset) this.offset = options.offset * 60; // min --> sec
      if(options.period) this.period = options.period * 60; // min --> sec
      if(options.entrail) this.entrail = options.entrail;
    },
    /** Determines the time spent at elevated and slow spawn rates
     */
    shapeTheSurge: function() {
      this.acph_up = this.speed / this.entrail[0];
      this.acph_dn = this.speed / this.entrail[1];  // to help the uptime calculation
      this.uptime = (this.period*this.frequency - this.period*this.acph_dn) /
                    (this.acph_up - this.acph_dn);
      this.uptime -= this.uptime%(3600/this.acph_up);
      this.acph_dn = Math.floor(this.frequency*this.period/3600 -
          Math.round(this.acph_up*this.uptime/3600)) * 3600/(this.period-this.uptime);      // adjust to maintain correct acph rate

      // Verify we can comply with the requested arrival rate based on entrail spacing
      if(this.frequency > this.acph_up) {
        log(this.airport.icao+": TOO MANY ARRIVALS IN SURGE! Requested: "
          +this.frequency+"acph | Acceptable Range for requested entrail distance: "
          +Math.ceil(this.acph_dn)+"acph - "+Math.floor(this.acph_up)+"acph", LOG_WARNING);
        this.frequency = this.acph_up;
        this.acph_dn = this.acph_up;
      }
      else if(this.frequency < this.acph_dn) {
        log(this.airport.icao+": TOO FEW ARRIVALS IN SURGE! Requested: "
          +this.frequency+"acph | Acceptable Range for requested entrail distance: "
          +Math.ceil(this.acph_dn)+"acph - "+Math.floor(this.acph_up)+"acph", LOG_WARNING);
        this.frequency = this.acph_dn;
        this.acph_up = this.acph_dn;
      }
    },
    nextInterval: function() {
      var t = prop.game.time - this.cycleStart;
      var done = t / this.period; // progress in period
      var interval_up = 3600/this.acph_up;
      var interval_dn = 3600/this.acph_dn;
      if(done >= 1) {
        this.cycleStart += this.period;
        return interval_up;
      }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
      if(t <= this.uptime) {  // elevated spawn rate
        return interval_up;
      }
      else {  // reduced spawn rate
        var timeleft = this.period - t;
        if(timeleft > interval_dn + interval_up) { // plenty of time until new period
          return interval_dn;
        }
        else if(timeleft > interval_dn) {  // next plane will delay the first arrival of the next period
          return interval_dn - (t+interval_dn+interval_up - this.period);
        }
        else {  // next plane is first of elevated spawn rate
          this.cycleStart += this.period;
          return interval_up;
        }
      }
    },
    start: function() {
      var delay = random(0, 3600 / this.frequency);
      this.cycleStart = prop.game.time - this.offset + delay;
      this.timeout = game_timeout(this.spawnAircraft, delay, this, [true, true]);
    }
  };
});

/** Calls constructor of the appropriate arrival type
 */
zlsa.atc.DepartureFactory = function(airport, options) {
  if (options.type) {
    if (options.type == 'random')
      return new zlsa.atc.DepartureBase(airport, options);
    if (options.type == 'cyclic')
      return new zlsa.atc.DepartureCyclic(airport, options);
    if (options.type == 'wave')
      return new zlsa.atc.DepartureWave(airport, options);
    log(airport.icao + ' using unsupported departure type "'+options.type+'"', LOG_WARNING);
  }
  else log(airport.icao + " departure stream not given type!", LOG_WARNING);
};

/** Generate departures at random, averaging the specified spawn rate
 */
zlsa.atc.DepartureBase = Fiber.extend(function(base) {
  return {
    /** Initialize member variables with default values
     */
    init: function(airport, options) {
      this.airlines = [];
      this.airport = airport;
      this.destinations = [0];
      this.frequency = 0;
      this.timeout = null;

      this.parse(options);
    },
    /** Departure Stream Settings
     ** @param {array of array} airlines - List of airlines with weight for each
     ** @param {integer} frequency - Spawn rate, in aircraft per hour (acph)
     ** @param {array of string} destinations - List of SIDs or departure fixes for departures
     */
    parse: function(options) {
      var params = ['airlines', 'destinations', 'frequency'];
      for(var i in params) {
        if(options[params[i]]) this[params[i]] = options[params[i]];
      }
    },
    /** Stop this departure stream
     */
    stop: function() {
      if(this.timeout) game_clear_timeout(this.timeout);
    },
    /** Start this departure stream
     */
    start: function() {
      var r = Math.floor(random(2, 5.99));
      for(var i=1;i<=r;i++) this.spawnAircraft(false); // spawn 2-5 departures to start with
      this.timeout = game_timeout(this.spawnAircraft, random(this.frequency*.5 , // start spawning loop
        this.frequency*1.5), this, true);
    },
    /** Spawn a new aircraft
     */
    spawnAircraft: function(timeout) {
      var message = (game_time() - this.start >= 2);
      var airline = choose_weight(this.airlines);
      if (airline.indexOf('/') > -1) {
        var fleet = airline.split('/', 2)[1];
        airline = airline.split('/', 2)[0];
      }

      aircraft_new({
        category:  "departure",
        destination: choose(this.destinations),
        airline:   airline,
        fleet:     fleet,
        message:   message
      });

      if(timeout) {
        this.timeout = game_timeout(this.spawnAircraft,
          this.nextInterval(), this, true);
      }
    },
    /** Determine delay until next spawn
     */
    nextInterval: function() {
      var min_interval = 5; // fastest possible between back-to-back departures, in seconds
      var tgt_interval = 3600 / this.frequency;
      var max_interval = tgt_interval + (tgt_interval - min_interval);
      return random(min_interval, max_interval);
    }
  };
});

/** Generate departures in cyclic pattern
 */
zlsa.atc.DepartureCyclic = zlsa.atc.DepartureBase.extend(function (base) {
  return {
    init: function(airport, options) {
      this.period = 60*60;
      this.offset = -15 * 60; // Start at the peak

      base.init.call(this, airport, options);

      this._amplitude = 3600 / this.frequency / 2;
      this._average = 3600/this.frequency;
    },
    /** Additional supported options
     ** period: {integer} Optionally specify the length of a cycle in minutes
     ** offset: {integer} Optionally specify when the cycle peaks in minutes
     */
    parse: function(options) {
      base.parse.call(this, options);
      if(options.period) this.period = options.period * 60;
      if(options.offset) this.offset = -this.period/4 + options.offset * 60;
    },
    nextInterval: function() {
      return (this._amplitude *
        Math.sin(Math.PI*2 * ((game_time() + this.offset)/this.period))
        + this._average) / prop.game.frequency;
    },
  };
});

/** Generate departures in a repeating wave
 */
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


/***************************** AIRPORT STRUCTURE *****************************/


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
    inQueue: function(aircraft) {
      return this.queue.indexOf(aircraft);
    },
    taxiDelay: function(aircraft) {
      return this.delay + Math.random() * 3;
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
      if(data.ils_distance) this.ils.loc_maxDist = km(data.ils_distance[end]);
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
      this.stars    = {};
      this.maps     = {};
      this.airways  = {};
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
        this.sids = data.sids;  // import the sids
        for(var s in this.sids) { // Check each SID fix and log if not found in the airport fix list
          if(this.sids.hasOwnProperty(s)) {
            var fixList = this.sids[s];
            for(var i=0; i<fixList.length; i++) {
              var fixname = fixList[i];
              if(!this.airport.fixes[fixname])
                log("SID " + s + " fix not found: " + fixname, LOG_WARNING);
            }
          }
        }
      }
      
      if(data.stars) this.stars = data.stars;
      if(data.airways) this.airways = data.airways;

      if(data.maps) {
        for(var m in data.maps) {
          this.maps[m] = [];
          var lines = data.maps[m];
          for(var i in lines) { // convert GPS coordinates to km-based position rel to airport
            var start = new Position([lines[i][0],lines[i][1]], this.position, this.magnetic_north).position;
            var end   = new Position([lines[i][2],lines[i][3]], this.position, this.magnetic_north).position;
            this.maps[m].push([start[0], start[1], end[0], end[1]]);
          }
        }
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
          if(!data.arrivals[i].hasOwnProperty("type"))
            log(this.icao + " arrival stream #" + i + " not given type!", LOG_WARNING);
          else this.arrivals.push(zlsa.atc.ArrivalFactory(this, data.arrivals[i]));
        }
      }

      this.checkFixes();  // verify we know where all the fixes are


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
      if(Object.keys(airport_get().fixes).indexOf(name.toUpperCase()) == -1) return;
      else return airport_get().fixes[name.toUpperCase()];
    },
    getSID: function(id, trxn, rwy) {
      if(!(id && trxn && rwy)) return null;
      if(Object.keys(this.sids).indexOf(id) == -1) return;
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
    /** Return an array of [Waypoint, fixRestrictions] for a given STAR
     ** @param {string} id - the identifier for the STAR (eg 'LENDY6')
     ** @param {string} trn - the transition from which to join the STAR
     ** @param {string} rwy - (optional) the planned arrival runway
     ** Note: Passing a value for 'rwy' will help the fms distinguish between
     **       different branches of a STAR, when it splits into different paths
     **       for landing on different runways (eg 'HAWKZ4, landing south' vs
     **       'HAWKZ4, landing north'). Not strictly required, but not passing
     **       it will cause an incomplete route in many cases (depends on the
     **       design of the actual STAR in the airport's json file).
     */
    getSTAR: function(id, trxn, /*optional*/ rwy) {
      if(!(id && trxn) || Object.keys(this.stars).indexOf(id) == -1) return null;
      var fixes = [];
      var star = this.stars[id];

      // transition portion
      if(star.hasOwnProperty("transitions"))
        for(var i=0; i<star.transitions[trxn].length; i++) {
          if(typeof star.transitions[trxn][i] == "string")
            fixes.push([star.transitions[trxn][i], null]);
          else fixes.push(star.transitions[trxn][i]);
        }

      // body portion
      if(star.hasOwnProperty("body"))
        for(var i=0; i<star.body.length; i++) {
          if(typeof star.body[i] == "string")
            fixes.push([star.body[i], null]);
          else fixes.push(star.body[i]);
        }

      // runway portion
      if(star.rwy && star.rwy.hasOwnProperty(rwy))
        for(var i=0; i<star.rwy[rwy].length; i++) {
          if(typeof star.rwy[rwy][i] == "string")
            fixes.push([star.rwy[rwy][i], null]);
          else fixes.push(star.rwy[rwy][i]);
        }

      return fixes;
    },
    getRunway: function(name) {
      if(!name) return null;
      name = name.toLowerCase();
      for(var i=0;i<this.runways.length;i++) {
        if(this.runways[i][0].name.toLowerCase() == name) return this.runways[i][0];
        if(this.runways[i][1].name.toLowerCase() == name) return this.runways[i][1];
      }
      return null;
    },
    /** Verifies all fixes used in the airport also have defined positions
     */
    checkFixes: function() {
      var fixes = [];

      // Gather fixes used by SIDs
      if(this.hasOwnProperty("sids")) {
        for(var s in this.sids) {
          if(this.sids[s].hasOwnProperty("rwy")) {  // runway portion
            for(var r in this.sids[s].rwy)
              for(var i in this.sids[s].rwy[r]) {
                if(typeof this.sids[s].rwy[r][i] == "string")
                  fixes.push(this.sids[s].rwy[r][i]);
                else fixes.push(this.sids[s].rwy[r][i][0]);
              }
          }
          if(this.sids[s].hasOwnProperty("body")) { // body portion
            for(var i in this.sids[s].body) {
              if(typeof this.sids[s].body[i] == "string")
                fixes.push(this.sids[s].body[i]);
              else fixes.push(this.sids[s].body[i][0]);
            }
          }
          if(this.sids[s].hasOwnProperty("transtitions")) { // transtitions portion
            for(var t in this.sids[s].transitions)
              for(var i in this.sids[s].transitions[t]) {
                if(typeof this.sids[s].transitions[t][i] == "string")
                  fixes.push(this.sids[s].transitions[t][i]);
                else fixes.push(this.sids[s].transitions[t][i][0]);
              }
          }
          if(this.sids[s].hasOwnProperty("draw")) { // draw portion
            for(var i in this.sids[s].draw)
              for(var j in this.sids[s].draw[i])
                fixes.push(this.sids[s].draw[i][j].replace('*',''));
          }
        }
      }

      // Gather fixes used by STARs
      if(this.hasOwnProperty("stars")) {
        for(var s in this.stars) {
          if(this.stars[s].hasOwnProperty("transtitions")) { // transtitions portion
            for(var t in this.stars[s].transitions)
              for(var i in this.stars[s].transitions[t]) {
                if(typeof this.stars[s].transitions[t][i] == "string")
                  fixes.push(this.stars[s].transitions[t][i]);
                else fixes.push(this.stars[s].transitions[t][i][0]);
              }
          }
          if(this.stars[s].hasOwnProperty("body")) { // body portion
            for(var i in this.stars[s].body) {
              if(typeof this.stars[s].body[i] == "string")
                fixes.push(this.stars[s].body[i]);
              else fixes.push(this.stars[s].body[i][0]);
            }
          }
          if(this.stars[s].hasOwnProperty("rwy")) {  // runway portion
            for(var r in this.stars[s].rwy)
              for(var i in this.stars[s].rwy[r]) {
                if(typeof this.stars[s].rwy[r][i] == "string")
                  fixes.push(this.stars[s].rwy[r][i]);
                else fixes.push(this.stars[s].rwy[r][i][0]);
              }
          }
          if(this.stars[s].hasOwnProperty("draw")) { // draw portion
            for(var i in this.stars[s].draw)
              for(var j in this.stars[s].draw[i])
                fixes.push(this.stars[s].draw[i][j].replace('*',''));
          }
        }
      }

      // Gather fixes used by airways
      if(this.hasOwnProperty("airways")) {
        for(var a in this.airways)
          for(var i in this.airways[a])
            fixes.push(this.airways[a][i]);
      }

      // Get (unique) list of fixes used that are not in 'this.fixes'
      var missing = fixes.filter(f => !this.fixes.hasOwnProperty(f)).sort();
      for(var i=0; i<missing.length-1; i++)
        if(missing[i] == missing[i+1]) missing.splice(i,1); // remove duplicates
      if(missing.length > 0) {  // there are some... yell at the airport designer!!! :)
        log(this.icao + " uses the following fixes which are not listed in " +
          "airport.fixes: " +missing.join(' '), LOG_WARNING);
      }
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
  airport_load("eddf");
  airport_load("eddh");
  airport_load("eddm");
  airport_load("eddt");
  airport_load("egkk");
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
  airport_load("ksea");
  airport_load("ksfo");
  airport_load("loww");
  airport_load("ltba");
  airport_load("saez");
  airport_load("sbgl");
  airport_load("sbgr");
  airport_load("uudd");
  airport_load("vhhh");
  airport_load("wiii");
  airport_load("wimm");
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

  $('.toggle-labels').toggle(
    !$.isEmptyObject(prop.airport.current.maps));

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
