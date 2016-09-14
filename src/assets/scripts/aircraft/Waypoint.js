import Fiber from 'fiber';

/**
  * Build a waypoint object
  * Note that .prependLeg() or .appendLeg() or .insertLeg()
  * should be called in order to add waypoints to the fms, based on which
  * you want. This function serves only to build the waypoint object; it is
  * placed by one of the other three functions.
  *
  * @class Waypoint
  * @extends Fiber
  */
const Waypoint = Fiber.extend(function(data, fms) {
    return {
        /**
         * Initialize Waypoint with empty values, then call the parser
         */
        init: function(data = {}, fms) {
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

            this.parse(data, fms);
        },

        /**
         * Parse input data and apply to this waypoint
         */
        parse: function(data, fms) {
            // Populate Waypoint with data
            if (data.fix) {
                this.navmode = 'fix';
                this.fix = data.fix;
                this.location = airport_get().getFix(data.fix);
            }

            for (var f in data) {
                if (this.hasOwnProperty(f)) {
                    this[f] = data[f];
                }
            }

            // for aircraft that don't yet have proper guidance (eg SID/STAR, for example)
            if (!this.navmode) {
                this.navmode = 'heading';
                var apt = airport_get();

                if (data.route.split('.')[0] === apt.icao && this.heading === null) {
                    // aim departure along runway heading
                    this.heading = apt.getRunway(apt.runway).angle;
                } else if (data.route.split('.')[0] === 'KDBG' && this.heading === null) {
                    // aim arrival @ middle of airspace
                    this.heading = this.radial + Math.PI;
                }
            }
        }
    };
});

export default Waypoint;
