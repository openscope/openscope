import ava from 'ava';
import _isArray from 'lodash/isArray';
import _map from 'lodash/map';
import { buildPreSpawnAircraft } from '../../src/assets/scripts/client/trafficGenerator/buildPreSpawnAircraft';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../fixtures/navigationLibraryFixtures';
import { airportModelFixture } from '../fixtures/airportFixtures';
import { ARRIVAL_PATTERN_MOCK } from './_mocks/spawnPatternMocks';

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('throws when passed invalid parameters', (t) => {
    t.throws(() => buildPreSpawnAircraft());
    t.throws(() => buildPreSpawnAircraft({}));
    t.throws(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, null, null));
    t.throws(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, null, airportModelFixture));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, airportModelFixture));
});

ava('returns an array of objects with correct keys', (t) => {
    const results = buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, airportModelFixture);

    t.true(_isArray(results));

    _map(results, (result) => {
        t.true(typeof result.heading === 'number');
        t.true(typeof result.nextFix === 'string');
        t.true(_isArray(result.positionModel.relativePosition));
    });
});

ava.skip('_calculateOffsetsToEachWaypointInRoute returns an array mirroring the provided waypoints', (t) => {
    t.true(true);
});
