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

ava.beforeEach(() => {
    createNavigationLibraryFixture();
    createAirportControllerFixture();
    SpawnPatternCollection.init(AIRPORT_JSON_FOR_SPAWN_MOCK);

    aircraftControllerStub = {
        createAircraftWithSpawnPatternModel: sinon.stub(),
        createPreSpawnAircraftWithSpawnPatternModel: sinon.stub()
    };
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
    resetAirportControllerFixture();

    spawnPatternCollectionFixture = null;
    aircraftControllerStub = null;
});

ava('throws when passed invalid parameters', (t) => {
    t.throws(() => new SpawnScheduler());
    t.throws(() => new SpawnScheduler(spawnPatternCollectionFixture));
    t.throws(() => new SpawnScheduler({}, aircraftControllerStub));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new SpawnScheduler(aircraftControllerStub));
});

ava('.createSchedulesFromList() calls .createNextSchedule() for each SpawnPatternModel in the collection', (t) => {
    const scheduler = new SpawnScheduler(aircraftControllerStub);
    const createNextScheduleSpy = sinon.spy(scheduler, 'createNextSchedule');

    scheduler.createSchedulesFromList(aircraftControllerStub);

    t.true(createNextScheduleSpy.calledTwice);
});

ava('.createSchedulesFromList() calls aircraftController.createPreSpawnAircraftWithSpawnPatternModel() if preSpawnAircraftList has items', (t) => {
    const scheduler = new SpawnScheduler(aircraftControllerStub);

    scheduler.createSchedulesFromList(aircraftControllerStub);

    t.true(aircraftControllerStub.createPreSpawnAircraftWithSpawnPatternModel.called);
});

ava.skip('.createNextSchedule() calls GameController.game_timeout()', (t) => {
    const gameControllerGameTimeoutStub = {
        game_timeout: sinon.stub(),
        game: {
            time: 0
        }
    };
    const scheduler = new SpawnScheduler(aircraftControllerStub);
    const spawnPatternModel = SpawnPatternCollection._items[0];

    scheduler.createNextSchedule(spawnPatternModel, aircraftControllerStub);

    t.true(gameControllerGameTimeoutStub.game_timeout.called);
});

ava('.createAircraftAndRegisterNextTimeout() calls aircraftController.createAircraftWithSpawnPatternModel()', (t) => {
    const scheduler = new SpawnScheduler(aircraftControllerStub);
    const spawnPatternModel = SpawnPatternCollection._items[0];

    scheduler.createAircraftAndRegisterNextTimeout([spawnPatternModel, aircraftControllerStub]);

    t.true(aircraftControllerStub.createAircraftWithSpawnPatternModel.called);
});

ava('.createAircraftAndRegisterNextTimeout() calls .createNextSchedule()', (t) => {
    const scheduler = new SpawnScheduler(aircraftControllerStub);
    const createNextScheduleSpy = sinon.spy(scheduler, 'createNextSchedule');
    const spawnPatternModel = SpawnPatternCollection._items[0];

    scheduler.createAircraftAndRegisterNextTimeout([spawnPatternModel, aircraftControllerStub]);

    t.true(createNextScheduleSpy.calledOnce);
});
