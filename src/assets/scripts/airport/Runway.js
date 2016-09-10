import $ from 'jquery';
import Fiber from 'fiber';

import { km, nm, degreesToRadians } from '../utilities/unitConverters';
import { distance2d } from '../math/distance';
import { vlen, vradial, vsub } from '../math/vector';

const Runway = Fiber.extend(function(base) {
  return {
    init: function(options = {}, end, airport) {
      options.airport     = airport;
      this.angle          = null;
      this.elevation      = 0;
      this.delay          = 2;
      this.gps            = [];
      this.ils            = { enabled : true,
                              loc_maxDist : km(25),
                              gs_maxHeight : 9999,
                              gs_gradient : degreesToRadians(3)
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
      return this.elevation + (rise * distance * 3280);
    },
    parse: function(data, end) {
      this.airport = data.airport;
      if(data.delay) this.delay = data.delay[end];
      if(data.end) {
        var thisSide  = new Position(data.end[end], data.reference_position, data.magnetic_north);
        var farSide   = new Position(data.end[(end==0)?1:0], data.reference_position, data.magnetic_north);
        this.gps      = [thisSide.latitude, thisSide.longitude];       // GPS latitude and longitude position
        if (thisSide.elevation != null)
          this.elevation = thisSide.elevation;
        if ((this.elevation == 0) && (this.airport.elevation != 0)) {
          this.elevation = this.airport.elevation;
        }
        this.position = thisSide.position; // relative position, based on center of map
        this.length   = vlen(vsub(farSide.position, thisSide.position));
        this.midfield = vscale(vadd(thisSide.position, farSide.position), 0.5);
        this.angle    = vradial(vsub(farSide.position, thisSide.position));
      }
      if(data.ils) this.ils.enabled = data.ils[end];
      if(data.ils_distance) this.ils.loc_maxDist = km(data.ils_distance[end]);
      if(data.ils_gs_maxHeight) this.ils.gs_maxHeight = data.ils_gs_maxHeight[end];
      if(data.glideslope) this.ils.gs_gradient = degreesToRadians(data.glideslope[end]);
      if(data.name_offset) this.labelPos = data.name_offset[end];
      if(data.name) this.name = data.name[end];
      if(data.sepFromAdjacent) this.sepFromAdjacent = km(data.sepFromAdjacent[end]);
    },
  };
});

export default Runway;
