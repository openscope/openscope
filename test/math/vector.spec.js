import ava from 'ava';
import _isEqual from 'lodash/isEqual';

import {
    vlen,
    vradial,
    vsub
} from '../../src/assets/scripts/math/vector';

ava('.vlen() returns the distance of a vector', t => {
    const expectedResult = 3.470727267316085;
    const result = vlen([3.413435715940289, -0.6280162237033251]);

    t.true(result === expectedResult);
});

ava('.vradial() calculate the angle of 2d vector in radians ', t => {
    const expectedResult = 1.7527451589209553;
    const result = vradial([3.413435715940289, -0.6280162237033251]);
    
    t.true(result === expectedResult);
});


ava('.vsub() returns the result of subtracting two vectors', t => {
    const v1 = [-1.916854832069327, 0.5900896751315733];
    const v2 = [1.5855125093045959, -0.2964924727406551];
    const expectedResult = [-3.502367341373923, 0.8865821478722284];
    const result = vsub(v1, v2);

    t.notThrows(() => vsub());
    t.true(result[0] === expectedResult[0]);
    t.true(result[1] === expectedResult[1]);
});
