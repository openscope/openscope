import _uniqueId from 'lodash/uniqueId';
import {
    calculateDistanceToPointForX,
    calculateDistanceToPointForY,
    adjustForMagneticNorth,
    hasCardinalDirectionInCoordinate
} from './positionModelHelpers';
import { distanceToPoint } from '../math/circle';
import {
    degreesToRadians,
    parseCoordinate,
    parseElevation
} from '../utilities/unitConverters';

/**
 * @property LATITUDE_INDEX
 * @type {number}
 * @final
 */
const LATITUDE_INDEX = 0;

/**
 * @property LONGITUDE_INDEX
 * @type {number}
 * @final
 */
const LONGITUDE_INDEX = 1;

/**
 * @property ELEVATION_INDEX
 * @type {number}
 * @final
 */
const ELEVATION_INDEX = 2;


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
     * @param coordinates {array}               Array containing offset pair or latitude/longitude pair
     * @param reference {PositionModel|null}    Position to use for calculating offsets when lat/long given
     * @param magnetic_north {number}           magnetic north direction
     * @param mode {string}                     Set to 'GPS' to indicate you are inputting lat/long that should
     *                                          be converted to positions
     */
    constructor(coordinates = [], reference, magnetic_north = 0, mode) {
        /**
         * @property _id
         * @type {string}
         */
        this._id = _uniqueId('position-model-');

        /**
         * @property latitude
         * @type {number}
         * @default 0
         */
        this.latitude = 0;

        /**
         * @property longitude
         * @type {number}
         * @default 0
         */
        this.longitude = 0;

        /**
         * @property elevation
         * @type {number}
         * @default 0
         */
        this.elevation = 0;

        /**
         * @property reference_position
         * @type {PositionModel|null}
         */
        this.reference_position = reference;

        /**
         * @property magnetic_north
         * @type {number}
         */
        this.magnetic_north = magnetic_north;

        /**
         * @property x
         * @type {number}
         * @default 0
         */
        this.x = 0;

        /**
         * @property y
         * @type {number}
         * @default 0
         */
        this.y = 0;

        return this.init(coordinates, mode);
    }

    /**
     * Current x, y position
     *
     * @property position
     * @return {array}
     */
    get position() {
        return [
            this.x,
            this.y
        ];
    }

    /**
     * GPS coordinates in [x,y] order
     *
     * @property gps
     * @return {array}
     */
    get gps() {
        return [
            this.longitude,
            this.latitude
        ];
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
     * @method init
     */
    init(coordinates, mode) {
        if (!hasCardinalDirectionInCoordinate(coordinates[LATITUDE_INDEX])) {
            this.x = coordinates[LATITUDE_INDEX];
            this.y = coordinates[LONGITUDE_INDEX];

            if (mode === 'GPS') {
                this.parse4326();
            }

            return;
        }

        this.latitude = parseCoordinate(coordinates[LATITUDE_INDEX]);
        this.longitude = parseCoordinate(coordinates[LONGITUDE_INDEX]);

        // TODO: this is using coersion and shoudld be updated to be more explicit
        if (coordinates[ELEVATION_INDEX] != null) {
            this.elevation = parseElevation(coordinates[ELEVATION_INDEX]);
        }

        // if !reference_position, x and y are both 0 and we don't have enough information to run `parse4326()`
        if (!this.reference_position) {
            return;
        }

        // this function (parse4326) is moved to be able to call it if point is
        // EPSG:4326, numeric decimal, like those from GeoJSON
        // FIXME: why do x/y get assigned with lat/long here, and then in parse4326 lat/long gets assigned with x/y?
        this.x = this.longitude;
        this.y = this.latitude;

        this.parse4326();
    }

    /**
     * If coordinates were in WGS84 EPSG:4326 (signed decimal lat/lon -12.123,83.456) parse them
     *
     * @for PositionModel
     * @method parse4326
     */
    parse4326() {
        this.longitude = this.x;
        this.latitude = this.y;

        this.x = calculateDistanceToPointForX(
            this.reference_position,
            this.reference_position.latitude,
            this.longitude
        );

        this.y = calculateDistanceToPointForY(
            this.reference_position,
            this.latitude,
            this.reference_position.longitude
        );

        this.adjustXYForMagneticNorth();
    }

    /**
     * @for PositionModel
     * @method distanceTo
     * @param point
     * @return {number}
     */
    distanceTo(point) {
        return distanceToPoint(
            this.latitude,
            this.longitude,
            point.latitude,
            point.longitude
        );
    }

    /**
     * Fascade for `adjustForMagneticNorth`
     *
     * Adjusts x & y coordinates from true north to magnetic north
     *
     * @for PositionModel
     * @method adjustXYForMagneticNorth
     */
    adjustXYForMagneticNorth() {
        const { x, y } = adjustForMagneticNorth(this.x, this.y, this.magnetic_north);

        this.x = x;
        this.y = y;
    }
}

/**
 * Calculate x/y position from latitude and longitude and a referencePostion
 *
 * Provides a static method to calculate position without instantiating a `PositionModel` class.
 *
 * @function getPosition
 * @param coordinates {array<string>}
 * @param referencePostion {PositionModel|null}
 * @param magneticNorth {number}
 * @return {array}
 * @static
 */
PositionModel.calculatePosition = (coordinates, referencePostion, magneticNorth) => {
    if (!coordinates || !referencePostion || !magneticNorth) {
        throw new TypeError('Invalid parameter. PositionModel.getPosition() requires coordinates, referencePostion and magneticNorth as parameters');
    }

    let latitude;
    let longitude;
    let rawX = 0;
    let rawY = 0;

    if (!hasCardinalDirectionInCoordinate(coordinates[LATITUDE_INDEX])) {
        rawX = coordinates[LATITUDE_INDEX];
        rawY = coordinates[LONGITUDE_INDEX];
    }

    latitude = parseCoordinate(coordinates[LATITUDE_INDEX]);
    longitude = parseCoordinate(coordinates[LONGITUDE_INDEX]);

    // FIXME: this still seems weird, but it seems to be necessary for some reason
    rawX = longitude;
    rawY = latitude;
    longitude = rawX;
    latitude = rawY;

    rawX = calculateDistanceToPointForX(
        referencePostion,
        referencePostion.latitude,
        longitude
    );

    if (referencePostion.longitude > longitude) {
        rawX *= -1;
    }

    rawY = calculateDistanceToPointForY(
        referencePostion,
        latitude,
        referencePostion.longitude
    );

    if (referencePostion.latitude > latitude) {
        rawY *= -1;
    }

    const { x, y } = adjustForMagneticNorth(rawX, rawY, magneticNorth);

    return [
        x,
        y
    ];
};
