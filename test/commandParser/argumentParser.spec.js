import ava from 'ava';

import {
    altitudeArgumentParser
} from '../../src/assets/scripts/commandParser/argumentParsers';

ava('.altitudeArgumentParser() converts a string flight level altitude to a number altitude in thousands', t => {
    const result = altitudeArgumentParser(['080']);

    t.true(result[0] === 8000);
});

ava('.altitudeArgumentParser() returns true if the second argument is not undefined', t => {
    const result = altitudeArgumentParser(['080', 'x']);

    t.true(result[1]);
});

ava('.altitudeArgumentParser() returns an array of length two when passed a single argument', t => {
    const result = altitudeArgumentParser(['080']);

    t.true(result.length === 2);
    t.true(result[0] === 8000);
    t.false(result[1]);
});
