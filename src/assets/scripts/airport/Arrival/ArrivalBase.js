import $ from 'jquery';
import Fiber from 'fiber';

import Runway from '../Runway';
import { km, nm, degreesToRadians } from '../../utilities/unitConverters';
import { distance2d } from '../../math/distance';
import { vlen, vradial, vsub } from '../../math/vector';

/**
 *  Generate arrivals at random, averaging the specified arrival rate
 */
const ArrivalBase = Fiber.extend(function(base) {
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
    /**
     * Arrival Stream Settings
     * airlines: {array of array} List of airlines with weight for each
     * altitude: {array or integer} Altitude in feet or range of altitudes
     * frequency: {integer} Arrival rate along this stream, in aircraft per hour (acph)
     * heading: {integer} Heading to fly when spawned, in degrees (don't use w/ fixes)
     * fixes: {array} Set of fixes to traverse (eg. for STARs). Spawns at first listed.
     * radial: {integer} bearing from airspace center to spawn point (don't use w/ fixes)
     * speed: {integer} Speed in knots of spawned aircraft
     */
    parse: function(options) {
      var params = ['airlines', 'altitude', 'frequency', 'speed'];
      for(var i in params) {  // Populate the data
        if(options[params[i]]) this[params[i]] = options[params[i]];
      }

      // Make corrections to data
      if(options.radial) this.radial = degreesToRadians(options.radial);
      if(options.heading) this.heading = degreesToRadians(options.heading);
      if(typeof this.altitude == "number") this.altitude = [this.altitude, this.altitude];
      if(options.route) this.route = options.route;
      else if(options.fixes) {
        for (var i=0; i<options.fixes.length; i++)
          this.fixes.push({fix: options.fixes[i]});
      }

      // Pre-load the airlines
      $.each(this.airlines, function (i, data) {
        airline_get(data[0].split('/')[0]);
      });
    },
    /** Backfill STAR routes with arrivals closer than the spawn point
     ** Aircraft spawn at the first point defined in the route of the entry in
     ** "arrivals" in the airport json file. When that spawn point is very far
     ** from the airspace boundary, it obviously takes quite a while for them
     ** to reach the airspace. This function spawns (all at once) arrivals along
     ** the route, between the spawn point and the airspace boundary, in order to
     ** ensure the player is not kept waiting for their first arrival aircraft.
     */
    preSpawn: function() {
      var star, entry;
      var runway = this.airport.runway;

      //Find STAR & entry point
      var pieces = array_clean(this.route.split('.'));
      for(var i in pieces) {
        if(this.airport.stars.hasOwnProperty(pieces[i])) {
          star = pieces[i];
          if(i>0) entry = pieces[i-1];
        }
      }

      // Find the last fix that's outside the airspace boundary
      var fixes = this.airport.getSTAR(star, entry, runway);
      var lastFix = fixes[0][0];
      var extra = 0;  // dist btwn closest fix outside a/s and a/s border, nm
      for(var i in fixes) {
        var fix = fixes[i][0];
        var pos = this.airport.fixes[fix].position;
        var fix_prev = (i>0) ? fixes[i-1][0] : fix;
        var pos_prev = (i>0) ? this.airport.fixes[fix_prev].position : pos;
        if(inAirspace(pos)) {
          if(i>=1) extra = nm(dist_to_boundary(pos_prev));
          break;
        }
        else fixes[i][2] = nm(distance2d(pos_prev, pos));  // calculate distance between fixes
      }

      // Determine spawn offsets
      var spawn_offsets = [];
      var entrail_dist = this.speed / this.frequency;   // distance between succ. arrivals, nm
      var dist_total = array_sum($.map(fixes,function(v){return v[2]})) + extra;
      for(var i=entrail_dist; i<dist_total; i+=entrail_dist) {
        spawn_offsets.push(i);
      }

      // Determine spawn points
      var spawn_positions = [];
      for(var i in spawn_offsets) { // for each new aircraft
        for(var j=1; j<fixes.length; j++) { // for each fix ahead
          if(spawn_offsets[i] > fixes[j][2]) {  // if point beyond next fix
            spawn_offsets[i] -= fixes[j][2];
            continue;
          }
          else {  // if point before next fix
            var next = airport_get().fixes[fixes[j][0]];
            var prev = airport_get().fixes[fixes[j-1][0]];
            var brng = bearing(prev.gps, next.gps);
            spawn_positions.push({
              pos: fixRadialDist(prev.gps, brng, spawn_offsets[i]),
              nextFix: fixes[j][0],
              heading: brng
            });
            break;
          }
        }
      }

      // Spawn aircraft along the route, ahead of the standard spawn point
      for(var i in spawn_positions) {
        var airline = choose_weight(this.airlines);
        var fleet = "";
        if(airline.indexOf('/') > -1) {
          fleet = airline.split('/')[1];
          airline   = airline.split('/')[0];
        }

        aircraft_new({
          category:  "arrival",
          destination:airport_get().icao,
          airline:   airline,
          fleet:     fleet,
          altitude:  10000, // should eventually look up altitude restrictions and try to spawn in an appropriate range
          heading:   spawn_positions[i].heading || this.heading,
          waypoints: this.fixes,
          route:     this.route,
          position:  new Position(spawn_positions[i].pos, airport_get().position, airport_get().magnetic_north, 'GPS').position,
          speed:     this.speed,
          nextFix:   spawn_positions[i].nextFix
        });
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
      if(this.route) this.preSpawn();
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

export default ArrivalBase;
