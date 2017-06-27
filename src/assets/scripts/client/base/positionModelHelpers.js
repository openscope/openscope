import _isNil from 'lodash/isNil';
import {
    INVALID_INDEX,
    REGEX
} from '../constants/globalConstants';
import { distanceToPoint } from '../math/circle';

/**
 * @function hasCardinalDirectionInCoordinate
 * @param coordinate {string}
 * @return {boolean}
 */
export const hasCardinalDirectionInCoordinate = (coordinate) => REGEX.COMPASS_DIRECTION.test(coordinate);

// TODO: Are these two functions really needed to be separate?
/**
 * @function calculateDistanceToPointForX
 * @param referencePosition {StaticPositionModel}
 * @param latitude {number}
 * @param longitude {number}
 * @return x {number}
 */
export const calculateDistanceToPointForX = (referencePosition, latitude, longitude) => {
    let x = distanceToPoint(
        referencePosition.latitude,
        referencePosition.longitude,
        latitude,
        longitude
    );

    if (referencePosition.longitude > longitude) {
        x *= -1;
    }

    return x;
};

// TODO: Are these two functions really needed to be separate?
/**
 *
 *
 * @function calculateDistanceToPointForY
 * @param referencePosition {StaticPositionModel}
 * @param latitude {number}
 * @param longitude {number}
 * @return y {number}
 */
export const calculateDistanceToPointForY = (referencePosition, latitude, longitude) => {
    let y = distanceToPoint(
        referencePosition.latitude,
        referencePosition.longitude,
        latitude,
        longitude
    );


    if (referencePosition.latitude > latitude) {
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
 * Returns whether provided GPS coordinate pair is valid
 *
 * @function isValidGpsCoordinatePair
 * @param  gpsCoordinates {array<number>} in the shape of [latitude, longitude]
 * @return {Boolean}
 */
export const isValidGpsCoordinatePair = (gpsCoordinates) => {
    const hasContent = !_isNil(gpsCoordinates);
    const hasTwoOrThreeElements = gpsCoordinates.length === 2 || gpsCoordinates.length === 3;
    const firstTwoElementsHaveSameType = typeof gpsCoordinates[0] === typeof gpsCoordinates[1];

    if (!hasContent || !hasTwoOrThreeElements || !firstTwoElementsHaveSameType) {
        return false;
    }

    const latitude = gpsCoordinates[0];
    const longitude = gpsCoordinates[1];

    if (typeof latitude === 'number') {
        return true;
    } else if (typeof latitude === 'string') {
        const latFirstCharIsNorthOrSouth = ['N', 'S'].indexOf(latitude[0].toUpperCase()) !== INVALID_INDEX;
        const lonFirstCharIsEastOrWest = ['E', 'W'].indexOf(longitude[0].toUpperCase()) !== INVALID_INDEX;

        return latFirstCharIsNorthOrSouth && lonFirstCharIsEastOrWest;
    }

    return false;
};
