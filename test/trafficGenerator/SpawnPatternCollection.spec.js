/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import sinon from 'sinon';

import SpawnPatternCollection from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternCollection';
import SpawnPatternModel from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternModel';
import {
    ARRIVAL_PATTERN_MOCK,
    AIRPORT_JSON_FOR_SPAWN_MOCK
} from './_mocks/spawnPatternMocks';

const spawnPatternModelFixture = new SpawnPatternModel('arrival', ARRIVAL_PATTERN_MOCK);

ava('throws when called with invalid parameters', (t) => {
    t.throws(() => new SpawnPatternCollection());
    t.throws(() => new SpawnPatternCollection([]));
    t.throws(() => new SpawnPatternCollection({}));
    t.throws(() => new SpawnPatternCollection(42));
    t.throws(() => new SpawnPatternCollection('threeve'));
    t.throws(() => new SpawnPatternCollection(false));
});

ava('.addItems() does not call .addItem() if passed an invalid value', (t) => {
    const collection = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK);
    const addItemSpy = sinon.spy(collection, 'addItem');

    collection.addItems([]);
    t.false(addItemSpy.called);

    collection.addItems();
    t.false(addItemSpy.called);
});

ava('.addItems() calls .addItem() for each item in the list passed as an argument', (t) => {
    const collection = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK);
    const addItemStub = sinon.stub(collection, 'addItem');

    collection.addItems([false, false]);
    t.true(addItemStub.calledTwice);
});

ava('.addItem() throws if anything other than a SpawnPatternModel is passed as an argument', (t) => {
    const collection = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK);

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
    const collection = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK);
    const originalLength = collection.length;

    collection.addItem(spawnPatternModelFixture);

    t.true(collection.length === (originalLength + 1));
});
