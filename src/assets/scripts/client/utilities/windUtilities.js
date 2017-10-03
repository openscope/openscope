import { getNormalDistributedNumber } from '../math/core';

export default getNewWind = (data) => {
    const speed = getNormalDistributedNumber(data.speed);
    const initialAngle = getNormalDistributedNumber(data.angle);
    let newAngle = initialAngle;

    if(initialAngle > 360) {
        newAngle = initialAngle - 360;
    }

    const newWind = {
        speed: speed,
        angle: newAngle
    };
    
    return newWind;
};
