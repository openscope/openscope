import ava from 'ava'

import { calculateMiddle } from '../../src/assets/scripts/math/core';

ava('.calculateMiddle() returns a number the is the mid-point of a given number, rounded up', t => {
    t.throws(() => calculateMiddle('10'));
    t.throws(() => calculateMiddle([]));
    t.throws(() => calculateMiddle({}));
    t.throws(() => calculateMiddle(null));
    t.throws(() => calculateMiddle(false));

    t.notThrows(() => calculateMiddle(undefined));
    t.notThrows(() => calculateMiddle());

    t.true(calculateMiddle(10) === 5);
    t.true(calculateMiddle(17) === 9);
});
