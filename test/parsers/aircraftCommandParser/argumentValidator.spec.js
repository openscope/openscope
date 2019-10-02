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
    isValidCourseString,
    squawkValidator,
    optionalAltitudeValidator,
    crossingValidator
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

ava('.optionalAltitudeValidator() returns undefined when no value is passed', t => {
    const result = optionalAltitudeValidator([]);
    t.true(typeof result === 'undefined');
});

ava('.optionalAltitudeValidator() returns undefined when passed a valid altitude', t => {
    let result = optionalAltitudeValidator(['100']);
    t.true(typeof result === 'undefined');

    result = optionalAltitudeValidator(['300']);
    t.true(typeof result === 'undefined');

    result = optionalAltitudeValidator(['aa']);
    t.true(result === 'Invalid argument. Altitude must be a number');
});

ava('.optionalAltitudeValidator() returns a string when passed the wrong number of arguments', t => {
    let result = optionalAltitudeValidator(['100', 'expedite']);
    t.true(result === 'Invalid argument length. Expected zero or one argument');

    result = optionalAltitudeValidator(['', '', '']);
    t.true(result === 'Invalid argument length. Expected zero or one argument');
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
    t.is(result, undefined);

    result = headingValidator(['l', '42']);
    t.is(result, undefined);

    result = headingValidator();
    t.is(result, 'Invalid argument length. Expected one or two arguments');

    result = headingValidator([]);
    t.is(result, 'Invalid argument length. Expected one or two arguments');

    result = headingValidator(['l', '42', 'threeve']);
    t.is(result, 'Invalid argument length. Expected one or two arguments');
});

ava('.headingValidator() returns a string when passed the wrong type of arguments', t => {
    t.is(headingValidator(['threeve']), 'Invalid argument. Heading must be between 001 and 360');
    t.is(headingValidator(['42', '42']), 'Invalid argument. Expected one of \'left / l / right / r\' as the first argument when passed three arguments');
    t.is(headingValidator(['l', 'threeve']), 'Invalid argument. Heading must be a number');
    t.is(headingValidator(['42', '42']), 'Invalid argument. Expected one of \'left / l / right / r\' as the first argument when passed three arguments');
    t.is(headingValidator(['l', 'threeve']), 'Invalid argument. Heading must be a number');
    t.is(headingValidator(['000']), 'Invalid argument. Heading must be between 001 and 360');
    t.is(headingValidator(['361']), 'Invalid argument. Heading must be between 001 and 360');
    t.is(headingValidator(['l', '000']), 'Invalid argument. Heading must be between 001 and 360');
    t.is(headingValidator(['l', '361']), 'Invalid argument. Heading must be between 001 and 360');
    t.is(headingValidator(['l', '0']), 'Invalid argument. Incremental heading must be positive');
    t.is(headingValidator(['l', '-9']), 'Invalid argument. Incremental heading must be positive');
});

ava('.headingValidator() returns undefined when passed a number as a single argument', t => {
    const result = headingValidator(['042']);
    t.is(result, undefined);
});

ava('.headingValidator() returns undefined when passed a string and a number as arguments', t => {
    t.is(headingValidator(['l', '2']), undefined);
    t.is(headingValidator(['l', '42']), undefined);
    t.is(headingValidator(['l', '042']), undefined);
});

ava('.holdValidator() returns a string when passed the wrong number of arguments', t => {
    const result = holdValidator(['', 'left', 1, '', '']);
    t.true(result === 'Invalid argument length. Expected zero to four arguments');
});

ava('.holdValidator() returns undefined when passed zero arguments', t => {
    let result = holdValidator();
    t.true(typeof result === 'undefined');

    result = holdValidator([]);
    t.true(typeof result === 'undefined');
});

ava('.holdValidator() returns a string when passed the wrong type of arguments', t => {
    t.true(holdValidator([false]) === 'Invalid argument. Must be a string');
    t.true(holdValidator([false, '42', '1min', '090']) === 'Invalid argument. Must be a string');
    t.true(holdValidator(['42', false, '1min', '090']) === 'Invalid argument. Must be a string');
    t.true(holdValidator(['42', 'left', false, '090']) === 'Invalid argument. Must be a string');
    t.true(holdValidator(['42', 'left', '1min', false]) === 'Invalid argument. Must be a string');
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

    result = holdValidator(['090', 'dumba']);
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

    result = holdValidator(['dumba', 'right', '090']);
    t.true(typeof result === 'undefined');

    result = holdValidator(['dumba', '1min', '090']);
    t.true(typeof result === 'undefined');

    result = holdValidator(['dumba', '1nm', '090']);
    t.true(typeof result === 'undefined');
});

ava('.holdValidator() returns undefined when passed four strings as arguments', t => {
    let result = holdValidator(['dumba', 'left', '1min', '090']);
    t.true(typeof result === 'undefined');

    result = holdValidator(['dumba', 'right', '1nm', '090']);
    t.true(typeof result === 'undefined');

    result = holdValidator(['dumba', 'right', '1min', '090']);
    t.true(typeof result === 'undefined');

    result = holdValidator(['dumba', 'right', '1nm', '090']);
    t.true(typeof result === 'undefined');
});

ava('.isValidCourseString() returns true when passed a 3 digit course', (t) => {
    t.true(isValidCourseString('001'));
    t.true(isValidCourseString('090'));
    t.true(isValidCourseString('360'));
});

ava('.isValidCourseString() returns false when passed an invalid course', (t) => {
    t.false(isValidCourseString('000'));
    t.false(isValidCourseString('1min'));
    t.false(isValidCourseString('5'));
    t.false(isValidCourseString('50'));
    t.false(isValidCourseString('370'));
    t.false(isValidCourseString('-10'));
    t.false(isValidCourseString('1000'));
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

ava('.crossingValidator() returns a string when passed the wrong number of arguments', t => {
    let result = crossingValidator();
    t.true(result === 'Invalid argument length. Expected exactly two arguments');

    result = crossingValidator([]);
    t.true(result === 'Invalid argument length. Expected exactly two arguments');

    result = crossingValidator(['', '', '']);
    t.true(result === 'Invalid argument length. Expected exactly two arguments');
});

ava('.crossingValidator() returns undefined when passed valid arguments', t => {
    let result = crossingValidator(['LEMDY', '50']);
    t.true(typeof result === 'undefined');

    result = crossingValidator(['BLUB', '100']);
    t.true(typeof result === 'undefined');
});

ava('.crossingValidator() returns an error when fixname is not a string', t => {
    let result = crossingValidator([50, '50']);
    t.true(result === 'Invalid argument. Must be a string');

    result = crossingValidator([{}, '100']);
    t.true(result === 'Invalid argument. Must be a string');

    result = crossingValidator([[], '100']);
    t.true(result === 'Invalid argument. Must be a string');
});

ava('.crossingValidator() returns an error when altitude is not a number', t => {
    let result = crossingValidator(['LEMDY', 'xx']);
    t.true(result === 'Invalid argument. Altitude must be a number');

    result = crossingValidator(['LEMDY', '']);
    t.true(result === 'Invalid argument. Altitude must be a number');

    result = crossingValidator(['LEMDY', []]);
    t.true(result === 'Invalid argument. Altitude must be a number');

    result = crossingValidator(['LEMDY', {}]);
    t.true(result === 'Invalid argument. Altitude must be a number');
});
