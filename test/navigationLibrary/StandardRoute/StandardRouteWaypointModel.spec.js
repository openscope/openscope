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

ava('._parseWaypointRestrictions() extracts alititude and speed restrictions from a waypointRestrictions string', t => {
    const model = new StandardRouteWaypointModel(ROUTE_WAYPOINT_MOCK);

    model._parseWaypointRestrictions(RESTRICTIONS_MOCK);

    t.true(model._altitude === 8000);
    t.true(model._speed === 250);
});

ava('._parseWaypointRestrictions() extracts an alititude restriction from a waypointRestrictions string by calling ._setAltitudeRestriction()', t => {
    const model = new StandardRouteWaypointModel(['BAKRR', 'A80+']);
    const spy = sinon.spy(model, '_setAltitudeRestriction');

    model._parseWaypointRestrictions('A180+');

    t.true(spy.callCount === 1);
    t.true(model._altitude === 18000);
    t.true(model._speed === -1);
});

ava('._parseWaypointRestrictions() extracts a speed restriction from a waypointRestrictions string by calling ._setSpeedRestriction()', t => {
    const model = new StandardRouteWaypointModel(['BAKRR', 'S280']);
    const spy = sinon.spy(model, '_setSpeedRestriction');

    model._parseWaypointRestrictions('XYZ|S280');

    t.true(spy.callCount === 1);
    t.true(model._altitude === -1);
    t.true(model._speed === 280);
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
