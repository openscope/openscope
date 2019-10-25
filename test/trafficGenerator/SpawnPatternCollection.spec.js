import ava from 'ava';
import sinon from 'sinon';
import SpawnPatternCollection from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternCollection';
import {
    createAirportControllerFixture,
    resetAirportControllerFixture
} from '../fixtures/airportFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../fixtures/navigationLibraryFixtures';
import { spawnPatternModelArrivalFixture, spawnPatternModelDepartureFixture } from '../fixtures/trafficGeneratorFixtures';
import { AIRPORT_JSON_FOR_SPAWN_MOCK } from './_mocks/spawnPatternMocks';

let sandbox; // using the sinon sandbox ensures stubs are restored after each test

ava.beforeEach(() => {
    sandbox = sinon.createSandbox();

    createNavigationLibraryFixture();
    createAirportControllerFixture();
});

ava.afterEach.always(() => {
    sandbox.restore();

    resetNavigationLibraryFixture();
    resetAirportControllerFixture();
    SpawnPatternCollection.reset();
});

ava('.init() throws when the provided airport JSON data is empty', (t) => {
    t.throws(() => SpawnPatternCollection.init());
    t.throws(() => SpawnPatternCollection.init({}));
});

ava('.init() calls _buildSpawnPatternModels()', (t) => {
    const _buildSpawnPatternModelsSpy = sandbox.spy(SpawnPatternCollection, '_buildSpawnPatternModels');

    SpawnPatternCollection.init(AIRPORT_JSON_FOR_SPAWN_MOCK);

    t.true(_buildSpawnPatternModelsSpy.calledWithExactly(AIRPORT_JSON_FOR_SPAWN_MOCK.spawnPatterns));
});

ava('.addItems() does not call .addItem() if passed an invalid value', (t) => {
    SpawnPatternCollection.init(AIRPORT_JSON_FOR_SPAWN_MOCK);

    const addItemSpy = sandbox.spy(SpawnPatternCollection, 'addItem');

    SpawnPatternCollection.addItems([]);
    t.false(addItemSpy.called);

    SpawnPatternCollection.addItems();
    t.false(addItemSpy.called);

    addItemSpy.restore();
});

ava('.addItems() calls .addItem() for each item in the list passed as an argument', (t) => {
    SpawnPatternCollection.init(AIRPORT_JSON_FOR_SPAWN_MOCK);

    const addItemSpy = sandbox.spy(SpawnPatternCollection, 'addItem');

    SpawnPatternCollection.addItems([spawnPatternModelArrivalFixture, spawnPatternModelDepartureFixture]);

    t.true(addItemSpy.calledTwice);

    addItemSpy.restore();
});

ava('.addItem() throws if anything other than a SpawnPatternModel is passed as an argument', (t) => {
    SpawnPatternCollection.init(AIRPORT_JSON_FOR_SPAWN_MOCK);

    t.throws(() => SpawnPatternCollection.addItem());
    t.throws(() => SpawnPatternCollection.addItem([]));
    t.throws(() => SpawnPatternCollection.addItem({}));
    t.throws(() => SpawnPatternCollection.addItem(42));
    t.throws(() => SpawnPatternCollection.addItem('threeve'));
    t.throws(() => SpawnPatternCollection.addItem(false));
    t.throws(() => SpawnPatternCollection.addItem(null));
    t.throws(() => SpawnPatternCollection.addItem(undefined));
});

ava('.findSpawnPatternsByCategory() returns an empty array when no spawn patterns of the specified category are found', (t) => {
    SpawnPatternCollection.init(AIRPORT_JSON_FOR_SPAWN_MOCK);
    SpawnPatternCollection.addItems([spawnPatternModelArrivalFixture, spawnPatternModelDepartureFixture]);

    const categoryMock = 'threeve';
    const expectedResult = [];
    const result = SpawnPatternCollection.findSpawnPatternsByCategory(categoryMock);

    t.deepEqual(result, expectedResult);
});

ava('.findSpawnPatternsByCategory() returns all SpawnPatternModels in the collection which have the specified category', (t) => {
    SpawnPatternCollection.init(AIRPORT_JSON_FOR_SPAWN_MOCK);
    SpawnPatternCollection.addItems([
        spawnPatternModelArrivalFixture,
        spawnPatternModelDepartureFixture
    ]);

    const categoryMock = 'arrival';
    const result = SpawnPatternCollection.findSpawnPatternsByCategory(categoryMock);

    t.true(result.every((spawnPatternModel) => spawnPatternModel.category === categoryMock));
});
