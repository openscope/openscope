/* eslint-disable max-len */
import ava from 'ava';
import _isArray from 'lodash/isArray';
import _isObject from 'lodash/isObject';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import NavigationLibrary from '../../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../../airport/_mocks/airportJsonMock';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

let navigationLibraryFixture;

ava.beforeEach(() => {
    navigationLibraryFixture = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
});

ava.afterEach(() => {
    navigationLibraryFixture.reset();
});

ava('.clearedAsFiled() grants pilot departure clearance and returns the correct response strings', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);
    const result = pilot.clearedAsFiled();

    t.true(_isArray(result));
    t.true(result[0] === true);
    t.true(_isObject(result[1]));
    t.true(result[1].log === 'cleared to destination as filed');
    t.true(result[1].say === 'cleared to destination as filed');
    t.true(pilot.hasDepartureClearance === true);
});
