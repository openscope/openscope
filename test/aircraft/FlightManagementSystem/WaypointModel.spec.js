import ava from 'ava';

import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';

const fixnameMock = 'COWBY';
const holdFixLocationMock = [113.4636606631233, 6.12969620221002];
const waypointMock = {
    turnDirection: '',
    legLength: '',
    name: fixnameMock,
    positionModel: holdFixLocationMock,
    altitudeRestriction: -1,
    speedRestriction: -1
};

ava('throws when instantiated without parameters', (t) => {
    t.throws(() => new WaypointModel());
});

ava('returns waypoint name when requesting the name of a waypoint that does not begin with an underscore', (t) => {
    const model = new WaypointModel(waypointMock);

    t.true(model.name === fixnameMock.toLowerCase());
});

ava('returns RNAV when requesting the name of a waypoint that begins with an underscore', (t) => {
    const waypointWithRnavMock = Object.assign({}, waypointMock, { name: '_NAPSE068' });
    const model = new WaypointModel(waypointWithRnavMock);

    t.true(model.name === 'RNAV');
});

ava('.updateWaypointWithHoldProps() sets parameters as hold-specific properties', (t) => {
    const model = new WaypointModel(waypointMock);
    model.updateWaypointWithHoldProps('left', '2min');

    t.true(model.isHold === true);
    t.true(model._turnDirection === 'left');
    t.true(model._legLength === '2min');
});
