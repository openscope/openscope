import ava from 'ava';
import _isEqual from 'lodash/isEqual';

import {
    vlen,
    vradial,
    vsub,
    area_to_poly
} from '../../src/assets/scripts/client/math/vector';
import { airportModelFixture } from '../fixtures/airportFixtures';

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
