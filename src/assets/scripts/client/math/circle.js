import { mod } from './core';
import { radiansToDegrees, degreesToRadians } from '../utilities/unitConverters';

/**
 * 2x Pi
 *
 * @function tau
 * @return {number}
 */
export const tau = () => {
    return Math.PI * 2;
};

/**
 * Returns the angle difference between two headings
 *
 * @function angle_offset
 * @param {number} a     heading, in radians
 * @param {number} b     heading, in radians
 * @return {number}
 */
export const angle_offset = (a, b) => {
    a = radiansToDegrees(a);
    b = radiansToDegrees(b);
    let invert = false;

    if (b > a) {
        invert = true;
        const temp = a;

        a = b;
        b = temp;
    }

    let offset = mod(a - b, 360);
    if (offset > 180) {
        offset -= 360;
    }

    if (invert) {
        offset *= -1;
    }

    offset = degreesToRadians(offset);

    return offset;
};

/**
 * normalize angles to within 0° - 360°
 * @param  {number} degrees an angle
 * @return {number}         an angle within [0,360]
 */
export const degrees_normalize = (degrees) => {
    if (degrees >= 0) {
        return degrees % 360;
    }

    return 360 + (degrees % 360);
};

/**
 * normalize angles to within 0 - 2π
 * @param  {number} radians an angle
 * @return {number}         an angle within [0,2π]
 */
export const radians_normalize = (radians) => {
    if (radians >= 0) {
        return radians % tau();
    }

    return tau() + (radians % tau());
};

/**
 * Calculate the distance between two lat/long coordinates in km
 *
 * This is a javascript implementation of the Haversine Formula
 *
 * for more information on the math see:
 * - http://www.movable-type.co.uk/scripts/latlong.html
 * - http://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
 *
 * @function distanceToPoint
 * @param startLatitude {number}
 * @param startLongitude {number}
 * @param endLatitude {number}
 * @param endLongitude {number}
 * return {number}
 */
export const distanceToPoint = (startLatitude, startLongitude, endLatitude, endLongitude) => {
    // TODO: add to global constants
    const EARTH_RADIUS_KM = 6371;
    const startLatitudeRadians = degreesToRadians(startLatitude);
    const endLatitudeRadians = degreesToRadians(endLatitude);
    const distanceLatitude = degreesToRadians(startLatitude - endLatitude);
    const distanceLongitude = degreesToRadians(startLongitude - endLongitude);

    // the square of half the chord length between points
    const a = Math.pow(Math.sin(distanceLatitude / 2), 2) +
        (Math.cos(startLatitudeRadians) * Math.cos(endLatitudeRadians) * Math.pow(Math.sin(distanceLongitude / 2), 2));


    const angularDistanceInRadians = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return angularDistanceInRadians * EARTH_RADIUS_KM;
};

// /**
//  *
//  * @function distEuclid
//  * @param
//  * @param
//  * @return
//  */
// export const distEuclid = (lat1, lon1, lat2, lon2) => {
//     // TODO: add to global constants
//     const EARTH_RADIUS_KM = 6371;
//     const lat1 = degreesToRadians(lat1);
//     const lat2 = degreesToRadians(lat2);
//     const dlat = degreesToRadians(lat2 - lat1);
//     const dlon = degreesToRadians(lon2 - lon1);
//
//     const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     const d = EARTH_RADIUS_KM * c;
//
//     return d; // distance, in kilometers
// };
