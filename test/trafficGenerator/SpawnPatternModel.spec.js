/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';

import SpawnPatternModel from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternModel';
import {
    DEPARTURE_PATTERN_MOCK,
    ARRIVAL_PATTERN_MOCK
} from './_mocks/spawnPatternMocks';

ava('throws when called with invalid parameters', (t) => {
    t.throws(() => new SpawnPatternModel());
    t.throws(() => new SpawnPatternModel([]));
    t.throws(() => new SpawnPatternModel({}));
    t.throws(() => new SpawnPatternModel(42));
    t.throws(() => new SpawnPatternModel('threeve'));
    t.throws(() => new SpawnPatternModel(false));
});

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => new SpawnPatternModel('arrival', ARRIVAL_PATTERN_MOCK));
    t.notThrows(() => new SpawnPatternModel('departure', DEPARTURE_PATTERN_MOCK));
});
