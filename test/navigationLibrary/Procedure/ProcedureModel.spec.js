import ava from 'ava';
import _every from 'lodash/every';
import _map from 'lodash/map';
import _isArray from 'lodash/isArray';
import ProcedureModel from '../../../src/assets/scripts/client/navigationLibrary/ProcedureModel';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';
import {
    SID_MOCK,
    STAR_MOCK
} from './_mocks/procedureMocks';
import { PROCEDURE_TYPE } from '../../../src/assets/scripts/client/constants/routeConstants';

// mocks
const invalidEntryMock = 'blahblahblah';
const invalidExitMock = 'blahblahblah';
const validBoachEntryMock = 'KLAS07R';
const validBoachExitMock = 'TNP';

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('throws when instantiated without parameters', (t) => {
    t.throws(() => new ProcedureModel());
});

ava('throws when instantiated with a procedure type but no data', (t) => {
    t.throws(() => new ProcedureModel(PROCEDURE_TYPE.SID));
});

ava('throws when instantiated with unknown procedure type', (t) => {
    t.throws(() => new ProcedureModel('invalidProcedureType', SID_MOCK.BOACH6));
});

ava('instantiates correctly when given valid SID data', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const expectedEntries = ['KLAS01L', 'KLAS01R', 'KLAS07L', 'KLAS07R', 'KLAS19L', 'KLAS19R', 'KLAS25L', 'KLAS25R'];
    const expectedExits = ['HEC', 'TNP'];

    t.deepEqual(model._body[0], ['BOACH', 'A130+']);
    t.true(model._body.length === 1);
    t.true(model._entryPoints.KLAS07R[0] === 'JESJI');
    t.deepEqual(Object.keys(model._entryPoints), expectedEntries);
    t.true(model._exitPoints.TNP[0] === 'ZELMA');
    t.deepEqual(Object.keys(model._exitPoints), expectedExits);
    t.deepEqual(model._draw, SID_MOCK.BOACH6.draw);
    t.true(model._icao === SID_MOCK.BOACH6.icao);
    t.true(model._name === SID_MOCK.BOACH6.name);
});

ava('instantiates correctly when given valid STAR data', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.STAR, STAR_MOCK.KEPEC1);
    const expectedEntries = ['DAG', 'TNP'];
    const expectedExits = ['KLAS01L', 'KLAS01R', 'KLAS07L', 'KLAS07R', 'KLAS19L', 'KLAS19R', 'KLAS25L', 'KLAS25R'];


    t.deepEqual(model._body[0], ['CLARR', 'A130|S250']);
    t.true(model._body.length === 4);
    t.true(model._entryPoints.TNP[1] === 'JOTNU');
    t.deepEqual(Object.keys(model._entryPoints), expectedEntries);
    t.deepEqual(model._exitPoints.KLAS07R[0], ['CHIPZ', 'A80|S170']);
    t.deepEqual(Object.keys(model._exitPoints), expectedExits);
    t.deepEqual(model._draw, STAR_MOCK.KEPEC1.draw);
    t.true(model._icao === STAR_MOCK.KEPEC1.icao);
    t.true(model._name === STAR_MOCK.KEPEC1.name);
});

ava('#draw returns value of #_draw', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const expectedResult = model._draw;
    const result = model.draw;

    t.deepEqual(result, expectedResult);
});

ava('#icao returns value of #_icao', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const expectedResult = model._icao;
    const result = model.icao;

    t.true(result === expectedResult);
});

ava('#name returns value of #_name', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const expectedResult = model._name;
    const result = model.name;

    t.true(result === expectedResult);
});

ava('#procedureType returns value of #_procedureType', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const expectedResult = model._procedureType;
    const result = model.procedureType;

    t.true(result === expectedResult);
});

ava('.getAllFixNamesInUse() throws when #_draw is not a 2D array', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);

    model._draw = [];

    t.throws(() => model.getAllFixNamesInUse());
});

