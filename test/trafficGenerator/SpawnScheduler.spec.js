/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import sinon from 'sinon';

import SpawnScheduler from '../../src/assets/scripts/client/trafficGenerator/SpawnScheduler';
import { spawnPatternCollectionFixture } from '../fixtures/trafficGeneratorFixtures';

let aircraftCollectionStub;
ava.before(() => {
    aircraftCollectionStub = {
        createAircraftWithSpawnModel: sinon.stub()
    };
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

    t.throws(() => new SpawnScheduler(aircraftCollectionStub));
    t.throws(() => new SpawnScheduler({}, aircraftCollectionStub));
    t.throws(() => new SpawnScheduler([], aircraftCollectionStub));
    t.throws(() => new SpawnScheduler(42, aircraftCollectionStub));
    t.throws(() => new SpawnScheduler('threeve', aircraftCollectionStub));
    t.throws(() => new SpawnScheduler(false, aircraftCollectionStub));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new SpawnScheduler(spawnPatternCollectionFixture, aircraftCollectionStub));
});

ava('adds a timer id to #schedules for each SpawnPatternModel', (t) => {
    const controller = new SpawnScheduler(spawnPatternCollectionFixture, aircraftCollectionStub);

    t.true(controller.schedules.length === spawnPatternCollectionFixture.length);
});

ava('.stopSchedule() throws if passed an invalid #scheduleId', (t) => {
    const controller = new SpawnScheduler(spawnPatternCollectionFixture, aircraftCollectionStub);

    t.throws(() => controller.stopSchedule(false));
});

ava('.stopSchedule() does not throw if passed a valid #scheduleId', (t) => {
    const controller = new SpawnScheduler(spawnPatternCollectionFixture, aircraftCollectionStub);

    t.notThrows(() => controller.stopSchedule(controller.schedules[0]));
});
