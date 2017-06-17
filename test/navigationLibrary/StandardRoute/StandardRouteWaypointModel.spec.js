import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';

import StandardRouteWaypointModel from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/StandardRouteWaypointModel';
import FixCollection from '../../../src/assets/scripts/client/navigationLibrary/Fix/FixCollection';
import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';

import {
    airportPositionFixtureKSFO,
    airportModelFixture
} from '../../fixtures/airportFixtures';
import { FIX_LIST_MOCK } from '../Fix/_mocks/fixMocks';

const NAME_MOCK = 'BIKKR';
const RESTRICTIONS_MOCK = 'A80+|S250';
const ROUTE_WAYPOINT_MOCK = [NAME_MOCK, RESTRICTIONS_MOCK];
const NAME_FLY_OVER_MOCK = '^BIKKR';

ava.before(() => FixCollection.addItems(FIX_LIST_MOCK, airportPositionFixtureKSFO));
ava.after(() => FixCollection.removeItems());

ava('StandardRouteWaypointModel exits early when instantiated without parameters', t => {
    t.notThrows(() => new StandardRouteWaypointModel());

    const model = new StandardRouteWaypointModel();

    t.true(typeof model.name === 'undefined');
});

ava('sets only `name` when provided a string', t => {
    const model = new StandardRouteWaypointModel(NAME_MOCK);

    t.true(typeof model._id === 'string');
    t.true(model.name === NAME_MOCK);
    t.true(model._altitude === -1);
    t.true(model._altitudeConstraint === '');
    t.true(model._speed === -1);
});

ava('.clonePositionFromFix() does not throw when no fix exists', t => {
    const model = new StandardRouteWaypointModel('ABCD');

    t.notThrows(() => model.clonePositionFromFix());
});

ava('does not call ._parseWaypointRestrictions() when provided a string', t => {
    const model = new StandardRouteWaypointModel(NAME_MOCK);
    const spy = sinon.spy(model, '_parseWaypointRestrictions');

    model._init(NAME_MOCK);

    t.true(spy.callCount === 0);
});

ava('calls ._parseWaypointRestrictions() when provided and array', t => {
    const model = new StandardRouteWaypointModel(ROUTE_WAYPOINT_MOCK);
    const spy = sinon.spy(model, '_parseWaypointRestrictions');

    model._init(ROUTE_WAYPOINT_MOCK);

    t.true(spy.callCount === 1);
});

ava('.toWaypointModel() returns a new instance of a WaypointModel', t => {
    const model = new StandardRouteWaypointModel(ROUTE_WAYPOINT_MOCK);
    const result = model.toWaypointModel();

    t.true(result instanceof WaypointModel);
    t.true(result.name === model.name.toLowerCase());
    t.true(_isArray(result.relativePosition));
    t.true(result.altitudeRestriction === 8000);
    t.true(result.speedRestriction === 250);
});

ava('._parseWaypointRestrictions() extracts all restrictions when ranged restrictions are used', (t) => {
    const modelWithAltitude = new StandardRouteWaypointModel(['BAKRR', 'A100+|A140-']);
    const modelWithSpeed = new StandardRouteWaypointModel(['BAKRR', 'S210+|S250-']);
    const modelWithAltitudeAndSpeed = new StandardRouteWaypointModel(['BAKRR', 'A100+|A140-|S210+|S250-']);

    t.true(modelWithAltitude._altitudeMinimum === 10000);
    t.true(modelWithAltitude._altitudeMaximum === 14000);
    t.true(modelWithSpeed._speedMinimum === 210);
    t.true(modelWithSpeed._speedMaximum === 250);
    t.true(modelWithAltitudeAndSpeed._altitudeMinimum === 10000);
    t.true(modelWithAltitudeAndSpeed._altitudeMaximum === 14000);
    t.true(modelWithAltitudeAndSpeed._speedMinimum === 210);
    t.true(modelWithAltitudeAndSpeed._speedMaximum === 250);
});

ava('._parseWaypointRestrictions() extracts all restrictions when non-ranged "AT" restrictions are used', (t) => {
    const modelWithAltitudeRange = new StandardRouteWaypointModel(['BAKRR', 'A100']);
    const modelWithSpeedRange = new StandardRouteWaypointModel(['BAKRR', 'S210']);
    const modelWithAltitudeRangeAndSpeedRange = new StandardRouteWaypointModel(['BAKRR', 'A100|S210']);

    t.true(modelWithAltitudeRange._altitudeMinimum === 10000);
    t.true(modelWithAltitudeRange._altitudeMaximum === 10000);
    t.true(modelWithSpeedRange._speedMinimum === 210);
    t.true(modelWithSpeedRange._speedMaximum === 210);
    t.true(modelWithAltitudeRangeAndSpeedRange._altitudeMinimum === 10000);
    t.true(modelWithAltitudeRangeAndSpeedRange._altitudeMaximum === 10000);
    t.true(modelWithAltitudeRangeAndSpeedRange._speedMinimum === 210);
    t.true(modelWithAltitudeRangeAndSpeedRange._speedMaximum === 210);
});

ava('._parseWaypointRestrictions() extracts all restrictions when non-ranged "AT/ABOVE" or "AT/BELOW" restrictions are used', (t) => {
    const modelWithAltitude = new StandardRouteWaypointModel(['BAKRR', 'A100+']);
    const modelWithSpeed = new StandardRouteWaypointModel(['BAKRR', 'S210-']);
    const modelWithAltitudeAndSpeed = new StandardRouteWaypointModel(['BAKRR', 'A100-|S210+']);

    t.true(modelWithAltitude._altitudeMinimum === 10000);
    t.true(modelWithAltitude._altitudeMaximum === -1);
    t.true(modelWithSpeed._speedMinimum === -1);
    t.true(modelWithSpeed._speedMaximum === 210);
    t.true(modelWithAltitudeAndSpeed._altitudeMinimum === -1);
    t.true(modelWithAltitudeAndSpeed._altitudeMaximum === 10000);
    t.true(modelWithAltitudeAndSpeed._speedMinimum === 210);
    t.true(modelWithAltitudeAndSpeed._speedMaximum === -1);
});

ava('._parseWaypointRestrictions() returns early if no paramater is received', t => {
    const model = new StandardRouteWaypointModel(['BAKRR']);

    model._parseWaypointRestrictions();

    t.true(model._altitude === -1);
    t.true(model._speed === -1);
});

ava('#_isFlyOverWaypoint is true for fix prepended by fly-over character', (t) => {
    const model = new StandardRouteWaypointModel(NAME_FLY_OVER_MOCK);

    t.true(model._isFlyOverWaypoint);
});
