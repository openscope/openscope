import { calculateNormalDistributedNumber } from '../math/core';

export const calculateNextWind = (data) => {
    const speed = getNormalDistributedNumber(data.speed);
    const initialAngle = getNormalDistributedNumber(data.angle);
    let nextAngle = initialAngle;

    if(initialAngle > 360) {
        nextAngle = initialAngle - 360;
    }

    const nextWind = {
        speed: speed,
        angle: nextAngle
    };
    
    return nextWind;
};
