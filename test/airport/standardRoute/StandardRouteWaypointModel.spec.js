/* eslint-disable arrow-parens, import/no-extraneous-dependencies*/
import ava from 'ava';
import sinon from 'sinon';

import StandardRouteWaypointModel from '../../../src/assets/scripts/airport/StandardRoute/StandardRouteWaypointModel';
import FixCollection from '../../../src/assets/scripts/airport/Fix/FixCollection';
import Waypoint from '../../../src/assets/scripts/aircraft/Waypoint';

import {
    airportPositionFixture,
    airportModelFixtureForWaypoint
} from '../../fixtures/airportFixtures';
import { FIX_LIST_MOCK } from '../fix/_mocks/fixMocks';

const NAME_MOCK = 'BIKKR';
const RESTRICTIONS_MOCK = 'A80+|S250';
const ROUTE_WAYPOINT_MOCK = [NAME_MOCK, RESTRICTIONS_MOCK];

ava.before(() => FixCollection.init(FIX_LIST_MOCK, airportPositionFixture));
ava.after(() => FixCollection.destroy());

ava('StandardRouteWaypointModel exits early when instantiated without parameters', t => {
    t.notThrows(() => new StandardRouteWaypointModel());

    const model = new StandardRouteWaypointModel();

    t.true(typeof model.name === 'undefined');
});

ava('sets only `name` when provided a string', t => {
    const model = new StandardRouteWaypointModel(NAME_MOCK);

    t.true(typeof model._id === 'string');
    t.true(model.name === NAME_MOCK);
    t.true(model._altitude === null);
    t.true(model._altitudeConstraint === '');
    t.true(model._speed === null);
});

ava('.clonePoisitonFromFix() does not throw when no fix exists', t => {
    const model = new StandardRouteWaypointModel('ABCD');

    t.notThrows(() => model.clonePoisitonFromFix());
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

ava('.generateFmsWaypoint() returns a new instance of an FMS Waypoint object', t => {
    const model = new StandardRouteWaypointModel(ROUTE_WAYPOINT_MOCK);
    const result = model.generateFmsWaypoint(airportModelFixtureForWaypoint);

    t.true(result instanceof Waypoint);
    t.true(model.name === result.fix);
    t.true(model._altitude === result.fixRestrictions.alt);
    t.true(model._speed === result.fixRestrictions.spd);
});

ava('._parseWaypointRestrictions() extracts alititude and speed restrictions from a waypointRestrictions string', t => {
    const model = new StandardRouteWaypointModel(ROUTE_WAYPOINT_MOCK);

    model._parseWaypointRestrictions(RESTRICTIONS_MOCK);

    t.true(model._altitude === '80+');
    t.true(model._speed === '250');
});

ava('._parseWaypointRestrictions() extracts an alititude restriction from a waypointRestrictions string by calling ._setAltitudeRestriction()', t => {
    const model = new StandardRouteWaypointModel(['BAKRR', 'A80+']);
    const spy = sinon.spy(model, '_setAltitudeRestriction');

    model._parseWaypointRestrictions('A80+');

    t.true(spy.callCount === 1);
    t.true(model._altitude === '80+');
    t.true(model._speed === null);
});

ava('._parseWaypointRestrictions() extracts a speed restriction from a waypointRestrictions string by calling ._setSpeedRestriction()', t => {
    const model = new StandardRouteWaypointModel(['BAKRR', 'S280']);
    const spy = sinon.spy(model, '_setSpeedRestriction');

    model._parseWaypointRestrictions('XYZ|S280');

    t.true(spy.callCount === 1);
    t.true(model._altitude === null);
    t.true(model._speed === '280');
});

ava('._parseWaypointRestrictions() returns early if no paramater is received', t => {
    const model = new StandardRouteWaypointModel(['BAKRR']);

    model._parseWaypointRestrictions();

    t.true(model._altitude === null);
    t.true(model._speed === null);
});
