import ava from 'ava';
import _isString from 'lodash/isString';

import BaseModel from '../../src/assets/scripts/client/base/BaseModel';
import ExtendedBaseModelFixture from './_fixtures/ExtendedBaseModelFixture';

ava('sets the #_id when passed invalid parameters', (t) => {
    const modelojb = new BaseModel({});
    t.true(modelojb._id.indexOf('BaseModel') !== -1);

    const modelArray = new BaseModel([]);
    t.true(modelArray._id.indexOf('BaseModel') !== -1);

    const modelInt = new BaseModel(42);
    t.true(modelInt._id.indexOf('BaseModel') !== -1);

    const modelBool = new BaseModel(false);
    t.true(modelBool._id.indexOf('BaseModel') !== -1);
});

ava('makes sure the model in instantiates with any data type', t => {
    t.notThrows(() => new BaseModel());
    t.notThrows(() => new BaseModel([]));
    t.notThrows(() => new BaseModel({}));
    t.notThrows(() => new BaseModel(42));
    t.notThrows(() => new BaseModel('string'));
    t.notThrows(() => new BaseModel(false));
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
