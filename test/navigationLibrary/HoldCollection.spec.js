import ava from 'ava';
import HoldCollection from '../../src/assets/scripts/client/navigationLibrary/HoldCollection';

import {
    FIX_NAME_WITHOUT_HOLD,
    FIX_NAME_WITH_HOLD,
    HOLD_COLLECTION_MOCK
} from './_mocks/holdCollectionMocks';

ava('throws if called with invalid parameters', (t) => {
    t.throws(() => new HoldCollection(''));
});

ava('accepts a null that is used to initialize the collection', (t) => {
    const collection = new HoldCollection(null);

    t.is(collection.length, 0);
});

ava('accepts an empty object that is used to initialize the collection', (t) => {
    const collection = new HoldCollection({});

    t.is(collection.length, 0);
});

ava('accepts a valid object that is used to initialize the collection', (t) => {
    const collection = new HoldCollection(HOLD_COLLECTION_MOCK);
    const expectedLength = Object.keys(HOLD_COLLECTION_MOCK).length;

    t.is(collection.length, expectedLength);
    t.is(collection.holds.length, expectedLength);
});

ava('.containsHoldForFix() returns expected value', (t) => {
    const collection = new HoldCollection(HOLD_COLLECTION_MOCK);

    t.true(collection.containsHoldForFix('ABBOT'));
    t.false(collection.containsHoldForFix('THREEVE'));
    t.false(collection.containsHoldForFix());
    t.false(collection.containsHoldForFix(null));
    t.false(collection.containsHoldForFix(''));
});

ava('.findHoldParametersByFix() returns expected value', (t) => {
    const collection = new HoldCollection(HOLD_COLLECTION_MOCK);
    const validFix = collection.findHoldParametersByFix(FIX_NAME_WITH_HOLD);

    t.is(collection.findHoldParametersByFix(''), null);
    t.is(collection.findHoldParametersByFix(FIX_NAME_WITHOUT_HOLD), null);
    t.not(validFix, null);
});

ava('.populateHolds() doesn\'t add duplicate holds', (t) => {
    const collection = new HoldCollection(HOLD_COLLECTION_MOCK);
    const expectedLength = Object.keys(HOLD_COLLECTION_MOCK).length;

    collection.populateHolds(HOLD_COLLECTION_MOCK);

    t.is(collection.length, expectedLength);
});

ava('.reset() clears the instance properties', (t) => {
    const collection = new HoldCollection(HOLD_COLLECTION_MOCK);
    collection.reset();

    t.is(collection.length, 0);
});
