import $ from 'jquery';
import Fiber from 'fiber';

import ArrivalBase from './ArrivalBase';
import { km, nm, degreesToRadians } from '../../utilities/unitConverters';
import { distance2d } from '../../math/distance';
import { vlen, vradial, vsub } from '../../math/vector';

/** Generate arrivals in a repeating wave
  * Arrival rate varies as pictured below. Arrival rate will increase
  * and decrease faster when changing between the lower/higher rates.
  * ------------o-o-o---------------------------------------+-----------o-o < - - - - - max arrival rate
  *        o             o                                  |      o      |       ^
  *    o                     o                              |  o          |  +variation
  *  o                         o                            |o            |       v
  * o-------------------------- o---------------------------o-------------+ < - - - - - avg arrival rate
  * |                            o                         o|             |       ^
  * |                              o                     o  |             |  -variation
  * |                                  o             o      |             |       v
  * +---------------------------------------o-o-o-----------+-------------+ < - - - - - min arrival rate
  * |                                                       |
  * |<  -  -  -  -  -  -  -  - period -  -  -  -  -  -  -  >|
 */
const ArrivalWave = ArrivalBase.extend(function(base) {
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

export default ArrivalWave;
