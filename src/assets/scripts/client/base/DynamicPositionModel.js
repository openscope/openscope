import _isNumber from 'lodash/isNumber';
import _uniqueId from 'lodash/uniqueId';
import {
    adjustForMagneticNorth,
    calculateDistanceToPointForX,
    calculateDistanceToPointForY,
    isValidGpsCoordinatePair
} from './positionModelHelpers';
import { PHYSICS_CONSTANTS } from '../constants/globalConstants';
import {
    DEFAULT_SCREEN_POSITION,
    GPS_COORDINATE_INDEX,
    RELATIVE_POSITION_OFFSET_INDEX
} from '../constants/positionConstants';
import {
    distanceToPoint,
    radians_normalize
} from '../math/circle';
import {
    degreesToRadians,
    parseCoordinate,
    parseElevation,
    radiansToDegrees
} from '../utilities/unitConverters';

/**
 * @class Position
 */
export default class DynamicPositionModel {
    /**
     * Coordinates may contain an optional elevation as a third element.
     * It must be suffixed by either 'ft' or 'm' to indicate the units.
     *
     * Latitude and Longitude numbers may be one of the following forms:
     *   Decimal degrees - `47.112388112`
     *   Decimal degrees - `'N47.112388112'`
     *   Decimal minutes - `'N38d38.109808'`
     *   Decimal seconds - `'N58d27m12.138'`
     *
     * @for DynamicPositionModel
     * @constructor
     * @param coordinates {array<string|number>}    array in shape of [latitude, longitude]
     * @param reference {StaticPositionModel}       position to use for calculating relative position
     * @param magnetic_north {number}               magnetic declination (variation), in radians east
     */
    constructor(coordinates = [], reference = null, magnetic_north = 0) {
        if (!isValidGpsCoordinatePair(coordinates)) {
            throw new TypeError('Invalid coordinates passed to DynamicPositionModel. Expected shape of ' +
                `"[latitude, longitude]" but received "${coordinates}"`);
        }

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
         * @property _referencePosition
         * @type {DynamicPositionModel|null}
         */
        this._referencePosition = reference;

        /**
         * @property magnetic_north
         * @type {number}
         */
        this.magnetic_north = magnetic_north;

        this.init(coordinates);
    }

    /**
     * GPS coordinates in [latitude, longitude] order
     * For reverse order, see `DynamicPositionModel.gpsXY`
     * @property gps
     * @return {array}
     */
    get gps() {
        return [
            this.latitude,
            this.longitude
        ];
    }

    /**
     * GPS coordinates in [x,y] order
     * For reverse order, see `DynamicPositionModel.gps`
     * @property gpsXY
     * @return {array}
     */
    get gpsXY() {
        return [
            this.longitude,
            this.latitude
        ];
    }

    /**
     * Relative position, in km offset from the airport
     *
     * @property relativePosition
     * @return {array}
     */
    get relativePosition() {
        return this._calculateRelativePosition();
    }

    /**
     * Kilometers east (magnetic) of the reference position
     *
     * @for DynamicPositionModel
     * @property x
     * @type {number}
     */
    get x() {
        return this.relativePosition[RELATIVE_POSITION_OFFSET_INDEX.LONGITUDINAL];
    }

    /**
     * Kilometers north (magnetic) of the reference position
     *
     * @for DynamicPositionModel
     * @property y
     * @type {number}
     */
    get y() {
        return this.relativePosition[RELATIVE_POSITION_OFFSET_INDEX.LATITUDINAL];
    }

    /**
     * @for DynamicPositionModel
     * @method init
     */
    init(coordinates) {
        this.latitude = parseCoordinate(coordinates[GPS_COORDINATE_INDEX.LATITUDE]);
        this.longitude = parseCoordinate(coordinates[GPS_COORDINATE_INDEX.LONGITUDE]);

        // TODO: this is using coersion and shoudld be updated to be more explicit
        if (coordinates[GPS_COORDINATE_INDEX.ELEVATION] != null) {
            this.elevation = parseElevation(coordinates[GPS_COORDINATE_INDEX.ELEVATION]);
        }
    }

    /**
     * Calculate the initial magnetic bearing from a given position to the position of `this`
     *
     * @for DynamicPositionModel
     * @method bearingFromPosition
     * @param position {DynamicPositionModel|StaticPositionModel} position we're comparing against
     * @return {Number} magnetic bearing from `position` to `this`, in radians
     */
    bearingFromPosition(position) {
        return position.bearingToPosition(this);
    }

    /**
     * Calculate the initial magnetic bearing to a given position from the position of `this`
     * Note: This method uses great circle math to determine the bearing. It is very accurate, but
     * also a very expensive operation. If the precision is not needed, a vradial(vsub()) of the
     * x/y positions is a more "quick and dirty" option.
     *
     * Source: Chris Veness, Movable Type Scripts
     * Subject: "Bearing"
     * Link: http://www.movable-type.co.uk/scripts/latlong.html
     *
     * @for DynamicPositionModel
     * @method bearingToPosition
     * @param position {DynamicPositionModel|StaticPositionModel} position we're comparing against
     * @return {Number} magnetic bearing from `this` to `position`, in radians
     */
    bearingToPosition(position) {
        const φ1 = degreesToRadians(this.latitude);
        const φ2 = degreesToRadians(position.latitude);
        const Δλ = degreesToRadians(position.longitude - this.longitude);
        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        const θ = Math.atan2(y, x);

        return radians_normalize(θ - this.magnetic_north);
    }

