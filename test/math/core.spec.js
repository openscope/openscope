import ava from 'ava'

import {
    calculateMiddle,
    clamp
} from '../../src/assets/scripts/client/math/core';

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

ava('.clamp() returns a number within a range, or the specified min/max number', t => {
    t.throws(() => clamp(7, []));
    t.throws(() => clamp(7, {}));
    t.throws(() => clamp(7, false));
    t.throws(() => clamp(7, ''));
    t.throws(() => clamp(7));

    t.true(clamp(0, 20, 5) === 5);
    t.true(clamp(-5, -10, 5) === -5);
    t.true(clamp(1, 10) === 10);
});
