/* eslint-disable arrow-parens, import/no-extraneous-dependencies*/
import ava from 'ava';
import sinon from 'sinon';

import StandardRouteWaypointModel from '../../../src/assets/scripts/airport/StandardRoute/StandardRouteWaypointModel';
import FixCollection from '../../../src/assets/scripts/airport/Fix/FixCollection';

import { airportPositionFixture } from '../../fixtures/airportFixtures';
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
    t.true(model._alititude === -1000);
    t.true(model._alititudeConstraint === '');
    t.true(model._speedConstraint === -1);
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
