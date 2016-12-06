import ava from 'ava';

import {
    zeroArgumentsValidator,
    singleArgumentValidator,
    zeroOrOneArgumentValidator,
    oneOrTwoArgumentValidator,
    altitudeArgumentValidator
} from '../../src/assets/scripts/commandParser/argumentValidators';

ava('.zeroArgumentsValidator() returns a string when passed the wrong number of arguments', t => {
    let result = zeroArgumentsValidator([]);

    t.true(typeof result === 'undefined');

    result = zeroArgumentsValidator(['', '']);

    t.true(typeof result === 'string');
    t.true(result === 'Invalid argument length. Expected exactly zero arguments');
});

ava('.singleArgumentValidator() returns a string when passed the wrong number of arguments', t => {
    let result = singleArgumentValidator(['']);

    t.true(typeof result === 'undefined');

    result = singleArgumentValidator(['', '']);
    t.true(typeof result === 'string');
    t.true(result === 'Invalid argment length. Expected exactly one argument');

    result = singleArgumentValidator([]);
    t.true(typeof result === 'string');
    t.true(result === 'Invalid argment length. Expected exactly one argument');
});

ava('.zeroOrOneArgumentValidator() returns a string when passed the wrong number of arguments', t => {
    let result = zeroOrOneArgumentValidator();
    t.true(typeof result === 'undefined');

    result = zeroOrOneArgumentValidator(['']);
    t.true(typeof result === 'undefined');

    result = zeroOrOneArgumentValidator(['', '']);
    t.true(typeof result === 'string');
    t.true(result === 'Invalid argument length. Expected zero or one argument');
});

ava('.oneOrTwoArgumentValidator() returns a string when passed the wrong number of arguments', t => {
    let result = oneOrTwoArgumentValidator(['']);
    t.true(typeof result === 'undefined');

    result = oneOrTwoArgumentValidator(['', '']);
    t.true(typeof result === 'undefined');

    result = oneOrTwoArgumentValidator();
    t.true(typeof result === 'string');
    t.true(result === 'Invalid argument length. Expected one or two arguments');

    result = oneOrTwoArgumentValidator(['', '', '']);
    t.true(typeof result === 'string');
    t.true(result === 'Invalid argument length. Expected one or two arguments');
});

ava('.altitudeArgumentValidator() returns a string when passed the wrong number of arguments', t => {
    let result = altitudeArgumentValidator(['']);
    t.true(typeof result === 'undefined');

    result = altitudeArgumentValidator(['', 'expedite']);
    t.true(typeof result === 'undefined');

    result = altitudeArgumentValidator([]);
    t.true(typeof result === 'string');
    t.true(result === 'Invalid argument length. Expected one or two arguments');

    result = altitudeArgumentValidator(['', '', '']);
    t.true(typeof result === 'string');
    t.true(result === 'Invalid argument length. Expected one or two arguments');
});

ava('.altitudeArgumentValidator() returns a string when passed anything other than expedite or x as the second argument', t => {
    let result = altitudeArgumentValidator(['', 'expedite']);
    t.true(typeof result === 'undefined');

    result = altitudeArgumentValidator(['', '']);
    t.true(typeof result === 'string');
    t.true(result === 'Invalid argument. Altitude accepts only "expedite" or "x" as a second argument');
});
