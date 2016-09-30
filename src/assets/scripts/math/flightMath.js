import { sin, cos, tan } from './core';
import { vradial, vsub, vlen } from './vector';

/**
 * @property CONSTANTS
 * @type {Object}
 * @final
 */
const CONSTANTS = {
    /**
     * @property
     * @type {number}
     * @final
     */
    GRAVITATIONAL_MAGNITUDE: 9.81
};

/**
 * @function calcTurnRadius
 * @param speed {number} currentSpeed of an aircraft
 * @param bankAngle {number} bank angle of an aircraft
 * @return {number}
 */
export const calcTurnRadius = (speed, bankAngle) => {
    return (speed * speed) / (CONSTANTS.GRAVITATIONAL_MAGNITUDE * tan(bankAngle));
};

/**
 * @function calcTurnInitiationDistance
 * @param speed {number}            currentSpeed of an aircraft
 * @param bankAngle {number}        bank angle of an aircraft
 * @param courseChange {number}
 * @return {number}
 */
export const calcTurnInitiationDistance = (speed, bankAngle, courseChange) => {
    const turnRadius = calcTurnRadius(speed, bankAngle);

    return turnRadius * tan(courseChange / 2) + speed;
};


/**
 * Returns the bearing from `startPosition` to `endPosition`
 *
 * @param startPosition {array}     positional array, start point
 * @param endPosition {array}       positional array, end point
 */
export const bearing = (startPosition, endPosition) => {
    return vradial(vsub(endPosition, startPosition));
};

// TODO: this may be better suited to live in an Aircraft model somewhere.
/**
 * Returns an offset array showing how far [fwd/bwd, left/right] 'aircraft' is of 'target'
 *
 * @param aircraft {Aircraft}           the aircraft in question
 * @param target {array}                positional array of the targeted position [x,y]
 * @param headingThruTarget {number}    (optional) The heading the aircraft should
 *                                      be established on when passing the target.
 *                                      Default value is the aircraft's heading.
 * @returns {array} with two elements:  retval[0] is the lateral offset, in km
 *                                      retval[1] is the longitudinal offset, in km
 *                                      retval[2] is the hypotenuse (straight-line distance), in km
 */
export const getOffset = (aircraft, target, headingThruTarget = null) => {
    if (!headingThruTarget) {
        headingThruTarget = aircraft.heading;
    }

    const offset = [0, 0, 0];
    const vector = vsub(target, aircraft.position); // vector from aircraft pointing to target
    const bearingToTarget = vradial(vector);

    offset[2] = vlen(vector);
    offset[0] = offset[2] * sin(headingThruTarget - bearingToTarget);
    offset[1] = offset[2] * cos(headingThruTarget - bearingToTarget);

    return offset;
};
