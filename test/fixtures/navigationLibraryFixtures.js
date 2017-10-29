import NavigationLibrary from '../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import FixCollection from '../../src/assets/scripts/client/navigationLibrary/Fix/FixCollection';
import RouteModel from '../../src/assets/scripts/client/navigationLibrary/Route/RouteModel';
import { AIRPORT_JSON_KLAS_MOCK } from '../airport/_mocks/airportJsonMock';
import { FIX_LIST_MOCK } from '../navigationLibrary/Fix/_mocks/fixMocks';
import { airportPositionFixtureKSFO } from './airportFixtures';

const arrivalProcedureRouteStringMock = 'MLF.GRNPA1.KLAS';
const departureProcedureRouteStringMock = 'KLAS.COWBY6.DRK';

export const navigationLibraryFixture = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
export const arrivalRouteModelFixture = new RouteModel(arrivalProcedureRouteStringMock);
export const departureRouteModelFixture = new RouteModel(departureProcedureRouteStringMock);
export const fixCollectionFixture = FixCollection.addItems(FIX_LIST_MOCK, airportPositionFixtureKSFO);
