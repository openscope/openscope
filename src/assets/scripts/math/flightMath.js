const CONSTANTS = {
    AVG_GRAVITATIONAL_MAGNITUDE: 9.81
};

/**
 * @function calcTurnRadius
 * @param speed {number}
 * @param bankAngle {number}
 * @return {number}
 */
export const calcTurnRadius = (speed, bankAngle) => {
    return (speed * speed) / (CONSTANTS.AVG_GRAVITATIONAL_MAGNITUDE * Math.tan(bankAngle));
}

/**
 * @function calcTurnInitiationDistance
 * @param speed {number}
 * @param bankAngle {number}
 * @param courseChange {number}
 * @return {number}
 */
export const calcTurnInitiationDistance = (speed, bankAngle, courseChange) => {
    const turnRadius = calcTurnRadius(speed, bankAngle);

    return turnRadius * Math.tan(courseChange / 2) + speed;
};
