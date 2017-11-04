import ava from 'ava';
import ProcedureWaypointModel from '../../../src/assets/scripts/client/navigationLibrary/Procedure/ProcedureWaypointModel';
import StaticPositionModel from '../../../src/assets/scripts/client/base/StaticPositionModel';
import NavigationLibrary from '../../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../../airport/_mocks/airportJsonMock';
import { INVALID_NUMBER } from '../../../src/assets/scripts/client/constants/globalConstants';

let navigationLibrary;

ava.beforeEach(() => {
    navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
});

ava.afterEach(() => {
    navigationLibrary.reset();
});

ava('throws when instantiated without parameters', (t) => {
    t.throws(() => new ProcedureWaypointModel());
});

ava('throws when instantiated with string containing unknown fix', (t) => {
    t.throws(() => new ProcedureWaypointModel('INVALIDFIXNAME'));
});

ava('throws when instantiated with array containing unknown fix', (t) => {
    t.throws(() => new ProcedureWaypointModel(['INVALIDFIXNAME', 'A100']));
});

ava('throws when instantiated with an array containing an unrestricted fix', (t) => {
    t.throws(() => new ProcedureWaypointModel(['BOACH']));
});

ava('throws when instantiated with an array containing improperly formatted restrictions', (t) => {
    t.throws(() => new ProcedureWaypointModel(['BOACH', '100A']));
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
    t.true(model._name === '#320');
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

ava('#name returns fix name without underscore for fixes with names prefixed with underscore', (t) => {
    const model = new ProcedureWaypointModel('_NAPSE068');
    const expectedResult = 'RNAV';
    const result = model.name;

    t.true(result === expectedResult);
});

ava('#name returns value of #_name for fixes with names not prefixed with underscore', (t) => {
    const model = new ProcedureWaypointModel('BOACH');
    const expectedResult = 'BOACH';
    const result = model.name;

    t.true(result === expectedResult);
});

ava('#hasAltitudeRestriction returns true when a minimum or maximium altitude restriction exists', (t) => {
    const modelWithSimpleRestriction = new ProcedureWaypointModel(['BOACH', 'A100']);
    const modelWithMaximumRestriction = new ProcedureWaypointModel(['BOACH', 'A120-']);
    const modelWithMininmumRestriction = new ProcedureWaypointModel(['BOACH', 'A80+']);
    const modelWithRangedRestriction = new ProcedureWaypointModel(['BOACH', 'A80+|A80-']);

    t.true(modelWithSimpleRestriction.hasAltitudeRestriction);
    t.true(modelWithMaximumRestriction.hasAltitudeRestriction);
    t.true(modelWithMininmumRestriction.hasAltitudeRestriction);
    t.true(modelWithRangedRestriction.hasAltitudeRestriction);
});

ava('#hasAltitudeRestriction returns false when neither minimum nor maximum altitude restriction exists', (t) => {
    const model = new ProcedureWaypointModel('BOACH');

    t.false(model.hasAltitudeRestriction);
});

ava('#hasRestriction returns true when any altitude or speed restriction exists', (t) => {
    const modelWithAltitudeRestriction = new ProcedureWaypointModel(['BOACH', 'A100']);
    const modelWithSpeedRestriction = new ProcedureWaypointModel(['BOACH', 'S250']);

    t.true(modelWithAltitudeRestriction.hasRestriction);
    t.true(modelWithSpeedRestriction.hasRestriction);
});

ava('#hasRestriction returns false when neither altitude nor speed restriction exists', (t) => {
    const model = new ProcedureWaypointModel('BOACH');

    t.false(model.hasRestriction);
});

ava('#hasSpeedRestriction returns true when a minimum or maximum speed restriction exists', (t) => {
    const modelWithSimpleRestriction = new ProcedureWaypointModel(['BOACH', 'S210']);
    const modelWithMaximumRestriction = new ProcedureWaypointModel(['BOACH', 'S220-']);
    const modelWithMininmumRestriction = new ProcedureWaypointModel(['BOACH', 'S200+']);
    const modelWithRangedRestriction = new ProcedureWaypointModel(['BOACH', 'S200+|S220-']);

    t.true(modelWithSimpleRestriction.hasSpeedRestriction);
    t.true(modelWithMaximumRestriction.hasSpeedRestriction);
    t.true(modelWithMininmumRestriction.hasSpeedRestriction);
    t.true(modelWithRangedRestriction.hasSpeedRestriction);
});

ava('#hasSpeedRestriction returns false when neither a minimum nor maximum speed restriction exists', (t) => {
    const model = new ProcedureWaypointModel('BOACH');

    t.false(model.hasSpeedRestriction);
});

ava('#holdParameters returns undefined when #_isHoldWaypoint is false', (t) => {
    const model = new ProcedureWaypointModel('BOACH');
    const result = model.holdParameters;

    t.true(typeof result === 'undefined');
});

ava('#holdParameters returns object with appropriate contents when #_isHoldWaypoint is true', (t) => {
    const model = new ProcedureWaypointModel('@BOACH');
    const expectedResult = {
        inboundHeading: undefined,
        legLength: 1,
        timer: INVALID_NUMBER,
        turnDirection: 'right'
    };
    const result = model.holdParameters;

    t.deepEqual(result, expectedResult);
});

ava('#positionModel returns #_positionModel', (t) => {
    const procedureWaypointModel = new ProcedureWaypointModel('BOACH');
    const positionModel = procedureWaypointModel.positionModel;
    const expectedResult = [35.6782610435946, -115.29470074200118];
    const result = positionModel.gps;

    t.true(positionModel instanceof StaticPositionModel);
    t.deepEqual(result, expectedResult);
});

ava('#relativePosition returns #_positionModel.relativePosition', (t) => {
    const procedureWaypointModel = new ProcedureWaypointModel('BOACH');
    const expectedResult = [-3.3138243641281715, -46.35714730047791];
    const result = procedureWaypointModel.relativePosition;

    t.deepEqual(result, expectedResult);
});

ava('#isFlyOverWaypoint returns false when #_isFlyOverWaypoint is false', (t) => {
    const model = new ProcedureWaypointModel('BOACH');
    const result = model.isFlyOverWaypoint;

    t.false(result);
});

ava('#isFlyOverWaypoint returns true when #_isFlyOverWaypoint is true', (t) => {
    const model = new ProcedureWaypointModel('^BOACH');
    const result = model.isFlyOverWaypoint;

    t.true(result);
});

ava('#isHoldWaypoint returns false when #_isHoldWaypoint is false', (t) => {
    const model = new ProcedureWaypointModel('BOACH');
    const result = model.isHoldWaypoint;

    t.false(result);
});

ava('#isHoldWaypoint returns true when #_isHoldWaypoint is true', (t) => {
    const model = new ProcedureWaypointModel('@BOACH');
    const result = model.isHoldWaypoint;

    t.true(result);
});

ava('#isVectorWaypoint returns false when #_isVectorWaypoint is false', (t) => {
    const model = new ProcedureWaypointModel('BOACH');
    const result = model.isVectorWaypoint;

    t.false(result);
});

ava('#isVectorWaypoint returns true when #_isVectorWaypoint is true', (t) => {
    const model = new ProcedureWaypointModel('#BOACH');
    const result = model.isVectorWaypoint;

    t.true(result);
});

ava('.getVector() returns undefined if waypoint is not a vector waypoint', (t) => {
    const model = new ProcedureWaypointModel('BOACH');
    const result = model.getVector();

    t.true(typeof result === 'undefined');
});

ava('.getVector() returns correct heading (in radians) for vector waypoints', (t) => {
    const model = new ProcedureWaypointModel('#180');
    const expectedResult = Math.PI;
    const result = model.getVector();

    t.true(result === expectedResult);
});

ava('.hasMaximumAltitudeBelow() returns false when waypoint does not have max restriction below specified value', (t) => {
    const waypointWithNoRestrictions = new ProcedureWaypointModel('BOACH');
    const waypointWithMinAltOnly = new ProcedureWaypointModel(['BOACH', 'A80+']);
    const waypointWithMaxAltAboveConstraint = new ProcedureWaypointModel(['BOACH', 'A110-']);
    const waypointWithMaxAltAtConstraint = new ProcedureWaypointModel(['BOACH', 'A100-']);
    const constraint = 10000;

    t.false(waypointWithNoRestrictions.hasMaximumAltitudeBelow(constraint));
    t.false(waypointWithMinAltOnly.hasMaximumAltitudeBelow(constraint));
    t.false(waypointWithMaxAltAboveConstraint.hasMaximumAltitudeBelow(constraint));
    t.false(waypointWithMaxAltAtConstraint.hasMaximumAltitudeBelow(constraint));
});

ava('.hasMaximumAltitudeBelow() returns true when waypoint has max restriction below specified value', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A80-']);
    const constraint = 10000;

    t.true(model.hasMaximumAltitudeBelow(constraint));
});

ava('.hasMinimumAltitudeAbove() returns false when waypoint does not have min restriction above specified value', (t) => {
    const waypointWithNoRestrictions = new ProcedureWaypointModel('BOACH');
    const waypointWithMaxAltOnly = new ProcedureWaypointModel(['BOACH', 'A110-']);
    const waypointWithMinAltBelowConstraint = new ProcedureWaypointModel(['BOACH', 'A80+']);
    const waypointWithMinAltAtConstraint = new ProcedureWaypointModel(['BOACH', 'A100+']);
    const constraint = 10000;

    t.false(waypointWithNoRestrictions.hasMinimumAltitudeAbove(constraint));
    t.false(waypointWithMaxAltOnly.hasMinimumAltitudeAbove(constraint));
    t.false(waypointWithMinAltBelowConstraint.hasMinimumAltitudeAbove(constraint));
    t.false(waypointWithMinAltAtConstraint.hasMinimumAltitudeAbove(constraint));
});

ava('.hasMinimumAltitudeAbove() returns true when waypoint has min restriction above specified value', (t) => {
    const model = new ProcedureWaypointModel(['BOACH', 'A110+']);
    const constraint = 10000;

    t.true(model.hasMinimumAltitudeAbove(constraint));
});
