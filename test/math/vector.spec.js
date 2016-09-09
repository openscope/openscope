import ava from 'ava';

import { vlen } from '../../src/assets/scripts/math/vector';

const V = [3.413435715940289, -0.6280162237033251];

ava('.vlen() returns the distance of a vector', t => {
    const result = vlen(V);
    const expectedResult = 3.470727267316085;

    t.true(result === expectedResult);
});
