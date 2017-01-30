import ava from 'ava';
import sinon from 'sinon';

import LegModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/LegModel';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import { AIRCRAFT_INITIALIZATION_PROPS_MOCK } from '../_mocks/aircraftMocks';

const procedureRouteSegmentMock = AIRCRAFT_INITIALIZATION_PROPS_MOCK.route;
const runwayMock = '19L';

ava('throws when passed invalid parameters', (t) => {
    t.throws(() => new LegModel());
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new LegModel(procedureRouteSegmentMock, runwayMock, navigationLibraryFixture));
});

ava('.init() calls ._buildWaypointCollection()', (t) => {
    const model = new LegModel(procedureRouteSegmentMock, runwayMock, navigationLibraryFixture);
    const _buildWaypointCollectionSpy = sinon.spy(model, '_buildWaypointCollection');

    model.init(procedureRouteSegmentMock);

    t.true(_buildWaypointCollectionSpy.calledWithExactly(procedureRouteSegmentMock));
});
