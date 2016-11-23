/* eslint-disable arrow-parens, import/no-extraneous-dependencies, new-cap */
import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';

import modelSourcePool from '../../../src/assets/scripts/base/ModelSource/ModelSourcePool';
import FixModel from '../../../src/assets/scripts/airport/Fix/FixModel';
import { airportPositionFixture } from '../../fixtures/airportFixtures';
import {
    FIXNAME_MOCK,
    FIX_COORDINATE_MOCK
} from '../../airport/fix/_mocks/fixMocks';

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
    const reusableModel = new FixModel(FIXNAME_MOCK, FIX_COORDINATE_MOCK, airportPositionFixture);
    const expectedResult = modelSourcePool.length + 1;

    modelSourcePool.returnReusable(reusableModel);

    t.true(modelSourcePool.length === expectedResult);
});

ava.serial('._findModelByConstructorName() returns null if no instance is found within the pool', t => {
    const result = modelSourcePool._findModelByConstructorName('Date');

    t.true(result === null);
});

ava.serial('._findModelByConstructorName() returns an instance if one is found within the pool', t => {
    const result = modelSourcePool._findModelByConstructorName('FixModel');

    t.true(result instanceof FixModel);
});

ava.serial('._findModelByConstructorName() calls ._removeItem() when an instance is found within the pool', t => {
    const stub = sinon.stub(modelSourcePool, '_removeItem');
    const result = modelSourcePool._findModelByConstructorName('FixModel');

    t.true(result instanceof FixModel);
    t.true(stub.withArgs(result).calledOnce);
});

ava.serial('.releasModelFromPool() calls _findModelByConstructorName() with the correct argument', t => {
    const stub = sinon.stub(modelSourcePool, '_findModelByConstructorName');
    modelSourcePool.releaseReusable(SOURCE_NAME_MOCK, FIXNAME_MOCK, FIX_COORDINATE_MOCK, airportPositionFixture);

    t.true(stub.calledOnce);
    t.true(stub.getCall(0).args[0] === SOURCE_NAME_MOCK);
});

ava.serial('.releasModelFromPool() returns a model if one exists within the pool', t => {
    const expectedPosition = [110.09968269139137, -7.686691271034179];
    const result = modelSourcePool.releaseReusable(SOURCE_NAME_MOCK, FIXNAME_MOCK, FIX_COORDINATE_MOCK, airportPositionFixture);

    t.true(result instanceof FixModel);
    t.true(result.name === FIXNAME_MOCK);
    t.true(_isEqual(result.position, expectedPosition));
});

ava.serial('.releasModelFromPool() returns a model if none exist within the pool', t => {
    modelSourcePool._items = [];
    const expectedPosition = [110.09968269139137, -7.686691271034179];
    const result = modelSourcePool.releaseReusable(SOURCE_NAME_MOCK, FIXNAME_MOCK, FIX_COORDINATE_MOCK, airportPositionFixture);

    t.true(result instanceof FixModel);
    t.true(result.name === FIXNAME_MOCK);
    t.true(_isEqual(result.position, expectedPosition));
});
