import ava from 'ava';

import {
    isWithin,
    isWithinEpsilon,
    calculateMiddle,
    clamp,
    generateRandomOctalWithLength
} from '../../src/assets/scripts/client/math/core';

ava('.isWithin() returns true if value is within (inclusive) two given values', (t) => {
    // we want to test the function opperates correctly in the negative
    // range, the positive range, as well as right in the middle.
    const tests = [0, 1, -1];

    // we will test providing the 'limit1' and 'limit2' both
    // ways since the function is supposed to work that way
    for (const number of tests) {
        let limit1;
        let limit2;

        // should pass
        limit1 = number - Number.EPSILON;
        limit2 = number + Number.EPSILON;
        t.true(isWithin(number, limit1, limit2), `${number} should be within ${limit1} and ${limit2}`);
        t.true(isWithin(number, limit2, limit1), `${number} should be within ${limit2} and ${limit1}`);

        // should fail
        limit1 = number - Number.EPSILON;
        limit2 = number - 2 * Number.EPSILON;
        t.false(isWithin(number, limit1, limit2), `${number} should NOT be within ${limit1} and ${limit2}`);
        t.false(isWithin(number, limit2, limit1), `${number} should NOT be within ${limit2} and ${limit1}`);

        // should fail too
        limit1 = number + Number.EPSILON;
        limit2 = number + 2 * Number.EPSILON;
        t.false(isWithin(number, limit1, limit2), `${number} should NOT be within ${limit1} and ${limit2}`);
        t.false(isWithin(number, limit2, limit1), `${number} should NOT be within ${limit2} and ${limit1}`);
    }
});

ava('.isWithinEpsilon() returns true if value is within EPSILON of an expected value', (t) => {
    // we want to test the function opperates correctly in the negative
    // range, the positive range, as well as right in the middle.
    const tests = [0, 1, -1];

    for (const number of tests) {
        let numberVariant1;
        let numberVariant2;

        // test the numbers plus and minus EPSILON
        // should pass
        numberVariant1 = number - Number.EPSILON;
        numberVariant2 = number + Number.EPSILON;
        t.true(isWithinEpsilon(number, number), `${number} should be within EPSILON of ${number}`);
        t.true(isWithinEpsilon(numberVariant1, number), `${numberVariant1} should be within EPSILON of ${number}`);
        t.true(isWithinEpsilon(numberVariant2, number), `${numberVariant2} should be within EPSILON of ${number}`);

        // test the numbers plus and minus *2 times* EPSILON
        // should fail
        numberVariant1 = number - 2 * Number.EPSILON;
        numberVariant2 = number + 2 * Number.EPSILON;
        t.false(isWithinEpsilon(numberVariant1, number), `${numberVariant1} should NOT be within EPSILON of ${number}`);
        t.false(isWithinEpsilon(numberVariant2, number), `${numberVariant2} should NOT be within EPSILON of ${number}`);
    }
});

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

ava('.generateRandomOctalWithLength() returns a single digit number when called without parameters', (t) => {
    const result = generateRandomOctalWithLength();

    t.true(result.toString().length === 1);
});


ava('.generateRandomOctalWithLength() returns a number of a desired length', (t) => {
    const result = generateRandomOctalWithLength(4);

    t.true(result.toString().length === 4);
});
