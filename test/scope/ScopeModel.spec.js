import ava from 'ava';
import sinon from 'sinon';
import ScopeModel from '../../src/assets/scripts/client/scope/ScopeModel';
import RadarTargetCollection from '../../src/assets/scripts/client/scope/RadarTargetCollection';
import {
    createRadarTargetArrivalMock,
    createRadarCollectionMock
} from './_mocks/radarTargetMocks';
import { createScopeCommandMock } from './_mocks/scopeCommandMocks';
import { THEME } from '../../src/assets/scripts/client/constants/themes';

ava('does not throw when instantiated with no parameters', (t) => {
    t.notThrows(() => new ScopeModel());
});

ava('creates RadarTargetCollection on instantiation', (t) => {
    const model = new ScopeModel();

    t.true(model.radarTargetCollection instanceof RadarTargetCollection);
});

ava('.acceptHandoff() returns message that command is unavailable', (t) => {
    const model = new ScopeModel();
    const expectedResult = [false, 'acceptHandoff command not yet available'];

    const result = model.acceptHandoff();

    t.deepEqual(result, expectedResult);
});

ava('.amendAltitude() accepts {string} number and passes {number} number to radarTargetModel.amendAltitude()', (t) => {
    const model = new ScopeModel();
    const radarTargetArrivalMock = createRadarTargetArrivalMock();
    const radarTargetModelAmendAltitudeSpy = sinon.spy(radarTargetArrivalMock, 'amendAltitude');

    model.amendAltitude(radarTargetArrivalMock, '220');

    t.true(radarTargetModelAmendAltitudeSpy.calledWithExactly(220));
});

ava('.initiateHandoff() returns message that command is unavailable', (t) => {
    const model = new ScopeModel();
    const expectedResult = [false, 'initiateHandoff command not yet available'];

    const result = model.initiateHandoff();

    t.deepEqual(result, expectedResult);
});

ava('.moveDataBlock() calls radarTargetModel.moveDataBlock() with correct parameters', (t) => {
    const model = new ScopeModel();
    const radarTargetArrivalMock = createRadarTargetArrivalMock();
    const radarTargetModelMoveDataBlockSpy = sinon.spy(radarTargetArrivalMock, 'moveDataBlock');

    model.moveDataBlock(radarTargetArrivalMock, '3/2');

    t.true(radarTargetModelMoveDataBlockSpy.calledWithExactly('3/2'));
});

ava('.propogateDataBlock() returns message that command is unavailable', (t) => {
    const model = new ScopeModel();
    const expectedResult = [false, 'propogateDataBlock command not yet available'];

    const result = model.propogateDataBlock();

    t.deepEqual(result, expectedResult);
});

ava('.route() returns message that command is unavailable', (t) => {
    const model = new ScopeModel();
    const expectedResult = [false, 'route command not yet available'];

    const result = model.route();

    t.deepEqual(result, expectedResult);
});

ava('.runScopeCommand() returns syntax error if scope command function does not exist', (t) => {
    const scopeModel = new ScopeModel();
    const scopeCommandModel = createScopeCommandMock();
    const expectedResponse = [false, 'ERR: BAD SYNTAX'];

    scopeCommandModel.commandFunction = 'complete and utter nonsense';

    const response = scopeModel.runScopeCommand(scopeCommandModel);

    t.deepEqual(response, expectedResponse);
});

ava('.runScopeCommand() returns unknown aircraft error when aircraft reference has no matching target models', (t) => {
    const scopeModel = new ScopeModel();

    scopeModel.radarTargetCollection = createRadarCollectionMock();

    const scopeCommandModel = createScopeCommandMock();

    scopeCommandModel.aircraftReference = 'yabbadabbadoo';

    const scopeMethodSpy = sinon.spy(scopeModel, scopeCommandModel.commandFunction);
    const expectedResponse = [false, 'ERR: UNKNOWN AIRCRAFT'];
    const response = scopeModel.runScopeCommand(scopeCommandModel);
    t.deepEqual(response, expectedResponse);
    t.true(scopeMethodSpy.notCalled);
});

ava('.runScopeCommand() calls the correct method specified in the ScopeCommandModel', (t) => {
    const scopeModel = new ScopeModel();

    scopeModel.radarTargetCollection = createRadarCollectionMock();

    const scopeCommandModel = createScopeCommandMock();
    const scopeMethodSpy = sinon.spy(scopeModel, scopeCommandModel.commandFunction);
    const expectedResponse = [true, 'AMEND ALTITUDE'];
    const response = scopeModel.runScopeCommand(scopeCommandModel);

    t.deepEqual(response, expectedResponse);
    t.true(scopeMethodSpy.calledOnce);
});

ava('.setScratchpad() returns scratchpad length error when too many characters provided', (t) => {
    const model = new ScopeModel();
    const radarTargetModel = createRadarTargetArrivalMock();
    const radarTargetModelSetScratchPadSpy = sinon.spy(radarTargetModel, 'setScratchpad');
    const newScratchPadText = 'ABDEFGHIJKLMNOP';
    const expectedResponse = [false, 'ERR: SCRATCHPAD MAX 3 CHAR'];
    const response = model.setScratchpad(radarTargetModel, newScratchPadText);

    t.deepEqual(response, expectedResponse);
    t.true(radarTargetModelSetScratchPadSpy.notCalled);
});

ava('.setScratchpad() sets RadarTargetModel._scratchPadText to the specified string', (t) => {
    const model = new ScopeModel();
    const radarTargetModel = createRadarTargetArrivalMock();
    const radarTargetModelSetScratchPadSpy = sinon.spy(radarTargetModel, 'setScratchpad');
    const newScratchPadText = 'V6R';
    const expectedResponse = [true, 'SET SCRATCHPAD'];
    const response = model.setScratchpad(radarTargetModel, newScratchPadText);

    t.deepEqual(response, expectedResponse);
    t.true(radarTargetModelSetScratchPadSpy.calledWithExactly(newScratchPadText));
});

ava('.toggleHalo() sets RadarTargetModel._hasHalo to the opposite of its current state', (t) => {
    const model = new ScopeModel();
    const radarTargetModel = createRadarTargetArrivalMock();
    const radarTargetModelToggleHaloSpy = sinon.spy(radarTargetModel, 'toggleHalo');
    const expectedResponse = [true, 'TOGGLE HALO'];
    const response = model.toggleHalo(radarTargetModel);

    t.deepEqual(response, expectedResponse);
    t.true(radarTargetModelToggleHaloSpy.called);
});

ava('._setTheme returns early when an invalid theme name is passed', (t) => {
    const model = new ScopeModel();
    const themeName = 'great googly moogly!';

    model._setTheme(themeName);

    t.true(model._theme === THEME.DEFAULT);
});

ava('._setTheme() changes the value of #_theme', (t) => {
    const model = new ScopeModel();
    const themeName = 'CLASSIC';

    model._setTheme(themeName);

    t.true(model._theme === THEME.CLASSIC);
});

// // ava('', (t) => {
//     //
// });

// // ava('', (t) => {
//     //
// });

// // ava('', (t) => {
//     //
// });

// // ava('', (t) => {
//     //
// });

// // ava('', (t) => {
//     //
// });

// // ava('', (t) => {
//     //
// });

// // ava('', (t) => {
//     //
// });

// // ava('', (t) => {
//     //
// });

// // ava('', (t) => {
//     //
// });

// // ava('', (t) => {
//     //
// });

// ava.todo('Add test for .amendAltitude()');
