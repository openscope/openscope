import SpawnPatternCollection from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternCollection';
import SpawnPatternModel from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternModel';
import {
    SPAWN_PATTERN_MODEL_FOR_FIXTURE,
    AIRPORT_JSON_FOR_SPAWN_MOCK
} from '../trafficGenerator/_mocks/spawnPatternMocks';

export const spawnPatternCollectionFixture = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK);

export const spawnPatternModelArrivalFixture = new SpawnPatternModel(SPAWN_PATTERN_MODEL_FOR_FIXTURE);
export const spawnPatternModelDepartureFixture = new SpawnPatternModel(SPAWN_PATTERN_MODEL_FOR_FIXTURE);
