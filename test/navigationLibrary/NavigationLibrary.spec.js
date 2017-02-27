import ava from 'ava';

import NavigationLibrary from '../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../airport/_mocks/airportJsonMock';

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
