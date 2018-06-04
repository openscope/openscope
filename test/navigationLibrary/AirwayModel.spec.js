import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import _map from 'lodash/map';
import AirwayModel from '../../src/assets/scripts/client/navigationLibrary/AirwayModel';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../fixtures/navigationLibraryFixtures';

const airwayNameMock = 'V587';
const validAirwayFixes = ['DAG', 'JOKUR', 'DANBY', 'WHIGG', 'BOACH', 'CRESO', 'BLD'];
const airwayWithUnknownFix = ['DAG', 'JOKUR', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'WHIGG', 'BOACH', 'CRESO', 'BLD'];
const fixNotOnAirway = 'PRINO';

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('throws when any fix in the airway definition is not defined in the fixes section', (t) => {
    t.throws(() => new AirwayModel(airwayNameMock, airwayWithUnknownFix));
});

ava('throws when an empty airway name is given', (t) => {
    t.throws(() => new AirwayModel(undefined, validAirwayFixes));
    t.throws(() => new AirwayModel(null, validAirwayFixes));
    t.throws(() => new AirwayModel('', validAirwayFixes));
});

ava('throws when airway definition does not include any fixes', (t) => {
    t.throws(() => new AirwayModel(airwayNameMock, undefined));
    t.throws(() => new AirwayModel(airwayNameMock, null));
    t.throws(() => new AirwayModel(airwayNameMock, {}));
    t.throws(() => new AirwayModel(airwayNameMock, []));
});

ava('initializes correctly when provided valid airway name and fix list', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes);

    t.true(model._icao === airwayNameMock);
    t.true(_isArray(model._fixNameCollection));
    t.true(model._fixNameCollection.length === 7);
    t.deepEqual(model._navigationLibrary);
});

ava('.getWaypointModelsForEntryAndExit() returns early when specified entry is the same as the exit', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes);
    const getFixNamesFromIndexToIndexSpy = sinon.spy(model, '_getFixNamesFromIndexToIndex');
    const result = model.getWaypointModelsForEntryAndExit('JOKUR', 'JOKUR');

    t.true(typeof result === 'undefined');
    t.true(getFixNamesFromIndexToIndexSpy.notCalled);
});

ava('.getWaypointModelsForEntryAndExit() returns early when specified entry is not on the airway', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes);
    const getFixNamesFromIndexToIndexSpy = sinon.spy(model, '_getFixNamesFromIndexToIndex');
    const result = model.getWaypointModelsForEntryAndExit(fixNotOnAirway, 'CRESO');

    t.true(typeof result === 'undefined');
    t.true(getFixNamesFromIndexToIndexSpy.notCalled);
});

ava('.getWaypointModelsForEntryAndExit() returns early when specified exit is not on the airway', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes);
    const getFixNamesFromIndexToIndexSpy = sinon.spy(model, '_getFixNamesFromIndexToIndex');
    const result = model.getWaypointModelsForEntryAndExit('JOKUR', fixNotOnAirway);

    t.true(typeof result === 'undefined');
    t.true(getFixNamesFromIndexToIndexSpy.notCalled);
});

ava('.getWaypointModelsForEntryAndExit() calls ._getFixNamesFromIndexToIndex() correctly for forward-order fix chains', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes);
    const getFixNamesFromIndexToIndexSpy = sinon.spy(model, '_getFixNamesFromIndexToIndex');
    const result = model.getWaypointModelsForEntryAndExit('JOKUR', 'CRESO');
    const expectedFixNames = ['JOKUR', 'DANBY', 'WHIGG', 'BOACH', 'CRESO'];
    const fixNames = _map(result, (fixModel) => fixModel.name);

    t.true(getFixNamesFromIndexToIndexSpy.calledWithExactly(1, 5));
    t.deepEqual(fixNames, expectedFixNames);
});

ava('.getWaypointModelsForEntryAndExit() calls ._getFixNamesFromIndexToIndex() correctly for backward-order fix chains', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes);
    const getFixNamesFromIndexToIndexSpy = sinon.spy(model, '_getFixNamesFromIndexToIndex');
    const result = model.getWaypointModelsForEntryAndExit('CRESO', 'JOKUR');
    const expectedFixNames = ['CRESO', 'BOACH', 'WHIGG', 'DANBY', 'JOKUR'];
    const fixNames = _map(result, (fixModel) => fixModel.name);

    t.true(getFixNamesFromIndexToIndexSpy.calledWithExactly(5, 1));
    t.deepEqual(fixNames, expectedFixNames);
});

ava('.hasFixName() returns false when the specified fix is not on the airway', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes);
    const result = model.hasFixName('ABCDE');

    t.false(result);
});

ava('.hasFixName() returns true when the specified fix is on the airway', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes);
    const result = model.hasFixName('BOACH');

    t.true(result);
});

ava('._getFixNamesFromIndexToIndex() throws when specified indices are the same', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes);

    t.throws(() => model._getFixNamesFromIndexToIndex(1, 1));
});
