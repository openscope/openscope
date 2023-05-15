/* eslint-disable import/no-extraneous-dependencies, arrow-parens */
import ava from 'ava';
import _isEqual from 'lodash/isEqual';
import LocalizerCollection from '../../src/assets/scripts/client/navigationLibrary/LocalizerCollection';
import LocalizerModel from '../../src/assets/scripts/client/navigationLibrary/LocalizerModel';
import { airportPositionFixtureKSFO } from '../fixtures/airportFixtures';
import {
    LOCALIZER_LIST_MOCK,
    LOCALIZER_LIST_SHORT_MOCK
} from './_mocks/localizerModelMocks';

ava.before(() => {
    LocalizerCollection.removeItems();
});

ava.after(() => {
    LocalizerCollection.removeItems();
});

ava('throws when an attempt to instantiate is made with invalid params', t => {
    t.throws(() => new LocalizerCollection());

    t.true(LocalizerCollection._items.length === 0);
    t.true(LocalizerCollection.length === 0);
});

ava('sets its properties when it receives a valid locList', t => {
    LocalizerCollection.addItems(LOCALIZER_LIST_MOCK, airportPositionFixtureKSFO);

    t.true(LocalizerCollection._items.length > 0);
    t.true(LocalizerCollection.length === LocalizerCollection._items.length);
});

ava('.addLocalizerToCollection() throws if it doesnt receive a LocalizerModel instance', t => {
    t.throws(() => LocalizerCollection.addLocalizerToCollection({}));
});

ava('.findLocalizerByName() returns null when passed a null value', t => {
    let result = LocalizerCollection.findLocalizerByName(null);
    t.true(!result);

    result = LocalizerCollection.findLocalizerByName(undefined);
    t.true(!result);
});

ava('.findLocalizerByName() returns null when a LocalizerModel does not exist within the collection', t => {
    const result = LocalizerCollection.findLocalizerByName('');

    t.true(!result);
});

ava('.findLocalizerByName() returns a LocalizerModel if it exists within the collection', t => {
    const result = LocalizerCollection.findLocalizerByName('I-LAS');

    t.true(result.name === 'I-LAS');
    t.true(result instanceof LocalizerModel);
});

ava('.findLocalizerByName() returns a LocalizerModel when passed a lowercase locName', t => {
    const result = LocalizerCollection.findLocalizerByName('i-las');

    t.true(result.name === 'I-LAS');
    t.true(result instanceof LocalizerModel);
});

ava('.findLocalizerByName() returns a LocalizerModel when passed a mixed case locName', t => {
    const result = LocalizerCollection.findLocalizerByName('i-LaS');

    t.true(result.name === 'I-LAS');
    t.true(result instanceof LocalizerModel);
});

ava('.getLocalizerRelativePosition() returns the position of a LocalizerModel', t => {
    const result = LocalizerCollection.getLocalizerRelativePosition('I-LAS');
    const expectedResult = [661.0979342086902, -15.45097187594201];

    t.true(_isEqual(result, expectedResult));
});

ava('.getLocalizerRelativePosition() returns null if a LocalizerModel does not exist within the collection', t => {
    const result = LocalizerCollection.getLocalizerRelativePosition('');

    t.true(!result);
});

ava('.addItems() resets _items when it is called with an existing collection', t => {
    t.true(LocalizerCollection.length === 3);

    LocalizerCollection.addItems(LOCALIZER_LIST_SHORT_MOCK, airportPositionFixtureKSFO);

    t.false(LocalizerCollection.length === 3);
    t.true(LocalizerCollection.length === 2);
});
