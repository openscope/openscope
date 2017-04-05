import ava from 'ava';
import _isString from 'lodash/isString';

import BaseModel from '../../src/assets/scripts/client/base/BaseModel';
import ExtendedBaseModelFixture from './_fixtures/ExtendedBaseModelFixture';

ava('sets the #_id when passed valid parameters', (t) => {
    const modelInt = new BaseModel();
    t.true(modelInt._id.indexOf('BaseModel') !== -1);

    const modelBool = new BaseModel('string');
    t.true(modelBool._id.indexOf('string') !== -1);
    console.log(modelBool._id);
});

ava('makes sure the model fails to instantiate with any incorrect', t => {
    t.notThrows(() => new BaseModel());
    t.throws(() => new BaseModel([]));
    t.throws(() => new BaseModel({}));
    t.throws(() => new BaseModel(42));
    t.notThrows(() => new BaseModel('string'));
    t.throws(() => new BaseModel(false));
});

ava('makes sure the model in instantiates with the correct data type', t => {
    t.notThrows(() => new BaseModel());
    t.notThrows(() => new BaseModel('string'));
});

ava('instantiates with an _id property', t => {
    const resultEmpty = new BaseModel();

    t.true(_isString(resultEmpty._id));
});

ava('instantiates with an _id with string property', t => {
    const resultString = new BaseModel('string');

    t.true(_isString(resultString._id));
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
