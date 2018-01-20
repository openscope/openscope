import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import _map from 'lodash/map';
import AirwayModel from '../../src/assets/scripts/client/navigationLibrary/AirwayModel';
// import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';
// import {
//     FIXNAME_MOCK,
//     FIX_COORDINATE_MOCK
// } from './_mocks/fixMocks';
// import { airportPositionFixtureKSFO } from '../../fixtures/airportFixtures';
import { createNavigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';
// import { INVALID_NUMBER } from '../../../src/assets/scripts/client/constants/globalConstants';

// fixtures
let navigationLibraryFixture;
const airwayNameMock = 'V587';
const validAirwayFixes = ['DAG', 'JOKUR', 'DANBY', 'WHIGG', 'BOACH', 'CRESO', 'BLD'];
const airwayWithInvalidFix = ['DAG', 'JOKUR', 'UNKNOWN', 'WHIGG', 'BOACH', 'CRESO', 'BLD'];
const fixNotOnAirway = 'PRINO';

ava.beforeEach(() => {
    navigationLibraryFixture = createNavigationLibraryFixture();
});

ava.afterEach(() => {
    navigationLibraryFixture = null;
});

ava('throws when any fix in the airway definition is not defined in the fixes section', (t) => {
    t.throws(() => new AirwayModel(airwayNameMock, airwayWithInvalidFix, navigationLibraryFixture));
});

ava('throws when an empty airway name is given', (t) => {
    t.throws(() => new AirwayModel(undefined, validAirwayFixes, navigationLibraryFixture));
    t.throws(() => new AirwayModel(null, validAirwayFixes, navigationLibraryFixture));
    t.throws(() => new AirwayModel('', validAirwayFixes, navigationLibraryFixture));
});

ava('throws when airway definition does not include any fixes', (t) => {
    t.throws(() => new AirwayModel(airwayNameMock, undefined, navigationLibraryFixture));
    t.throws(() => new AirwayModel(airwayNameMock, null, navigationLibraryFixture));
    t.throws(() => new AirwayModel(airwayNameMock, {}, navigationLibraryFixture));
    t.throws(() => new AirwayModel(airwayNameMock, [], navigationLibraryFixture));
});

ava('initializes correctly when provided valid airway name and fix list', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes, navigationLibraryFixture);

    t.true(model._icao === airwayNameMock);
    t.true(_isArray(model._fixCollection));
    t.true(model._fixCollection.length === 7);
    t.deepEqual(model._navigationLibrary, navigationLibraryFixture);
});

ava('.getWaypointModelsForEntryAndExit() returns early when specified entry is the same as the exit', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes, navigationLibraryFixture);
    const getFixNamesFromIndexToIndexSpy = sinon.spy(model, '_getFixNamesFromIndexToIndex');
    const result = model.getWaypointModelsForEntryAndExit('JOKUR', 'JOKUR');

    t.true(typeof result === 'undefined');
    t.true(getFixNamesFromIndexToIndexSpy.notCalled);
});

ava('.getWaypointModelsForEntryAndExit() returns early when specified entry is not on the airway', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes, navigationLibraryFixture);
    const getFixNamesFromIndexToIndexSpy = sinon.spy(model, '_getFixNamesFromIndexToIndex');
    const result = model.getWaypointModelsForEntryAndExit(fixNotOnAirway, 'CRESO');

    t.true(typeof result === 'undefined');
    t.true(getFixNamesFromIndexToIndexSpy.notCalled);
});

ava('.getWaypointModelsForEntryAndExit() returns early when specified exit is not on the airway', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes, navigationLibraryFixture);
    const getFixNamesFromIndexToIndexSpy = sinon.spy(model, '_getFixNamesFromIndexToIndex');
    const result = model.getWaypointModelsForEntryAndExit('JOKUR', fixNotOnAirway);

    t.true(typeof result === 'undefined');
    t.true(getFixNamesFromIndexToIndexSpy.notCalled);
});

ava('.getWaypointModelsForEntryAndExit() calls ._getFixNamesFromIndexToIndex() correctly for forward-order fix chains', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes, navigationLibraryFixture);
    const getFixNamesFromIndexToIndexSpy = sinon.spy(model, '_getFixNamesFromIndexToIndex');
    const result = model.getWaypointModelsForEntryAndExit('JOKUR', 'CRESO');
    const expectedFixNames = ['JOKUR', 'DANBY', 'WHIGG', 'BOACH', 'CRESO'];
    const fixNames = _map(result, (fixModel) => fixModel.name);

    t.true(getFixNamesFromIndexToIndexSpy.calledWithExactly(1, 5));
    t.deepEqual(fixNames, expectedFixNames);
});

ava('.getWaypointModelsForEntryAndExit() calls ._getFixNamesFromIndexToIndex() correctly for backward-order fix chains', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes, navigationLibraryFixture);
    const getFixNamesFromIndexToIndexSpy = sinon.spy(model, '_getFixNamesFromIndexToIndex');
    const result = model.getWaypointModelsForEntryAndExit('CRESO', 'JOKUR');
    const expectedFixNames = ['CRESO', 'BOACH', 'WHIGG', 'DANBY', 'JOKUR'];
    const fixNames = _map(result, (fixModel) => fixModel.name);

    t.true(getFixNamesFromIndexToIndexSpy.calledWithExactly(5, 1));
    t.deepEqual(fixNames, expectedFixNames);
});

ava('._findIndexOfFixName() returns -1 when specified fix is not in the #_fixCollection', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes, navigationLibraryFixture);
    const expectedResult = -1;
    const result = model._findIndexOfFixName('ABCDE');

    t.true(result === expectedResult);
});

ava('._findIndexOfFixName() returns the correct index for upper cased fix name', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes, navigationLibraryFixture);
    const expectedResult = 2;
    const result = model._findIndexOfFixName('DANBY');

    t.true(result === expectedResult);
});

ava('._findIndexOfFixName() returns the correct index for lower cased fix name', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes, navigationLibraryFixture);
    const expectedResult = 2;
    const result = model._findIndexOfFixName('danby');

    t.true(result === expectedResult);
});

ava('._getFixNamesFromIndexToIndex() throws when specified indices are the same', (t) => {
    const model = new AirwayModel(airwayNameMock, validAirwayFixes, navigationLibraryFixture);

    t.throws(() => model._getFixNamesFromIndexToIndex(1, 1));
});
