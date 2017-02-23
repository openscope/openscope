import ava from 'ava';
import sinon from 'sinon';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';


ava('throws when instantiated with invalid parameters', (t) => {
    t.throws(() => new Pilot());
});
