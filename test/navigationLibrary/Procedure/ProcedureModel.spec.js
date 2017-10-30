import ava from 'ava';
import _map from 'lodash/map';
import _isArray from 'lodash/isArray';
import NavigationLibrary from '../../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import ProcedureModel from '../../../src/assets/scripts/client/navigationLibrary/Procedure/ProcedureModel';
import {
    SID_MOCK,
    STAR_MOCK
} from './_mocks/procedureMocks';
import { AIRPORT_JSON_KLAS_MOCK } from '../../airport/_mocks/airportJsonMock';
import { PROCEDURE_TYPE } from '../../../src/assets/scripts/client/constants/aircraftConstants';

let navigationLibrary;

ava.beforeEach(() => {
    navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
});

ava.afterEach(() => {
    navigationLibrary.reset();
});

ava('throws when instantiated without parameters', (t) => {
    t.throws(() => new ProcedureModel());
});

ava('throws when instantiated with unknown procedure type', (t) => {
    t.throws(() => new ProcedureModel('invalidProcedureType', SID_MOCK.BOACH6));
});

ava('instantiates correctly when given valid SID data', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const expectedEntries = ['01L', '01R', '07L', '07R', '19L', '19R', '25L', '25R'];
    const expectedExits = ['HEC', 'TNP'];

    t.true(model._bodyProcedureWaypoints[0]._name === 'BOACH');
    t.true(model._bodyProcedureWaypoints.length === 1);
    t.true(model._entryProcedureWaypointCollection['07R'][0]._name === 'JESJI');
    t.deepEqual(Object.keys(model._entryProcedureWaypointCollection), expectedEntries);
    t.true(model._exitProcedureWaypointCollection.TNP[0]._name === 'ZELMA');
    t.deepEqual(Object.keys(model._exitProcedureWaypointCollection), expectedExits);
    t.true(model._draw === SID_MOCK.BOACH6.draw);
    t.true(model._icao === SID_MOCK.BOACH6.icao);
    t.true(model._name === SID_MOCK.BOACH6.name);
});

ava('instantiates correctly when given valid STAR data', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.STAR, STAR_MOCK.KEPEC1);
    const expectedEntries = ['DAG', 'TNP'];
    const expectedExits = ['01L', '01R', '07L', '07R', '19L', '19R', '25L', '25R'];


    t.true(model._bodyProcedureWaypoints[0]._name === 'CLARR');
    t.true(model._bodyProcedureWaypoints.length === 4);
    t.true(model._entryProcedureWaypointCollection.TNP[1]._name === 'JOTNU');
    t.deepEqual(Object.keys(model._entryProcedureWaypointCollection), expectedEntries);
    t.true(model._exitProcedureWaypointCollection['07R'][0]._name === 'CHIPZ');
    t.deepEqual(Object.keys(model._exitProcedureWaypointCollection), expectedExits);
    t.true(model._draw === STAR_MOCK.KEPEC1.draw);
    t.true(model._icao === STAR_MOCK.KEPEC1.icao);
    t.true(model._name === STAR_MOCK.KEPEC1.name);
});

ava('.getWaypointModelsForEntryAndExit() returns early when specified entry is invalid', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const invalidEntry = 'blahblahblah';
    const validExit = 'TNP';
    const result = model.getWaypointModelsForEntryAndExit(invalidEntry, validExit);

    t.true(typeof result === 'undefined');
});

ava('.getWaypointModelsForEntryAndExit() returns early when specified exit is invalid', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const validEntry = '07R';
    const invalidExit = 'blahblahblah';
    const result = model.getWaypointModelsForEntryAndExit(validEntry, invalidExit);

    t.true(typeof result === 'undefined');
});

ava('.getWaypointModelsForEntryAndExit() returns correct waypoints when specified entry/exit are valid', (t) => {
    const model = new ProcedureModel(PROCEDURE_TYPE.SID, SID_MOCK.BOACH6);
    const validEntry = '07R';
    const validExit = 'TNP';
    const result = model.getWaypointModelsForEntryAndExit(validEntry, validExit);
    const resultingWaypointNames = _map(result, (waypointModel) => waypointModel._name);
    const expectedWaypointNames = ['JESJI', 'BAKRR', 'MINEY', 'HITME', 'BOACH', 'ZELMA', 'JOTNU', 'TNP'];

    t.true(_isArray(result));
    t.true(result.length === 8);
    t.deepEqual(resultingWaypointNames, expectedWaypointNames);
});
