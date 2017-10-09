/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies */
import ava from 'ava';

import {
    zeroArgumentsValidator,
    singleArgumentValidator,
    zeroOrOneArgumentValidator,
    oneOrTwoArgumentValidator,
    oneToThreeArgumentsValidator,
    oneOrThreeArgumentsValidator,
    altitudeValidator,
    fixValidator,
    headingValidator,
    holdValidator,
    squawkValidator
} from '../../../src/assets/scripts/client/parsers/aircraftCommandParser/argumentValidators';

// TODO: import ERROR_MESSAGE and use actual values to test against

ava('.zeroArgumentsValidator() returns a string when passed the wrong number of arguments', t => {
    let result = zeroArgumentsValidator();
    t.true(typeof result === 'undefined');

    result = zeroArgumentsValidator([]);
    t.true(typeof result === 'undefined');

    result = zeroArgumentsValidator(['', '']);
    t.true(result === 'Invalid argument length. Expected exactly zero arguments');
});

ava('.singleArgumentValidator() returns a string when passed the wrong number of arguments', t => {
    let result = singleArgumentValidator(['']);
    t.true(typeof result === 'undefined');

    result = singleArgumentValidator();
    t.true(result === 'Invalid argument length. Expected exactly one argument');

    result = singleArgumentValidator([]);
    t.true(result === 'Invalid argument length. Expected exactly one argument');

    result = singleArgumentValidator(['', '']);
    t.true(result === 'Invalid argument length. Expected exactly one argument');
});

ava('.zeroOrOneArgumentValidator() returns a string when passed the wrong number of arguments', t => {
    let result = zeroOrOneArgumentValidator();
    t.true(typeof result === 'undefined');

    result = zeroOrOneArgumentValidator(['']);
    t.true(typeof result === 'undefined');

    result = zeroOrOneArgumentValidator(['', '']);
    t.true(result === 'Invalid argument length. Expected zero or one argument');
});

ava('.oneOrTwoArgumentValidator() returns a string when passed the wrong number of arguments', t => {
    let result = oneOrTwoArgumentValidator(['']);
    t.true(typeof result === 'undefined');

    result = oneOrTwoArgumentValidator(['', '']);
    t.true(typeof result === 'undefined');

    result = oneOrTwoArgumentValidator();
    t.true(result === 'Invalid argument length. Expected one or two arguments');

    result = oneOrTwoArgumentValidator(['', '', '']);
    t.true(result === 'Invalid argument length. Expected one or two arguments');
});

ava('.oneToThreeArgumentsValidator() returns a string when passed the wrong number of arguments', t => {
    let result = oneToThreeArgumentsValidator(['']);
    t.true(typeof result === 'undefined');

    result = oneToThreeArgumentsValidator(['', '']);
    t.true(typeof result === 'undefined');

    result = oneToThreeArgumentsValidator(['', '', '']);
    t.true(typeof result === 'undefined');

    result = oneToThreeArgumentsValidator();
    t.true(result === 'Invalid argument length. Expected one, two, or three arguments');

    result = oneToThreeArgumentsValidator(['', '', '', '']);
    t.true(result === 'Invalid argument length. Expected one, two, or three arguments');
});

ava('.oneOrThreeArgumentValidator() returns a string when passed the wrong number of arguments', t => {
    let result = oneOrThreeArgumentsValidator(['']);
    t.true(typeof result === 'undefined');

    result = oneOrThreeArgumentsValidator(['', '', '']);
    t.true(typeof result === 'undefined');

    result = oneOrThreeArgumentsValidator();
    t.true(result === 'Invalid argument length. Expected one or three arguments');

    result = oneOrThreeArgumentsValidator(['', '', '', '']);
    t.true(result === 'Invalid argument length. Expected one or three arguments');
});

ava('.altitudeValidator() returns undefined when passed a valid altitude', t => {
    let result = altitudeValidator(['100']);
    t.true(typeof result === 'undefined');

    result = altitudeValidator(['300']);
    t.true(typeof result === 'undefined');

    result = altitudeValidator(['aa']);
    t.true(result === 'Invalid argument. Altitude must be a number');
});

ava('.altitudeValidator() returns a string when passed the wrong number of arguments', t => {
    let result = altitudeValidator(['100', 'expedite']);
    t.true(typeof result === 'undefined');

    result = altitudeValidator();
    t.true(result === 'Invalid argument length. Expected one or two arguments');

    result = altitudeValidator([]);
    t.true(result === 'Invalid argument length. Expected one or two arguments');

    result = altitudeValidator(['', '', '']);
    t.true(result === 'Invalid argument length. Expected one or two arguments');
});

ava('.altitudeValidator() returns a string when passed anything other than expedite or x as the second argument', t => {
    let result = altitudeValidator(['100', 'expedite']);
    t.true(typeof result === 'undefined');

    result = altitudeValidator(['100', 'x']);
    t.true(typeof result === 'undefined');

    result = altitudeValidator(['100', '']);
    t.true(result === 'Invalid argument. Altitude accepts only "expedite" or "x" as a second argument');
});

ava('.fixValidator() returns undefined when it receives at least one valid argument', (t) => {
    let result = fixValidator(['one']);
    t.true(typeof result === 'undefined');

    result = fixValidator(['one', 'two', 'th33', '4F1o']);
    t.true(typeof result === 'undefined');

    t.true(fixValidator([]) === 'Invalid argument length. Expected one or more arguments');
});

