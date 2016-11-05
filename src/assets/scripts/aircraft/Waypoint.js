/* eslint-disable no-multi-spaces, no-undef */
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _head from 'lodash/head';
import FixCollection from '../airport/Fix/FixCollection';
import { WAYPOINT_NAV_MODE } from '../constants/aircraftConstants';

/**
  * Build a waypoint object
  *
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
     *
     * @for Waypoint
     * @constructor
     */
    constructor(data = {}, fms) {
        this.altitude = null;
        this.fix = null;
        this.navmode = null;
        this.heading = null;
        this.turn = null;
        this.location = null;
        this.expedite = false;
        this.speed = null;

        this.hold = {
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
     *
     * @for Waypoint
     * @method parse
     */
    parse(data, fms) {
        this.route = _get(data, 'route', this.route);
        this.fixRestrictions = _get(data, 'fixRestrictions', this.fixRestrictions);

        // Populate Waypoint with data
        if (data.fix) {
            this.navmode = 'fix';
            this.fix = data.fix;
            this.location = FixCollection.getFixPositionCoordinates(data.fix);
        }

        // for aircraft that don't yet have proper guidance (eg: SID/STAR, or departing aircraft)
        if (!this.navmode) {
            this.navmode = WAYPOINT_NAV_MODE.HEADING;
            const airport = window.airportController.airport_get();
            const firstRouteSegment = _head(this.route.split('.'));

            if (firstRouteSegment === airport.icao && this.heading === null) {
                // aim departure along runway heading
                const { angle } = airport.getRunway(airport.runway);

                this.heading = angle;
            } else if (firstRouteSegment === 'KDBG' && this.heading === null) {
                // aim arrival @ middle of airspace
                this.heading = this.radial + Math.PI;
            }
        }
    }
}
