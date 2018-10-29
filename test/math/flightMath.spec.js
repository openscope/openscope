/* eslint-disable import/no-extraneous-dependencies, arrow-parens */
import ava from 'ava';

import {
    calcTurnRadiusByBankAngle,
    calcTurnRadiusByTurnRate,
    calcTurnInitiationDistanceNm,
    bearingToPoint,
    fixRadialDist,
    calculateCrosswindAngle
} from '../../src/assets/scripts/client/math/flightMath';

ava('calcTurnRadiusByBankAngle() returns a turn radius based on speed and bank angle', t => {
    const speed = 190;
    const bankAngle = 0.523599;
    const expectedResult = 0.9139236691657421;
    const result = calcTurnRadiusByBankAngle(speed, bankAngle);

    t.true(result === expectedResult);
});

ava('calcTurnRadiusByTurnRate() returns a turn radius based on speed and turn rate', t => {
    const speed = 190;
    const turnRate = 0.0523598776;
    const expectedResult = 1.0079813054753546;
    const result = calcTurnRadiusByTurnRate(speed, turnRate);

    t.true(result === expectedResult);
});

ava('calcTurnInitiationDistanceNm() returns the distance required for a turn', t => {
    const speedA = 190;
    const speedB = 500;
    const turnRate = 0.0523598776;

    t.is(calcTurnInitiationDistanceNm(speedA, turnRate, 0.26420086153126987), 0.1339347496990795);
    t.is(calcTurnInitiationDistanceNm(speedA, turnRate, Math.PI*0.5), 1.0079813054753544);
    t.is(calcTurnInitiationDistanceNm(speedA, turnRate, Math.PI*0.75), 2.4334821382971388);

    t.is(calcTurnInitiationDistanceNm(speedB, turnRate, 0.26420086153126987), 0.35245986762915654);
    t.is(calcTurnInitiationDistanceNm(speedB, turnRate, Math.PI*0.5), 2.65258238282988);
    t.is(calcTurnInitiationDistanceNm(speedB, turnRate, Math.PI*0.75), 6.403900363939838);
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
