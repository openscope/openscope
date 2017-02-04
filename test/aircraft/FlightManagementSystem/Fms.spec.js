import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';

import Fms from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/Fms';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import {
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK
} from '../_mocks/aircraftMocks';

const initialRunwayAssignmentMock = '19L';

function buildFmsMock(shouldUseComplexRoute = false) {
    if (shouldUseComplexRoute) {
        const complexRouteString = 'COWBY..BIKKR..DAG.KEPEC3.KLAS';
        const aircraftPropsMock = Object.assign({}, ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, { route: complexRouteString });

        return new Fms(aircraftPropsMock, initialRunwayAssignmentMock, navigationLibraryFixture);
    }

    return new Fms(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, initialRunwayAssignmentMock, navigationLibraryFixture);
}

ava('throws when called without parameters', (t) => {
    t.throws(() => new Fms());
});

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => new Fms(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, initialRunwayAssignmentMock, navigationLibraryFixture));
});

ava('#currentWaypoint returns the first waypoint of the first leg in the #legCollection', (t) => {
    const fms = buildFmsMock();

    t.true(_isEqual(fms.legCollection[0].waypointCollection[0], fms.currentWaypoint));
});

ava('.init() calls ._buildInitialLegCollection()', (t) => {
    const fms = buildFmsMock();
    const _buildInitialLegCollectionSpy = sinon.spy(fms, '_buildInitialLegCollection');

    fms.init(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);

    t.true(_buildInitialLegCollectionSpy.calledWithExactly(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK));
});

ava('.addLegToBeginning() adds a leg to the beginning of the #legCollection when passed a directRouteString', (t) => {
    const fms = buildFmsMock();

    fms.addLegToBeginning('BIKKR');

    t.true(fms.currentLeg.routeString === 'bikkr');
});

ava('.addLegToBeginning() adds a leg to the beginning of the #legCollection when passed a procedureRouteString', (t) => {
    const fms = buildFmsMock();
    fms.legCollection = [];

    fms.addLegToBeginning('DAG.KEPEC3.KLAS');

    t.true(fms.legCollection.length === 1);
    t.true(fms.legCollection[0].waypointCollection.length === 12);
});

ava('.nextWaypoint() calls ._moveToNextLeg() if the current waypointCollection.length === 0', (t) => {
    const fms = buildFmsMock(true);
    const _moveToNextLegSpy = sinon.spy(fms, '_moveToNextLeg');
    fms.legCollection[0].waypointCollection = [];

    fms.nextWaypoint();

    t.true(_moveToNextLegSpy.calledOnce);
});

ava('.nextWaypoint() calls ._moveToNextWaypointInLeg() if the current waypointCollection.length > 1', (t) => {
    const fms = buildFmsMock(true);
    const _moveToNextWaypointInLegSpy = sinon.spy(fms, '_moveToNextWaypointInLeg');

    fms.nextWaypoint();

    t.true(_moveToNextWaypointInLegSpy.calledOnce);
});

ava('.nextWaypoint() removes the first LegModel from legCollection when the first Leg has no waypoints', (t) => {
    const fms = buildFmsMock(true);
    const length = fms.legCollection.length;
    fms.legCollection[0].waypointCollection = [];

    fms.nextWaypoint();

    t.true(fms.legCollection.length === length - 1);
});

ava('._buildInitialLegCollection() returns an array of LegModels', (t) => {
    const fms = buildFmsMock(true);

    t.true(fms.legCollection.length === 3);
});
