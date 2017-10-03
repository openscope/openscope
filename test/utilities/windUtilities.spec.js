import ava from 'ava';

import { getNewWind } from '../../src/assets/scripts/client/utilities/windUtilities';

const windMock = {
    speed: 10,
    angle: 400
};

ava('.getNewWind() does not return a value greater than 360', (t) => {
    const newWind = getNewWind(windMock);

    t.true(newWind.angle < 360);
});