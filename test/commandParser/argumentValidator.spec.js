import ava from 'ava';

import {
    zeroArgumentsValidator,
    singleArgumentValidator,
    zeroOrOneArgumentValidator,
    oneOrTwoArgumentValidator,
    altitudeValidator,
    headingValidator
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

ava('.altitudeValidator() returns a string when passed the wrong number of arguments', t => {
    let result = altitudeValidator(['']);
    t.true(typeof result === 'undefined');

    result = altitudeValidator(['', 'expedite']);
    t.true(typeof result === 'undefined');

    result = altitudeValidator([]);
    t.true(typeof result === 'string');
    t.true(result === 'Invalid argument length. Expected one or two arguments');

    result = altitudeValidator(['', '', '']);
    t.true(typeof result === 'string');
    t.true(result === 'Invalid argument length. Expected one or two arguments');
});

ava('.altitudeValidator() returns a string when passed anything other than expedite or x as the second argument', t => {
    let result = altitudeValidator(['', 'expedite']);
    t.true(typeof result === 'undefined');

    result = altitudeValidator(['', '']);
    t.true(typeof result === 'string');
    t.true(result === 'Invalid argument. Altitude accepts only "expedite" or "x" as a second argument');
});

ava('.headingValidator() returns a string when passed the wrong number of arguments', t => {
    let result = headingValidator(['042']);
    t.true(typeof result === 'undefined');

    result = headingValidator(['l', '42']);
    t.true(typeof result === 'undefined');

    result = headingValidator(['', '', '']);
    t.true(typeof result === 'undefined');

    result = headingValidator([]);
    t.true(typeof result === 'string');
    t.true(result === 'Invalid argument length. Expected one, two, or three arguments');

    result = headingValidator(['', '', '', '']);
    t.true(typeof result === 'string');
    t.true(result === 'Invalid argument length. Expected one, two, or three arguments');
});

ava('.headingValidator() returns undefined when passed a number as a single argument', t => {
    let result = headingValidator(['042']);
    t.true(typeof result === 'undefined');
});

ava('.headingValidator() returns a string when passed a NaN as a single argument', t => {
    let result = headingValidator(['l']);
    t.true(result === 'Invalid argument. Heading accepts a number as the first argument');
});

ava('.headingValidator() returns undefined when passed a string and a number as arguments', t => {
    let result = headingValidator(['l', '042']);
    t.true(typeof result === 'undefined');
});

ava('.headingValidator() returns a string when passed two arguments with the first invalid ', t => {
    let result = headingValidator(['threeve', '042']);
    t.true(result === 'Invalid argument. Expected one of "left / l / right / r" as the first argument when passed two arguments');
});

ava('.headingValidator() returns a string when passed two arguments with the second invalid ', t => {
    let result = headingValidator(['l', 'threeve']);
    t.true(result === 'Invalid argument. Heading accepts a number for the second argument when passed two arguments');
});
