import ava from 'ava';
import AircraftCommandModel
    from '../../../src/assets/scripts/client/commands/aircraftCommand/AircraftCommandModel';

import {
    altitudeValidator,
    crossingValidator,
    fixValidator,
    headingValidator,
    holdValidator,
    squawkValidator,
    optionalAltitudeValidator
} from '../../../src/assets/scripts/client/commands/parsers/argumentValidators';
import {
    altitudeParser,
    ilsParser,
    crossingParser,
    headingParser,
    holdParser,
    optionalAltitudeParser
} from '../../../src/assets/scripts/client/commands/parsers/argumentParsers';
import { AIRCRAFT_COMMAND_MAP } from '../../../src/assets/scripts/client/commands/aircraftCommand/aircraftCommandMap';

import {
    noopParse,
    zeroArgVal,
    singleArgVal,
    strToNumArrayParse,
    zeroOrOneArgumentVal,
    self_alias,
    test_aliases
} from './testUtils';

const extractParseAndValidate = (t, cmd) => {
    const model = new AircraftCommandModel(cmd);
    const parse = model._commandDefinition.parse.toString();
    const validate = model._commandDefinition.validate.toString();
    t.false(AIRCRAFT_COMMAND_MAP[cmd].isSystemCommand);
    return [parse, validate];
};


ava('aliases, noop parser and zeroArgumentsValidator used by abort', t => {
    const [parse, validate] = extractParseAndValidate(t, 'abort');
    t.true(parse === noopParse() && validate === zeroArgVal());
    self_alias(t, AIRCRAFT_COMMAND_MAP, 'abort');
});


ava('aliases, noop parser and zeroArgumentsValidator used by clearedAsFiled', t => {
    const [parse, validate] = extractParseAndValidate(t, 'clearedAsFiled');
    t.true(parse === noopParse() && validate === zeroArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'clearedAsFiled', ['caf', 'clearedAsFiled']);
});


ava('aliases, noop parser and zeroArgumentsValidator used by delete', t => {
    const [parse, validate] = extractParseAndValidate(t, 'delete');
    t.true(parse === noopParse() && validate === zeroArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'delete', ['del', 'delete', 'kill']);
});


ava('aliases, noop parser and zeroArgumentsValidator used by flyPresentHeading', t => {
    const [parse, validate] = extractParseAndValidate(t, 'flyPresentHeading');
    t.true(parse === noopParse() && validate === zeroArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'flyPresentHeading', ['fph']);
});


ava('aliases, noop parser and zeroArgumentsValidator used by takeoff', t => {
    const [parse, validate] = extractParseAndValidate(t, 'takeoff');
    t.true(parse === noopParse() && validate === zeroArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'takeoff', ['/', 'cto', 'to', 'takeoff']);
});

ava('aliases, noop parser and zeroArgumentsValidator used by sayAltitude', t => {
    const [parse, validate] = extractParseAndValidate(t, 'sayAltitude');
    t.true(parse === noopParse() && validate === zeroArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'sayAltitude', ['sa']);
});

ava('aliases, noop parser and zeroArgumentsValidator used by sayAssignedAltitude', t => {
    const [parse, validate] = extractParseAndValidate(t, 'sayAssignedAltitude');
    t.true(parse === noopParse() && validate === zeroArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'sayAssignedAltitude', ['saa']);
});

ava('aliases, noop parser and zeroArgumentsValidator used by sayHeading', t => {
    const [parse, validate] = extractParseAndValidate(t, 'sayHeading');
    t.true(parse === noopParse() && validate === zeroArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'sayHeading', ['sh']);
});

ava('aliases, noop parser and zeroArgumentsValidator used by sayAssignedHeading', t => {
    const [parse, validate] = extractParseAndValidate(t, 'sayAssignedHeading');
    t.true(parse === noopParse() && validate === zeroArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'sayAssignedHeading', ['sah']);
});

ava('aliases, noop parser and zeroArgumentsValidator used by sayIndicatedAirspeed', t => {
    const [parse, validate] = extractParseAndValidate(t, 'sayIndicatedAirspeed');
    t.true(parse === noopParse() && validate === zeroArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'sayIndicatedAirspeed', ['si']);
});

ava('aliases, noop parser and zeroArgumentsValidator used by sayAssignedSpeed', t => {
    const [parse, validate] = extractParseAndValidate(t, 'sayAssignedSpeed');
    t.true(parse === noopParse() && validate === zeroArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'sayAssignedSpeed', ['sas']);
});

ava('aliases, noop parser and zeroArgumentsValidator used by sayRoute', t => {
    const [parse, validate] = extractParseAndValidate(t, 'sayRoute');
    t.true(parse === noopParse() && validate === zeroArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'sayRoute', ['sr']);
});

ava('aliases, noop parser and singleArgumentValidator used by direct', t => {
    const [parse, validate] = extractParseAndValidate(t, 'direct');
    t.true(parse === noopParse() && validate === singleArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'direct', ['dct', 'direct', 'pd']);
});

ava('aliases, noop parser and singleArgumentValidator used by expectArrivalRunway', t => {
    const [parse, validate] = extractParseAndValidate(t, 'expectArrivalRunway');
    t.true(parse === noopParse() && validate === singleArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'expectArrivalRunway', ['e']);
});

ava('aliases, ilsParser and singleArgumentValidator used by ils', t => {
    const [parse, validate] = extractParseAndValidate(t, 'ils');
    const tmp = ilsParser;
    t.true(parse === tmp.toString() && validate === singleArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'ils', ['*', 'i', 'ils']);
});

