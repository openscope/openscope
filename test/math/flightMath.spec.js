/* eslint-disable import/no-extraneous-dependencies, arrow-parens */
import ava from 'ava';

import {
    calcTurnRadius,
    calcTurnInitiationDistance,
    bearingToPoint,
    fixRadialDist
} from '../../src/assets/scripts/client/math/flightMath';

ava('calcTurnRadius() returns a turn radius based on speed and bank angle', t => {
    const speed = 144.0444432;
    const bankAngle = 0.4363323129985824;
    const expectedResult = 4535.774583027857;
    const result = calcTurnRadius(speed, bankAngle);

    t.true(result === expectedResult);
});

ava('calcTurnRadius() returns a turn radius based on speed and bank angle', t => {
    const speed = 144.0444432;
    const bankAngle = 0.4363323129985824;
    const courseChange = 0.26420086153126987;
    const expectedResult = 746.732042830424;
    const result = calcTurnInitiationDistance(speed, bankAngle, courseChange);

    t.true(result === expectedResult);
});

ava('bearingToPoint() returns the bearing from one point to another', t => {
    const positionStart = [-99.76521626690608, -148.0266530993096];
    const positionEnd = [-87.64380662924125, -129.57471627889475];
    const expectedResult = 0.5812231343277809;
    const result = bearingToPoint(positionStart, positionEnd);

    t.true(result === expectedResult);
});

ava('fixRadialDist() returns a point defined by a direction and distance away from another point', t => {
    const positionStart = [36.455167, -121.879667];
    const radial = 6.02139;
    const distance_nm = 8.5;
    const expectedResult = [36.59190833043389, -121.92530325256963];
    const result = fixRadialDist(positionStart, radial, distance_nm);

    t.true(result[0] === expectedResult[0]);
    t.true(result[1] === expectedResult[1]);
});
