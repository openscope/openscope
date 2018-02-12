import SpawnPatternModel from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternModel';
import { createNavigationLibraryFixture } from './navigationLibraryFixtures';
import {
    SPAWN_PATTERN_MODEL_FOR_ARRIVAL_FIXTURE,
    SPAWN_PATTERN_MODEL_FOR_DEPARTURE_FIXTURE
} from '../trafficGenerator/_mocks/spawnPatternMocks';

// fixtures
const navigationLibraryFixture = createNavigationLibraryFixture();

export const spawnPatternModelArrivalFixture = new SpawnPatternModel(SPAWN_PATTERN_MODEL_FOR_ARRIVAL_FIXTURE, navigationLibraryFixture);
export const spawnPatternModelDepartureFixture = new SpawnPatternModel(SPAWN_PATTERN_MODEL_FOR_DEPARTURE_FIXTURE, navigationLibraryFixture);
