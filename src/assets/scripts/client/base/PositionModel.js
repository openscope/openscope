import _isEmpty from 'lodash/isEmpty';
import _isNil from 'lodash/isNil';
import _isNumber from 'lodash/isNumber';
import _uniqueId from 'lodash/uniqueId';
import StaticPositionModel from './StaticPositionModel';
import {
    calculateDistanceToPointForX,
    calculateDistanceToPointForY,
    adjustForMagneticNorth
} from './positionModelHelpers';
import { PHYSICS_CONSTANTS } from '../constants/globalConstants';
import {
    LATITUDE_INDEX,
    LONGITUDE_INDEX,
    ELEVATION_INDEX,
    DEFAULT_SCREEN_POSITION
} from '../constants/positionConstants';
import { distanceToPoint, radians_normalize } from '../math/circle';
import {
    degreesToRadians,
    parseCoordinate,
    parseElevation,
    radiansToDegrees
} from '../utilities/unitConverters';

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
     * Relative position, in km offset from the airport
     *
     * @property relativePosition
     * @return {array}
     */
    get relativePosition() {
        return this._calculaterelativePosition();
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
     * @method bearingFromPosition
     * @param position {PositionModel} position we're comparing against
     * @return {Number} bearing from `position` to `this`, in radians
     */
    bearingFromPosition(position) {
        return radians_normalize(this.bearingToPosition(position) + Math.PI);
    }

    // TODO: Rename this to imply that it accepts a `PositionModel`
    /**
     * Calculate the initial magnetic bearing to a given position from the position of `this`
     * Note: This method uses great circle math to determine the bearing. It is very accurate, but
     * also a very expensive operation. If the precision is not needed, a vradial(vsub()) of the
     * x/y positions is a more "quick and dirty" option.
     *
     * @for PositionModel
     * @method bearingToPosition
     * @param position {PositionModel} position we're comparing against
     * @return {Number} bearing from `this` to `position`, in radians
     */
    bearingToPosition(position) {
        const φ1 = degreesToRadians(this.latitude);
        const φ2 = degreesToRadians(position.latitude);
        const Δλ = degreesToRadians(position.longitude - this.longitude);

        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        const θ = Math.atan2(y, x);

        return θ - this.magnetic_north;
    }

    /**
     * Returns a new `StaticPositionModel` a given bearing/distance from `this`
     *
     * @for PositionModel
     * @method generatePositionFromBearingAndDistance
     * @param bearing {number} magnetic bearing, in radians
     * @param distance {number} distance, in nautical miles
     * @param isStatic {boolean} whether the returned position should be a `StaticPositionModel`
     * @return {StaticPositionModel}
     */
    generatePositionFromBearingAndDistance(bearing, distance, /* optional */ isStatic) {
        // FIXME: There may already be a method for this. if there isnt there should be. `position.gpsInRadians`
        // convert GPS coordinates to radians
        const fix = [
            degreesToRadians(this.latitude),
            degreesToRadians(this.longitude)
        ];

        const R = PHYSICS_CONSTANTS.EARTH_RADIUS_NM;
        // TODO: abstract these two calculations to functions
        const lat2 = radiansToDegrees(Math.asin(
            Math.sin(fix[0]) * Math.cos(distance / R) + Math.cos(fix[0])
            * Math.sin(distance / R) * Math.cos(bearing)
        ));
        const lon2 = radiansToDegrees(fix[1] + Math.atan2(
            Math.sin(bearing) * Math.sin(distance / R) * Math.cos(fix[0]),
            Math.cos(distance / R) - Math.sin(fix[0]) * Math.sin(lat2)
        ));

        if (isStatic) {
            return new StaticPositionModel([lat2, lon2], this.reference_position, this.magnetic_north);
        }

        return new PositionModel([lat2, lon2], this.reference_position, this.magnetic_north);
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
     * Change the lat/lon coordinates of `this`
     *
     * @for PositionModel
     * @method setCoordinates
     * @param newCoordinates {Array<number>} [latitude, longitude]
     */
    setCoordinates(newCoordinates) {
        if (_isNil(newCoordinates) || newCoordinates.length !== 2 ||
            typeof newCoordinates[0] !== 'number' || typeof newCoordinates[1] !== 'number'
        ) {
            return new TypeError('Expected valid GPS coordinates to be passed to Position.setCoordinates, ' +
                `but received ${newCoordinates}`);
        }

        this.latitude = newCoordinates[0];
        this.longitude = newCoordinates[1];
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
     * @method _calculaterelativePosition
     * @private
     */
    _calculaterelativePosition() {
        if (!this._hasReferencePosition()) {
            return DEFAULT_SCREEN_POSITION;
        }

        return PositionModel.calculateRelativePosition(this.gps, this.reference_position, this.magnetic_north);
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
PositionModel.calculateRelativePosition = (coordinates, referencePostion, magneticNorth) => {
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
