import ava from 'ava';

import NavigationLibrary from '../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import DynamicPositionModel from '../../src/assets/scripts/client/base/DynamicPositionModel';
import { airportPositionFixtureKLAS } from '../fixtures/airportFixtures';
import { AIRPORT_JSON_KLAS_MOCK } from '../airport/_mocks/airportJsonMock';

const sidSuffixProcedureIdMock = 'COWBY61A';
const starSuffixRouteStringMock = 'KLAS.GRNPA11A.DRK';

ava('throws when called without an airportJson', (t) => {
    t.throws(() => new NavigationLibrary());
});

ava('.findCollectionNameForProcedureId() returns an empty string when passed an invalid procedureId', (t) => {
    const navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
    const result = navigationLibrary.findCollectionNameForProcedureId('~!@#$');

    t.true(result === '');
});

ava('.findCollectionNameForProcedureId() returns sidCollection when passed a SID procedureId', (t) => {
    const navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
    const result = navigationLibrary.findCollectionNameForProcedureId('COWBY6');

    t.true(result === 'sidCollection');
});

ava('.findCollectionNameForProcedureId() returns starCollection when passed STAR procedureId', (t) => {
    const navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
    const result = navigationLibrary.findCollectionNameForProcedureId('GRNPA1');

    t.true(result === 'starCollection');
});

ava('.generateStaticPositionModelForLatLong() returns a DynamicPositionModel from a set of latitude and longitude coordinates', (t) => {
    const latLongMock = [113.4636606631233, 6.12969620221002];
    const navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
    const result = navigationLibrary.generateStaticPositionModelForLatLong(latLongMock, airportPositionFixtureKLAS, airportPositionFixtureKLAS.magneticNorth);

    t.true(result instanceof DynamicPositionModel);
});

ava('.isSuffixRoute() returns true when passed a routeString associated with a star suffix StandardRouteModel', (t) => {
    const navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
    const result = navigationLibrary.isSuffixRoute(starSuffixRouteStringMock, 'STAR');

    t.true(result);
});

ava('.isSuffixRoute() returns true when passed a routeString associated with a sid suffix StandardRouteModel', (t) => {
    const navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
    const result = navigationLibrary.isSuffixRoute(sidSuffixProcedureIdMock, 'SID');

    t.true(result);
});

ava('.isGroundedFlightPhase() returns true when passed `APRON`', (t) => {
    const navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);

    t.true(navigationLibrary.isGroundedFlightPhase('APRON'));
});

ava('.isGroundedFlightPhase() returns true when passed `TAXI`', (t) => {
    const navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);

    t.true(navigationLibrary.isGroundedFlightPhase('TAXI'));
});

ava('.isGroundedFlightPhase() returns true when passed `WAITING`', (t) => {
    const navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);

    t.true(navigationLibrary.isGroundedFlightPhase('WAITING'));
});

ava('.getAllFixNamesInUse() returns list of all fixnames used in all procedures', (t) => {
    const navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
    const fixNameList = navigationLibrary._getAllFixNamesInUse();

    t.true(fixNameList.length === 83);
});
