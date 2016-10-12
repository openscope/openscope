/* eslint-disable arrow-parens, import/no-extraneous-dependencies*/
import ava from 'ava';
import sinon from 'sinon';

import StandardRouteWaypointModel from '../../../src/assets/scripts/airport/StandardRoute/StandardRouteWaypointModel';

const NAME_MOCK = 'GOPHR';
const RESTRICTIONS_MOCK = 'A80+|S250';
const ROUTE_WAYPOINT_MOCK = [NAME_MOCK, RESTRICTIONS_MOCK];

ava('StandardRouteWaypointModel exits early when instantiated without parameters', t => {
    t.notThrows(() => new StandardRouteWaypointModel());

    const model = new StandardRouteWaypointModel();

    t.true(typeof model._id === 'undefined');
});

ava('StandardRouteWaypointModel sets only `_name` when provided a string', t => {
    const model = new StandardRouteWaypointModel(NAME_MOCK);

    t.true(typeof model._id === 'string');
    t.true(model._name === 'GOPHR');
    t.true(model._alititude === -1000);
    t.true(model._alititudeConstraint === '');
    t.true(model._speedConstraint === -1);
});

ava('StandardRouteWaypointModel does not call ._parseWaypointRestrictions() when provided a string', t => {
    const model = new StandardRouteWaypointModel(NAME_MOCK);
    const spy = sinon.spy(model, '_parseWaypointRestrictions');

    model._init(NAME_MOCK);

    t.true(spy.callCount === 0);
});

ava('StandardRouteWaypointModel calls ._parseWaypointRestrictions() when provided and array', t => {
    const model = new StandardRouteWaypointModel(ROUTE_WAYPOINT_MOCK);
    const spy = sinon.spy(model, '_parseWaypointRestrictions');

    model._init(ROUTE_WAYPOINT_MOCK);

    t.true(spy.callCount === 1);
});
