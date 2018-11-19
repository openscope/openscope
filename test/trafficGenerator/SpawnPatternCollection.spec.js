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
import { AIRPORT_JSON_FOR_SPAWN_MOCK } from './_mocks/spawnPatternMocks';

ava.beforeEach(() => {
    createNavigationLibraryFixture();
    createAirportControllerFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
    resetAirportControllerFixture();
});

ava('.init() calls _buildSpawnPatternModels()', (t) => {
    const _buildSpawnPatternModelsSpy = sinon.spy(SpawnPatternCollection, '_buildSpawnPatternModels');

    SpawnPatternCollection.init(AIRPORT_JSON_FOR_SPAWN_MOCK);

    t.true(_buildSpawnPatternModelsSpy.calledWithExactly(AIRPORT_JSON_FOR_SPAWN_MOCK.spawnPatterns));
});

ava('.addItems() does not call .addItem() if passed an invalid value', (t) => {
    SpawnPatternCollection.init(AIRPORT_JSON_FOR_SPAWN_MOCK);

    const addItemSpy = sinon.spy(SpawnPatternCollection, 'addItem');

    SpawnPatternCollection.addItems([]);
    t.false(addItemSpy.called);

    SpawnPatternCollection.addItems();
    t.false(addItemSpy.called);
});

ava('.addItems() calls .addItem() for each item in the list passed as an argument', (t) => {
    const addItemStub = sinon.stub(SpawnPatternCollection, 'addItem');

    SpawnPatternCollection.init(AIRPORT_JSON_FOR_SPAWN_MOCK);
    SpawnPatternCollection.addItems([false, false]);
    t.true(addItemStub.calledTwice);
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
