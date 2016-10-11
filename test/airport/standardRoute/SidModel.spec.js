import ava from 'ava';

import SidModel from '../../../src/assets/scripts/airport/StandardRoute/SidModel';

ava('SidModel throws when instantiated with invaild parameters', t => {
    t.throws(() => new SidModel());
    t.throws(() => new SidModel([]));
    t.throws(() => new SidModel(''));
    t.throws(() => new SidModel(42));
    t.throws(() => new SidModel(false));
});