ava('.getAllFixNamesInUse() returns all fix names that exist in any portion of the procedure', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const expectedResult = [
        'BESSY', 'WITLA', 'JEBBB', 'WASTE', 'BAKRR', 'MINEY', 'HITME', 'JESJI', 'FIXIX',
        'ROPPR', 'RODDD', 'JAKER', 'PIRMD', 'RBELL', 'BOACH', 'HEC', 'ZELMA', 'JOTNU', 'TNP'
    ];
    const result = model.getAllFixNamesInUse();

    t.deepEqual(result, expectedResult);
});

ava('.getRandomExitPoint() returns different exit point names on successive calls', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    // making call count high to prevent chance of erroneous failure
    // callCount 15 yields 1 in 32k chance of failure on 2-exit SID (such as in this test)
    const callCount = 15;
    const randomlySelectedExitNames = [];

    for (let i = 0; i < callCount; i++) {
        randomlySelectedExitNames.push(model.getRandomExitPoint());
    }

    const allExitsAreEqual = _every(randomlySelectedExitNames, (name) => name === randomlySelectedExitNames[0]);

    t.false(allExitsAreEqual);
});

ava('.getWaypointModelsForEntryAndExit() returns early when specified entry point is invalid', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const result = model.getWaypointModelsForEntryAndExit(invalidEntryMock, validBoachExitMock);

    t.true(typeof result === 'undefined');
});

ava('.getWaypointModelsForEntryAndExit() returns early when specified exit point is invalid', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const result = model.getWaypointModelsForEntryAndExit(validBoachEntryMock, invalidExitMock);

    t.true(typeof result === 'undefined');
});

ava('.getWaypointModelsForEntryAndExit() returns correct waypoints when specified entry/exit are valid', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const result = model.getWaypointModelsForEntryAndExit(validBoachEntryMock, validBoachExitMock);
    const resultingWaypointNames = _map(result, (waypointModel) => waypointModel._name);
    const expectedWaypointNames = ['JESJI', 'BAKRR', 'MINEY', 'HITME', 'BOACH', 'ZELMA', 'JOTNU', 'TNP'];

    t.true(_isArray(result));
    t.true(result.length === 8);
    t.deepEqual(resultingWaypointNames, expectedWaypointNames);
});

ava('.hasEntry() returns false when the specified entry is not valid for the procedure', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const result = model.hasEntry(invalidEntryMock);

    t.false(result);
});

ava('.hasEntry() returns true when the specified entry is valid for the procedure', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const result = model.hasEntry(validBoachEntryMock);

    t.true(result);
});

ava('.hasExit() returns false when the specified exit is not valid for the procedure', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const result = model.hasExit(invalidExitMock);

    t.false(result);
});

ava('.hasExit() returns true when the specified exit is valid for the procedure', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const result = model.hasExit(validBoachExitMock);

    t.true(result);
});

ava('.isSid() returns false when this procedure is not a SID', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.STAR, STAR_MOCK.KEPEC1);

    t.false(model.isSid());
});

ava('.isSid() returns true when this procedure is a SID', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);

    t.true(model.isSid());
});

ava('.isStar() returns false when this procedure is not a STAR', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);

    t.false(model.isStar());
});

ava('.isStar() returns true when this procedure is a STAR', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.STAR, STAR_MOCK.KEPEC1);

    t.true(model.isStar());
});

ava('._getFixNameFromRestrictedFixArray() returns undefined when provided a vector waypoint name', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const result = model._getFixNameFromRestrictedFixArray('#123');

    t.true(typeof result === 'undefined');
});

ava('._generateWaypointsForEntry() throws when specified entry point is invalid', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);

    t.throws(() => model._generateWaypointsForEntry(invalidEntryMock));
});

ava('._generateWaypointsForExit() throws when specified exit point is invalid', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);

    t.throws(() => model._generateWaypointsForExit(invalidExitMock));
});
