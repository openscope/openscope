/* eslint-disable no-multi-spaces, func-names, camelcase, no-undef, max-len, object-shorthand */
import PositionModel from '../base/PositionModel';
import { abs, tan } from '../math/core';
import { km, degreesToRadians } from '../utilities/unitConverters';
import { vlen, vradial, vsub } from '../math/vector';

export default class Runway {
    constructor(options = {}, end, airport) {
        options.airport     = airport;
        this.angle          = null;
        this.elevation      = 0;
        this.delay          = 2;
        this.gps            = [];
        this.ils            = {
            // TODO: what do these numbers mean? enumerate the magic numbers
            enabled: true,
            loc_maxDist: km(25),
            gs_maxHeight: 9999,
            gs_gradient: degreesToRadians(3)
        };
        this.labelPos       = [];
        this.length         = null;
        this.midfield       = [];
        this.name           = '';
        this.position       = [];
        this.queue          = [];
        this.sepFromAdjacent = km(3);

        this.parse(options, end);
    }

    addQueue(aircraft) {
        this.queue.push(aircraft);
    }

    removeQueue(aircraft, force) {
        if (this.queue[0] === aircraft || force) {
            this.queue.shift(aircraft);

            if (this.queue.length >= 1) {
                this.queue[0].moveForward();
            }

            return true;
        }

        return false;
    }

    inQueue(aircraft) {
        return this.queue.indexOf(aircraft);
    }

    taxiDelay() {
        // TODO: what does 3 mean? enumerate the magic numbers.
        return (this.delay + Math.random()) * 3;
    }

    getGlideslopeAltitude(distance, /* optional */ gs_gradient) {
        if (!gs_gradient) {
            gs_gradient = this.ils.gs_gradient;
        }

        distance = Math.max(0, distance);
        const rise = tan(abs(gs_gradient));

        // TODO: this logic could be abstracted to a helper.
        // TODO: what does 3280 mean? enumerate the magic number
        return this.elevation + (rise * distance * 3280);
    }

    parse(data, end) {
        this.airport = data.airport;

        if (data.delay) {
            this.delay = data.delay[end];
        }

        if (data.end) {
            const thisSide = new PositionModel(data.end[end], data.reference_position, data.magnetic_north);
            // FIXME: ressignment of an argument with an inline ternary? this line needs some work.
            const farSide = new PositionModel(data.end[(end === 0) ? 1 : 0], data.reference_position, data.magnetic_north);

            // GPS latitude and longitude position
            this.gps = [thisSide.latitude, thisSide.longitude];

            if (thisSide.elevation != null) {
                this.elevation = thisSide.elevation;
            }

            if ((this.elevation === 0) && (this.airport.elevation !== 0)) {
                this.elevation = this.airport.elevation;
            }

            // relative position, based on center of map
            this.position = thisSide.position;
            this.length = vlen(vsub(farSide.position, thisSide.position));
            // TODO: what is the 0.5 for? enumerate the magic number
            this.midfield = vscale(vadd(thisSide.position, farSide.position), 0.5);
            this.angle = vradial(vsub(farSide.position, thisSide.position));
        }

        if (data.ils) {
            this.ils.enabled = data.ils[end];
        }

        if (data.ils_distance) {
            this.ils.loc_maxDist = km(data.ils_distance[end]);
        }

        if (data.ils_gs_maxHeight) {
            this.ils.gs_maxHeight = data.ils_gs_maxHeight[end];
        }

        if (data.glideslope) {
            this.ils.gs_gradient = degreesToRadians(data.glideslope[end]);
        }

        if (data.name_offset) {
            this.labelPos = data.name_offset[end];
        }

        if (data.name) {
            this.name = data.name[end];
        }

        if (data.sepFromAdjacent) {
            this.sepFromAdjacent = km(data.sepFromAdjacent[end]);
        }
    }
}
