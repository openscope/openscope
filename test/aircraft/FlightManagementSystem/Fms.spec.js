import ava from 'ava';
import sinon from 'sinon';

import Fms from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/Fms';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import { AIRCRAFT_INITIALIZATION_PROPS_MOCK } from '../_mocks/aircraftMocks';

const initialRunwayAssignmentMock = '19L';

ava('throws when called without parameters', (t) => {
    t.throws(() => new Fms());
});

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => new Fms(AIRCRAFT_INITIALIZATION_PROPS_MOCK, initialRunwayAssignmentMock, navigationLibraryFixture));
});

ava('.init() calls ._buildInitialLegsCollection()', (t) => {
    const fms = new Fms(AIRCRAFT_INITIALIZATION_PROPS_MOCK, initialRunwayAssignmentMock, navigationLibraryFixture);
    const _buildInitialLegsCollectionSpy = sinon.spy(fms, '_buildInitialLegsCollection');

    fms.init(AIRCRAFT_INITIALIZATION_PROPS_MOCK);

    t.true(_buildInitialLegsCollectionSpy.calledWithExactly(AIRCRAFT_INITIALIZATION_PROPS_MOCK));
});

ava('._buildInitialLegsCollection() returns an array of LegModels', (t) => {
    const complexRouteString = 'COWBY..BIKKR..DAG.KEPEC3.KLAS';
    const aircraftPropsMock = Object.assign({}, AIRCRAFT_INITIALIZATION_PROPS_MOCK, { route: complexRouteString });
    const fms = new Fms(aircraftPropsMock, initialRunwayAssignmentMock, navigationLibraryFixture);

    t.true(fms.legCollection.length === 3);
});
