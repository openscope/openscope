import ava from 'ava';
import AircraftCommandModel
    from '../../../src/assets/scripts/client/commands/definitions/aircraftCommand/AircraftCommandModel';
import { AIRCRAFT_COMMAND_MAP } from '../../../src/assets/scripts/client/commands/definitions/aircraftCommand/aircraftCommandMap';
import { timewarpParser } from '../../../src/assets/scripts/client/commands/parsers/argumentParsers';
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
    t.true(AIRCRAFT_COMMAND_MAP[cmd].isSystemCommand);
    return [parse, validate];
};

ava('aliases, noop parser and zeroArgumentsValidator used by airac', t => {
    const [parse, validate] = extractParseAndValidate(t, 'airac');
    t.true(parse === noopParse() && validate === zeroArgVal());
    self_alias(t, 'airac');
});

ava('aliases, noop parser and singleArgumentValidator used by airport', t => {
    const [parse, validate] = extractParseAndValidate(t, 'airport');
    t.true(parse === noopParse() && validate === singleArgVal());
    self_alias(t, 'airport');
});

ava('aliases, noop parser and zeroArgumentsValidator used by auto', t => {
    const [parse, validate] = extractParseAndValidate(t, 'auto');
    t.true(parse === noopParse() && validate === zeroArgVal());
    self_alias(t, 'auto');
});

ava('aliases, noop parser and zeroArgumentsValidator used by clear', t => {
    const [parse, validate] = extractParseAndValidate(t, 'clear');
    t.true(parse === noopParse() && validate === zeroArgVal());
    self_alias(t, 'clear');
});

ava('aliases, noop parser and zeroArgumentsValidator used by pause', t => {
    const [parse, validate] = extractParseAndValidate(t, 'pause');
    t.true(parse === noopParse() && validate === zeroArgVal());
    self_alias(t, 'pause');
});

ava('aliases, noop parser and zeroArgumentsValidator used by tutorial', t => {
    const [parse, validate] = extractParseAndValidate(t, 'tutorial');
    t.true(parse === noopParse() && validate === zeroArgVal());
    self_alias(t, 'tutorial');
});

ava('aliases, strToNumArray parser and singleArgumentValidator used by rate', t => {
    const [parse, validate] = extractParseAndValidate(t, 'rate');
    t.true(parse === strToNumArrayParse() && validate === singleArgVal());
    self_alias(t, 'rate');
});

ava('aliases, timewarp parser and zeroOrOneArgumentValidator used by timewarp', t => {
    const [parse, validate] = extractParseAndValidate(t, 'timewarp');
    const p = timewarpParser;
    const v = zeroOrOneArgumentVal();
    t.true(parse === p.toString() && validate === v.toString());
    test_aliases(t, 'timewarp', ['timewarp', 'tw']);
});

ava('make sure we test all 8 system commands', t => {
    t.true(Object.values(AIRCRAFT_COMMAND_MAP)
        .filter(val => val.isSystemCommand).length === 8);
});
