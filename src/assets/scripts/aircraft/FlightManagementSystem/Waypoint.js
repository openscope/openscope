import _get from 'lodash/get';
import _head from 'lodash/head';
import _isNil from 'lodash/isNil';
import FixCollection from '../../airport/Fix/FixCollection';
import { WAYPOINT_NAV_MODE } from '../../constants/aircraftConstants';

/**
 * Symbol denoting a greater than restriction
 *
 * @property ABOVE_SYMBOL
 * @type {string}
 * @final
 */
const ABOVE_SYMBOL = '+';

/**
 * Symbol denoting a less than restriction
 *
 * @property ABOVE_SYMBOL
 * @type {string}
 * @final
 */
const BELOW_SYMBOL = '-';

// TODO: there should be a helper function for this
/**
 * Number to used to cnovert a FL altitude to an altitude in thousands
 *
 * @property ABOVE_SYMBOL
 * @type {string}
 * @final
 */
const FL_TO_THOUSANDS_MULTIPLIER = 100;

/**
 * Enemuration for an invalid index number.
 *
 * @property INVALID_INDEX
 * @type {number}
 * @final
 */
const INVALID_INDEX = -1;

/**
 * Enumeration for the radix value of `parseInt`
 *
 * @proeprty DECIMAL_RADIX
 * @type {number}
 * @final
 */
const DECIMAL_RADIX = 10;

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
    constructor(data = {}, airport) {
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

        this.parse(data, airport);
    }

    /**
     * Parse input data and apply to this waypoint
     *
     * @for Waypoint
     * @method parse
     * @param data {object}
     */
    parse(data, airport) {
        // TODO: is this used?
        this.route = _get(data, 'route', this.route);
        this.altitude = _get(data, 'altitude', this.altitude);
        this.navmode = _get(data, 'navmode', this.navmode);
        this.heading = _get(data, 'heading', this.heading);
        this.turn = _get(data, 'turn', this.turn);
        this.location = _get(data, 'location', this.location);
        this.expedite = _get(data, 'expedite', this.expedite);
        this.speed = _get(data, 'speed', this.speed);
        this.hold = _get(data, 'hold', this.hold);


        // Populate Waypoint with data
        if (data.fix) {
            this.navmode = WAYPOINT_NAV_MODE.FIX;
            this.fix = data.fix;
            this.location = FixCollection.getFixPositionCoordinates(data.fix);
        }

        this.extractFixRestrictions(data);
        this.setInitialNavMode(airport);
    }

    /**
     * @for Waypoint
     * @method extractFixRestrictions
     * @param fixRestrictions {object}
     */
    extractFixRestrictions({ fixRestrictions }) {
        if (_isNil(fixRestrictions)) {
            return;
        }

        this.fixRestrictions = fixRestrictions;
    }

    /**
     * If there isn't a navmode set, set one here
     *
     * For aircraft that don't yet have proper guidance (eg: SID/STAR, or departing aircraft)
     *
     * @for Waypoint
     * @method setInitialNavMode
     */
    setInitialNavMode(airport) {
        if (this.navmode) {
            return;
        }

        this.navmode = WAYPOINT_NAV_MODE.HEADING;
        const firstRouteSegment = _head(this.route.split('.'));

        if (firstRouteSegment === airport.icao && this.heading === null) {
            // aim departure along runway heading
            const { angle } = airport.getRunway(airport.runway);

            this.heading = angle;
        } else if (firstRouteSegment === 'UNASSIGNED' && this.heading === null) {
            // FIXME: radial is not defined or set anywhere in this class. this block DOES get hit for
            // every arriving aircraft

            // aim arrival @ middle of airspace
            this.heading = this.radial + Math.PI;
        }
    }

    // TODO: rename centerCeiling and make this method more flexible
    // TODO: use a default constant for cruiseAltitude
    /**
     * @for Waypoint
     * @method setAltitude
     * @param centerCeiling {number}  ceiling of the airspace in feet
     * @param cruiseAltitude {number} cruiseAltitude of the current aircraft
     */
    setAltitude(centerCeiling = null, cruiseAltitude) {
        const { alt: altitudeRestriction } = this.fixRestrictions;

        if (!altitudeRestriction) {
            this.altitude = !_isNil(centerCeiling)
                ? Math.min(centerCeiling, cruiseAltitude)
                : cruiseAltitude;

            return;
        }

        // TODO: there has to be an easier way to do this logic.
        if (altitudeRestriction.indexOf(ABOVE_SYMBOL) !== INVALID_INDEX) {
            // at-or-above altitudeRestriction restriction
            const minAlt = parseInt(altitudeRestriction.replace(ABOVE_SYMBOL, ''), DECIMAL_RADIX);
            const minimumAltitudeWithoutSymbol = minAlt * FL_TO_THOUSANDS_MULTIPLIER;

            // not a fan of this ternary, but I don't think there is a better way to do it
            this.altitude = minimumAltitudeWithoutSymbol > cruiseAltitude
                ? minimumAltitudeWithoutSymbol
                : cruiseAltitude;
        } else if (altitudeRestriction.indexOf(BELOW_SYMBOL) !== INVALID_INDEX) {
            const maxAlt = parseInt(altitudeRestriction.replace(BELOW_SYMBOL, ''), DECIMAL_RADIX);
            const maximumAltitudeWithoutSymbol = maxAlt * FL_TO_THOUSANDS_MULTIPLIER;

            // climb as high as restrictions permit
            this.altitude = Math.min(maximumAltitudeWithoutSymbol, cruiseAltitude);
        } else {
             // cross AT this altitudeRestriction
            this.altitude = parseInt(altitudeRestriction, DECIMAL_RADIX) * FL_TO_THOUSANDS_MULTIPLIER;
        }
    }

    /**
     * @for Waypoint
     * @method setSpeed
     * @param cruiseSpeed {number}  cruiseSpeed of the current aircraft
     */
    setSpeed(cruiseSpeed) {
        const { spd: speedRestriction } = this.fixRestrictions;

        if (!speedRestriction) {
            this.speed = cruiseSpeed;

            return;
        }

        // TODO: there has to be an easier way to do this logic.
        if (speedRestriction.indexOf(ABOVE_SYMBOL) !== INVALID_INDEX) {
            // at-or-above speed restriction
            const minSpd = parseInt(speedRestriction.replace(ABOVE_SYMBOL, ''), DECIMAL_RADIX);

            this.speed = minSpd > cruiseSpeed
                ? minSpd
                : cruiseSpeed;
        } else if (speedRestriction.indexOf(BELOW_SYMBOL) !== INVALID_INDEX) {
            const maxSpd = parseInt(speedRestriction.replace(BELOW_SYMBOL, ''), DECIMAL_RADIX);

            // go as fast as restrictions permit
            this.speed = Math.min(maxSpd, cruiseSpeed);
        } else {
             // cross AT this speed
            this.speed = parseInt(speedRestriction, DECIMAL_RADIX);
        }
    }
}
