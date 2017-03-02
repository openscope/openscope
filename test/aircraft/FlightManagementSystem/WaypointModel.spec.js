import ava from 'ava';

import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';

const fixnameMock = 'COWBY';
const holdFixLocationMock = [113.4636606631233, 6.12969620221002];
const WaypointMock = {
    turnDirection: '',
    legLength: '',
    name: fixnameMock,
    position: holdFixLocationMock,
    altitudeRestriction: -1,
    speedRestriction: -1
};

ava('throws when instantiated without parameters', (t) => {
    t.throws(() => new WaypointModel());
});

ava('.createHoldAtWaypoint() sets parameters as hold-specific properties', (t) => {
    const model = new WaypointModel(WaypointMock);
    model.createHoldAtWaypoint('left', '2min');

    t.true(model._turnDirection === 'left');
    t.true(model._legLength === '2min');
});
