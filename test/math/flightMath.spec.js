/* eslint-disable import/no-extraneous-dependencies, arrow-parens */
import ava from 'ava';

import {
    calcTurnRadius,
    calcTurnInitiationDistance,
    bearingToPoint,
    fixRadialDist,
    calculateCrosswindAngle
} from '../../src/assets/scripts/client/math/flightMath';

ava('calcTurnRadius() returns a turn radius based on speed and bank angle', t => {
    const speed = 144.0444432;
    const bankAngle = 0.4363323129985824;
    const expectedResult = 4535.774583027857;
    const result = calcTurnRadius(speed, bankAngle);

    t.true(result === expectedResult);
});

ava('calcTurnInitiationDistance() returns a distance for a 80 degree course change', t => {
    const speed = 144.0444432;
    const bankAngle = 0.4363323129985824;
    const courseChange = 0.26420086153126987;
    const expectedResult = 746.732042830424;
    const result = calcTurnInitiationDistance(speed, bankAngle, courseChange);

    t.true(result === expectedResult);
});

ava('calcTurnInitiationDistance() returns a distance for a 90 degree course change', t => {
    const speed = 144.0;
    const bankAngle = 0.4363323129985824;
    const courseChange = Math.PI*0.5;
    const expectedResult = 4676.97609619635;
    const result = calcTurnInitiationDistance(speed, bankAngle, courseChange);

    t.true(result === expectedResult);
});

ava('calcTurnInitiationDistance() returns a distance for a 180 degree course change', t => {
    const speed = 144.0;
    const bankAngle = 0.4363323129985824;
    const courseChange = Math.PI;
    const expectedResult = 4676.97609619635;
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

ava('.calculateCrosswindAngle() returns a number that represents the crosswind angle', (t) => {
    const expectedResult = 0.4720489082412385;
    const runwayAngleMock = 3.3676754461462877;
    const windAngleMock = 3.839724354387525;
    const result = calculateCrosswindAngle(runwayAngleMock, windAngleMock);

    t.true(result === expectedResult);
});