ava('aliases, noop parser and zeroOrOneArgumentValidator used by land', t => {
    const [parse, validate] = extractParseAndValidate(t, 'land');
    t.true(parse === noopParse() && validate === zeroOrOneArgumentVal());
    self_alias(t, AIRCRAFT_COMMAND_MAP, 'land');
});

ava('aliases, noop parser and singleArgumentValidator used by moveDataBlock', t => {
    const [parse, validate] = extractParseAndValidate(t, 'moveDataBlock');
    t.true(parse === noopParse() && validate === singleArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'moveDataBlock', ['`']);
});


ava('aliases, noop parser and singleArgumentValidator used by reroute', t => {
    const [parse, validate] = extractParseAndValidate(t, 'reroute');
    t.true(parse === noopParse() && validate === singleArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'reroute', ['reroute', 'rr']);
});

ava('aliases, noop parser and singleArgumentValidator used by route', t => {
    const [parse, validate] = extractParseAndValidate(t, 'route');
    t.true(parse === noopParse() && validate === singleArgVal());
    self_alias(t, AIRCRAFT_COMMAND_MAP, 'route');
});

ava('aliases, noop parser and singleArgumentValidator used by sid', t => {
    const [parse, validate] = extractParseAndValidate(t, 'sid');
    t.true(parse === noopParse() && validate === singleArgVal());
    self_alias(t, AIRCRAFT_COMMAND_MAP, 'sid');
});

ava('aliases, strToNumArray parser and singleArgumentValidator used by speed', t => {
    const [parse, validate] = extractParseAndValidate(t, 'speed');
    t.true(parse === strToNumArrayParse() && validate === singleArgVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'speed', ['-', '+', 'slow', 'sp', 'speed']);
});

ava('aliases, noop parser and singleArgumentValidator used by star', t => {
    const [parse, validate] = extractParseAndValidate(t, 'star');
    t.true(parse === noopParse() && validate === singleArgVal());
    self_alias(t, AIRCRAFT_COMMAND_MAP, 'star');
});

ava('aliases, noop parser and zeroOrOneArgumentValidator used by taxi', t => {
    const [parse, validate] = extractParseAndValidate(t, 'taxi');
    t.true(parse === noopParse() && validate === zeroOrOneArgumentVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'taxi', ['taxi', 'w', 'wait']);
});

ava('aliases, noop parser and zeroOrOneArgumentValidator used by cancelHold', t => {
    const [parse, validate] = extractParseAndValidate(t, 'cancelHold');
    t.true(parse === noopParse() && validate === zeroOrOneArgumentVal());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'cancelHold', ['exithold', 'cancelhold', 'continue', 'nohold', 'xh']);
});

ava('aliases, altitude parser and altitude validator used by altitude', t => {
    const [parse, validate] = extractParseAndValidate(t, 'altitude');
    const p = altitudeParser;
    const v = altitudeValidator;
    t.true(parse === p.toString() && validate === v.toString());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'altitude', ['a', 'altitude', 'c', 'climb', 'd', 'descend']);
});

ava('aliases, crossing parser and crossing validator used by cross', t => {
    const [parse, validate] = extractParseAndValidate(t, 'cross');
    const p = crossingParser;
    const v = crossingValidator;
    t.true(parse === p.toString() && validate === v.toString());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'cross', ['cross', 'cr', 'x']);
});

ava('aliases, noop parser and fix validator used by fix', t => {
    const [parse, validate] = extractParseAndValidate(t, 'fix');
    const v = fixValidator;
    t.true(parse === noopParse() && validate === v.toString());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'fix', ['f', 'fix', 'track']);
});

ava('aliases, heading parser and heading validator used by heading', t => {
    const [parse, validate] = extractParseAndValidate(t, 'heading');
    const p = headingParser;
    const v = headingValidator;
    t.true(parse === p.toString() && validate === v.toString());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'heading', ['fh', 'h', 'heading', 't', 'turn']);
});

ava('aliases, hold parser and hold validator used by hold', t => {
    const [parse, validate] = extractParseAndValidate(t, 'hold');
    const p = holdParser;
    const v = holdValidator;
    t.true(parse === p.toString() && validate === v.toString());
    self_alias(t, AIRCRAFT_COMMAND_MAP, 'hold');
});

ava('aliases, noop parser and squawk validator used by squawk', t => {
    const [parse, validate] = extractParseAndValidate(t, 'squawk');
    const v = squawkValidator;
    t.true(parse === noopParse() && validate === v.toString());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'squawk', ['sq', 'squawk']);
});


ava('aliases, optionalAltitudeParser and optionalAltitudeValidator used by descendViaStar', t => {
    const [parse, validate] = extractParseAndValidate(t, 'descendViaStar');
    const p = optionalAltitudeParser;
    const v = optionalAltitudeValidator;
    t.true(parse === p.toString() && validate === v.toString());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'descendViaStar', ['descendViaStar', 'dvs']);
});

ava('aliases, optionalAltitudeParser and optionalAltitudeValidator used by climbViaSid', t => {
    const [parse, validate] = extractParseAndValidate(t, 'climbViaSid');
    const p = optionalAltitudeParser;
    const v = optionalAltitudeValidator;
    t.true(parse === p.toString() && validate === v.toString());
    test_aliases(t, AIRCRAFT_COMMAND_MAP, 'climbViaSid', ['climbViaSid', 'cvs']);
});

ava('make sure we test all 32 aircraft commands', t => {
    t.true(Object.values(AIRCRAFT_COMMAND_MAP)
        .filter(val => !val.isSystemCommand).length === 32);
});
