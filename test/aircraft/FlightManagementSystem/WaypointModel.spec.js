import ava from 'ava';
import sinon from 'sinon';
import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';
import StaticPositionModel from '../../../src/assets/scripts/client/base/StaticPositionModel';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';
import { INVALID_NUMBER } from '../../../src/assets/scripts/client/constants/globalConstants';
import { DEFAULT_HOLD_PARAMETERS } from '../../../src/assets/scripts/client/constants/waypointConstants';

let sandbox;

ava.beforeEach(() => {
    sandbox = sinon.createSandbox();
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    sandbox.restore();
    resetNavigationLibraryFixture();
});

ava('throws when instantiated without parameters', (t) => {
    t.throws(() => new WaypointModel());
});

ava('throws when instantiated with string containing unknown fix', (t) => {
    t.throws(() => new WaypointModel('INVALIDFIXNAME'));
});

ava('throws when instantiated with array containing unknown fix', (t) => {
    t.throws(() => new WaypointModel(['INVALIDFIXNAME', 'A100']));
});

ava('throws when instantiated with an array containing an unrestricted fix', (t) => {
    t.throws(() => new WaypointModel(['BOACH']));
});

ava('throws when instantiated with an array containing improperly formatted restrictions', (t) => {
    t.throws(() => new WaypointModel(['BOACH', '100A']));
});

ava('throws when instantiated with an array containing improperly formatted altitude restrictions', (t) => {
    t.throws(() => new WaypointModel(['BOACH', 'A1000']));
    t.throws(() => new WaypointModel(['BOACH', 'A150@']));
});

ava('throws when instantiated with an array containing improperly formatted speed restrictions', (t) => {
    t.throws(() => new WaypointModel(['BOACH', 'S50+']));
    t.throws(() => new WaypointModel(['BOACH', 'S1000+']));
    t.throws(() => new WaypointModel(['BOACH', 'S150@']));
});

ava('does not throw when instantiated with string containing known fix', (t) => {
    t.notThrows(() => new WaypointModel('BOACH'));
});

ava('does not throw when instantiated with array containing known fix', (t) => {
    t.notThrows(() => new WaypointModel(['BOACH', 'A100-']));
});

ava('instantiates correctly when given a fly-over fix', (t) => {
    const model = new WaypointModel('^BOACH');

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
    const model = new WaypointModel('@BOACH');

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
    const model = new WaypointModel('#320');

    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === -1);
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === -1);
    t.true(model._isFlyOverWaypoint === false);
    t.true(model._isHoldWaypoint === false);
    t.true(model._isVectorWaypoint === true);
    t.true(model._name === '#320');
    t.true(!model._positionModel);
});

