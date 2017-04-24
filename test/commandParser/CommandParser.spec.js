import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';
import _map from 'lodash/map';
import _tail from 'lodash/tail';

import CommandParser from '../../src/assets/scripts/client/commandParser/CommandParser';
import CommandModel from '../../src/assets/scripts/client/commandParser/CommandModel';

const VERSION_COMMAND_MOCK = 'version';
const TIMEWARP_50_MOCK = 'timewarp 50';
const CALLSIGN_MOCK = 'AA777';
const CAF_MOCK = 'caf';
const CVS_MOCK = 'cvs';
const TO_MOCK = 'to';
const FH_COMMAND_MOCK = 'fh 180';
const D_COMMAND_MOCK = 'd 030';
const STAR_MOCK = 'star quiet7';
const UNICODE_HEADING_MOCK = '\u2BA2 180'

const buildCommandString = (...args) => `${CALLSIGN_MOCK} ${args.join(' ')}`;

const buildCommandList = (...args) => {
    const commandString = buildCommandString(...args);

    return commandString.split(' ');
};

ava('throws when called without parameters', t => {
    t.throws(() => new CommandParser(false));
    t.throws(() => new CommandParser(42));
    t.throws(() => new CommandParser({}));

    t.notThrows(() => new CommandParser());
});

ava('throws when called with an invalid command', (t) => {
    t.throws(() => new CommandParser(['threeve']));
});

ava('throws when called with invalid arguments', (t) => {
    const commandStringMock = buildCommandString(TO_MOCK, 'threeve');

    t.throws(() => new CommandParser(commandStringMock));
});

ava('#args returns one item when a system command is present', t => {
    const model = new CommandParser(TIMEWARP_50_MOCK);

    t.true(_isEqual(model.args, [50]));
});

ava('#args an array for each command with arg values when a transmit command is present', t => {
    const commandStringMock = buildCommandString(FH_COMMAND_MOCK, D_COMMAND_MOCK, STAR_MOCK);
    const model = new CommandParser(commandStringMock);

    t.true(model.args.length === 3);
});

ava('sets #command with the correct name when provided a system command', t => {
    const model = new CommandParser(TIMEWARP_50_MOCK);

    t.true(model.command === 'timewarp');
});

ava('sets #command with the correct name when provided a transmit command', t => {
    const commandStringMock = buildCommandString(CAF_MOCK, CVS_MOCK, TO_MOCK);
    const model = new CommandParser(commandStringMock);

    t.true(model.command === 'transmit');
});

ava('sets #commandList with a CommandModel object when provided a system command', t => {
    const model = new CommandParser(TIMEWARP_50_MOCK);

    t.true(model.commandList.length === 1);
    t.true(model.commandList[0] instanceof CommandModel);
});

ava('sets #commandList with CommandModel objects when it receives transmit commands', t => {
    const commandStringMock = buildCommandString(CAF_MOCK, CVS_MOCK, TO_MOCK);
    const model = new CommandParser(commandStringMock);

    t.true(model.commandList.length === 3);

    _map(model.commandList, (command) => {
        t.true(command instanceof CommandModel);
    });
});

ava('._extractCommandsAndArgs() calls _buildCommandList() when provided transmit commands', t => {
    const commandStringMock = buildCommandString(CAF_MOCK, CVS_MOCK, TO_MOCK);
    const expectedArgs = buildCommandList(CAF_MOCK, CVS_MOCK, TO_MOCK);
    const model = new CommandParser(commandStringMock);
    const _buildCommandListSpy = sinon.spy(model, '_buildCommandList');

    model._extractCommandsAndArgs(commandStringMock);

    t.true(_buildCommandListSpy.calledWithExactly(_tail(expectedArgs)));
});

ava('._buildCommandList() finds correct command when it recieves a space before a unicode value', t => {
    const commandListMock = buildCommandList('', UNICODE_HEADING_MOCK);
    const model = new CommandParser(buildCommandString('', UNICODE_HEADING_MOCK));
    const result = model._buildCommandList(_tail(commandListMock));

    t.true(result[0].name === 'heading');
    t.true(result[0].args[0] === '180');
});

ava('._buildCommandList() does not throw when it trys to add args to an undefined commandModel and returns an empty array', t => {
    const model = new CommandParser();

    t.notThrows(() => model._buildCommandList(['threeve', '$texas']));

    const result = model._buildCommandList(['threeve', '$texas']);

    t.true(result.length === 0);
});

ava('._validateAndParseCommandArguments() calls ._validateCommandArguments()', t => {
    const commandStringMock = buildCommandString(CAF_MOCK, CVS_MOCK, TO_MOCK);
    const model = new CommandParser(commandStringMock);

    const _validateCommandArgumentsSpy = sinon.spy(model, '_validateCommandArguments');
    model._validateCommandArguments();

    t.true(_validateCommandArgumentsSpy.called);
});

ava('._isSystemCommand() returns true if callsignOrTopLevelCommandName exists within SYSTEM_COMMANDS and is not transmit', t => {
    const systemCommandMock = 'timewarp';
    const model = new CommandParser();

    t.true(model._isSystemCommand(systemCommandMock));
});

// specific use case tests
ava('when passed t l 042 as a command it adds l as an argument and not a new command', t => {
    const commandStringMock = buildCommandString('t', 'l', '042');
    const model = new CommandParser(commandStringMock);

    t.true(model.args[0][0] === 'heading');
    t.true(model.args[0][1] === 'left');
});

ava('when passed l as command it adds land as a new command', t => {
    const commandStringMock = buildCommandString('t', 'l', '042', 'l', '28l');
    const model = new CommandParser(commandStringMock);

    t.true(model.args[0][0] === 'heading');
    t.true(model.args[0][1] === 'left');
    t.true(model.args[1][0] === 'land');
    t.true(model.args[1][2] === '28l');
});

ava('when passed hold LAM it creates the correct command with the correct arguments', t => {
    const commandStringMock = buildCommandString('hold', 'LAM');
    const model = new CommandParser(commandStringMock);

    t.true(model.args[0][0] === 'hold');
    t.true(model.args[0][1] === 'right');
    t.true(model.args[0][2] === '1min');
    t.true(model.args[0][3] === 'lam');
});

ava('when passed dct WHAMY it creates the correct command with the correct arguments', t => {
    const commandStringMock = buildCommandString('dct', 'WHAMY');
    const model = new CommandParser(commandStringMock);

    t.true(model.args[0][0] === 'direct');
    t.true(model.args[0][1] === 'whamy');
});

ava('when passed dct TOU it creates the correct command with the correct arguments', t => {
    const commandStringMock = buildCommandString('dct', 'TOU');
    const model = new CommandParser(commandStringMock);

    t.true(model.args[0][0] === 'direct');
    t.true(model.args[0][1] === 'tou');
});

ava('when passed dct TOR it creates the correct command with the correct arguments', t => {
    const commandStringMock = buildCommandString('dct', 'TOR');
    const model = new CommandParser(commandStringMock);

    t.true(model.args[0][0] === 'direct');
    t.true(model.args[0][1] === 'tor');
});

ava('does not throw when passed version command', t => {
    t.notThrows(() => new CommandParser('version'));

    const model = new CommandParser('version');

    t.true(model.command === 'version');
});

ava('provides a default value for the timewarp command when no args are passed', (t) => {
    const model = new CommandParser('timewarp');

    t.true(model.args[0] === 1);
});
