/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import _isArray from 'lodash/isArray';

import {
    buildPreSpawnAircraft,
    _calculateSpawnPositions,
    _assembleSpawnOffsets,
    _preSpawn
} from '../../src/assets/scripts/client/trafficGenerator/buildPreSpawnAircraft';
import { navigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';
import { airportModelFixture } from '../fixtures/airportFixtures';
import { ARRIVAL_PATTERN_MOCK } from './_mocks/spawnPatternMocks';

ava('throws when passed invalid parameters', (t) => {
    t.throws(() => buildPreSpawnAircraft());
    t.throws(() => buildPreSpawnAircraft({}));
    t.throws(() => buildPreSpawnAircraft(null, null, null));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportModelFixture));
});

ava('returns an array', (t) => {
    const result = buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportModelFixture);

    t.true(_isArray(result));
});