ava('.fixValidator() returns a string when passed anything other than a string', (t) => {
    t.true(fixValidator([42, '', '']) === 'Invalid argument. Must be a string');
    t.true(fixValidator(['', false, '']) === 'Invalid argument. Must be a string');
    t.true(fixValidator([42, false, '', {}]) === 'Invalid argument. Must be a string');
});

ava('.headingValidator() returns a string when passed the wrong number of arguments', t => {
    let result = headingValidator(['042']);
    t.true(typeof result === 'undefined');

    result = headingValidator(['l', '42']);
    t.true(typeof result === 'undefined');

    result = headingValidator();
    t.true(result === 'Invalid argument length. Expected one or two arguments');

    result = headingValidator([]);
    t.true(result === 'Invalid argument length. Expected one or two arguments');

    result = headingValidator(['l', '42', 'threeve']);
    t.true(result === 'Invalid argument length. Expected one or two arguments');
});

ava('.headingValidator() returns a string when passed the wrong type of arguments', t => {
    t.true(headingValidator(['threeve']) === 'Invalid argument. Heading must be a number');
    t.true(headingValidator(['42', '42']) === 'Invalid argument. Expected one of \'left / l / right / r\' as the first argument when passed three arguments');
    t.true(headingValidator(['l', 'threeve']) === 'Invalid argument. Heading must be a number');
    t.true(headingValidator(['42', '42']) === 'Invalid argument. Expected one of \'left / l / right / r\' as the first argument when passed three arguments');
    t.true(headingValidator(['l', 'threeve']) === 'Invalid argument. Heading must be a number');
});

ava('.headingValidator() returns undefined when passed a number as a single argument', t => {
    const result = headingValidator(['042']);
    t.true(typeof result === 'undefined');
});

ava('.headingValidator() returns undefined when passed a string and a number as arguments', t => {
    const result = headingValidator(['l', '042']);
    t.true(typeof result === 'undefined');
});

ava('.holdValidator() returns a string when passed the wrong number of arguments', t => {
    const result = holdValidator(['', 'left', '1min', '']);
    t.true(result === 'Invalid argument length. Expected zero to three arguments');
});

ava('.holdValidator() returns undefined when passed zero arguments', t => {
    let result = holdValidator();
    t.true(typeof result === 'undefined');

    result = holdValidator([]);
    t.true(typeof result === 'undefined');
});

ava('.holdValidator() returns a string when passed the wrong type of arguments', t => {
    t.true(holdValidator([false]) === 'Invalid argument. Must be a string');
    t.true(holdValidator([false, '42', '1min']) === 'Invalid argument. Must be a string');
    t.true(holdValidator(['42', false, '1min']) === 'Invalid argument. Must be a string');
    t.true(holdValidator(['42', 'left', false]) === 'Invalid argument. Must be a string');
});

ava('.holdValidator() returns undefined when passed a string as an argument', t => {
    const result = holdValidator(['']);
    t.true(typeof result === 'undefined');
});

ava('.holdValidator() returns undefined when two strings as arguments', t => {
    let result = holdValidator(['dumba', '1min']);
    t.true(typeof result === 'undefined');

    result = holdValidator(['1nm', '1min']);
    t.true(typeof result === 'undefined');

    result = holdValidator(['l', 'dumba']);
    t.true(typeof result === 'undefined');
});

ava('.holdValidator() returns undefined when passed three strings as arguments', t => {
    let result = holdValidator(['dumba', 'left', '1min']);
    t.true(typeof result === 'undefined');

    result = holdValidator(['dumba', 'right', '1nm']);
    t.true(typeof result === 'undefined');

    result = holdValidator(['dumba', 'right', '1min']);
    t.true(typeof result === 'undefined');

    result = holdValidator(['dumba', 'right', '1nm']);
    t.true(typeof result === 'undefined');
});

ava('.squawkValidator() returns undefined when passed a valid squawk', t => {
    let result = squawkValidator(['1111']);
    t.true(typeof result === 'undefined');

    result = squawkValidator(['1234']);
    t.true(typeof result === 'undefined');
});

ava('.squawkValidator() returns a string when passed the wrong number of arguments', t => {
    let result = squawkValidator();
    t.true(result === 'Invalid argument length. Expected exactly one argument');

    result = squawkValidator([]);
    t.true(result === 'Invalid argument length. Expected exactly one argument');

    result = squawkValidator(['', '']);
    t.true(result === 'Invalid argument length. Expected exactly one argument');
});

ava('.squawkValidator() returns string when passed invalid squawk', t => {
    let result = squawkValidator(['8888']);
    t.true(result === 'Invalid argument. Expected \'0000\'-\'7777\' for the transponder code.');

    result = squawkValidator(['111']);
    t.true(result === 'Invalid argument. Expected \'0000\'-\'7777\' for the transponder code.');

    result = squawkValidator(['1181']);
    t.true(result === 'Invalid argument. Expected \'0000\'-\'7777\' for the transponder code.');

    result = squawkValidator(['11711']);
    t.true(result === 'Invalid argument. Expected \'0000\'-\'7777\' for the transponder code.');

    result = squawkValidator(['1a11']);
    t.true(result === 'Invalid argument. Expected \'0000\'-\'7777\' for the transponder code.');
});
