import ava from 'ava';
import sinon from 'sinon';
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
import { AIRPORT_JSON_FOR_SPAWN_MOCK } from '../trafficGenerator/_mocks/spawnPatternMocks';

let aircraftControllerStub;
let spawnPatternCollectionFixture;
let sandbox; // using the sinon sandbox ensures stubs are restored after each test

ava.beforeEach(() => {
    createNavigationLibraryFixture();
    createAirportControllerFixture();
    SpawnPatternCollection.init(AIRPORT_JSON_FOR_SPAWN_MOCK);

    sandbox = sinon.sandbox.create();
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
});