    /**
     * Returns a new `DynamicPositionModel` a given bearing/distance from `this`
     *
     * Source: Chris Veness, Movable Type Scripts
     * Subject: "Destination point given distance and bearing from start point"
     * Link: http://www.movable-type.co.uk/scripts/latlong.html
     *
     * @for DynamicPositionModel
     * @method generateDynamicPositionFromBearingAndDistance
     * @param bearing {number} magnetic bearing (θ), in radians
     * @param distance {number} distance (d), in nautical miles
     * @return {DynamicPositionModel}
     */
    generateDynamicPositionFromBearingAndDistance(bearing, distance) {
        const R = PHYSICS_CONSTANTS.EARTH_RADIUS_NM;
        const θ = bearing;
        const d = distance;
        const δ = d / R;    // angular distance, in earth laps
        const φ1 = degreesToRadians(this.latitude);
        const λ1 = degreesToRadians(this.longitude);
        const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) +
            Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
        const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
            Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
        const dynamicPositionModel = new DynamicPositionModel([φ2, λ2], this._referencePosition, this.magnetic_north);

        return dynamicPositionModel;
    }

    /**
     * Get the distance from `this` to a given position
     * Note: This method is not accurate for long distances, due its simpleton 2D vector math
     *
     * @for DynamicPositionModel
     * @method distanceTo
     * @param position {DynamicPositionModel|StaticPositionModel} position we're comparing against
     * @return {Number} distance to `position`, in (units???)
     */
    distanceToPosition(position) {
        return distanceToPoint(
            this.latitude,
            this.longitude,
            position.latitude,
            position.longitude
        );
    }

    /**
     * Change the lat/lon coordinates of `this`
     *
     * @for DynamicPositionModel
     * @method setCoordinates
     * @param gpsCoordinates {Array<number>} [latitude, longitude]
     */
    setCoordinates(gpsCoordinates) {
        if (!isValidGpsCoordinatePair(gpsCoordinates)) {
            return new TypeError('Expected valid GPS coordinates to be passed to Position.setCoordinates, ' +
                `but received ${gpsCoordinates}`);
        }

        this.latitude = gpsCoordinates[GPS_COORDINATE_INDEX.LATITUDE];
        this.longitude = gpsCoordinates[GPS_COORDINATE_INDEX.LONGITUDE];
    }

    /**
     * Determine the `x` and `y` values of the `DynamicPositionModel`, used for drawing on the canvas
     *
     * @for DynamicPositionModel
     * @method _calculateRelativePosition
     * @return {array<number>}
     * @private
     */
    _calculateRelativePosition() {
        if (!this._hasReferencePosition()) {
            return DEFAULT_SCREEN_POSITION;
        }

        return DynamicPositionModel.calculateRelativePosition(this.gps, this._referencePosition, this.magnetic_north);
    }

    /**
     * Checks whether or not this `DynamicPositionModel` has a reference `DynamicPositionModel`
     * Without the reference position, the rotation due to magnetic variation will not be applied
     *
     * @for DynamicPositionModel
     * @method _hasReferencePosition
     * @return {Boolean} whether this position is based on a reference position
     * @private
     */
    _hasReferencePosition() {
        return this._referencePosition !== null;
    }
}

/**
 * Calculate x/y position from latitude and longitude and a referencePostion
 *
 * Provides a static method to calculate position without instantiating a `DynamicPositionModel` class.
 *
 * @function getPosition
 * @param coordinates {array<string>}
 * @param referencePostion {DynamicPositionModel|StaticPositionModel|null}
 * @param magneticNorth {number}
 * @return {array}
 * @static
 */
DynamicPositionModel.calculateRelativePosition = (coordinates, referencePostion, magneticNorth) => {
    if (!coordinates || !referencePostion || !_isNumber(magneticNorth)) {
        throw new TypeError('Invalid parameter. DynamicPositionModel.getPosition() requires coordinates, referencePostion ' +
            'and magneticNorth as parameters');
    }

    const latitude = parseCoordinate(coordinates[GPS_COORDINATE_INDEX.LATITUDE]);
    const longitude = parseCoordinate(coordinates[GPS_COORDINATE_INDEX.LONGITUDE]);

    const canvasPositionX = calculateDistanceToPointForX(
        referencePostion,
        referencePostion.latitude,
        longitude
    );

    const canvasPositionY = calculateDistanceToPointForY(
        referencePostion,
        latitude,
        referencePostion.longitude
    );

    const { x, y } = adjustForMagneticNorth(canvasPositionX, canvasPositionY, magneticNorth);

    return [
        x,
        y
    ];
};
