import sinon from 'sinon';

import AirportController from '../../src/assets/scripts/client/airport/AirportController';
import AirportModel from '../../src/assets/scripts/client/airport/AirportModel';
import StaticPositionModel from '../../src/assets/scripts/client/base/StaticPositionModel';
import { navigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';
import { AIRPORT_JSON_KLAS_MOCK } from '../airport/_mocks/airportJsonMock';
import { AIRPORT_LOAD_LIST_MOCK } from '../airport/_mocks/airportLoadListMocks';

const updateRunStub = sinon.stub();
const onAirportChangeStub = sinon.stub();

export const airportControllerFixture = new AirportController(
    AIRPORT_JSON_KLAS_MOCK,
    AIRPORT_LOAD_LIST_MOCK,
    updateRunStub,
    onAirportChangeStub,
    navigationLibraryFixture
);

export const airportModelFixture = new AirportModel(
    AIRPORT_JSON_KLAS_MOCK,
    updateRunStub,
    onAirportChangeStub,
    navigationLibraryFixture
);

// airport position for KSFO
export const airportPositionFixtureKSFO = new StaticPositionModel(['N37.6195', 'W122.3738333', '13ft'], null, 13.7);

// klas airport reference
export const airportPositionFixtureKLAS = new StaticPositionModel(['N36.080056', 'W115.15225', '2181ft'], null, 2181);
