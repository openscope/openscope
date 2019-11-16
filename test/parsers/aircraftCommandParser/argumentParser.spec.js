/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies */
import ava from 'ava';

import {
    altitudeParser,
    headingParser,
    findHoldCommandByType,
    holdParser,
    isLegLengthArg,
    timewarpParser,
    optionalAltitudeParser,
    crossingParser
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

ava('.optionalAltitudeParser() converts a string flight level altitude to a number altitude in thousands', t => {
    const result = optionalAltitudeParser(['080']);

    t.true(result[0] === 8000);
});

ava('.optionalAltitudeParser() returns true if there is no argument', t => {
    const result = optionalAltitudeParser([]);

    t.true(result.length === 0);
});

ava('.headingParser() throws if it does not receive 1 or 2 arguments', t => {
    t.throws(() => headingParser([]));
    t.throws(() => headingParser(['l', '042', 'threeve']));
});

ava('.headingParser() returns an array of length 3 when passed new heading as the second argument', t => {
    const result = headingParser(['042']);

    t.true(result.length === 3);
    t.true(!result[0]);
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
    t.is(findHoldCommandByType('turnDirection', argsMock), 'left');
});

ava('.findHoldCommandByType() returns a legLength when passed a valid legLength in min', (t) => {
    const argsMock = ['dumba', 'l', '3min'];
    t.is(findHoldCommandByType('legLength', argsMock), '3min');
});

ava('.findHoldCommandByType() returns a legLength when passed a valid legLength in nm', (t) => {
    const argsMock = ['dumba', 'l', '3nm'];
    t.is(findHoldCommandByType('legLength', argsMock), '3nm');
});

ava('.findHoldCommandByType() returns a fixName when passed a valid fixName', (t) => {
    const argsMock = ['dumba', 'l', '3nm'];
    t.is(findHoldCommandByType('fixName', argsMock), 'dumba');
});

ava('.isLegLengthArg() returns false when passed an invalid leg length', (t) => {
    t.false(isLegLengthArg('1'));
    t.false(isLegLengthArg('0min'));
    t.false(isLegLengthArg('0nm'));
    t.false(isLegLengthArg('20min'));
    t.false(isLegLengthArg('20nm'));
    t.false(isLegLengthArg('1km'));
});

ava('.isLegLengthArg() returns true when passed a valid leg length', (t) => {
    t.true(isLegLengthArg('1min'));
    t.true(isLegLengthArg('2min'));
    t.true(isLegLengthArg('19min'));
    t.true(isLegLengthArg('1nm'));
    t.true(isLegLengthArg('2nm'));
    t.true(isLegLengthArg('19nm'));
});

ava('.holdParser() returns an array of length 4 when passed a fixname as the only argument', t => {
    const expectedResult = [null, null, 'dumba', null];
    const result = holdParser(['dumba']);

    t.deepEqual(result, expectedResult);
});

ava('.holdParser() returns an array of length 4 when passed a direction and fixname as arguments', t => {
    const expectedResult = ['left', null, 'dumba', null];
    let result = holdParser(['dumba', 'left']);
    t.deepEqual(result, expectedResult);

    result = holdParser(['left', 'dumba']);
    t.deepEqual(result, expectedResult);
});

ava('.holdParser() returns an array of length 4 when passed a legLength and fixname as arguments', t => {
    const expectedResult = [null, '1min', 'dumba', null];
    let result = holdParser(['dumba', '1min']);
    t.deepEqual(result, expectedResult);

    result = holdParser(['1min', 'dumba']);
    t.deepEqual(result, expectedResult);
});

ava('.holdParser() returns an array of length 4 when passed a direction, legLength and fixname as arguments', t => {
    const expectedResult = ['left', '1min', 'dumba', null];
    let result = holdParser(['dumba', 'left', '1min']);
    t.deepEqual(result, expectedResult);

    result = holdParser(['left', '1min', 'dumba']);
    t.deepEqual(result, expectedResult);

    result = holdParser(['1min', 'left', 'dumba']);
    t.deepEqual(result, expectedResult);

    result = holdParser(['left', 'dumba', '1min']);
    t.deepEqual(result, expectedResult);
});

ava('.holdParser() returns an array of length 4 when passed a direction, legLength, fixname and radial as arguments', t => {
    const expectedResult = ['left', '1min', 'dumba', 7];
    let result = holdParser(['dumba', 'left', '1min', '007']);
    t.deepEqual(result, expectedResult);

    result = holdParser(['left', '1min', 'dumba', '007']);
    t.deepEqual(result, expectedResult);

    result = holdParser(['1min', 'left', 'dumba', '007']);
    t.deepEqual(result, expectedResult);

    result = holdParser(['left', 'dumba', '1min', '007']);
    t.deepEqual(result, expectedResult);

    result = holdParser(['left', 'dumba', '007', '1min']);
    t.deepEqual(result, expectedResult);
});

ava('.timewarpParser() returns an array with 0 as a value when provided no args', (t) => {
    const result = timewarpParser([]);

    t.true(result[0] === 1);
});

ava('.timewarpParser() returns an array with 50 as a value when provided as an arg', (t) => {
    const result = timewarpParser([50]);

    t.true(result[0] === 50);
});


ava('.crossingParser() returns an array with the correct values', (t) => {
    const result = crossingParser(['LEMDY', '50']);

    t.true(result[0] === 'LEMDY');
    t.true(result[1] === 5000);
});
