import ava from 'ava';

import { tau } from '../../src/assets/scripts/math/circle';

ava('.tau() returns PI * 2', t => {
    const result = tau();
    const expectedResult = Math.PI * 2;

    t.true(result === expectedResult);
});
