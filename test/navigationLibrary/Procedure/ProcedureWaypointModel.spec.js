import ava from 'ava';
import ProcedureWaypointModel from '../../../src/assets/scripts/client/navigationLibrary/Procedure/ProcedureWaypointModel';
// FIXME: Better way to do this?
// here we import `fixCollectionFixture` to act as a stub for FixCollection
// eslint-disable-next-line no-unused-vars
import { fixCollectionFixture } from '../../fixtures/navigationLibraryFixtures';

ava('throws when instantiated without parameters', (t) => {
    t.throws(() => new ProcedureWaypointModel());
});

ava('throws when instantiated with string containing unknown fix', (t) => {
    t.throws(() => new ProcedureWaypointModel('INVALIDFIXNAME'));
});

ava('throws when instantiated with array containing unknown fix', (t) => {
    t.throws(() => new ProcedureWaypointModel(['INVALIDFIXNAME', 'A100']));
});

ava('does not throw when instantiated with string containing known fix', (t) => {
    t.notThrows(() => new ProcedureWaypointModel('BOACH'));
});

ava('does not throw when instantiated with array containing known fix', (t) => {
    t.notThrows(() => new ProcedureWaypointModel(['BOACH', 'A100-']));
});

ava('instantiates correctly when given a fly-over fix', (t) => {
    const model = new ProcedureWaypointModel('^BOACH');

    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === -1);
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === -1);
    t.true(model._isFlyOverWaypoint === true);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a hold fix', (t) => {
    const model = new ProcedureWaypointModel('@BOACH');

    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === -1);
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === -1);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === true);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a vector fix', (t) => {
    const model = new ProcedureWaypointModel('#320');

    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === -1);
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === -1);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === true);
    t.true(model._name === '320');
    t.true(model._positionModel === null);
});

ava('instantiates correctly when given an unrestricted fix', (t) => {
    const model = new ProcedureWaypointModel('BOACH');

    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === -1);
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === -1);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (simple altitude)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100']);

    t.true(model.altitudeMaximum === 10000);
    t.true(model.altitudeMinimum === 10000);
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === -1);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (minimum altitude)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100+']);

    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === 10000);
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === -1);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (maximum altitude)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100-']);

    t.true(model.altitudeMaximum === 10000);
    t.true(model.altitudeMinimum === -1);
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === -1);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (ranged altitude)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A80+|A120-']);

    t.true(model.altitudeMaximum === 12000);
    t.true(model.altitudeMinimum === 8000);
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === -1);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (simple speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'S210']);

    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === -1);
    t.true(model.speedMaximum === 210);
    t.true(model.speedMinimum === 210);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (minimum speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'S210+']);

    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === -1);
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === 210);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (maximum speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'S210-']);

    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === -1);
    t.true(model.speedMaximum === 210);
    t.true(model.speedMinimum === -1);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (ranged speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'S200+|S220-']);

    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === -1);
    t.true(model.speedMaximum === 220);
    t.true(model.speedMinimum === 200);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (simple altitude and simple speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100|S210']);

    t.true(model.altitudeMaximum === 10000);
    t.true(model.altitudeMinimum === 10000);
    t.true(model.speedMaximum === 210);
    t.true(model.speedMinimum === 210);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (simple altitude and minimum speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100|S210+']);

    t.true(model.altitudeMaximum === 10000);
    t.true(model.altitudeMinimum === 10000);
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === 210);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (simple altitude and maximum speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100|S210-']);

    t.true(model.altitudeMaximum === 10000);
    t.true(model.altitudeMinimum === 10000);
    t.true(model.speedMaximum === 210);
    t.true(model.speedMinimum === -1);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (simple altitude and ranged speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100|S200+|S220-']);

    t.true(model.altitudeMaximum === 10000);
    t.true(model.altitudeMinimum === 10000);
    t.true(model.speedMaximum === 220);
    t.true(model.speedMinimum === 200);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (minimum altitude and simple speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100+|S210']);

    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === 10000);
    t.true(model.speedMaximum === 210);
    t.true(model.speedMinimum === 210);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (minimum altitude and minimum speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100+|S210+']);

    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === 10000);
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === 210);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (minimum altitude and maximum speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100+|S210-']);

    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === 10000);
    t.true(model.speedMaximum === 210);
    t.true(model.speedMinimum === -1);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (minimum altitude and ranged speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100+|S200+|S220-']);

    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === 10000);
    t.true(model.speedMaximum === 220);
    t.true(model.speedMinimum === 200);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (maximum altitude and simple speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100-|S210']);

    t.true(model.altitudeMaximum === 10000);
    t.true(model.altitudeMinimum === -1);
    t.true(model.speedMaximum === 210);
    t.true(model.speedMinimum === 210);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (maximum altitude and minimum speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100-|S210+']);

    t.true(model.altitudeMaximum === 10000);
    t.true(model.altitudeMinimum === -1);
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === 210);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (maximum altitude and maximum speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100-|S210-']);

    t.true(model.altitudeMaximum === 10000);
    t.true(model.altitudeMinimum === -1);
    t.true(model.speedMaximum === 210);
    t.true(model.speedMinimum === -1);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (maximum altitude and ranged speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A100-|S200+|S220-']);

    t.true(model.altitudeMaximum === 10000);
    t.true(model.altitudeMinimum === -1);
    t.true(model.speedMaximum === 220);
    t.true(model.speedMinimum === 200);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (ranged altitude and simple speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A80+|A120-|S210']);

    t.true(model.altitudeMaximum === 12000);
    t.true(model.altitudeMinimum === 8000);
    t.true(model.speedMaximum === 210);
    t.true(model.speedMinimum === 210);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (ranged altitude and minimum speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A80+|A120-|S210+']);

    t.true(model.altitudeMaximum === 12000);
    t.true(model.altitudeMinimum === 8000);
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === 210);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (ranged altitude and maximum speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A80+|A120-|S210-']);

    t.true(model.altitudeMaximum === 12000);
    t.true(model.altitudeMinimum === 8000);
    t.true(model.speedMaximum === 210);
    t.true(model.speedMinimum === -1);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});

ava('instantiates correctly when given a restricted fix (ranged altitude and ranged speed)', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A80+|A120-|S200+|S220-']);

    t.true(model.altitudeMaximum === 12000);
    t.true(model.altitudeMinimum === 8000);
    t.true(model.speedMaximum === 220);
    t.true(model.speedMinimum === 200);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === false);
    t.true(model._name === 'BOACH');
    t.deepEqual(model._positionModel.gps, [35.6782610435946, -115.29470074200118]);
});
