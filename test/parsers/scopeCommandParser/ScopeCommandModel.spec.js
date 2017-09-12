import ava from 'ava';
import ScopeCommandModel from '../../../src/assets/scripts/client/parsers/scopeCommandParser/ScopeCommandModel';
import { COMMAND_FUNCTIONS } from '../../../src/assets/scripts/client/parsers/scopeCommandParser/scopeCommandMap';

ava('throws when instantiated without parameters', (t) => {
    t.throws(() => new ScopeCommandModel());
});

ava('sets correct property values for ACCEPT_HANDOFF', (t) => {
    const commandMock = '167';
    const model = new ScopeCommandModel(commandMock);

    t.true(model.aircraftReference === '167');
    t.deepEqual(model.commandArguments, []);
    t.true(model.commandFunction === COMMAND_FUNCTIONS.ACCEPT_HANDOFF);
});

ava('sets correct property values for HANDOFF', (t) => {
    const commandMock = '19 167';
    const model = new ScopeCommandModel(commandMock);

    t.true(model.aircraftReference === '167');
    t.deepEqual(model.commandArguments, ['19']);
    t.true(model.commandFunction === COMMAND_FUNCTIONS.INITIATE_HANDOFF);
});

ava('sets correct property values for MOVE_DATA_BLOCK (direction only)', (t) => {
    const commandMock = '1 167';
    const model = new ScopeCommandModel(commandMock);

    t.true(model.aircraftReference === '167');
    t.deepEqual(model.commandArguments, ['1']);
    t.true(model.commandFunction === COMMAND_FUNCTIONS.MOVE_DATA_BLOCK);
});

ava('sets correct property values for MOVE_DATA_BLOCK (length only)', (t) => {
    const commandMock = '/3 167';
    const model = new ScopeCommandModel(commandMock);

    t.true(model.aircraftReference === '167');
    t.deepEqual(model.commandArguments, ['/3']);
    t.true(model.commandFunction === COMMAND_FUNCTIONS.MOVE_DATA_BLOCK);
});

ava('sets correct property values for MOVE_DATA_BLOCK (direction and length)', (t) => {
    const commandMock = '3/2 167';
    const model = new ScopeCommandModel(commandMock);

    t.true(model.aircraftReference === '167');
    t.deepEqual(model.commandArguments, ['3/2']);
    t.true(model.commandFunction === COMMAND_FUNCTIONS.MOVE_DATA_BLOCK);
});

ava('sets correct property values for QP (toggle FDB suppression)', (t) => {
    const commandMock = 'QP 167';
    const model = new ScopeCommandModel(commandMock);

    t.true(model.aircraftReference === '167');
    t.deepEqual(model.commandArguments, []);
    t.true(model.commandFunction === COMMAND_FUNCTIONS.QP);
});

ava('sets correct property values for QP (propogate FDB to another sector)', (t) => {
    const commandMock = 'QP 19 167';
    const model = new ScopeCommandModel(commandMock);

    t.true(model.aircraftReference === '167');
    t.deepEqual(model.commandArguments, ['19']);
    t.true(model.commandFunction === COMMAND_FUNCTIONS.QP);
});

ava('sets correct property values for QP_J', (t) => {
    const commandMock = 'QP_J 167';
    const model = new ScopeCommandModel(commandMock);

    t.true(model.aircraftReference === '167');
    t.deepEqual(model.commandArguments, []);
    t.true(model.commandFunction === COMMAND_FUNCTIONS.QP_J);
});

ava('sets correct property values for QU', (t) => {
    const commandMock = 'QU 167';
    const model = new ScopeCommandModel(commandMock);

    t.true(model.aircraftReference === '167');
    t.deepEqual(model.commandArguments, []);
    t.true(model.commandFunction === COMMAND_FUNCTIONS.QU);
});

ava('sets correct property values for QZ', (t) => {
    const commandMock = 'QZ 210 167';
    const model = new ScopeCommandModel(commandMock);

    t.true(model.aircraftReference === '167');
    t.deepEqual(model.commandArguments, ['210']);
    t.true(model.commandFunction === COMMAND_FUNCTIONS.QZ);
});

ava('sets correct property values for SCRATCHPAD', (t) => {
    const commandMock = 'I8R 167';
    const model = new ScopeCommandModel(commandMock);

    t.true(model.aircraftReference === '167');
    t.deepEqual(model.commandArguments, ['I8R']);
    t.true(model.commandFunction === COMMAND_FUNCTIONS.SCRATCHPAD);
});
