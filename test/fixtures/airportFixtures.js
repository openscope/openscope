import AirportController from '../../src/assets/scripts/client/airport/AirportController';
import AirportModel from '../../src/assets/scripts/client/airport/AirportModel';
import StaticPositionModel from '../../src/assets/scripts/client/base/StaticPositionModel';
import { AIRPORT_JSON_KLAS_MOCK } from '../airport/_mocks/airportJsonMock';
import { AIRPORT_LOAD_LIST_MOCK } from '../airport/_mocks/airportLoadListMocks';

export function createAirportControllerFixture() {
    AirportController.reset();

    AirportController.init('klas', AIRPORT_JSON_KLAS_MOCK, AIRPORT_LOAD_LIST_MOCK);
}

export function resetAirportControllerFixture() {
    AirportController.reset();
}

export const airportControllerKlasFixture = AirportController;
airportControllerKlasFixture.init('klas', AIRPORT_JSON_KLAS_MOCK, AIRPORT_LOAD_LIST_MOCK);
airportControllerKlasFixture.airport_set('klas', AIRPORT_JSON_KLAS_MOCK);

export const airportModelFixture = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
export function createAirportModelFixture() {
    return new AirportModel(AIRPORT_JSON_KLAS_MOCK);
}

// airport position for KSFO
export const airportPositionFixtureKSFO = new StaticPositionModel(['N37.6195', 'W122.3738333', '13ft'], null, 0.2391101);

// klas airport reference
export const airportPositionFixtureKLAS = new StaticPositionModel(['N36.080056', 'W115.15225', '2181ft'], null, 0.2076941809873252);
