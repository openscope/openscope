import _isNil from 'lodash/isNil';
import { distanceToPoint } from '../math/circle';
import { REGEX } from '../constants/globalConstants';
import PositionModel from './PositionModel';
import StaticPositionModel from './StaticPositionModel';

/**
 * @function hasCardinalDirectionInCoordinate
 * @param coordinate {string}
 * @return {boolean}
 */
export const hasCardinalDirectionInCoordinate = (coordinate) => REGEX.COMPASS_DIRECTION.test(coordinate);

// TODO: Are these two functions really needed to be separate?
/**
 * @function calculateDistanceToPointForX
 * @param referencePostion {PositionModel}
 * @param latitude {number}
 * @param longitude {number}
 * @return x {number}
 */
export const calculateDistanceToPointForX = (referencePostion, latitude, longitude) => {
    let x = distanceToPoint(
        referencePostion.latitude,
        referencePostion.longitude,
        latitude,
        longitude
    );

    if (referencePostion.longitude > longitude) {
        x *= -1;
    }

    return x;
};

// TODO: Are these two functions really needed to be separate?
/**
 *
 *
 * @function calculateDistanceToPointForY
 * @param referencePostion {PositionModel}
 * @param latitude {number}
 * @param longitude {number}
 * @return y {number}
 */
export const calculateDistanceToPointForY = (referencePostion, latitude, longitude) => {
    let y = distanceToPoint(
        referencePostion.latitude,
        referencePostion.longitude,
        latitude,
        longitude
    );


    if (referencePostion.latitude > latitude) {
        y *= -1;
    }

    return y;
};

/**
 * Adjust to use magnetic north instead of true north
 *
 * @function adjustForMagneticNorth
 * @param originalX {string}
 * @param originalY {string}
 * @param magneticNorth {number}
 * @return {object}
 */
export const adjustForMagneticNorth = (originalX, originalY, magneticNorth) => {
    const t = Math.atan2(originalY, originalX) + magneticNorth;
    const r = Math.sqrt((originalX * originalX) + (originalY * originalY));

    const x = r * Math.cos(t);
    const y = r * Math.sin(t);

    return {
        x,
        y
    };
};

/**
 * Accepts a `StaticPositionModel` and returns a `PositionModel` with the same location
 *
 * @function convertStaticPositionToDynamic
 * @param staticPositionModel {staticPositionModel}
 * @return {PositionModel}
 */
export const convertStaticPositionToDynamic = (staticPositionModel) => {
    const dyanmicPositionModel = new PositionModel(staticPositionModel.gps,
        staticPositionModel.referencePostion, staticPositionModel.magnetic_north
    );

    return dyanmicPositionModel;
};

/**
 * Accepts a `PositionModel` and returns a `StaticPositionModel` with the same location
 *
 * @function convertDynamicPositionToStatic
 * @param dynamicPositionModel {PositionModel}
 * @return {StaticPositionModel}
 */
export const convertDynamicPositionToStatic = (dynamicPositionModel) => {
    const staticPositionModel = new StaticPositionModel(dynamicPositionModel.gps,
        dynamicPositionModel.referencePostion, dynamicPositionModel.magnetic_north
    );

    return staticPositionModel;
};

/**
 * Returns whether provided GPS coordinate pair is valid
 *
 * @function isValidGpsCoordinatePair
 * @param  gpsCoordinates {array<number>} in the shape of [latitude, longitude]
 * @return {Boolean}
 */
export const isValidGpsCoordinatePair = (gpsCoordinates) => {
    const isValid = _isNil(gpsCoordinates) || gpsCoordinates.length !== 2
        || typeof gpsCoordinates[0] !== 'number' || typeof gpsCoordinates[1] !== 'number';

    return isValid;
};
