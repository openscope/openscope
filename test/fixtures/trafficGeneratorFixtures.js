import SpawnPatternCollection from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternCollection';
import SpawnPatternModel from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternModel';
import {
    ARRIVAL_PATTERN_MOCK,
    AIRPORT_JSON_FOR_SPAWN_MOCK
} from '../trafficGenerator/_mocks/spawnPatternMocks';

export const spawnPatternCollectionFixture = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK);

export const spawnPatternModelFixture = new SpawnPatternModel('arrival', ARRIVAL_PATTERN_MOCK);
