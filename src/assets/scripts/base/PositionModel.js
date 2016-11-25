import _uniqueId from 'lodash/uniqueId';
import { sin, cos } from '../math/core';
import { degreesToRadians, parseElevation } from '../utilities/unitConverters';

/**
 * @property REGEX
 * @type {Object}
 * @final
 */
const REGEX = {
    COMPASS_DIRECTION: /^[NESW]/,
    SW: /[SW]/,
    LAT_LONG: /^([NESW])(\d+(\.\d+)?)([d °](\d+(\.\d+)?))?([m '](\d+(\.\d+)?))?$/
};

/**
 * A physical location on the Earth's surface
 *
 * properties:
 *   latitude - Latitude in decimal degrees
 *   longitude - Longitude in decimal degrees
 *   elevation - Elevation in feet
 *   reference_position - Position to use when calculating offsets
 *   x - Offset from reference position in km
 *   y - Offset from reference position in km
 *   position - Array containing the x,y pair
 *
 * @class Position
 */
export default class PositionModel {
    /**
     * coordinates may contain an optional elevation as a third element.
     * It must be suffixed by either 'ft' or 'm' to indicate the units.
     *
     * Latitude and Longitude numbers may be one of the following forms:
     *   Decimal degrees - 'N47.112388112'
     *   Decimal minutes - 'N38d38.109808'
     *   Decimal seconds - 'N58d27m12.138'
     *
     * @for PositionModel
     * @constructor
     * @param coordinates {array} Array containing offset pair or latitude/longitude pair
     * @param reference {}        Position to use for calculating offsets when lat/long given
     * @param magnetic_north
     * @param mode {string}       optional. Set to 'GPS' to indicate you are inputting lat/lon
     *                            that should be converted to positions
     */
    constructor(coordinates = [], reference, magnetic_north = 0, mode) {
        this._id = _uniqueId();
        // TODO: it might make more sense to abstract `coordinates` out to another Model object.
        this.latitude = 0;
        this.longitude = 0;
        this.elevation = 0;
        this.reference_position = reference;
        this.magnetic_north = magnetic_north;
        this.x = 0;
        this.y = 0;
        // TODO: make this a getter;
        this.position = [this.x, this.y];
        this.gps = [0, 0];

        return this.parse(coordinates, mode);
    }

    /**
     * Magnetic north of the current instance expressed in radians
     *
     * @property magneticNorthInRadians
     * @return {number}
     */
    get magneticNorthInRadians() {
        return degreesToRadians(this.magnetic_north);
    }

    /**
     * @for PositionModel
     * @method parse
     */
    parse(coordinates, mode) {
        if (!REGEX.COMPASS_DIRECTION.test(coordinates[0])) {
            this.x = coordinates[0];
            this.y = coordinates[1];
            // TODO: remove once this property is a getter
            this.position = [this.x, this.y];

            if (mode === 'GPS') {
                this.parse4326();
            }

            return;
        }

        this.latitude = this.parseCoordinate(coordinates[0]);
        this.longitude = this.parseCoordinate(coordinates[1]);
        // GPS coordinates in [x,y] order
        this.gps = [
            this.longitude,
            this.latitude
        ];

        // TODO: this is using coersion and shoudld be updated to be more explicit
        if (coordinates[2] != null) {
            this.elevation = parseElevation(coordinates[2]);
        }

      // this function (parse4326) is moved to be able to call it if point is
      // EPSG:4326, numeric decimal, like those from GeoJSON
        if (this.reference_position != null) {
            this.x = this.longitude;
            this.y = this.latitude;

            this.parse4326();
        }
    }

    /**
     * @for PositionModel
     * @method parse4326
     */
    parse4326() {
        // if coordinates were in WGS84 EPSG:4326 (signed decimal lat/lon -12.123,83.456)
        // parse them
        this.longitude = this.x;
        this.latitude = this.y;
        this.x = this.distanceToPoint(
            this.reference_position.latitude,
            this.reference_position.longitude,
            this.reference_position.latitude,
            this.longitude
        );

        if (this.reference_position.longitude > this.longitude) {
            this.x *= -1;
        }

        this.y = this.distanceToPoint(
            this.reference_position.latitude,
            this.reference_position.longitude,
            this.latitude,
            this.reference_position.longitude
        );

        if (this.reference_position.latitude > this.latitude) {
            this.y *= -1;
        }

        // Adjust to use magnetic north instead of true north
        let t = Math.atan2(this.y, this.x);
        const r = Math.sqrt((this.x * this.x) + (this.y * this.y));

        t += this.magnetic_north;

        this.x = r * cos(t);
        this.y = r * sin(t);

        this.position = [this.x, this.y];
    }

    /**
     * @for PositionModel
     * @method distanceTo
     * @param point
     * @return {number}
     */
    distanceTo(point) {
        return this.distanceToPoint(
            this.latitude,
            this.longitude,
            point.latitude,
            point.longitude
        );
    }

    /**
     * The distance in km between two locations
     *
     * @for PositionModel
     * @method distanceToPoint
     * @param lat_a
     * @param lng_a
     * @param lat_b
     * @param lng_b
     * return {number}
     */
    distanceToPoint(lat_a, lng_a, lat_b, lng_b) {
        const d_lat = degreesToRadians(lat_a - lat_b);
        const d_lng = degreesToRadians(lng_a - lng_b);

        // TODO: what do these vars mean? a & c?
        // TODO: could the maths here be abstracted?
        const a = Math.pow(sin(d_lat / 2), 2) +
            (cos(degreesToRadians(lat_a)) *
            cos(degreesToRadians(lat_b)) *
            Math.pow(sin(d_lng / 2), 2));
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // TODO: what does this number mean? enumerate the magic nubmer
        return c * 6371.00;
    }

    /**
     * @for PositionModel
     * @method parseCoordinate
     * @param coord
     */
    parseCoordinate(coord) {
        const match = REGEX.LAT_LONG.exec(coord);

        if (match == null) {
            log(`Unable to parse coordinate ${coord}`);

            return;
        }

        let ret = parseFloat(match[2]);

        if (match[5] != null) {
            ret += parseFloat(match[5]) / 60;

            if (match[8] != null) {
                ret += parseFloat(match[8]) / 3600;
            }
        }

        if (REGEX.SW.test(match[1])) {
            ret *= -1;
        }

        return ret;
    }
}
