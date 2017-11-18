import ava from 'ava';
import _isArray from 'lodash/isArray';
import RouteModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/RouteModel';
import { createNavigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';

// mocks
const complexRouteStringMock = 'KLAS07R.BOACH6.TNP..OAL..MLF..PGS.TYSSN4.KLAS07R';
const singleDirectSegmentRouteStringMock = 'OAL..MLF';
const multiDirectSegmentRouteStringMock = 'OAL..MLF..PGS';
const singleProcedureSegmentRouteStringMock = 'KLAS07R.BOACH6.TNP';
const multiProcedureSegmentRouteStringMock = 'KLAS07R.BOACH6.TNP.KEPEC3.KLAS07R';
const nightmareRouteStringMock = 'TNP.KEPEC3.KLAS07R.BOACH6.TNP..OAL..PGS.TYSSN4.KLAS07R.BOACH6.TNP';

// fixtures
let navigationLibraryFixture;

ava.beforeEach(() => {
    navigationLibraryFixture = createNavigationLibraryFixture();
});

ava.afterEach(() => {
    navigationLibraryFixture.reset();
});

ava('throws when instantiated without valid parameters', (t) => {
    t.throws(() => new RouteModel());
    t.throws(() => new RouteModel(navigationLibraryFixture));
    t.throws(() => new RouteModel(complexRouteStringMock, navigationLibraryFixture));
    t.throws(() => new RouteModel(navigationLibraryFixture, 3));
});

ava('throws when instantiated with route string containing spaces', (t) => {
    t.throws(() => new RouteModel(navigationLibraryFixture, 'KLAS07R BOACH6 TNP'));
});

ava('does not throw when instantiated with valid parameters', (t) => {
    t.notThrows(() => new RouteModel(navigationLibraryFixture, complexRouteStringMock));
});

ava('instantiates correctly when provided valid single-segment direct route string', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleDirectSegmentRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 2);
    t.true(model._navigationLibrary === navigationLibraryFixture);
});

ava('instantiates correctly when provided valid single-segment procedural route string', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleProcedureSegmentRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 1);
    t.true(model._legCollection[0]._waypointCollection.length === 8);
    t.true(model._navigationLibrary === navigationLibraryFixture);
});

ava('instantiates correctly when provided valid multi-segment direct route string', (t) => {
    const model = new RouteModel(navigationLibraryFixture, multiDirectSegmentRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 3);
    t.true(model._navigationLibrary === navigationLibraryFixture);
});

ava('instantiates correctly when provided valid multi-segment procedural route string', (t) => {
    const model = new RouteModel(navigationLibraryFixture, multiProcedureSegmentRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 2);
    t.true(model._legCollection[0]._waypointCollection.length === 8);
    t.true(model._legCollection[1]._waypointCollection.length === 13);
    t.true(model._navigationLibrary === navigationLibraryFixture);
});

ava('instantiates correctly when provided valid multi-segment mixed route string', (t) => {
    const model = new RouteModel(navigationLibraryFixture, complexRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 4);
    t.true(model._legCollection[0]._waypointCollection.length === 8);
    t.true(model._legCollection[1]._waypointCollection.length === 1);
    t.true(model._legCollection[2]._waypointCollection.length === 1);
    t.true(model._legCollection[3]._waypointCollection.length === 6);
    t.true(model._navigationLibrary === navigationLibraryFixture);
});

ava('#routeString returns the route string representing the entire route', (t) => {
    const model = new RouteModel(navigationLibraryFixture, nightmareRouteStringMock);
    const expectedResult = nightmareRouteStringMock;
    const result = model.routeString;

    t.true(result === expectedResult);
});

ava('.reset() clears #_legCollection', (t) => {
    const model = new RouteModel(navigationLibraryFixture, complexRouteStringMock);

    model.reset();

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 0);
});

ava.todo('.absorbRouteModel()');
