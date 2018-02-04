import ava from 'ava';
import NavigationLibrary from '../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../airport/_mocks/airportJsonMock';

ava('throws when called without an airportJson', (t) => {
    t.throws(() => new NavigationLibrary());
});

ava('.getAllFixNamesInUse() returns list of all fixnames used in all procedures and airways', (t) => {
    const navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
    const fixNameList = navigationLibrary._getAllFixNamesInUse();

    t.true(fixNameList.length === 91);
});
