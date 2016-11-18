import ava from 'ava';
import _isString from 'lodash/isString';

import BaseModel from '../../src/assets/scripts/base/BaseModel';
import ExtendedBaseModelFixture from './_fixtures/ExtendedBaseModelFixture';

ava('instantiates with an _id property', t => {
    const result = new BaseModel();

    t.true(_isString(result._id));
});

ava('._init() throws when called from BaseModel', t => {
    const model = new BaseModel();

    t.throws(() => model._init());
});

ava('._init() does not throw when called by an extending class', t => {
    const model = new ExtendedBaseModelFixture();

    t.notThrows(() => model._init());
});

ava('.reset() throws when called from BaseModel', t => {
    const model = new BaseModel();

    t.throws(() => model.reset());
});

ava('.reset() does not throw when called from and extending class', t => {
    const model = new ExtendedBaseModelFixture();

    t.notThrows(() => model.reset());
});
