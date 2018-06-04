import ava from 'ava';
import NavigationLibrary from '../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../airport/_mocks/airportJsonMock';

ava('throws when attempting to create an instance', (t) => {
    t.throws(() => new NavigationLibrary());
    t.throws(() => new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK));
});

ava('.getAllFixNamesInUse() returns list of all fix names used in all procedures and airways', (t) => {
    NavigationLibrary.init(AIRPORT_JSON_KLAS_MOCK);

    const fixNameList = NavigationLibrary._getAllFixNamesInUse();

    t.true(fixNameList.length === 93);
});
