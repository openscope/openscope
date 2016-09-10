import $ from 'jquery';
import Fiber from 'fiber';

import { km, nm, degreesToRadians } from '../../utilities/unitConverters';
import { distance2d } from '../../math/distance';
import { vlen, vradial, vsub } from '../../math/vector';

/**
 * Generate departures at random, averaging the specified spawn rate
 */
const DepartureBase = Fiber.extend(function(base) {
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
      // Pre-load the airlines
      $.each(this.airlines, function (i, data) {
        airline_get(data[0].split('/')[0]);
      });
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

export default DepartureBase;
