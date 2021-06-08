/* eslint-disable arrow-parens, import/no-extraneous-dependencies, new-cap */
import ava from 'ava';

import ModelSourceFactory from '../../../src/assets/scripts/client/base/ModelSource/ModelSourceFactory';
import FixModel from '../../../src/assets/scripts/client/navigationLibrary/FixModel';
import {
    FIXNAME_MOCK,
    FIX_COORDINATE_MOCK
} from '../../navigationLibrary/Fix/_mocks/fixMocks';
import { airportPositionFixtureKSFO } from '../../fixtures/airportFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';

const SOURCE_NAME_MOCK = 'FixModel';
const FIX_ARGS_MOCK = [FIXNAME_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO];

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('throws when attempting to instantiate', t => {
    t.throws(() => new ModelSourceFactory());
});

ava('.getModelSourceForType() throws when provided an unsupported type', t => {
    t.throws(() => ModelSourceFactory.getModelSourceForType('abc'));
});

ava('.getModelSourceForType() does not throw when provided a supported type', t => {
    t.notThrows(() => ModelSourceFactory.getModelSourceForType(SOURCE_NAME_MOCK, ...FIX_ARGS_MOCK));
});

ava('.getModelSourceForType() returns a constructor when one doesnt exist in the pool', t => {
    const result = ModelSourceFactory.getModelSourceForType(SOURCE_NAME_MOCK, ...FIX_ARGS_MOCK);

    t.true(result instanceof FixModel);
});

ava('.getModelSourceForType() returns a constructor that exists in the pool', t => {
    const model = new FixModel(...FIX_ARGS_MOCK);
    ModelSourceFactory.returnModelToPool(model);
    const result = ModelSourceFactory.getModelSourceForType(SOURCE_NAME_MOCK, ...FIX_ARGS_MOCK);

    t.true(result instanceof FixModel);
});

ava('.returnModelToPool() throws when provided an unsupported type', t => {
    const model = new Date();

    t.throws(() => ModelSourceFactory.returnModelToPool(model));
});

ava('.returnModelToPool() accepts a class instance', t => {
    const model = new FixModel(...FIX_ARGS_MOCK);

    t.notThrows(() => ModelSourceFactory.returnModelToPool(model));
});
