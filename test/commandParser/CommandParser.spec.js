/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies */
import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';
import _map from 'lodash/map';

import CommandParser from '../../src/assets/scripts/commandParser/CommandParser';
import CommandModel from '../../src/assets/scripts/commandParser/CommandModel';

const CALLSIGN_MOCK = 'AA777';
const FH_COMMAND_MOCK = 'fh 180';
const D_COMMAND_MOCK = 'd 030';
const CAF_MOCK = 'caf';
const CVS_MOCK = 'cvs';
const TO_MOCK = 'to';
const STAR_MOCK = 'star quiet7';
const COMPLEX_COMMAND_MOCK = 'caf cvs w 27l c 50 fix wetor dumba to';

const buildCommandString = (...args) => {
    return `${CALLSIGN_MOCK} ${args.join(' ')}`;
};

const buildCommandList = (...args) => {
    const commandString = buildCommandString(...args);

    return commandString.split(' ');
};

ava('throws when called without parameters', t => {
    t.throws(() => new CommandParser());
});

ava('._extractCommandsAndArgs() calls _findCommandIndicies()', t => {
    const commandStringMock = buildCommandString(CAF_MOCK, CVS_MOCK, TO_MOCK);
    const expectedArgs = buildCommandList(CAF_MOCK, CVS_MOCK, TO_MOCK);
    const model = new CommandParser('');
    const _findCommandIndiciesStub = sinon.stub(model, '_findCommandIndicies');

    model._extractCommandsAndArgs(commandStringMock);

    t.true(_findCommandIndiciesStub.calledWithExactly(expectedArgs));
});

ava('._extractCommandsAndArgs() sets commandList with CommandModel objects', t => {
    const commandStringMock = buildCommandString(CAF_MOCK, CVS_MOCK, TO_MOCK);
    const model = new CommandParser(commandStringMock);

    t.true(model.commandList.length === 3);

    _map(model.commandList, (command) => {
        t.true(command instanceof CommandModel);
    });
});

ava('._findCommandIndicies() returns the indicies of valid commands within the commandValueString', t => {
    const commandListMock = buildCommandList(CAF_MOCK, CVS_MOCK, FH_COMMAND_MOCK);
    const model = new CommandParser('');
    const result = model._findCommandIndicies(commandListMock);
    const expectedResult = [1, 2, 3];

    t.true(_isEqual(result, expectedResult));
});
