/* eslint-disable arrow-parens, import/no-extraneous-dependencies, new-cap */
import ava from 'ava';
import sinon from 'sinon';

import modelSourcePool from '../../../src/assets/scripts/base/ModelSource/ModelSourcePool';
import FixModel from '../../../src/assets/scripts/airport/Fix/FixModel';

const SOURCE_NAME_MOCK = 'FixModel';

ava.serial('throws when attempting to instantiate', t => {
    t.throws(() => new modelSourcePool());
});

ava.serial('pre-populates pool with the specified number models', t => {
    t.true(modelSourcePool.length === modelSourcePool._maxPoolSizePerModel);
});

ava.serial('.returnReusable() throws if the modelToAdd is the incorrect type', t => {
    const modelToAdd = new Date();

    t.throws(() => modelSourcePool.returnReusable(modelToAdd));
});

ava.serial('.returnReusable() adds the modelToAdd to the pool', t => {
    const modelToAdd = new FixModel();
    const expectedResult = modelSourcePool.length + 1;

    modelSourcePool.returnReusable(modelToAdd);

    t.true(modelSourcePool.length === expectedResult);
});

ava.serial('.releasModelFromPool() calls _findModelOfType() with the correct argument', t => {
    const stub = sinon.stub(modelSourcePool, '_findModelOfType');
    modelSourcePool.releaseReusable(SOURCE_NAME_MOCK);

    t.true(stub.calledOnce);
    t.true(stub.getCall(0).args[0] === SOURCE_NAME_MOCK);
});

ava.serial('.releasModelFromPool() returns a model if one exists within the pool', t => {
    const result = modelSourcePool.releaseReusable(SOURCE_NAME_MOCK);
    t.true(result instanceof FixModel);
});

ava.serial('.releasModelFromPool() returns a model if none exist within the pool', t => {
    modelSourcePool._items = [];
    const result = modelSourcePool.releaseReusable(SOURCE_NAME_MOCK);

    t.true(result instanceof FixModel);
});
