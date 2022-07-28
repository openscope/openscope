import SpawnPatternModel from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternModel';
import {
    SPAWN_PATTERN_MODEL_FOR_ARRIVAL_FIXTURE,
    SPAWN_PATTERN_MODEL_FOR_DEPARTURE_FIXTURE
} from '../trafficGenerator/_mocks/spawnPatternMocks';
import { createNavigationLibraryFixture } from './navigationLibraryFixtures';

createNavigationLibraryFixture();

export const spawnPatternModelArrivalFixture = new SpawnPatternModel(SPAWN_PATTERN_MODEL_FOR_ARRIVAL_FIXTURE);
export const spawnPatternModelDepartureFixture = new SpawnPatternModel(SPAWN_PATTERN_MODEL_FOR_DEPARTURE_FIXTURE);
