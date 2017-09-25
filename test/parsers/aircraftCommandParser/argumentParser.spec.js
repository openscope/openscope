/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import _isEqual from 'lodash/isEqual';

import {
    altitudeParser,
    headingParser,
    findHoldCommandByType,
    holdParser,
    timewarpParser
} from '../../../src/assets/scripts/client/parsers/aircraftCommandParser/argumentParsers';

ava('.altitudeParser() converts a string flight level altitude to a number altitude in thousands', t => {
    const result = altitudeParser(['080']);

    t.true(result[0] === 8000);
});

ava('.altitudeParser() returns true if the second argument is not undefined', t => {
    const result = altitudeParser(['080', 'x']);

    t.true(result[1]);
});

ava('.altitudeParser() returns an array of length two when passed a single argument', t => {
    const result = altitudeParser(['080']);

    t.true(result.length === 2);
    t.true(result[0] === 8000);
    t.false(result[1]);
});

ava('.headingParser() throws if it does not receive 1 or 2 arguments', t => {
    t.throws(() => headingParser([]));
    t.throws(() => headingParser(['l', '042', 'threeve']));
});

ava('.headingParser() returns an array of length 3 when passed new heading as the second argument', t => {
    const result = headingParser(['042']);

    t.true(result.length === 3);
    t.true(result[0] === null);
    t.true(result[1] === 42);
    t.false(result[2]);
});

ava('.headingParser() returns an array of length 3 when passed direction and heading as arguments', t => {
    const result = headingParser(['left', '42']);

    t.true(result.length === 3);
    t.true(result[0] === 'left');
    t.true(result[1] === 42);
    t.true(result[2]);
});

ava('.headingParser() translates l to left as the first value', t => {
    const result = headingParser(['l', '042']);

    t.true(result[0] === 'left');
});

ava('.headingParser() translates r to right as the first value', t => {
    const result = headingParser(['r', '042']);

    t.true(result[0] === 'right');
});

// specfic use cases for headingParser
ava('.headingParser() parses two digit heading as an incremental heading', t => {
    const result = headingParser(['r', '42']);

    t.true(result[0] === 'right');
    t.true(result[1] === 42);
    t.true(result[2]);
});

ava('.headingParser() parses three digit heading as a generic heading', t => {
    const result = headingParser(['r', '042']);

    t.true(result[0] === 'right');
    t.true(result[1] === 42);
    t.false(result[2]);
});

ava('.findHoldCommandByType() returns a turnDirection when passed a variation of left or right', (t) => {
    const argsMock = ['dumba', 'l', '3nm'];
    t.true(findHoldCommandByType('turnDirection', argsMock) === 'left');
});

ava('.findHoldCommandByType() returns a legLength when passed a valid legLength in min', (t) => {
    const argsMock = ['dumba', 'l', '3min'];
    t.true(findHoldCommandByType('legLength', argsMock) === '3min');
});

ava('.findHoldCommandByType() returns a legLength when passed a valid legLength in nm', (t) => {
    const argsMock = ['dumba', 'l', '3nm'];
    t.true(findHoldCommandByType('legLength', argsMock) === '3nm');
});

ava('.findHoldCommandByType() returns a fixName when passed a valid fixName', (t) => {
    const argsMock = ['dumba', 'l', '3nm'];
    t.true(findHoldCommandByType('fixName', argsMock) === 'dumba');
});

ava('.holdParser() returns an array of length 3 when passed a fixname as the only argument', t => {
    const expectedResult = ['right', '1min', 'dumba'];
    const result = holdParser(['dumba']);

    t.true(_isEqual(result, expectedResult));
});

ava('.holdParser() returns an array of length 3 when passed a direction and fixname as arguments', t => {
    const expectedResult = ['left', '1min', 'dumba'];
    let result = holdParser(['dumba', 'left']);
    t.true(_isEqual(result, expectedResult));

    result = holdParser(['left', 'dumba']);
    t.true(_isEqual(result, expectedResult));
});

ava('.holdParser() returns an array of length 3 when passed a direction, legLength and fixname as arguments', t => {
    const expectedResult = ['left', '1min', 'dumba'];
    let result = holdParser(['dumba', 'left', '1min']);
    t.true(_isEqual(result, expectedResult));

    result = holdParser(['left', '1min', 'dumba']);
    t.true(_isEqual(result, expectedResult));

    result = holdParser(['1min', 'left', 'dumba']);
    t.true(_isEqual(result, expectedResult));

    result = holdParser(['left', 'dumba', '1min']);
    t.true(_isEqual(result, expectedResult));
});

ava('.timewarpParser() returns an array with 0 as a value when provided no args', (t) => {
    const result = timewarpParser([]);

    t.true(result[0] === 1);
});

ava('.timewarpParser() returns an array with 50 as a value when provided as an arg', (t) => {
    const result = timewarpParser([50]);

    t.true(result[0] === 50);
});
