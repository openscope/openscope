import ava from 'ava';
import sinon from 'sinon';
import SpawnScheduler from '../../src/assets/scripts/client/trafficGenerator/SpawnScheduler';
import SpawnPatternCollection from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternCollection';
import {
    airportControllerFixture,
    resetAirportControllerFixture
} from '../fixtures/airportFixtures';
import { navigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';
import { AIRPORT_JSON_FOR_SPAWN_MOCK } from '../trafficGenerator/_mocks/spawnPatternMocks';

let aircraftControllerStub;
let spawnPatternCollectionFixture;

ava.beforeEach(() => {
    airportControllerFixture();
    spawnPatternCollectionFixture = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, navigationLibraryFixture);
    aircraftControllerStub = {
        createAircraftWithSpawnPatternModel: sinon.stub(),
        createPreSpawnAircraftWithSpawnPatternModel: sinon.stub()
    };
});

ava.afterEach(() => {
    resetAirportControllerFixture();
    spawnPatternCollectionFixture = null;
    aircraftControllerStub = null;
});

ava('throws when passed invalid parameters', (t) => {
    t.throws(() => new SpawnScheduler());
    t.throws(() => new SpawnScheduler(spawnPatternCollectionFixture));
    t.throws(() => new SpawnScheduler(aircraftControllerStub));
    t.throws(() => new SpawnScheduler({}, aircraftControllerStub));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new SpawnScheduler(spawnPatternCollectionFixture, aircraftControllerStub));
});

ava('.createSchedulesFromList() calls .createNextSchedule() for each SpawnPatternModel in the collection', (t) => {
    const scheduler = new SpawnScheduler(spawnPatternCollectionFixture, aircraftControllerStub);
    const createNextScheduleSpy = sinon.spy(scheduler, 'createNextSchedule');

    scheduler.createSchedulesFromList(spawnPatternCollectionFixture, aircraftControllerStub);

    t.true(createNextScheduleSpy.calledTwice);
});

ava('.createSchedulesFromList() calls aircraftController.createPreSpawnAircraftWithSpawnPatternModel() if preSpawnAircraftList has items', (t) => {
    const scheduler = new SpawnScheduler(spawnPatternCollectionFixture, aircraftControllerStub);

    scheduler.createSchedulesFromList(spawnPatternCollectionFixture, aircraftControllerStub);

    t.true(aircraftControllerStub.createPreSpawnAircraftWithSpawnPatternModel.called);
});

ava.skip('.createNextSchedule() calls GameController.game_timeout()', (t) => {
    const gameControllerGameTimeoutStub = {
        game_timeout: sinon.stub(),
        game: {
            time: 0
        }
    };
    const scheduler = new SpawnScheduler(spawnPatternCollectionFixture, aircraftControllerStub);
    const spawnPatternModel = spawnPatternCollectionFixture._items[0];

    scheduler.createNextSchedule(spawnPatternModel, aircraftControllerStub);

    t.true(gameControllerGameTimeoutStub.game_timeout.called);
});

ava('.createAircraftAndRegisterNextTimeout() calls aircraftController.createAircraftWithSpawnPatternModel()', (t) => {
    const scheduler = new SpawnScheduler(spawnPatternCollectionFixture, aircraftControllerStub);
    const spawnPatternModel = spawnPatternCollectionFixture._items[0];

    scheduler.createAircraftAndRegisterNextTimeout([spawnPatternModel, aircraftControllerStub]);

    t.true(aircraftControllerStub.createAircraftWithSpawnPatternModel.called);
});

ava('.createAircraftAndRegisterNextTimeout() calls .createNextSchedule()', (t) => {
    const scheduler = new SpawnScheduler(spawnPatternCollectionFixture, aircraftControllerStub);
    const createNextScheduleSpy = sinon.spy(scheduler, 'createNextSchedule');
    const spawnPatternModel = spawnPatternCollectionFixture._items[0];

    scheduler.createAircraftAndRegisterNextTimeout([spawnPatternModel, aircraftControllerStub]);

    t.true(createNextScheduleSpy.calledOnce);
});
