import ava from 'ava';

import {
    altitudeParser
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
