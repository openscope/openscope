import PositionModel from '../../../src/assets/scripts/client/base/PositionModel';
import StaticPositionModel from '../../../src/assets/scripts/client/base/StaticPositionModel';
import { airportModelFixture } from '../../fixtures/airportFixtures';

export const GPS_COORDINATES_MOCK = [35.404050, -97.619943];

export const MAGNETIC_NORTH_MOCK = -8.2;

export const POSITION_MODEL_MOCK = new PositionModel(GPS_COORDINATES_MOCK, airportModelFixture.position, MAGNETIC_NORTH_MOCK);

export const STATIC_POSITION_MODEL_MOCK = new StaticPositionModel(GPS_COORDINATES_MOCK, airportModelFixture.position, MAGNETIC_NORTH_MOCK);

export const SNORA_COORDINATES = ['N37d38.73m0', 'W119d48.38m0'];

export const SNORA_STATIC_POSITION_MODEL = new StaticPositionModel(SNORA_COORDINATES, null, 0);
