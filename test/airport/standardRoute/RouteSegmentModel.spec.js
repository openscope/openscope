/* eslint-disable arrow-parens, import/no-extraneous-dependencies*/
import ava from 'ava';
import sinon from 'sinon';

import RouteSegmentModel from '../../../src/assets/scripts/airport/StandardRoute/RouteSegmentModel';
import FixCollection from '../../../src/assets/scripts/airport/Fix/FixCollection';

import { airportPositionFixtureKSFO } from '../../fixtures/airportFixtures';
import { FIX_LIST_MOCK } from '../Fix/_mocks/fixMocks';

const NAME_MOCK = '25R';
const SEGMENT_WAYPOINTS_MOCK = ['RBELL', ['ROPPR', 'A70'], ['MDDOG', 'A90'], ['TARRK', 'A110']];

ava.before(() => FixCollection.init(FIX_LIST_MOCK, airportPositionFixtureKSFO));
ava.after(() => FixCollection.destroy());

ava('throws with invalid parameters', t => {
    t.notThrows(() => new RouteSegmentModel(NAME_MOCK, SEGMENT_WAYPOINTS_MOCK));
});

ava('accepts name and segmentWaypoints as parameters', t => {
    const result = new RouteSegmentModel(NAME_MOCK, SEGMENT_WAYPOINTS_MOCK);

    t.true(result.name === NAME_MOCK);
    t.true(result.length === result._items.length);
    t.true(result._items.length === SEGMENT_WAYPOINTS_MOCK.length);
});

ava('accepts name as a single parameter', t => {
    const result = new RouteSegmentModel(NAME_MOCK);

    t.true(result.name === NAME_MOCK);
    t.true(result._items.length === 0);
    t.true(result.length === 0);
});

ava('._init() does not call ._createWaypointModelsFromList() when it receives only a `name`', t => {
    const model = new RouteSegmentModel();
    const spy = sinon.spy(model, '_createWaypointModelsFromList');

    model._init(NAME_MOCK);

    t.false(spy.calledOnce);
});

ava('._init() calls ._createWaypointModelsFromList() when it receives both a `name` and a `segmentList`', t => {
    const model = new RouteSegmentModel();
    const spy = sinon.spy(model, '_createWaypointModelsFromList');

    model._init(NAME_MOCK, SEGMENT_WAYPOINTS_MOCK);

    t.true(spy.calledOnce);
    t.true(spy.withArgs(SEGMENT_WAYPOINTS_MOCK).calledOnce);
});

ava('._addWaypointToCollection() throws if it does not receive a `StandardRouteWaypointModel`', t => {
    const model = new RouteSegmentModel(NAME_MOCK, SEGMENT_WAYPOINTS_MOCK);

    t.throws(() => model._addWaypointToCollection({}));
});
