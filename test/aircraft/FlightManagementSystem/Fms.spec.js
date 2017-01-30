import ava from 'ava';

import Fms from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/Fms';

ava('does not throw when called without parameters', (t) => {
    t.notThrows(() => new Fms());
});
