import NavigationLibrary from '../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import RouteModel from '../../src/assets/scripts/client/navigationLibrary/Route/RouteModel';
import { AIRPORT_JSON_KLAS_MOCK } from '../airport/_mocks/airportJsonMock';

const arrivalProcedureRouteStringMock = 'MLF.GRNPA1.KLAS';
const departureProcedureRouteStringMock = 'KLAS.COWBY6.DRK';

export const navigationLibraryFixture = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
export const arrivalRouteModelFixture = new RouteModel(arrivalProcedureRouteStringMock);
export const departureRouteModelFixture = new RouteModel(departureProcedureRouteStringMock);
