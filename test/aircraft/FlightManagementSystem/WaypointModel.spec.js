import ava from 'ava';
import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';
import { INVALID_NUMBER } from '../../../src/assets/scripts/client/constants/globalConstants';

const fixnameMock = 'COWBY';
const holdFixLocationMock = [113.4636606631233, 6.12969620221002];
const waypointMock = {
    altitudeMaximum: INVALID_NUMBER,
    altitudeMinimum: INVALID_NUMBER,
    isFlyOverWaypoint: false,
    isVector: false,
    legLength: '',
    name: fixnameMock,
    positionModel: holdFixLocationMock,
    speedMaximum: INVALID_NUMBER,
    speedMinimum: INVALID_NUMBER,
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

ava('.hasMaximumAltitudeBelow returns true when current altitude is above', (t) => {
    const waypointWithMaximumAltitude = Object.assign({}, waypointMock, {altitudeMaximum: 5000});
    const model = new WaypointModel(waypointWithMaximumAltitude);

    t.true(model.hasMaximumAltitudeBelow(6000) === true);
});

ava('.hasMaximumAltitudeBelow returns false when current altitude is below', (t) => {
    const waypointWithMaximumAltitude = Object.assign({}, waypointMock, {altitudeMaximum: 5000});
    const model = new WaypointModel(waypointWithMaximumAltitude);

    t.true(model.hasMaximumAltitudeBelow(4000) === false);
});

ava('.hasMaximumAltitudeBelow returns false when no maximum is specified', (t) => {
    const waypointWithoutMaximumAltitude = Object.assign({}, waypointMock, {altitudeMaximum: INVALID_NUMBER});
    const model = new WaypointModel(waypointWithoutMaximumAltitude);

    t.true(model.hasMaximumAltitudeBelow(6000) === false);
});

ava('.hasMinimumAltitudeAbove returns false when current altitude is above', (t) => {
    const waypointWithMinimumAltitude = Object.assign({}, waypointMock, {altitudeMinimum: 5000});
    const model = new WaypointModel(waypointWithMinimumAltitude);

    t.true(model.hasMinimumAltitudeAbove(6000) === false);
});

ava('.hasMinimumAltitudeAbove returns true when current altitude is below', (t) => {
    const waypointWithMinimumAltitude = Object.assign({}, waypointMock, {altitudeMinimum: 5000});
    const model = new WaypointModel(waypointWithMinimumAltitude);

    t.true(model.hasMinimumAltitudeAbove(4000) === true);
});

ava('.hasMinimumAltitudeAbove returns false when no minimum is specified', (t) => {
    const waypointWithoutMinimumAltitude = Object.assign({}, waypointMock, {altitudeMinimum: INVALID_NUMBER});
    const model = new WaypointModel(waypointWithoutMinimumAltitude);

    t.true(model.hasMinimumAltitudeAbove(6000) === false);
});
