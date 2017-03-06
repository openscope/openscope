import _isEmpty from 'lodash/isEmpty';
import _isNumber from 'lodash/isNumber';
import _uniqueId from 'lodash/uniqueId';
import {
    calculateDistanceToPointForX,
    calculateDistanceToPointForY,
    adjustForMagneticNorth,
    hasCardinalDirectionInCoordinate
} from './positionModelHelpers';
import { distanceToPoint, radians_normalize } from '../math/circle';
import {
    degreesToRadians,
    radiansToDegrees,
    parseCoordinate,
    parseElevation
} from '../utilities/unitConverters';

// TODO: Move these enumerations out to a separate file
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
 * Screen position to default to if the actual position cannot be calculated, in shape of [x,y]
 *
 * @property DEFAULT_SCREEN_POSITION
 * @type {Array}
 * @final
 */
const DEFAULT_SCREEN_POSITION = [0, 0];


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
    constructor(coordinates = [], reference, magnetic_north = 0) {
        if (_isEmpty(coordinates)) {
            throw new TypeError('Invalid coordinates passed to PositionModel. Expected shape of ' +
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
         * @property reference_position
         * @type {PositionModel|null}
         */
        this.reference_position = reference;

        /**
         * @property magnetic_north
         * @type {number}
         */
        this.magnetic_north = magnetic_north;

        return this.init(coordinates);
    }

    // TODO: This name should be changed to `get screenPosition()` to better represent its purpose
    /**
     * Current x, y position
     *
     * @property position
     * @return {array}
     */
    get position() {
        return this._calculateScreenPosition();
    }

    /**
     * GPS coordinates in [latitude, longitude] order
     * For reverse order, see `PositionModel.gpsXY`
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
     * For reverse order, see `PositionModel.gps`
     * @property gpsXY
     * @return {array}
     */
    get gpsXY() {
        return [
            this.longitude,
            this.latitude
        ];
    }

    // TODO: magnetic_north is already in radians? This should be changed or removed
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
    init(coordinates) {
        this.latitude = parseCoordinate(coordinates[LATITUDE_INDEX]);
        this.longitude = parseCoordinate(coordinates[LONGITUDE_INDEX]);

        // TODO: this is using coersion and shoudld be updated to be more explicit
        if (coordinates[ELEVATION_INDEX] != null) {
            this.elevation = parseElevation(coordinates[ELEVATION_INDEX]);
        }
    }

    // TODO: Rename this to imply that it accepts a `PositionModel`
    /**
     * Calculate the initial magnetic bearing from a given position to the position of `this`
     *
     * @for PositionModel
     * @method bearingFrom
     * @param position {PositionModel} position we're comparing against
     * @return {Number} bearing from `position` to `this`, in radians
     */
    bearingFrom(position) {
        return radians_normalize(this.bearingTo(position) + Math.PI);
    }

    // TODO: Rename this to imply that it accepts a `PositionModel`
    /**
     * Calculate the initial magnetic bearing to a given position from the position of `this`
     * Note: This method uses great circle math to determine the bearing. It is very accurate, but
     * also a very expensive operation. If the precision is not needed, a vradial(vsub()) of the
     * x/y positions is a more "quick and dirty" option.
     *
     * @for PositionModel
     * @method bearingTo
     * @param position {PositionModel} position we're comparing against
     * @return {Number} bearing from `this` to `position`, in radians
     */
    bearingTo(position) {
        const φ1 = degreesToRadians(this.latitude);
        const φ2 = degreesToRadians(position.latitude);
        const Δλ = degreesToRadians(position.longitude - this.longitude);

        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        const θ = Math.atan2(y, x);

        return θ - this.magnetic_north;
    }

    // TODO: Rename this to imply that it accepts a `PositionModel`
    /**
     * Get the distance from `this` to a given position
     * Note: This method is not accurate for long distances, due its simpleton 2D vector math
     *
     * @for PositionModel
     * @method distanceTo
     * @param position {PositionModel} position we're comparing against
     * @return {Number} distance to `position`, in (units???)
     */
    distanceTo(position) {
        return distanceToPoint(
            this.latitude,
            this.longitude,
            position.latitude,
            position.longitude
        );
    }

    /**
     * Checks whether or not this `PositionModel` has a reference `PositionModel`
     * Without the reference position, the rotation due to magnetic variation will not be applied
     * @for PositionModel
     * @method _hasReferencePosition
     * @return {Boolean} whether this position is based on a reference position
     */
    _hasReferencePosition() {
        return this.reference_position !== null;
    }

    /**
     * Determine the `x` and `y` values of the `PositionModel`, used for drawing on the canvas
     * @for PositionModel
     * @method _calculateScreenPosition
     * @private
     */
    _calculateScreenPosition() {
        if (!this._hasReferencePosition()) {
            return DEFAULT_SCREEN_POSITION;
        }

        return PositionModel.calculatePosition(this.gps, this.reference_position, this.magnetic_north);
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
    if (!coordinates || !referencePostion || !_isNumber(magneticNorth)) {
        throw new TypeError('Invalid parameter. PositionModel.getPosition() requires coordinates, referencePostion ' +
            'and magneticNorth as parameters');
    }

    const latitude = parseCoordinate(coordinates[LATITUDE_INDEX]);
    const longitude = parseCoordinate(coordinates[LONGITUDE_INDEX]);

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
