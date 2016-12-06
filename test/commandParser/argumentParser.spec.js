import ava from 'ava';

import {
    altitudeParser,
    headingParser
} from '../../src/assets/scripts/commandParser/argumentParsers';

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

ava('.headingParser() returns an array of length 3 when passed new heading as the second argument', t => {
    const result = headingParser(['042'])

    t.true(result.length === 3);
    t.true(result[0] === '');
    t.true(result[1] === 42);
    t.false(result[2]);
});

ava('.headingParser() returns an array of length 3 when passed direction and heading as arguments', t => {
    const result = headingParser(['left', '042'])

    t.true(result.length === 3);
    t.true(result[0] === 'left');
    t.true(result[1] === 42);
    t.false(result[2]);
});

ava('.headingParser() translates l to left as the first value', t => {
    const result = headingParser(['l', '042'])

    t.true(result[0] === 'left');
});

ava('.headingParser() translates r to right as the first value', t => {
    const result = headingParser(['r', '042'])

    t.true(result[0] === 'right');
});

ava('.headingParser() returns an array of length 3 when passed direction, heading and incremental as arguments', t => {
    const result = headingParser(['left', '042', true])

    t.true(result.length === 3);
    t.true(result[0] === 'left');
    t.true(result[1] === 42);
    t.true(result[2]);
});

ava('.headingParser() throws if it receives less than 1 or more than 3 arguments', t => {
    t.throws(() => headingParser([]));
    t.throws(() => headingParser(['l', '042', true, '']));
});
