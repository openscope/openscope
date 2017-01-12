import ava from 'ava';
import sinon from 'sinon';

import SpawnScheduler from '../../src/assets/scripts/client/trafficGenerator/SpawnScheduler';
import { spawnPatternCollectionFixture } from '../fixtures/trafficGeneratorFixtures';

let aircraftControllerStub;
let gameControllerStub;
ava.before(() => {
    aircraftControllerStub = {
        createAircraftWithSpawnPatternModel: sinon.stub(),
        createPreSpawnAircraftWithSpawnPatternModel: sinon.stub()
    };

    gameControllerStub = {
        game_timeout: sinon.stub(),
        game: {
            time: 0
        }
    };
});

ava.after(() => {
    aircraftControllerStub = null;
    gameControllerStub = null;
});

ava('throws when passed invalid parameters', (t) => {
    t.throws(() => new SpawnScheduler());
    t.throws(() => new SpawnScheduler({}));
    t.throws(() => new SpawnScheduler([]));
    t.throws(() => new SpawnScheduler(42));
    t.throws(() => new SpawnScheduler('threeve'));
    t.throws(() => new SpawnScheduler(false));

    t.throws(() => new SpawnScheduler(spawnPatternCollectionFixture));
    t.throws(() => new SpawnScheduler(spawnPatternCollectionFixture, {}));
    t.throws(() => new SpawnScheduler(spawnPatternCollectionFixture, []));
    t.throws(() => new SpawnScheduler(spawnPatternCollectionFixture, 42));
    t.throws(() => new SpawnScheduler(spawnPatternCollectionFixture, 'threeve'));
    t.throws(() => new SpawnScheduler(spawnPatternCollectionFixture, false));

    t.throws(() => new SpawnScheduler(aircraftControllerStub));
    t.throws(() => new SpawnScheduler({}, aircraftControllerStub));
    t.throws(() => new SpawnScheduler([], aircraftControllerStub));
    t.throws(() => new SpawnScheduler(42, aircraftControllerStub));
    t.throws(() => new SpawnScheduler('threeve', aircraftControllerStub));
    t.throws(() => new SpawnScheduler(false, aircraftControllerStub));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new SpawnScheduler(spawnPatternCollectionFixture, aircraftControllerStub, gameControllerStub));
});

ava('.createSchedulesFromList() calls .createNextSchedule() for each SpawnPatternModel in the collection', (t) => {
    const scheduler = new SpawnScheduler(spawnPatternCollectionFixture, aircraftControllerStub, gameControllerStub);
    const createNextScheduleSpy = sinon.spy(scheduler, 'createNextSchedule');

    scheduler.createSchedulesFromList(spawnPatternCollectionFixture, aircraftControllerStub);

    t.true(createNextScheduleSpy.calledTwice);
});

ava('.createSchedulesFromList() calls aircraftController.createPreSpawnAircraftWithSpawnPatternModel() if preSpawnAircraftList has items', (t) => {
    const scheduler = new SpawnScheduler(spawnPatternCollectionFixture, aircraftControllerStub, gameControllerStub);

    scheduler.createSchedulesFromList(spawnPatternCollectionFixture, aircraftControllerStub);

    t.true(aircraftControllerStub.createPreSpawnAircraftWithSpawnPatternModel.called);
});

ava('.createNextSchedule() calls GameController.game_timeout()', (t) => {
    const gameControllerGameTimeoutStub = {
        game_timeout: sinon.stub(),
        game: {
            time: 0
        }
    };
    const scheduler = new SpawnScheduler(spawnPatternCollectionFixture, aircraftControllerStub, gameControllerGameTimeoutStub);
    const spawnPatternModel = spawnPatternCollectionFixture._items[0];

    scheduler.createNextSchedule(spawnPatternModel, aircraftControllerStub);

    t.true(gameControllerGameTimeoutStub.game_timeout.called);
});

ava('.createAircraftAndRegisterNextTimeout() calls aircraftController.createAircraftWithSpawnPatternModel()', (t) => {
    const scheduler = new SpawnScheduler(spawnPatternCollectionFixture, aircraftControllerStub, gameControllerStub);
    const spawnPatternModel = spawnPatternCollectionFixture._items[0];

    scheduler.createAircraftAndRegisterNextTimeout([spawnPatternModel, aircraftControllerStub]);

    t.true(aircraftControllerStub.createAircraftWithSpawnPatternModel.called);
});

ava('.createAircraftAndRegisterNextTimeout() calls .createNextSchedule()', (t) => {
    const scheduler = new SpawnScheduler(spawnPatternCollectionFixture, aircraftControllerStub, gameControllerStub);
    const createNextScheduleSpy = sinon.spy(scheduler, 'createNextSchedule');
    const spawnPatternModel = spawnPatternCollectionFixture._items[0];

    scheduler.createAircraftAndRegisterNextTimeout([spawnPatternModel, aircraftControllerStub]);

    t.true(createNextScheduleSpy.calledOnce);
});
