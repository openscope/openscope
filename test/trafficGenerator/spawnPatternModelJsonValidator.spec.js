import ava from 'ava';
import { spawnPatternModelJsonValidator } from '../../src/assets/scripts/client/trafficGenerator/spawnPatternModelJsonValidator';
import {
    ARRIVAL_PATTERN_MOCK,
    DEPARTURE_PATTERN_MOCK
} from './_mocks/spawnPatternMocks';

const invalidSpawnPattern = {
    route: 'KLAS.BOACH6.HEC',
    altitude: null,
    method: 'random',
    rate: 5,
    speed: null,
    threeve: 42,
    42: 'threeve'
};

ava('spawnPatternModelJsonValidator() retruns true when passed a valid arrival spawnPattern ', (t) => {
    t.true(spawnPatternModelJsonValidator(ARRIVAL_PATTERN_MOCK));
});

ava('spawnPatternModelJsonValidator() returns true when passed a valid departure spawnPattern', (t) => {
    t.true(spawnPatternModelJsonValidator(DEPARTURE_PATTERN_MOCK));
});

ava('spawnPatternModelJsonValidator() returns false when passed an invalid spawnPattern with unsupported keys', (t) => {
    t.false(spawnPatternModelJsonValidator(invalidSpawnPattern));
});
