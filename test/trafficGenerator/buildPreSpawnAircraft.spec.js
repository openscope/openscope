/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import _isArray from 'lodash/isArray';
import _map from 'lodash/map';
import { buildPreSpawnAircraft } from '../../src/assets/scripts/client/trafficGenerator/buildPreSpawnAircraft';
import { createNavigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';
import { airportModelFixture } from '../fixtures/airportFixtures';
import { ARRIVAL_PATTERN_MOCK } from './_mocks/spawnPatternMocks';

// fixtures
let navigationLibraryFixture;

ava.beforeEach(() => {
    navigationLibraryFixture = createNavigationLibraryFixture();
});

ava.afterEach(() => {
    navigationLibraryFixture.reset();
});

ava('throws when passed invalid parameters', (t) => {
    t.throws(() => buildPreSpawnAircraft());
    t.throws(() => buildPreSpawnAircraft({}));
    t.throws(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, null, null));
    t.throws(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, null, airportModelFixture));
    t.throws(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, null));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportModelFixture));
});

ava('returns an array of objects with correct keys', (t) => {
    const results = buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportModelFixture);

    t.true(_isArray(results));

    _map(results, (result) => {
        t.true(typeof result.heading === 'number');
        t.true(typeof result.nextFix === 'string');
        t.true(_isArray(result.positionModel.relativePosition));
    });
});
