import { distanceToPoint } from '../math/circle';
import { REGEX } from '../constants/globalConstants';

/**
 * @function hasCardinalDirectionInCoordinate
 * @param coordinate {string}
 * @return {boolean}
 */
export const hasCardinalDirectionInCoordinate = (coordinate) => REGEX.COMPASS_DIRECTION.test(coordinate);

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
    let t = Math.atan2(originalY, originalX) + magneticNorth;
    const r = Math.sqrt((originalX * originalX) + (originalY * originalY));


    const x = r * Math.cos(t);
    const y = r * Math.sin(t);

    return {
        x,
        y
    };
};
