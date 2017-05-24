import RunwayModel from '../../src/assets/scripts/client/airport/runway/RunwayModel';
import { airportPositionFixtureKLAS } from './airportFixtures';
import { AIRPORT_JSON_KLAS_MOCK } from '../airport/_mocks/airportJsonMock';

const runways = AIRPORT_JSON_KLAS_MOCK.runways;

export const runwayModel07lFixture = new RunwayModel(runways[0], 0, airportPositionFixtureKLAS);
export const runwayModel07rFixture = new RunwayModel(runways[1], 0, airportPositionFixtureKLAS);
export const runwayModel19lFixture = new RunwayModel(runways[2], 1, airportPositionFixtureKLAS);
