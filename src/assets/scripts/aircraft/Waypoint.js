/* eslint-disable no-multi-spaces, no-undef */
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _has from 'lodash/has';

/**
  * Build a waypoint object
  * Note that .prependLeg() or .appendLeg() or .insertLeg()
  * should be called in order to add waypoints to the fms, based on which
  * you want. This function serves only to build the waypoint object; it is
  * placed by one of the other three functions.
  *
  * @class Waypoint
  */
export default class Waypoint {
    /**
     * Initialize Waypoint with empty values, then call the parser
     */
    constructor(data = {}, fms) {
        this.altitude = null;
        this.fix      = null;
        this.navmode  = null;
        this.heading  = null;
        this.turn     = null;
        this.location = null;
        this.expedite = false;
        this.speed    = null;
        this.hold     = {
            dirTurns: null,
            fixName: null,
            fixPos: null,
            inboundHd: null,
            legLength: null,
            timer: 0
        };
        this.fixRestrictions = {
            alt: null,
            spd: null
        };

        this.route = '';

        this.parse(data, fms);
    }

    /**
     * Parse input data and apply to this waypoint
     */
    parse(data, fms) {
        // Populate Waypoint with data
        if (data.fix) {
            this.navmode = 'fix';
            this.fix = data.fix;
            this.location = window.airportController.airport_get().getFixPosition(data.fix);
        }

        this.route = _get(data, 'route', this.route);

        _forEach(data, (value, key) => {
            if (_has(this, key)) {
                console.log(key);
                // this[key] = data[key];
            }
        });

        // for aircraft that don't yet have proper guidance (eg SID/STAR, for example)
        if (!this.navmode) {
            this.navmode = 'heading';
            const apt = window.airportController.airport_get();

            if (this.route.split('.')[0] === apt.icao && this.heading === null) {
                // aim departure along runway heading
                this.heading = apt.getRunway(apt.runway).angle;
            } else if (this.route.split('.')[0] === 'KDBG' && this.heading === null) {
                // aim arrival @ middle of airspace
                this.heading = this.radial + Math.PI;
            }
        }
    }
}
