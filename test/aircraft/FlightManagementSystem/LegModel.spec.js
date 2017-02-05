import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import _isEqual from 'lodash/isEqual';

import LegModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/LegModel';
import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';

const directRouteSegmentMock = 'COWBY';
const procedureRouteSegmentMock = 'DAG.KEPEC3.KLAS';
const runwayMock = '19L';
const categoryMock = 'arrival';

ava('throws when passed invalid parameters', (t) => {
    t.throws(() => new LegModel());
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new LegModel(procedureRouteSegmentMock, runwayMock, categoryMock, navigationLibraryFixture));
});

ava('#currentWaypoint returns the first item in #waypointCollection', (t) => {
    const model = new LegModel(procedureRouteSegmentMock, runwayMock, categoryMock, navigationLibraryFixture);

    t.true(_isEqual(model.waypointCollection[0], model.currentWaypoint));
});

ava('.init() calls ._buildWaypointCollection()', (t) => {
    const model = new LegModel(procedureRouteSegmentMock, runwayMock, categoryMock, navigationLibraryFixture);
    const _buildWaypointCollectionSpy = sinon.spy(model, '_buildWaypointCollection');

    model.init(procedureRouteSegmentMock, runwayMock, categoryMock);

    t.true(_buildWaypointCollectionSpy.calledWithExactly(procedureRouteSegmentMock, runwayMock, categoryMock));
});

ava('.skipToWaypointAtIndex() drops n number of WaypointModels from  the left of #waypointCollection', (t) => {
    const model = new LegModel(procedureRouteSegmentMock, runwayMock, categoryMock, navigationLibraryFixture);

    model.skipToWaypointAtIndex(3);

    t.true(model.waypointCollection.length === 9);
    t.true(model.currentWaypoint.name === 'skebr');
});

ava('._buildWaypointForDirectRoute() returns an instance of a WaypointModel', (t) => {
    const model = new LegModel(directRouteSegmentMock, runwayMock, categoryMock, navigationLibraryFixture);
    const result = model._buildWaypointForDirectRoute(directRouteSegmentMock);

    t.true(_isArray(result));
    t.true(result[0] instanceof WaypointModel);
    t.true(result[0].name === 'cowby');
});

ava('._buildWaypointCollectionForProcedureRoute() returns a list of WaypointModels', (t) => {
    const model = new LegModel(procedureRouteSegmentMock, runwayMock, categoryMock, navigationLibraryFixture);
    const result = model._buildWaypointCollectionForProcedureRoute(procedureRouteSegmentMock, runwayMock);

    t.plan(result.length);
    for (let i = 0; i < result.length; i++) {
        t.true(result[i] instanceof WaypointModel);
    }
});
