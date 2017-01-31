import ava from 'ava';
import sinon from 'sinon';

import LegModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/LegModel';
import FixModel from '../../../src/assets/scripts/client/navigationLibrary/Fix/FixModel';
import StandardRouteWaypointModel from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/StandardRouteWaypointModel';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';

const directRouteSegmentMock = 'COWBY';
const procedureRouteSegmentMock = 'DAG.KEPEC3.KLAS';
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

ava('._buildWaypointForDirectRoute() returns an instance of a FixModel', (t) => {
    const model = new LegModel(directRouteSegmentMock, runwayMock, navigationLibraryFixture);
    const result = model._buildWaypointForDirectRoute(directRouteSegmentMock);

    t.true(result instanceof FixModel);
    t.true(result.name === 'COWBY');
});

ava('._buildWaypointCollectionForProcedureRoute() returns a list of StandardRouteWaypointModels', (t) => {
    const model = new LegModel(procedureRouteSegmentMock, runwayMock, navigationLibraryFixture);
    const result = model._buildWaypointCollectionForProcedureRoute(procedureRouteSegmentMock);

    t.plan(result.length);
    for (let i = 0; i < result.length; i++) {
        t.true(result[i] instanceof StandardRouteWaypointModel);
    }
});
