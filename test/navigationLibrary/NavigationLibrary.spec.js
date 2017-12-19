import ava from 'ava';
import NavigationLibrary from '../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../airport/_mocks/airportJsonMock';

const sidSuffixProcedureIdMock = 'COWBY61A';
const starSuffixRouteStringMock = 'KLAS.GRNPA11A.DRK';

ava('throws when called without an airportJson', (t) => {
    t.throws(() => new NavigationLibrary());
});

ava.skip('.isSuffixRoute() returns true when passed a routeString associated with a star suffix StandardRouteModel', (t) => {
    const navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
    const result = navigationLibrary.isSuffixRoute(starSuffixRouteStringMock, 'STAR');

    t.true(result);
});

ava.skip('.isSuffixRoute() returns true when passed a routeString associated with a sid suffix StandardRouteModel', (t) => {
    const navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
    const result = navigationLibrary.isSuffixRoute(sidSuffixProcedureIdMock, 'SID');

    t.true(result);
});

ava('.getAllFixNamesInUse() returns list of all fixnames used in all procedures', (t) => {
    const navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
    const fixNameList = navigationLibrary._getAllFixNamesInUse();

    t.true(fixNameList.length === 85);
});
