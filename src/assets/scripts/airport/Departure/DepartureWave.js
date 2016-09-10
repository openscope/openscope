import $ from 'jquery';
import Fiber from 'fiber';

import DepartureCyclic from './DepartureCyclic';
import { km, nm, degreesToRadians } from '../../utilities/unitConverters';
import { distance2d } from '../../math/distance';
import { vlen, vradial, vsub } from '../../math/vector';

/**
 * Generate departures in a repeating wave
 */
const DepartureWave = DepartureCyclic.extend(function(base) {
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

export default DepartureWave;
