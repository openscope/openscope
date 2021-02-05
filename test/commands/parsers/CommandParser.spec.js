import ava from 'ava';
import sinon from 'sinon';
import _map from 'lodash/map';
import _tail from 'lodash/tail';

import CommandParser from '../../../src/assets/scripts/client/commands/parsers/CommandParser';
import AircraftCommandModel from '../../../src/assets/scripts/client/commands/aircraftCommand/AircraftCommandModel';
import { PARSED_COMMAND_NAME } from '../../../src/assets/scripts/client/constants/inputConstants';

const TIMEWARP_50_MOCK = 'timewarp 50';
const CALLSIGN_MOCK = 'AAL777';
const CAF_MOCK = 'caf';
const CVS_MOCK = 'cvs';
const TAKEOFF_MOCK = 'to';

const buildCommandString = (...args) => `${CALLSIGN_MOCK} ${args.join(' ')}`;

const buildCommandList = (...args) => {
    const commandString = buildCommandString(...args);

    return commandString.split(' ');
};

ava('throws when called with an invalid command', (t) => {
    t.throws(() => new CommandParser(['threeve']));
    t.throws(() => new CommandParser(false));
    t.throws(() => new CommandParser(42));
    t.throws(() => new CommandParser({}));
});

ava('throws when called with invalid arguments', (t) => {
    const expectedResult = 'Invalid argument length. Expected exactly zero arguments';
    const commandStringMock = buildCommandString(TAKEOFF_MOCK, 'threeve');

    try {
        // eslint-disable-next-line no-unused-vars
        const model = new CommandParser(commandStringMock);
    } catch (e) {
        t.true(e === expectedResult);
    }
});

ava('does not throw when called without parameters', t => {
    t.notThrows(() => new CommandParser());
});


ava('sets #command with the correct name when provided a system command', t => {
    const model = new CommandParser(TIMEWARP_50_MOCK);

    t.true(model.command === 'timewarp');
});

ava('sets #command with the correct name when provided a transmit command', t => {
    const commandStringMock = buildCommandString(CAF_MOCK, CVS_MOCK, TAKEOFF_MOCK);
    const model = new CommandParser(commandStringMock);

    t.true(model.command === PARSED_COMMAND_NAME.TRANSMIT);
});

ava('sets #commandList with a AircraftCommandModel object when provided a system command', t => {
    const model = new CommandParser(TIMEWARP_50_MOCK);

    t.true(model.commandList.length === 1);
    t.true(model.commandList[0] instanceof AircraftCommandModel);
});

ava('sets #commandList with AircraftCommandModel objects when it receives transmit commands', t => {
    const commandStringMock = buildCommandString(CAF_MOCK, CVS_MOCK, TAKEOFF_MOCK);
    const model = new CommandParser(commandStringMock);

    t.true(model.commandList.length === 3);

    _map(model.commandList, (command) => {
        t.true(command instanceof AircraftCommandModel);
    });
});

ava('._extractCommandsAndArgs() calls _buildCommandList() when provided transmit commands', t => {
    const commandStringMock = buildCommandString(CAF_MOCK, CVS_MOCK, TAKEOFF_MOCK);
    const expectedArgs = buildCommandList(CAF_MOCK, CVS_MOCK, TAKEOFF_MOCK);
    const model = new CommandParser(commandStringMock);
    const _buildCommandListSpy = sinon.spy(model, '_buildCommandList');

    model._extractCommandsAndArgs(commandStringMock);

    t.true(_buildCommandListSpy.calledWithExactly(_tail(expectedArgs)));
});

ava('._buildCommandList() returns an empty array when adding args to an undefined AircraftCommandModel', t => {
    const model = new CommandParser('threeve');

    t.notThrows(() => model._buildCommandList(['$texas']));

    const result = model._buildCommandList(['$texas']);

    t.deepEqual(result, []);
});

ava('._validateAndParseCommandArguments() calls ._validateCommandArguments()', t => {
    const commandStringMock = buildCommandString(CAF_MOCK, CVS_MOCK, TAKEOFF_MOCK);
    const model = new CommandParser(commandStringMock);

    const _validateCommandArgumentsSpy = sinon.spy(model, '_validateCommandArguments');
    model._validateCommandArguments();

    t.true(_validateCommandArgumentsSpy.called);
});

ava('._isSystemCommand() returns true if callsignOrTopLevelCommandName exists within SYSTEM_COMMANDS and is not transmit', t => {
    const systemCommandMock = 'timewarp';
    const model = new CommandParser(systemCommandMock);

    t.true(model._isSystemCommand(systemCommandMock));
});
