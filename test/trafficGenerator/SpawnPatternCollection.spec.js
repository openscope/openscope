/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import sinon from 'sinon';

import SpawnPatternCollection from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternCollection';
import { airportControllerFixture } from '../fixtures/airportFixtures';
import { navigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';
import { spawnPatternModelArrivalFixture } from '../fixtures/trafficGeneratorFixtures';
import { AIRPORT_JSON_FOR_SPAWN_MOCK } from './_mocks/spawnPatternMocks';

ava('throws when called with invalid parameters', (t) => {
    t.throws(() => new SpawnPatternCollection());
    t.throws(() => new SpawnPatternCollection([]));
    t.throws(() => new SpawnPatternCollection({}));

    t.throws(() => new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK));
    t.throws(() => new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, []));
    t.throws(() => new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, {}));
    t.throws(() => new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, 42));
    t.throws(() => new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, 'threeve'));
    t.throws(() => new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, false));

    t.throws(() => new SpawnPatternCollection([], navigationLibraryFixture));
    t.throws(() => new SpawnPatternCollection({}, navigationLibraryFixture));

    t.throws(() => new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, navigationLibraryFixture));
    t.throws(() => new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, navigationLibraryFixture, []));
    t.throws(() => new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, navigationLibraryFixture, {}));
    t.throws(() => new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, navigationLibraryFixture, 42));
    t.throws(() => new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, navigationLibraryFixture, 'threeve'));
    t.throws(() => new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, navigationLibraryFixture, false));
});

ava('.init() calls _buildspawnPatternModels()', (t) => {
    const collection = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, navigationLibraryFixture, airportControllerFixture);
    const _buildspawnPatternModelsSpy = sinon.spy(collection, '_buildspawnPatternModels');

    collection.init(AIRPORT_JSON_FOR_SPAWN_MOCK, navigationLibraryFixture, airportControllerFixture);

    t.true(_buildspawnPatternModelsSpy.calledWithExactly(AIRPORT_JSON_FOR_SPAWN_MOCK.spawnPatterns, navigationLibraryFixture, airportControllerFixture));
});

ava('.addItems() does not call .addItem() if passed an invalid value', (t) => {
    const collection = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, navigationLibraryFixture, airportControllerFixture);
    const addItemSpy = sinon.spy(collection, 'addItem');

    collection.addItems([]);
    t.false(addItemSpy.called);

    collection.addItems();
    t.false(addItemSpy.called);
});

ava('.addItems() calls .addItem() for each item in the list passed as an argument', (t) => {
    const collection = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, navigationLibraryFixture, airportControllerFixture);
    const addItemStub = sinon.stub(collection, 'addItem');

    collection.addItems([false, false]);
    t.true(addItemStub.calledTwice);
});

ava('.addItem() throws if anything other than a SpawnPatternModel is passed as an argument', (t) => {
    const collection = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, navigationLibraryFixture, airportControllerFixture);

    t.throws(() => collection.addItem());
    t.throws(() => collection.addItem([]));
    t.throws(() => collection.addItem({}));
    t.throws(() => collection.addItem(42));
    t.throws(() => collection.addItem('threeve'));
    t.throws(() => collection.addItem(false));
    t.throws(() => collection.addItem(null));
    t.throws(() => collection.addItem(undefined));
});

ava('.addItem() adds a SpawnPatternModel to _items', (t) => {
    const collection = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, navigationLibraryFixture, airportControllerFixture);
    const originalLength = collection.length;

    collection.addItem(spawnPatternModelArrivalFixture);

    t.true(collection.length === (originalLength + 1));
});
