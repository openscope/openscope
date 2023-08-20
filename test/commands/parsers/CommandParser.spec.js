import ava from 'ava';
import sinon from 'sinon';
import _map from 'lodash/map';
import _some from 'lodash/some';
import _tail from 'lodash/tail';

import CommandParser from '../../../src/assets/scripts/client/commands/parsers/CommandParser';
import AircraftCommandModel from '../../../src/assets/scripts/client/commands/aircraftCommand/AircraftCommandModel';
import { PARSED_COMMAND_NAME } from '../../../src/assets/scripts/client/constants/inputConstants';

const COMMAND_ARGS_SEPARATOR = ' ';

const AIRPORT_MOCK = 'airport ksea';
const PAUSE_MOCK = 'pause';
const TIMEWARP_50_MOCK = 'timewarp 50';
const TW_50_MOCK = 'tw 50';
const TUTORIAL_MOCK = 'tutorial';

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
    const airportModel = new CommandParser(AIRPORT_MOCK);
    const pauseModel = new CommandParser(PAUSE_MOCK);
    const timewarpModel = new CommandParser(TIMEWARP_50_MOCK);
    const tutorialModel = new CommandParser(TUTORIAL_MOCK);

    t.true(airportModel.command === PARSED_COMMAND_NAME.AIRPORT);
    t.true(pauseModel.command === PARSED_COMMAND_NAME.PAUSE);
    t.true(timewarpModel.command === PARSED_COMMAND_NAME.TIMEWARP);
    t.true(tutorialModel.command === PARSED_COMMAND_NAME.TUTORIAL);
});

ava('sets #command with identical name when provided an alias of a system command', t => {
    const twModel = new CommandParser(TW_50_MOCK);
    const timewarpModel = new CommandParser(TIMEWARP_50_MOCK);

    t.is(twModel.command, timewarpModel.command);
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

ava('._extractCommandsAndArgs() discards empty tokens caused by multiple spaces', t => {
    const extraSpacesMock = 'timewarp  50';
    const model = new CommandParser(extraSpacesMock);
    const _buildSystemCommandModelSpy = sinon.spy(model, '_buildSystemCommandModel');

    model._extractCommandsAndArgs(extraSpacesMock);

    t.true(_buildSystemCommandModelSpy.calledOnce);
    t.false(_some(_buildSystemCommandModelSpy.lastCall.args[0], { length: 0 }));
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

ava('._isSystemCommand() returns true if callsignOrSystemCommandName exists within AIRCRAFT_COMMAND_MAP and is marked as a system command there', t => {
    const airportModel = new CommandParser(AIRPORT_MOCK);
    const pauseModel = new CommandParser(PAUSE_MOCK);
    const timewarpModel = new CommandParser(TIMEWARP_50_MOCK);
    const tutorialModel = new CommandParser(TUTORIAL_MOCK);

    t.true(airportModel._isSystemCommand(AIRPORT_MOCK.split(COMMAND_ARGS_SEPARATOR)[0]));
    t.true(pauseModel._isSystemCommand(PAUSE_MOCK.split(COMMAND_ARGS_SEPARATOR)[0]));
    t.true(timewarpModel._isSystemCommand(TIMEWARP_50_MOCK.split(COMMAND_ARGS_SEPARATOR)[0]));
    t.true(tutorialModel._isSystemCommand(TUTORIAL_MOCK.split(COMMAND_ARGS_SEPARATOR)[0]));
});

ava('._isSystemCommand() returns identical outcome for alias of a system command', t => {
    const twModel = new CommandParser(TW_50_MOCK);
    const timewarpModel = new CommandParser(TIMEWARP_50_MOCK);

    t.is(
        twModel._isSystemCommand(TW_50_MOCK.split(COMMAND_ARGS_SEPARATOR)[0]),
        timewarpModel._isSystemCommand(TIMEWARP_50_MOCK.split(COMMAND_ARGS_SEPARATOR)[0])
    );
});
