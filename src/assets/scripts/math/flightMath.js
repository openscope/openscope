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
    return (speed * speed) / (CONSTANTS.GRAVITATIONAL_MAGNITUDE * Math.tan(bankAngle));
}

/**
 * @function calcTurnInitiationDistance
 * @param speed {number} currentSpeed of an aircraft
 * @param bankAngle {number} bank angle of an aircraft
 * @param courseChange {number}
 * @return {number}
 */
export const calcTurnInitiationDistance = (speed, bankAngle, courseChange) => {
    const turnRadius = calcTurnRadius(speed, bankAngle);

    return turnRadius * Math.tan(courseChange / 2) + speed;
};
