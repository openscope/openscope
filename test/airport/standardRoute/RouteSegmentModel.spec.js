/* eslint-disable arrow-parens, import/no-extraneous-dependencies*/
import ava from 'ava';

import RouteSegmentModel from '../../../src/assets/scripts/airport/StandardRoute/RouteSegmentModel';

const NAME_MOCK = '25R';
const SEGMENT_WAYPOINTS_MOCK = ['RBELL', ['ROPPR', 'A70'], ['MDDOG', 'A90'], ['TARRK', 'A110']];

ava('throws with invalid parameters', t => {
    t.throws(() => new RouteSegmentModel());
    t.throws(() => new RouteSegmentModel(NAME_MOCK));
    t.throws(() => new RouteSegmentModel(NAME_MOCK));
    t.throws(() => new RouteSegmentModel(NAME_MOCK, {}));
    t.throws(() => new RouteSegmentModel(NAME_MOCK, ''));

    t.notThrows(() => new RouteSegmentModel(NAME_MOCK, SEGMENT_WAYPOINTS_MOCK));
});

ava('accepts name and segmentWaypoints as parameters', t => {
    const result = new RouteSegmentModel(NAME_MOCK, SEGMENT_WAYPOINTS_MOCK);

    t.true(result.name === NAME_MOCK);
    t.true(result.length === result._items.length);
    t.true(result._items.length === SEGMENT_WAYPOINTS_MOCK.length);
});

ava('._addWaypointToCollection() throws if it does not receive a `StandardRouteWaypointModel`', t => {
    const model = new RouteSegmentModel(NAME_MOCK, SEGMENT_WAYPOINTS_MOCK);

    t.throws(() => model._addWaypointToCollection({}));
});