ava('instantiates correctly when given an unrestricted fix', (t) => {
    const model = new WaypointModel('BOACH');

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
    const model = new WaypointModel(['BOACH', 'A100']);

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
    const model = new WaypointModel(['BOACH', 'A100+']);

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
    const model = new WaypointModel(['BOACH', 'A100-']);

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
    const model = new WaypointModel(['BOACH', 'A80+|A120-']);

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
    const model = new WaypointModel(['BOACH', 'S210']);

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
    const model = new WaypointModel(['BOACH', 'S210+']);

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
    const model = new WaypointModel(['BOACH', 'S210-']);

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
    const model = new WaypointModel(['BOACH', 'S200+|S220-']);

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
    const model = new WaypointModel(['BOACH', 'A100|S210']);

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
    const model = new WaypointModel(['BOACH', 'A100|S210+']);

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
    const model = new WaypointModel(['BOACH', 'A100|S210-']);

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
    const model = new WaypointModel(['BOACH', 'A100|S200+|S220-']);

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
    const model = new WaypointModel(['BOACH', 'A100+|S210']);

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
    const model = new WaypointModel(['BOACH', 'A100+|S210+']);

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
    const model = new WaypointModel(['BOACH', 'A100+|S210-']);

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
    const model = new WaypointModel(['BOACH', 'A100+|S200+|S220-']);

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
    const model = new WaypointModel(['BOACH', 'A100-|S210']);

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
    const model = new WaypointModel(['BOACH', 'A100-|S210+']);

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
    const model = new WaypointModel(['BOACH', 'A100-|S210-']);

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
    const model = new WaypointModel(['BOACH', 'A100-|S200+|S220-']);

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
    const model = new WaypointModel(['BOACH', 'A80+|A120-|S210']);

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
    const model = new WaypointModel(['BOACH', 'A80+|A120-|S210+']);

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
    const model = new WaypointModel(['BOACH', 'A80+|A120-|S210-']);

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
    const model = new WaypointModel(['BOACH', 'A80+|A120-|S200+|S220-']);

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

ava('#hasAltitudeRestriction returns true when a minimum or maximium altitude restriction exists', (t) => {
    const modelWithSimpleRestriction = new WaypointModel(['BOACH', 'A100']);
    const modelWithMaximumRestriction = new WaypointModel(['BOACH', 'A120-']);
    const modelWithMininmumRestriction = new WaypointModel(['BOACH', 'A80+']);
    const modelWithRangedRestriction = new WaypointModel(['BOACH', 'A80+|A80-']);

    t.true(modelWithSimpleRestriction.hasAltitudeRestriction);
    t.true(modelWithMaximumRestriction.hasAltitudeRestriction);
    t.true(modelWithMininmumRestriction.hasAltitudeRestriction);
    t.true(modelWithRangedRestriction.hasAltitudeRestriction);
});

ava('#hasAltitudeRestriction returns false when neither minimum nor maximum altitude restriction exists', (t) => {
    const model = new WaypointModel('BOACH');

    t.false(model.hasAltitudeRestriction);
});

ava('#hasRestriction returns true when any altitude or speed restriction exists', (t) => {
    const modelWithAltitudeRestriction = new WaypointModel(['BOACH', 'A100']);
    const modelWithSpeedRestriction = new WaypointModel(['BOACH', 'S250']);

    t.true(modelWithAltitudeRestriction.hasRestriction);
    t.true(modelWithSpeedRestriction.hasRestriction);
});

ava('#hasRestriction returns false when neither altitude nor speed restriction exists', (t) => {
    const model = new WaypointModel('BOACH');

    t.false(model.hasRestriction);
});

ava('#hasSpeedRestriction returns true when a minimum or maximum speed restriction exists', (t) => {
    const modelWithSimpleRestriction = new WaypointModel(['BOACH', 'S210']);
    const modelWithMaximumRestriction = new WaypointModel(['BOACH', 'S220-']);
    const modelWithMininmumRestriction = new WaypointModel(['BOACH', 'S200+']);
    const modelWithRangedRestriction = new WaypointModel(['BOACH', 'S200+|S220-']);

    t.true(modelWithSimpleRestriction.hasSpeedRestriction);
    t.true(modelWithMaximumRestriction.hasSpeedRestriction);
    t.true(modelWithMininmumRestriction.hasSpeedRestriction);
    t.true(modelWithRangedRestriction.hasSpeedRestriction);
});


ava('#hasSpeedRestriction returns true when a hold with a speed restriction is set', (t) => {
    const modelWithHold = new WaypointModel('@BOACH');
    const holdParametersMock = {
        inboundHeading: 3.14,
        legLength: '2min',
        speedMaximum: 220,
        turnDirection: 'left'
    };

    modelWithHold.setHoldParameters(
        holdParametersMock
    );

    t.true(modelWithHold.hasSpeedRestriction);
});

ava('#hasSpeedRestriction returns false when neither a minimum nor maximum speed restriction exists', (t) => {
    const model = new WaypointModel('BOACH');

    t.false(model.hasSpeedRestriction);
});

ava('#holdParameters returns undefined when #_isHoldWaypoint is false', (t) => {
    const model = new WaypointModel('BOACH');
    const result = model.holdParameters;

    t.true(typeof result === 'undefined');
});

ava('#holdParameters returns object with appropriate contents when #_isHoldWaypoint is true', (t) => {
    const model = new WaypointModel('@BOACH');
    const expectedResult = {
        inboundHeading: undefined,
        legLength: '1min',
        speedMaximum: undefined,
        timer: INVALID_NUMBER,
        turnDirection: 'right'
    };
    const result = model.holdParameters;

    t.deepEqual(result, expectedResult);
});

ava('#isFlyOverWaypoint returns false when #_isFlyOverWaypoint is false', (t) => {
    const model = new WaypointModel('BOACH');
    const result = model.isFlyOverWaypoint;

    t.false(result);
});

ava('#isFlyOverWaypoint returns true when #_isFlyOverWaypoint is true', (t) => {
    const model = new WaypointModel('^BOACH');
    const result = model.isFlyOverWaypoint;

    t.true(result);
});

ava('#isHoldWaypoint returns false when #_isHoldWaypoint is false', (t) => {
    const model = new WaypointModel('BOACH');
    const result = model.isHoldWaypoint;

    t.false(result);
});

ava('#isHoldWaypoint returns true when #_isHoldWaypoint is true', (t) => {
    const model = new WaypointModel('@BOACH');
    const result = model.isHoldWaypoint;

    t.true(result);
});

ava('#isVectorWaypoint returns false when #_isVectorWaypoint is false', (t) => {
    const model = new WaypointModel('BOACH');
    const result = model.isVectorWaypoint;

    t.false(result);
});

ava('#isVectorWaypoint returns true when #_isVectorWaypoint is true', (t) => {
    const model = new WaypointModel('#BOACH');
    const result = model.isVectorWaypoint;

    t.true(result);
});

ava('#name returns value of #_name for fixes with names prefixed with underscore', (t) => {
    const model = new WaypointModel('_NAPSE068');
    const expectedResult = '_NAPSE068';
    const result = model.name;

    t.true(result === expectedResult);
});

ava('#name returns value of #_name for fixes with names not prefixed with underscore', (t) => {
    const model = new WaypointModel('BOACH');
    const expectedResult = 'BOACH';
    const result = model.name;

    t.true(result === expectedResult);
});

ava('#positionModel returns #_positionModel', (t) => {
    const waypointModel = new WaypointModel('BOACH');
    const { positionModel } = waypointModel;
    const expectedResult = [35.6782610435946, -115.29470074200118];
    const result = positionModel.gps;

    t.true(positionModel instanceof StaticPositionModel);
    t.deepEqual(result, expectedResult);
});

ava('#relativePosition returns undefined for vector waypoints', (t) => {
    const waypointModel = new WaypointModel('#320');
    const result = waypointModel.relativePosition;

    t.true(typeof result === 'undefined');
});

ava('#relativePosition returns #_positionModel.relativePosition for non-vector waypoints', (t) => {
    const waypointModel = new WaypointModel('BOACH');
    const expectedResult = [-3.3138243641281715, -46.35714730047791];
    const result = waypointModel.relativePosition;

    t.deepEqual(result, expectedResult);
});

ava('#speedMaximum returns expected value when hold with speed restriction is inactive', (t) => {
    const modelWithHold = new WaypointModel(['BOACH', 'S250-']);
    const holdParametersMock = {
        inboundHeading: 3.14,
        legLength: '2min',
        speedMaximum: 220,
        turnDirection: 'left'
    };

    modelWithHold.setHoldParameters(
        holdParametersMock
    );

    t.is(modelWithHold.speedMaximum, 250);
});

ava('#speedMaximum returns expected value when hold with speed restriction is active', (t) => {
    const modelWithHold = new WaypointModel(['@BOACH', 'S250-']);
    const holdParametersMock = {
        inboundHeading: 3.14,
        legLength: '2min',
        speedMaximum: 220,
        turnDirection: 'left'
    };

    modelWithHold.setHoldParameters(
        holdParametersMock
    );

    t.is(modelWithHold.speedMaximum, holdParametersMock.speedMaximum);
});

ava('.activateHold() sets #_isHoldWaypoint to true', (t) => {
    const waypointModel = new WaypointModel('@BOACH');

    waypointModel._isHoldWaypoint = false;

    const result = waypointModel.activateHold();

    t.true(typeof result === 'undefined');
    t.true(waypointModel._isHoldWaypoint);
});

ava('.calculateBearingToWaypoint() calls ._ensureNonVectorWaypointsForThisAndWaypoint()', (t) => {
    const model = new WaypointModel('BOACH');
    const otherModel = new WaypointModel('FRAWG');
    const ensureNonVectorWaypointsForThisAndWaypointSpy = sinon.spy(model, '_ensureNonVectorWaypointsForThisAndWaypoint');

    model.calculateBearingToWaypoint(otherModel);

    t.true(ensureNonVectorWaypointsForThisAndWaypointSpy.calledWithExactly(otherModel));
});

ava('.calculateBearingToWaypoint() returns correct bearing', (t) => {
    const model = new WaypointModel('BOACH');
    const otherModel = new WaypointModel('FRAWG');
    const expectedResult = 0.5299639748799476;
    const result = model.calculateBearingToWaypoint(otherModel);

    t.true(result === expectedResult);
});

ava('.calculateDistanceToWaypoint() calls ._ensureNonVectorWaypointsForThisAndWaypoint()', (t) => {
    const model = new WaypointModel('BOACH');
    const otherModel = new WaypointModel('FRAWG');
    const ensureNonVectorWaypointsForThisAndWaypointSpy = sinon.spy(model, '_ensureNonVectorWaypointsForThisAndWaypoint');

    model.calculateDistanceToWaypoint(otherModel);

    t.true(ensureNonVectorWaypointsForThisAndWaypointSpy.calledWithExactly(otherModel));
});

ava('.calculateDistanceToWaypoint() returns correct distance', (t) => {
    const model = new WaypointModel('BOACH');
    const otherModel = new WaypointModel('FRAWG');
    const expectedResult = 37.98364876057637;
    const result = model.calculateDistanceToWaypoint(otherModel);

    t.true(result === expectedResult);
});

ava('.deactivateHold() sets #_isHoldWaypoint to false', (t) => {
    const model = new WaypointModel('BOACH');

    model._isHoldWaypoint = true;
    model.deactivateHold();

    t.false(model._isHoldWaypoint);
});

ava('.getDisplayName() returns "[RNAV]" for fixes with names prefixed with underscore', (t) => {
    const model = new WaypointModel('_NAPSE068');
    const expectedResult = '[RNAV]';
    const result = model.getDisplayName();

    t.true(result === expectedResult);
});

ava('.getDisplayName() returns value of #_name for fixes with names not prefixed with underscore', (t) => {
    const model = new WaypointModel('BOACH');
    const expectedResult = 'BOACH';
    const result = model.getDisplayName();

    t.true(result === expectedResult);
});

ava('.getVector() returns undefined if waypoint is not a vector waypoint', (t) => {
    const model = new WaypointModel('BOACH');
    const result = model.getVector();

    t.true(typeof result === 'undefined');
});

ava('.getVector() returns correct heading (in radians) for vector waypoints', (t) => {
    const model = new WaypointModel('#180');
    const expectedResult = Math.PI;
    const result = model.getVector();

    t.true(result === expectedResult);
});

ava('.hasMaximumAltitudeAtOrBelow() returns false when waypoint does not have max restriction at or below specified value', (t) => {
    const waypointWithNoRestrictions = new WaypointModel('BOACH');
    const waypointWithMinAltOnly = new WaypointModel(['BOACH', 'A80+']);
    const waypointWithMaxAltAboveConstraint = new WaypointModel(['BOACH', 'A110-']);
    const constraint = 10000;

    t.false(waypointWithNoRestrictions.hasMaximumAltitudeAtOrBelow(constraint));
    t.false(waypointWithMinAltOnly.hasMaximumAltitudeAtOrBelow(constraint));
    t.false(waypointWithMaxAltAboveConstraint.hasMaximumAltitudeAtOrBelow(constraint));
});

ava('.hasMaximumAltitudeAtOrBelow() returns true when waypoint has max restriction at or below specified value', (t) => {
    const waypointWithMaxAltAtConstraint = new WaypointModel(['BOACH', 'A100-']);
    const waypointWithMaxAltBelowConstraint = new WaypointModel(['BOACH', 'A80-']);
    const constraint = 10000;

    t.true(waypointWithMaxAltAtConstraint.hasMaximumAltitudeAtOrBelow(constraint));
    t.true(waypointWithMaxAltBelowConstraint.hasMaximumAltitudeAtOrBelow(constraint));
});

ava('.hasMinimumAltitudeAtOrAbove() returns false when waypoint does not have min restriction at or above specified value', (t) => {
    const waypointWithNoRestrictions = new WaypointModel('BOACH');
    const waypointWithMaxAltOnly = new WaypointModel(['BOACH', 'A110-']);
    const waypointWithMinAltBelowConstraint = new WaypointModel(['BOACH', 'A80+']);
    const constraint = 10000;

    t.false(waypointWithNoRestrictions.hasMinimumAltitudeAtOrAbove(constraint));
    t.false(waypointWithMaxAltOnly.hasMinimumAltitudeAtOrAbove(constraint));
    t.false(waypointWithMinAltBelowConstraint.hasMinimumAltitudeAtOrAbove(constraint));
});

ava('.hasMinimumAltitudeAtOrAbove() returns true when waypoint has min restriction at or above specified value', (t) => {
    const waypointWithMinAltAtConstraint = new WaypointModel(['BOACH', 'A100+']);
    const waypointWithMinAltAboveConstraint = new WaypointModel(['BOACH', 'A110+']);
    const constraint = 10000;

    t.true(waypointWithMinAltAtConstraint.hasMinimumAltitudeAtOrAbove(constraint));
    t.true(waypointWithMinAltAboveConstraint.hasMinimumAltitudeAtOrAbove(constraint));
});

ava('.setAltitude() calls .setAltitudeMinimum() and .setAltitudeMaximum()', (t) => {
    const model = new WaypointModel('BOACH');
    const altitudeMock = 5000;
    const setAltitudeMinimumStub = sinon.stub(model, 'setAltitudeMinimum');
    const setAltitudeMaximumStub = sinon.stub(model, 'setAltitudeMaximum');
    const result = model.setAltitude(altitudeMock);

    t.true(typeof result === 'undefined');
    t.true(setAltitudeMinimumStub.calledOnce);
    t.true(setAltitudeMaximumStub.calledOnce);
});

ava('.setAltitudeMaximum() returns early if specified altitude is not a number', (t) => {
    const model = new WaypointModel('BOACH');
    const originalAltitudeMaximimValueMock = 7000;
    const nextAltitudeMock = 'chipz';
    model.altitudeMaximum = originalAltitudeMaximimValueMock;
    const result = model.setAltitudeMaximum(nextAltitudeMock);

    t.true(typeof result === 'undefined');
    t.true(model.altitudeMaximum === originalAltitudeMaximimValueMock);
});

ava('.setAltitudeMaximum() returns early if specified altitude is an "unreasonable" value', (t) => {
    const model = new WaypointModel('BOACH');
    const originalAltitudeMaximimValueMock = 7000;
    const nextAltitudeMock = 99999;
    model.altitudeMaximum = originalAltitudeMaximimValueMock;
    const result = model.setAltitudeMaximum(nextAltitudeMock);

    t.true(typeof result === 'undefined');
    t.true(model.altitudeMaximum === originalAltitudeMaximimValueMock);
});

ava('.setAltitudeMaximum() sets #altitudeMaximum to the specified altitude', (t) => {
    const model = new WaypointModel('BOACH');
    const originalAltitudeMaximimValueMock = 7000;
    const nextAltitudeMock = 5500;
    model.altitudeMaximum = originalAltitudeMaximimValueMock;
    const result = model.setAltitudeMaximum(nextAltitudeMock);

    t.true(typeof result === 'undefined');
    t.true(model.altitudeMaximum === nextAltitudeMock);
});

ava('.setAltitudeMinimum() returns early if specified altitude is not a number', (t) => {
    const model = new WaypointModel('BOACH');
    const originalAltitudeMinimimValueMock = 7000;
    const nextAltitudeMock = 'chipz';
    model.altitudeMinimum = originalAltitudeMinimimValueMock;
    const result = model.setAltitudeMinimum(nextAltitudeMock);

    t.true(typeof result === 'undefined');
    t.true(model.altitudeMinimum === originalAltitudeMinimimValueMock);
});

ava('.setAltitudeMinimum() returns early if specified altitude is an "unreasonable" value', (t) => {
    const model = new WaypointModel('BOACH');
    const originalAltitudeMinimimValueMock = 7000;
    const nextAltitudeMock = 99999;
    model.altitudeMinimum = originalAltitudeMinimimValueMock;
    const result = model.setAltitudeMinimum(nextAltitudeMock);

    t.true(typeof result === 'undefined');
    t.true(model.altitudeMinimum === originalAltitudeMinimimValueMock);
});

ava('.setAltitudeMinimum() sets #altitudeMinimum to the specified altitude', (t) => {
    const model = new WaypointModel('BOACH');
    const originalAltitudeMinimimValueMock = 7000;
    const nextAltitudeMock = 5500;
    model.altitudeMinimum = originalAltitudeMinimimValueMock;
    const result = model.setAltitudeMinimum(nextAltitudeMock);

    t.true(typeof result === 'undefined');
    t.true(model.altitudeMinimum === nextAltitudeMock);
});

ava('.setHoldParameters() sets #_holdParameters to default values when no argument is provided', (t) => {
    const model = new WaypointModel('BOACH');

    model.setHoldParameters();

    t.deepEqual(model._holdParameters, DEFAULT_HOLD_PARAMETERS);
});

ava('.setHoldParameters() sets #_holdParameters according to provided parameters', (t) => {
    const model = new WaypointModel('BOACH');
    const holdParametersMock = {
        inboundHeading: 3.14,
        legLength: '2min',
        speedMaximum: 220,
        turnDirection: 'left'
    };
    const expectedResult = {
        inboundHeading: 3.14,
        legLength: '2min',
        speedMaximum: 220,
        timer: -1,
        turnDirection: 'left'
    };

    const result = model.setHoldParameters(holdParametersMock);

    t.deepEqual(result, expectedResult);
    t.deepEqual(model._holdParameters, expectedResult);
});

ava('.resetHoldTimer() sets #_holdParameters.timer back to the default value', (t) => {
    const model = new WaypointModel('BOACH');

    model._holdParameters.timer = 515;

    const result = model.resetHoldTimer();

    t.true(typeof result === 'undefined');
    t.true(model._holdParameters.timer === DEFAULT_HOLD_PARAMETERS.timer);
});

ava('.setHoldParametersAndActivateHold() calls .setHoldParameters() and .activateHold()', (t) => {
    const model = new WaypointModel('BOACH');
    const setHoldParametersSpy = sinon.spy(model, 'setHoldParameters');
    const activateHoldSpy = sinon.spy(model, 'activateHold');
    const holdParametersMock = {
        inboundHeading: 3.14,
        legLength: '2min',
        turnDirection: 'left'
    };
    const result = model.setHoldParametersAndActivateHold(holdParametersMock);

    t.not(typeof result, 'undefined');
    t.true(setHoldParametersSpy.calledWith(holdParametersMock));
    t.true(activateHoldSpy.calledWithExactly());
});

ava('.setHoldTimer() throws when specified timer value is not a number', (t) => {
    const model = new WaypointModel('BOACH');

    t.throws(() => model.setHoldTimer());
    t.throws(() => model.setHoldTimer(''));
    t.throws(() => model.setHoldTimer([]));
    t.throws(() => model.setHoldTimer({}));
});

ava('.setHoldTimer() sets #_holdParameters.timer to the specified value', (t) => {
    const model = new WaypointModel('BOACH');
    const timerValueMock = 881.1234;
    const result = model.setHoldTimer(timerValueMock);

    t.true(typeof result === 'undefined');
    t.true(model._holdParameters.timer === timerValueMock);
});

ava('._applyAltitudeRestriction() sets #altitudeMinimum to specified value (x100) when restriction has "+" character', (t) => {
    const model = new WaypointModel('BOACH');
    const restrictionMock = 'A65+';
    const result = model._applyAltitudeRestriction(restrictionMock);

    t.true(typeof result === 'undefined');
    t.true(model.altitudeMaximum === -1);
    t.true(model.altitudeMinimum === 6500);
});

ava('._applyAltitudeRestriction() sets #altitudeMaximum to specified value (x100) when restriction has "-" character', (t) => {
    const model = new WaypointModel('BOACH');
    const restrictionMock = 'A65-';
    const result = model._applyAltitudeRestriction(restrictionMock);

    t.true(typeof result === 'undefined');
    t.true(model.altitudeMaximum === 6500);
    t.true(model.altitudeMinimum === -1);
});

ava('._applyAltitudeRestriction() sets #altitudeMinimum and #altitudeMaximum to specified value (x100) when restriction has neither "+" or "-" characters', (t) => {
    const model = new WaypointModel('BOACH');
    const restrictionMock = 'A65';
    const result = model._applyAltitudeRestriction(restrictionMock);

    t.true(typeof result === 'undefined');
    t.true(model.altitudeMaximum === 6500);
    t.true(model.altitudeMinimum === 6500);
});

ava('._applyRestrictions() throws when an invalid restriction-type-qualifier is used to prefix the value', (t) => {
    const model = new WaypointModel('BOACH');

    t.throws(() => model._applyRestrictions('Y80'));
    t.throws(() => model._applyRestrictions('A120|Y80'));
});

ava('._applyRestrictions() returns early when specified restriction is an empty string', (t) => {
    const model = new WaypointModel('BOACH');
    const applyAltitudeRestrictionSpy = sinon.spy(model, '_applyAltitudeRestriction');
    const applySpeedRestrictionSpy = sinon.spy(model, '_applySpeedRestriction');
    const result = model._applyRestrictions('');

    t.true(typeof result === 'undefined');
    t.true(applyAltitudeRestrictionSpy.notCalled);
    t.true(applySpeedRestrictionSpy.notCalled);
});

ava('._applyRestrictions() calls ._applyAltitudeRestriction() and ._applySpeedRestriction() appropriately', (t) => {
    const model = new WaypointModel('BOACH');
    const applyAltitudeRestrictionSpy = sinon.spy(model, '_applyAltitudeRestriction');
    const applySpeedRestrictionSpy = sinon.spy(model, '_applySpeedRestriction');
    const result = model._applyRestrictions('A125|S210');

    t.true(typeof result === 'undefined');
    t.true(applyAltitudeRestrictionSpy.calledWithExactly('A125'));
    t.true(applySpeedRestrictionSpy.calledWithExactly('S210'));
});

ava('._applySpeedRestriction() sets #speedMinimum to specified value when restriction has "+" character', (t) => {
    const model = new WaypointModel('BOACH');
    const restrictionMock = 'S210+';
    const result = model._applySpeedRestriction(restrictionMock);

    t.true(typeof result === 'undefined');
    t.true(model.speedMaximum === -1);
    t.true(model.speedMinimum === 210);
});

ava('._applySpeedRestriction() sets #speedMaximum to specified value when restriction has "-" character', (t) => {
    const model = new WaypointModel('BOACH');
    const restrictionMock = 'S210-';
    const result = model._applySpeedRestriction(restrictionMock);

    t.true(typeof result === 'undefined');
    t.true(model.speedMaximum === 210);
    t.true(model.speedMinimum === -1);
});

ava('._applySpeedRestriction() sets #speedMinimum and #speedMaximum to specified value when restriction has neither "+" or "-" characters', (t) => {
    const model = new WaypointModel('BOACH');
    const restrictionMock = 'S210';
    const result = model._applySpeedRestriction(restrictionMock);

    t.true(typeof result === 'undefined');
    t.true(model.speedMaximum === 210);
    t.true(model.speedMinimum === 210);
});

ava('._ensureNonVectorWaypointsForThisAndWaypoint() throws if parameter is not a WaypointModel', (t) => {
    const model = new WaypointModel('BOACH');
    const nonWaypoint = 'BOACH';

    t.throws(() => model._ensureNonVectorWaypointsForThisAndWaypoint(nonWaypoint));
});

ava('._ensureNonVectorWaypointsForThisAndWaypoint() throws if this is a vector waypoint', (t) => {
    const model = new WaypointModel('#320');
    const otherModel = new WaypointModel('BOACH');

    t.throws(() => model._ensureNonVectorWaypointsForThisAndWaypoint(otherModel));
});

ava('._ensureNonVectorWaypointsForThisAndWaypoint() throws if parameter is a vector waypoint', (t) => {
    const model = new WaypointModel('BOACH');
    const otherModel = new WaypointModel('#320');

    t.throws(() => model._ensureNonVectorWaypointsForThisAndWaypoint(otherModel));
});

ava('._ensureNonVectorWaypointsForThisAndWaypoint() does not throw when both are valid, non-vector waypoints', (t) => {
    const model = new WaypointModel('BOACH');
    const otherModel = new WaypointModel('FRAWG');

    t.notThrows(() => model._ensureNonVectorWaypointsForThisAndWaypoint(otherModel));
});

ava('._initializePosition() returns early when this is a vector waypoint', (t) => {
    const model = new WaypointModel('#320');
    const result = model._initializePosition();

    t.true(typeof result === 'undefined');
    t.true(!model._positionModel);
});

ava('._initializePosition() throws when #_name does not have a corresponding fix definition in the FixCollection', (t) => {
    const model = new WaypointModel('BOACH');

    model._name = 'nonsense';

    t.throws(() => model._initializePosition());
});

ava('._initializePosition() sets #_positionModel to the position corresponding with the #_name waypoint', (t) => {
    const model = new WaypointModel('BIKKR');

    model._name = 'BOACH';

    const result = model._initializePosition();
    const expectedGpsCoordinates = [35.67826104359460, -115.29470074200118];
    const resultingGpsCoordinates = model.positionModel.gps;

    t.true(typeof result === 'undefined');
    t.deepEqual(resultingGpsCoordinates, expectedGpsCoordinates);
});
