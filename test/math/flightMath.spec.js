/* eslint-disable import/no-extraneous-dependencies, arrow-parens */
import ava from 'ava';

import {
    calcTurnRadius,
    calcTurnInitiationDistance,
    bearingToPoint
} from '../../src/assets/scripts/math/flightMath';

ava('.calcTurnRadius() returns a turn radius based on speed and bank angle', t => {
    const speed = 144.0444432;
    const bankAngle = 0.4363323129985824;
    const expectedResult = 4535.774583027857;
    const result = calcTurnRadius(speed, bankAngle);

    t.true(result === expectedResult);
});

ava('.calcTurnRadius() returns a turn radius based on speed and bank angle', t => {
    const speed = 144.0444432;
    const bankAngle = 0.4363323129985824;
    const courseChange = 0.26420086153126987;
    const expectedResult = 746.732042830424;
    const result = calcTurnInitiationDistance(speed, bankAngle, courseChange);

    t.true(result === expectedResult);
});

ava('.bearingToPoint()', t => {
    const positionStart = [-99.76521626690608, -148.0266530993096];
    const positionEnd = [-87.64380662924125, -129.57471627889475];
    const expectedResult = 0.5812231343277809;
    const result = bearingToPoint(positionStart, positionEnd);

    t.true(result === expectedResult);
});
