import ava from 'ava';
import _isArray from 'lodash/isArray';
import _isString from 'lodash/isString';
import BaseCollection from '../../src/assets/scripts/client/base/BaseCollection';
import ExtendedBaseCollectionFixture from './_fixtures/ExtendedBaseCollectionFixture';

ava('instantiates with a _id and _items properties', t => {
    const result = new BaseCollection();

    t.true(_isString(result._id));
    t.true(_isArray(result._items));
    t.true(result.length === 0);
});

ava('._init() throws when called from BaseCollection', t => {
    const collection = new BaseCollection();

    t.throws(() => collection._init());
});

ava('._init() does not throw when called by an extending class', t => {
    const collection = new ExtendedBaseCollectionFixture();

    t.notThrows(() => collection._init());
});

ava('.destroy() throws when called from BaseCollection', t => {
    const collection = new BaseCollection();

    t.throws(() => collection.destroy());
});

ava('.destroy() does not throw when called from and extending class', t => {
    const collection = new ExtendedBaseCollectionFixture();

    t.notThrows(() => collection.destroy());
});
