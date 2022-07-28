import NavigationLibrary from '../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import FixCollection from '../../src/assets/scripts/client/navigationLibrary/FixCollection';
import { AIRPORT_JSON_KLAS_MOCK } from '../airport/_mocks/airportJsonMock';
import { FIX_LIST_MOCK } from '../navigationLibrary/Fix/_mocks/fixMocks';
import { airportPositionFixtureKSFO } from './airportFixtures';

// const arrivalProcedureRouteStringMock = 'MLF.GRNPA1.KLAS';
// const departureProcedureRouteStringMock = 'KLAS.COWBY6.DRK';

// Only import `navigationLibraryFixture` where it will NOT be modified!
// Else, it is better to import and invoke the function `createNavigationLibraryFixture`
// to get a fresh fixture for each test.
// export const navigationLibraryFixture = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);

// export const arrivalRouteModelFixture = new RouteModel(arrivalProcedureRouteStringMock);
// export const departureRouteModelFixture = new RouteModel(departureProcedureRouteStringMock);
export const fixCollectionFixture = FixCollection.addItems(FIX_LIST_MOCK, airportPositionFixtureKSFO);

// In lieu of importing `navigationLibraryFixture` directly, when the test requires
// changes to be made to the navigation library, it is wiser to call this function
// in `ava.beforeEach()`in order to generate a fresh fixture for each and every test
export function createNavigationLibraryFixture() {
    NavigationLibrary.reset();
    NavigationLibrary.init(AIRPORT_JSON_KLAS_MOCK);
}

export function resetNavigationLibraryFixture() {
    NavigationLibrary.reset();
}
