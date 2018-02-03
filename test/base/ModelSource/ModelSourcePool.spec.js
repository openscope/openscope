/* eslint-disable arrow-parens, import/no-extraneous-dependencies, new-cap */
import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';

import modelSourcePool from '../../../src/assets/scripts/client/base/ModelSource/ModelSourcePool';
import FixModel from '../../../src/assets/scripts/client/navigationLibrary/FixModel';
import { airportPositionFixtureKSFO } from '../../fixtures/airportFixtures';
import {
    FIXNAME_MOCK,
    FIX_COORDINATE_MOCK
} from '../../navigationLibrary/Fix/_mocks/fixMocks';

const SOURCE_NAME_MOCK = 'FixModel';

// when reactivating, use ava.serial
ava.skip('throws when attempting to instantiate', t => {
    t.throws(() => new modelSourcePool());
});

// when reactivating, use ava.serial
ava.skip('pre-populates pool with the specified number models', t => {
    t.true(modelSourcePool.length !== 0);
    t.true(modelSourcePool.length <= modelSourcePool._maxPoolSizePerModel);
});

// when reactivating, use ava.serial
ava.skip('.returnReusable() throws if the modelToAdd is the incorrect type', t => {
    const modelToAdd = new Date();

    t.throws(() => modelSourcePool.returnReusable(modelToAdd));
});

// when reactivating, use ava.serial
ava.skip('.returnReusable() adds the modelToAdd to the pool', t => {
    const reusableModel = new FixModel(FIXNAME_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);
    const expectedResult = modelSourcePool.length + 1;

    modelSourcePool.returnReusable(reusableModel);

    t.true(modelSourcePool.length === expectedResult);
});

// when reactivating, use ava.serial
ava.skip('._findModelByConstructorName() returns null if no instance is found within the pool', t => {
    const result = modelSourcePool._findModelByConstructorName('Date');

    t.true(!result);
});

// when reactivating, use ava.serial
ava.skip('._findModelByConstructorName() returns an instance if one is found within the pool', t => {
    const result = modelSourcePool._findModelByConstructorName('FixModel');

    t.true(result instanceof FixModel);
});

// when reactivating, use ava.serial
ava.skip('._findModelByConstructorName() calls ._removeItem() when an instance is found within the pool', t => {
    const stub = sinon.stub(modelSourcePool, '_removeItem');
    const result = modelSourcePool._findModelByConstructorName('FixModel');

    t.true(result instanceof FixModel);
    t.true(stub.withArgs(result).calledOnce);
});

// when reactivating, use ava.serial
ava.skip('.releaseModelFromPool() calls _findModelByConstructorName() with the correct argument', t => {
    const stub = sinon.stub(modelSourcePool, '_findModelByConstructorName');
    modelSourcePool.releaseReusable(SOURCE_NAME_MOCK, FIXNAME_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);

    t.true(stub.calledOnce);
    t.true(stub.getCall(0).args[0] === SOURCE_NAME_MOCK);
});

// when reactivating, use ava.serial
ava.skip('.releaseModelFromPool() returns a model if one exists within the pool', t => {
    const expectedPosition = [74.90562387226687, 81.0566028386814];
    const result = modelSourcePool.releaseReusable(SOURCE_NAME_MOCK, FIXNAME_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);

    t.true(result instanceof FixModel);
    t.true(result.name === FIXNAME_MOCK);
    t.true(_isEqual(result.relativePosition, expectedPosition));
});

// when reactivating, use ava.serial
ava.skip('.releasModelFromPool() returns a model if none exist within the pool', t => {
    modelSourcePool._items = [];
    const expectedPosition = [74.90562387226687, 81.0566028386814];
    const result = modelSourcePool.releaseReusable(SOURCE_NAME_MOCK, FIXNAME_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);

    t.true(result instanceof FixModel);
    t.true(result.name === FIXNAME_MOCK);
    t.true(_isEqual(result.relativePosition, expectedPosition));
});
