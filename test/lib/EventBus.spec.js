import ava from 'ava';

import EventBus from '../../src/assets/scripts/client/lib/EventBus';


ava.beforeEach(() => {});

ava.afterEach(() => {});


ava('throws when attempting to instantiate', (t) => {
    t.throws(() => new EventBus());
});
