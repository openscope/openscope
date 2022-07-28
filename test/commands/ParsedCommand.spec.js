import _isEqual from 'lodash/isEqual';
import ava from 'ava';
import CommandParser from '../../src/assets/scripts/client/commands/parsers/CommandParser';

const TIMEWARP_50_MOCK = 'timewarp 50';
const CALLSIGN_MOCK = 'AAL777';
const FH_COMMAND_MOCK = 'fh 180';
const D_COMMAND_MOCK = 'd 030';
const STAR_MOCK = 'star quiet7';

const buildCommandString = (...args) => `${CALLSIGN_MOCK} ${args.join(' ')}`;

ava('#args returns one item when a system command is present', t => {
    const parser = new CommandParser(TIMEWARP_50_MOCK);
    const cmd = parser.parse();
    t.true(_isEqual(cmd.args, [50]));
});

ava('#args an array for each command with arg values when a transmit command is present', t => {
    const commandStringMock = buildCommandString(FH_COMMAND_MOCK, D_COMMAND_MOCK, STAR_MOCK);
    const parser = new CommandParser(commandStringMock);
    const cmd = parser.parse();
    t.true(cmd.args.length === 3);
});

// specific use case tests
ava('when passed hold LAM it creates the correct command with the correct arguments', t => {
    const commandStringMock = buildCommandString('hold', 'LAM');
    const parser = new CommandParser(commandStringMock);
    const cmd = parser.parse();
    t.true(cmd.args[0][0] === 'hold');
    t.true(cmd.args[0][1] === null);
    t.true(cmd.args[0][2] === null);
    t.true(cmd.args[0][3] === 'lam');
});

ava('when passed dct WHAMY it creates the correct command with the correct arguments', t => {
    const commandStringMock = buildCommandString('dct', 'WHAMY');
    const parser = new CommandParser(commandStringMock);
    const cmd = parser.parse();
    t.true(cmd.args[0][0] === 'direct');
    t.true(cmd.args[0][1] === 'whamy');
});

ava('when passed dct TOU it creates the correct command with the correct arguments', t => {
    const commandStringMock = buildCommandString('dct', 'TOU');
    const parser = new CommandParser(commandStringMock);
    const cmd = parser.parse();
    t.true(cmd.args[0][0] === 'direct');
    t.true(cmd.args[0][1] === 'tou');
});

ava('provides a default value for the timewarp command when no args are passed', (t) => {
    const parser = new CommandParser('timewarp');
    const cmd = parser.parse();
    t.true(cmd.args[0] === 1);
});
