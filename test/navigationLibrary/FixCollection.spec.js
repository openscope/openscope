/* eslint-disable import/no-extraneous-dependencies, arrow-parens */
import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';

import FixCollection from '../../src/assets/scripts/client/navigationLibrary/FixCollection';
import FixModel from '../../src/assets/scripts/client/navigationLibrary/FixModel';

import {
    AIRPORT_JSON_FIXES_MOCK,
    FIX_LIST_MOCK,
    SMALL_FIX_LIST_MOCK
} from './_mocks/fixMocks';

ava('throws when an attempt to instantiate is made with invalid params', t => {
    t.throws(() => new FixCollection());
    t.throws(() => new FixCollection({}));
    t.throws(() => new FixCollection([]));
    t.throws(() => new FixCollection(42));
    t.throws(() => new FixCollection('threeve'));
    t.throws(() => new FixCollection(false));
});

ava('does not throw when passed valid params', (t) => {
    t.notThrows(() => new FixCollection(AIRPORT_JSON_FIXES_MOCK));
});

ava('.addItems() calls ._buildFixModelsFromList()', t => {
    const collection = new FixCollection(AIRPORT_JSON_FIXES_MOCK);
    const _buildFixModelsFromListSpy = sinon.spy(collection, '_buildFixModelsFromList');

    collection.addItems([]);
    t.true(_buildFixModelsFromListSpy.calledOnce);
});

ava('.addFixToCollection() throws if it doesnt receive a FixModel instance', t => {
    const collection = new FixCollection(AIRPORT_JSON_FIXES_MOCK);

    t.throws(() => collection.addFixToCollection({}));
});

ava('.findFixByName() returns a FixModel if it exists within the collection', t => {
    const expectedResult = 'BAKRR';
    const collection = new FixCollection(AIRPORT_JSON_FIXES_MOCK);
    const result = collection.findFixByName('BAKRR');

    t.true(result.name === expectedResult);
    t.true(result instanceof FixModel);
});

ava('.findFixByName() returns a FixModel if it exists within the collection and is passed as lowercase', t => {
    const expectedResult = 'BAKRR';
    const collection = new FixCollection(AIRPORT_JSON_FIXES_MOCK);
    const result = collection.findFixByName('bakrr');

    t.true(result.name === expectedResult);
    t.true(result instanceof FixModel);
});

ava('.findFixByName() returns a FixMode if it exists within the collection and is passed as mixed case', t => {
    const expectedResult = 'BAKRR';
    const collection = new FixCollection(AIRPORT_JSON_FIXES_MOCK);
    const result = collection.findFixByName('bAkRr');

    t.true(result.name === expectedResult);
    t.true(result instanceof FixModel);
});

ava('.findFixByName() returns null if a FixModel does not exist within the collection', t => {
    const collection = new FixCollection(AIRPORT_JSON_FIXES_MOCK);
    const result = collection.findFixByName('');

    t.true(result === null);
});

ava('.getFixPositionCoordinates() returns null a FixModel cannot be found in the collection', t => {
    const collection = new FixCollection(AIRPORT_JSON_FIXES_MOCK);
    const result = collection.getFixPositionCoordinates('threeve');

    t.true(result === null);
});

ava('.getFixPositionCoordinates() returns the position of a FixModel', t => {
    const collection = new FixCollection(AIRPORT_JSON_FIXES_MOCK);
    const result = collection.getFixPositionCoordinates('BAKRR');
    const expectedResult = [17.609592797974525, 3.2296848609327107];

    t.true(_isEqual(result, expectedResult));
});

ava('.getFixPositionCoordinates() returns null if a FixModel does not exist within the collection', t => {
    const collection = new FixCollection(AIRPORT_JSON_FIXES_MOCK);
    const result = collection.getFixPositionCoordinates('');

    t.true(result === null);
});

ava('.findRealFixes() returns a list of fixes that dont have `_` prepending thier name', t => {
    const collection = new FixCollection(AIRPORT_JSON_FIXES_MOCK);
    const result = collection.findRealFixes();

    t.true(result.length === 104);
});

ava('.removeItems() calls _resetFixModels()', t => {
    const collection = new FixCollection(AIRPORT_JSON_FIXES_MOCK);
    const _resetFixModelsSpy = sinon.spy(collection, '_resetFixModels');

    collection.removeItems();

    t.true(_resetFixModelsSpy.called);
});

ava('.removeItems() removes all FixModels from #_items', t => {
    const collection = new FixCollection(AIRPORT_JSON_FIXES_MOCK);

    collection.removeItems();

    t.true(collection.length === 0);
});
