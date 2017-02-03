import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';

import Fms from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/Fms';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import { AIRCRAFT_INITIALIZATION_PROPS_MOCK } from '../_mocks/aircraftMocks';

const initialRunwayAssignmentMock = '19L';

function buildFmsMock() {
    return new Fms(AIRCRAFT_INITIALIZATION_PROPS_MOCK, initialRunwayAssignmentMock, navigationLibraryFixture);
}

ava('throws when called without parameters', (t) => {
    t.throws(() => new Fms());
});

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => new Fms(AIRCRAFT_INITIALIZATION_PROPS_MOCK, initialRunwayAssignmentMock, navigationLibraryFixture));
});

ava('#currentWaypoint returns the first waypoint of the first leg in the #legCollection', (t) => {
    const fms = buildFmsMock();

    t.true(_isEqual(fms.legCollection[0].waypointCollection[0], fms.currentWaypoint));
});

ava('.init() calls ._buildInitialLegCollection()', (t) => {
    const fms = new Fms(AIRCRAFT_INITIALIZATION_PROPS_MOCK, initialRunwayAssignmentMock, navigationLibraryFixture);
    const _buildInitialLegCollectionSpy = sinon.spy(fms, '_buildInitialLegCollection');

    fms.init(AIRCRAFT_INITIALIZATION_PROPS_MOCK);

    t.true(_buildInitialLegCollectionSpy.calledWithExactly(AIRCRAFT_INITIALIZATION_PROPS_MOCK));
});

ava('._buildInitialLegCollection() returns an array of LegModels', (t) => {
    const complexRouteString = 'COWBY..BIKKR..DAG.KEPEC3.KLAS';
    const aircraftPropsMock = Object.assign({}, AIRCRAFT_INITIALIZATION_PROPS_MOCK, { route: complexRouteString });
    const fms = new Fms(aircraftPropsMock, initialRunwayAssignmentMock, navigationLibraryFixture);

    t.true(fms.legCollection.length === 3);
});
