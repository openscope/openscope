import ava from 'ava';

import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';

const fixnameMock = 'COWBY';
const holdFixLocationMock = [113.4636606631233, 6.12969620221002];
const waypointMock = {
    altitudeRestriction: -1,
    isFlyOverWaypoint: false,
    isVector: false,
    legLength: '',
    name: fixnameMock,
    positionModel: holdFixLocationMock,
    speedRestriction: -1,
    turnDirection: ''
};

const vectorWaypointPropsMock = {
    isFlyOverWaypoint: false,
    isVector: true,
    name: '#260'
};

ava('throws when instantiated without parameters', (t) => {
    t.throws(() => new WaypointModel());
});

ava('#hold returns properties for a holding pattern', (t) => {
    const waypointHoldMock = Object.assign({}, waypointMock, { legLength: '3min', turnDirection: 'right' });
    const model = new WaypointModel(waypointHoldMock);

    t.true(model.hold.dirTurns === 'right');
    t.true(model.hold.legLength === 3);
    t.true(model.hold.timer === -999);
});

ava('#isVector returns true when name starts with `#`', (t) => {
    const model = new WaypointModel(vectorWaypointPropsMock);

    t.true(model.isVector);
});

ava('#isVector returns false when name does not contain `#`', (t) => {
    const props = Object.assign({}, waypointMock, { legLength: '3min', turnDirection: 'right' });
    const model = new WaypointModel(props);

    t.false(model.isVector);
});

ava('#vector returns undefined when #isVector is false', (t) => {
    const props = Object.assign({}, waypointMock, { legLength: '3min', turnDirection: 'right' });
    const model = new WaypointModel(props);

    t.true(model.vector === undefined);
});

ava('#vector returns heading when #isVector is true', (t) => {
    const model = new WaypointModel(vectorWaypointPropsMock);
    const heading = model.vector;
    const expectedHeading = 4.537856055185257;

    t.true(heading === expectedHeading);
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
    model.updateWaypointWithHoldProps(0, 'left', '2min');

    t.true(model.isHold === true);
    t.true(model._holdingPatternInboundHeading === 0);
    t.true(model._turnDirection === 'left');
    t.true(model._legLength === '2min');
});
