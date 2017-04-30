import ava from 'ava';
import _isString from 'lodash/isString';

import BaseModel from '../../src/assets/scripts/client/base/BaseModel';
import ExtendedBaseModelFixture from './_fixtures/ExtendedBaseModelFixture';

ava('sets the #_id when passed valid parameters', (t) => {
    let model = new BaseModel();
    t.true(model._id.indexOf('BaseModel') !== -1);

    model = new BaseModel('modelName');
    t.true(model._id.indexOf('modelName') !== -1);

});

ava('throws when passed invalid parameters', t => {
    t.throws(() => new BaseModel([]));
    t.throws(() => new BaseModel({}));
    t.throws(() => new BaseModel(42));
    t.throws(() => new BaseModel(false));
});

ava('makes sure the model in instantiates with the correct data type', t => {
    t.notThrows(() => new BaseModel());
    t.notThrows(() => new BaseModel('string'));
});

ava('instantiates with an _id property', t => {
    const model = new BaseModel();

    t.true(_isString(model._id));
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
