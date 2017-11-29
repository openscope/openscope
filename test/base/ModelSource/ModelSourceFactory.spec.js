/* eslint-disable arrow-parens, import/no-extraneous-dependencies, new-cap */
import ava from 'ava';

import modelSourceFactory from '../../../src/assets/scripts/client/base/ModelSource/ModelSourceFactory';
import FixModel from '../../../src/assets/scripts/client/navigationLibrary/FixModel';

const SOURCE_NAME_MOCK = 'FixModel';

ava('throws when attempting to instantiate', t => {
    t.throws(() => new modelSourceFactory());
});

ava('.getModelSourceForType() throws when provided an unsupported type', t => {
    t.throws(() => modelSourceFactory.getModelSourceForType('abc'));
});

ava('.getModelSourceForType() does not throw when provided a supported type', t => {
    t.notThrows(() => modelSourceFactory.getModelSourceForType(SOURCE_NAME_MOCK));
});

ava('.getModelSourceForType() returns a constructor when one doesnt exist in the pool', t => {
    const result = modelSourceFactory.getModelSourceForType(SOURCE_NAME_MOCK);

    t.true(result instanceof FixModel);
});

ava('.getModelSourceForType() returns a constructor that exists in the pool', t => {
    const model = new FixModel();
    modelSourceFactory.returnModelToPool(model);
    const result = modelSourceFactory.getModelSourceForType(SOURCE_NAME_MOCK);

    t.true(result instanceof FixModel);
});

ava('.returnModelToPool() throws when provided an unsupported type', t => {
    const model = new Date();

    t.throws(() => modelSourceFactory.returnModelToPool(model));
});

ava('.returnModelToPool() accepts a class instance', t => {
    const model = new FixModel();

    t.notThrows(() => modelSourceFactory.returnModelToPool(model));
});
