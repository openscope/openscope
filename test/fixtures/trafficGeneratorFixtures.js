/* eslint-disable max-len */
import SpawnPatternCollection from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternCollection';
import SpawnPatternModel from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternModel';
import { navigationLibraryFixture } from './navigationLibraryFixtures';
import { airportControllerFixture } from './airportFixtures';
import {
    SPAWN_PATTERN_MODEL_FOR_ARRIVAL_FIXTURE,
    SPAWN_PATTERN_MODEL_FOR_DEPARTURE_FIXTURE,
    AIRPORT_JSON_FOR_SPAWN_MOCK
} from '../trafficGenerator/_mocks/spawnPatternMocks';

export const spawnPatternCollectionFixture = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK, navigationLibraryFixture, airportControllerFixture);

export const spawnPatternModelArrivalFixture = new SpawnPatternModel(SPAWN_PATTERN_MODEL_FOR_ARRIVAL_FIXTURE, navigationLibraryFixture, airportControllerFixture);
export const spawnPatternModelDepartureFixture = new SpawnPatternModel(SPAWN_PATTERN_MODEL_FOR_DEPARTURE_FIXTURE, navigationLibraryFixture, airportControllerFixture);
