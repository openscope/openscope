import ava from 'ava';
import _isEqual from 'lodash/isEqual';

import { isWithinEpsilon } from '../../src/assets/scripts/client/math/core';
import {
    vectorize2dFromRadians,
    vectorize2dFromDegrees,
    vlen,
    vradial,
    vsub,
    area_to_poly
} from '../../src/assets/scripts/client/math/vector';
import { airportModelFixture } from '../fixtures/airportFixtures';

ava('.vectorize2dFromRadians() returns the 2D unit vector for a heading in radians', (t) => {
    // will need to use that later with different values
    let message;

    // test the four cardinal points
    const test_4_cardinal_points = [{
        // north (0 degree)
        angle: 0,
        expectedResult: [0, 1]
    }, {
        // east
        angle: 0.5 * Math.PI,
        expectedResult: [1, 0]
    }, {
        // south
        angle: Math.PI,
        expectedResult: [0, -1]
    }, {
        // west
        angle: 1.5 * Math.PI,
        expectedResult: [-1, 0]
    }, {
        // north (360 degree)
        angle: 2 * Math.PI,
        expectedResult: [0, 1]
    }];

    for (const { angle, expectedResult } of test_4_cardinal_points) {
        const result = vectorize2dFromRadians(angle);

        message = `Unit vector's x component for a ${angle} radians angle is expected to be within EPSILON of ${expectedResult[0]}, result was ${result[0]}`;
        t.true(isWithinEpsilon(result[0], expectedResult[0]), message);

        message = `Unit vector's y component for a ${angle} radians angle is expected to be within EPSILON of ${expectedResult[1]}, result was ${result[1]}`;
        t.true(isWithinEpsilon(result[1], expectedResult[1]), message);
    }

    // test unit vector length is within epsilon of 1 for each degree between 0 and 360
    for (let angle = 0; angle <= 2 * Math.PI; angle += Math.PI / 180) {
        const vector = vectorize2dFromRadians(angle);
        const vectorLength = Math.sqrt(vector[0] ** 2 + vector[1] ** 2);

        const result = vectorLength;
        const expectedResult = 1;

        message = `Unit vector's length for a ${angle} radians angle is expected to be within EPSILON of ${expectedResult}, result was ${result}`;
        t.true(isWithinEpsilon(result, expectedResult), message);
    }
});

ava('.vectorize2dFromDegrees() returns the 2D unit vector for a heading, in degrees', (t) => {
    // will need to use that later with different values
    let message;

    // test the four cardinal points
    const test_4_cardinal_points = [{
        // north (0 degree)
        angle: 0,
        expectedResult: [0, 1]
    }, {
        // east
        angle: 90,
        expectedResult: [1, 0]
    }, {
        // south
        angle: 180,
        expectedResult: [0, -1]
    }, {
        // west
        angle: 270,
        expectedResult: [-1, 0]
    }, {
        // north (360 degree)
        angle: 360,
        expectedResult: [0, 1]
    }];

    for (const { angle, expectedResult } of test_4_cardinal_points) {
        const result = vectorize2dFromDegrees(angle);

        message = `Unit vector's x component for a ${angle} degrees angle is expected to be within EPSILON of ${expectedResult[0]}, result was ${result[0]}`;
        t.true(isWithinEpsilon(result[0], expectedResult[0]), message);

        message = `Unit vector's y component for a ${angle} degrees angle is expected to be within EPSILON of ${expectedResult[1]}, result was ${result[1]}`;
        t.true(isWithinEpsilon(result[1], expectedResult[1]), message);
    }

    // test unit vector length is within epsilon of 1 for each degree between 0 and 360
    for (let angle = 0; angle <= 360; angle++) {
        const vector = vectorize2dFromDegrees(angle);
        const vectorLength = Math.sqrt(vector[0] ** 2 + vector[1] ** 2);

        const result = vectorLength;
        const expectedResult = 1;

        message = `Unit vector's length for a ${angle} degrees angle is expected to be within EPSILON of ${expectedResult}, result was ${result}`;
        t.true(isWithinEpsilon(result, expectedResult), message);
    }
});

ava('.vlen() returns the distance of a vector', (t) => {
    const expectedResult = 3.470727267316085;
    const result = vlen([3.413435715940289, -0.6280162237033251]);

    t.true(result === expectedResult);
});

ava('.vradial() calculate the angle of 2d vector in radians ', (t) => {
    const expectedResult = 1.7527451589209553;
    const result = vradial([3.413435715940289, -0.6280162237033251]);

    t.true(result === expectedResult);
});

ava('.vsub() returns the result of subtracting two vectors', (t) => {
    const v1 = [-1.916854832069327, 0.5900896751315733];
    const v2 = [1.5855125093045959, -0.2964924727406551];
    const expectedResult = [-3.502367341373923, 0.8865821478722284];
    const result = vsub(v1, v2);

    t.notThrows(() => vsub());
    t.true(result[0] === expectedResult[0]);
    t.true(result[1] === expectedResult[1]);
});

ava('.area_to_poly() returns an array of 2 index arrays that represent canvas position', (t) => {
    const expectedResult = [
        [-59.059917680148594, -25.64677074552053],
        [-17.53371865240307, -61.0880349114718],
        [32.29657092287467, -50.58714587887948],
        [72.87432656152905, -8.891916430259512],
        [64.3715412492825, 31.456691481947626],
        [35.71462317218646, 43.599668190360354],
        [27.779774535370052, 37.066390562099514],
        [13.505483517053174, 16.065784282742673],
        [12.526179775077852, 14.659909858483443],
        [9.512187402098329, 14.435118251757926],
        [-5.3007735621762935, 13.302187078361868],
        [-6.720597482088389, 14.107788420824814],
        [-49.641760676130005, 11.37605308808484],
        [-67.81746809538386, 15.91078422023606]
    ];
    const result = area_to_poly(airportModelFixture.perimeter);

    t.true(_isEqual(result, expectedResult));
});
