import ava from 'ava';
import sinon from 'sinon';
import GameController from '../../src/assets/scripts/client/game/GameController';
import SpawnScheduler from '../../src/assets/scripts/client/trafficGenerator/SpawnScheduler';
import SpawnPatternCollection from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternCollection';
import {
    createAirportControllerFixture,
    resetAirportControllerFixture
} from '../fixtures/airportFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../fixtures/navigationLibraryFixtures';
import { AIRPORT_JSON_FOR_SPAWN_MOCK } from './_mocks/spawnPatternMocks';
import { INVALID_NUMBER } from '../../src/assets/scripts/client/constants/globalConstants';

let aircraftControllerStub;
let spawnPatternCollectionFixture;
let sandbox; // using the sinon sandbox ensures stubs are restored after each test

ava.beforeEach(() => {
    createNavigationLibraryFixture();
    createAirportControllerFixture();
    SpawnPatternCollection.init(AIRPORT_JSON_FOR_SPAWN_MOCK);

    sandbox = sinon.createSandbox();
    aircraftControllerStub = {
        createAircraftWithSpawnPatternModel: sinon.stub(),
        createPreSpawnAircraftWithSpawnPatternModel: sinon.stub()
    };
});

ava.afterEach.always(() => {
    resetNavigationLibraryFixture();
    resetAirportControllerFixture();
    sandbox.restore();

    spawnPatternCollectionFixture = null;
    aircraftControllerStub = null;
});

ava('throws when passed invalid parameters', (t) => {
    t.throws(() => SpawnScheduler.init());
    t.throws(() => SpawnScheduler.init(spawnPatternCollectionFixture));
    t.throws(() => SpawnScheduler.init({}, aircraftControllerStub));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => SpawnScheduler.init(aircraftControllerStub));
});

ava('.createSchedulesFromList() calls .createNextSchedule() for each SpawnPatternModel in the collection', (t) => {
    const createSchedulesFromListSpy = sandbox.spy(SpawnScheduler, 'createSchedulesFromList');
    const createNextScheduleSpy = sandbox.spy(SpawnScheduler, 'createNextSchedule');
    const expectedCallCount = SpawnPatternCollection.spawnPatternModels.length;

    SpawnScheduler.init(aircraftControllerStub);

    t.true(createSchedulesFromListSpy.called);
    t.true(createNextScheduleSpy.callCount === expectedCallCount);

    createSchedulesFromListSpy.restore();
    createNextScheduleSpy.restore();
});

ava('.createSchedulesFromList() calls aircraftController.createPreSpawnAircraftWithSpawnPatternModel() if preSpawnAircraftList has items', (t) => {
    SpawnScheduler.init(aircraftControllerStub);
    SpawnScheduler.createSchedulesFromList();

    t.true(aircraftControllerStub.createPreSpawnAircraftWithSpawnPatternModel.called);
});

ava.skip('.createNextSchedule() calls GameController.game_timeout()', (t) => {
    const gameControllerGameTimeoutStub = {
        game_timeout: sandbox.stub(),
        game: {
            time: 0
        }
    };
    SpawnScheduler.init(aircraftControllerStub);
    const spawnPatternModel = SpawnPatternCollection._items[0];

    SpawnScheduler.createNextSchedule(spawnPatternModel, aircraftControllerStub);

    t.true(gameControllerGameTimeoutStub.game_timeout.called);
});

ava('.createAircraftAndRegisterNextTimeout() calls aircraftController.createAircraftWithSpawnPatternModel()', (t) => {
    SpawnScheduler.init(aircraftControllerStub);
    const spawnPatternModel = SpawnPatternCollection._items[0];

    SpawnScheduler.createAircraftAndRegisterNextTimeout([spawnPatternModel, aircraftControllerStub]);

    t.true(aircraftControllerStub.createAircraftWithSpawnPatternModel.called);
});

ava('.createAircraftAndRegisterNextTimeout() calls .createNextSchedule()', (t) => {
    SpawnScheduler.init(aircraftControllerStub);
    const createNextScheduleSpy = sandbox.spy(SpawnScheduler, 'createNextSchedule');
    const spawnPatternModel = SpawnPatternCollection._items[0];

    SpawnScheduler.createAircraftAndRegisterNextTimeout([spawnPatternModel, aircraftControllerStub]);

    t.true(createNextScheduleSpy.calledOnce);

    createNextScheduleSpy.restore();
});

ava('.resetTimer() returns early when SpawnPatternModel has no #scheduleId', (t) => {
    SpawnScheduler.init(aircraftControllerStub);
    const destroyTimerStub = sandbox.stub(GameController, 'destroyTimer');
    const spawnPatternModel = SpawnPatternCollection._items[0];
    spawnPatternModel.scheduleId = INVALID_NUMBER;

    SpawnScheduler.resetTimer(spawnPatternModel);

    delete spawnPatternModel.scheduleId;

    SpawnScheduler.resetTimer(spawnPatternModel);

    t.true(destroyTimerStub.notCalled);

    destroyTimerStub.restore();
});

ava('.resetTimer() destroys existing timers but does not create a new spawn schedule when SpawnPatternModel has a non-positive spawn rate', (t) => {
    SpawnScheduler.init(aircraftControllerStub);
    const spawnPatternModel = SpawnPatternCollection._items[0];
    const destroyTimerStub = sandbox.stub(GameController, 'destroyTimer');
    const getNextDelayValueStub = sandbox.stub(spawnPatternModel, 'getNextDelayValue');
    spawnPatternModel.rate = 0;

    SpawnScheduler.resetTimer(spawnPatternModel);

    spawnPatternModel.rate = -6;
    spawnPatternModel.scheduleId = 10;

    SpawnScheduler.resetTimer(spawnPatternModel);

    t.true(destroyTimerStub.calledTwice);
    t.true(getNextDelayValueStub.notCalled);

    destroyTimerStub.restore();
    getNextDelayValueStub.restore();
});

// ava('.resetTimer() updates remaining time when timer has not yet expired', (t) => {
//     SpawnScheduler.init(aircraftControllerStub);
//     const spawnPatternModel = SpawnPatternCollection._items[0];
//
//     sandbox.stub(spawnPatternModel, 'getNextDelayValue').returns(15);
//
//     // TimeKeeper.accumulatedDeltaTime += 10;
//     const oldTimerValue = TimeKeeper.accumulatedDeltaTime;
//     const createAircraftWithSpawnPatternModelStub = sandbox.stub(spawnPatternModel.aircraftController, 'createAircraftWithSpawnPatternModel');
//     const _createTimeoutStub = sandbox.stub(SpawnScheduler, '_createTimeout');
//
//     SpawnScheduler.resetTimer(spawnPatternModel);
//
//     t.true(createAircraftWithSpawnPatternModelStub.notCalled);
//     t.true(_createTimeoutStub.calledWithExactly(spawnPatternModel, oldTimerValue + (15)));
// });
