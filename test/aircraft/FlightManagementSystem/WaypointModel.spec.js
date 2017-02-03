import ava from 'ava';

import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';

ava('throws when instantiated without parameters', (t) => {
    t.throws(() => new WaypointModel());
});
