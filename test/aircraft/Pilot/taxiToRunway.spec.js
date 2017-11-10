import ava from 'ava';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import NavigationLibrary from '../../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../../airport/_mocks/airportJsonMock';
import { airportModelFixture } from '../../fixtures/airportFixtures';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import { FLIGHT_PHASE } from '../../../src/assets/scripts/client/constants/aircraftConstants';

const runwayName = '19L';
const runwayMock = airportModelFixture.getRunway(runwayName);
let navigationLibraryFixture;

ava.beforeEach(() => {
    navigationLibraryFixture = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
});

ava.afterEach(() => {
    navigationLibraryFixture.reset();
});

ava('.taxiToRunway() returns an error when flightPhase is equal to FLIGHT_PHASE.TAXI', (t) => {
    const expectedResult = [false, 'already taxiing'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);
    const result = pilot.taxiToRunway(runwayMock, true, FLIGHT_PHASE.TAXI);

    t.deepEqual(result, expectedResult);
});

ava('.taxiToRunway() returns an error when flightPhase is equal to FLIGHT_PHASE.WAITING', (t) => {
    const expectedResult = [false, 'already taxiied and waiting in runway queue'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);
    const result = pilot.taxiToRunway(runwayMock, true, FLIGHT_PHASE.WAITING);

    t.deepEqual(result, expectedResult);
});

ava('.taxiToRunway() returns an error when isDeparture is false', (t) => {
    const expectedResult = [false, 'unable to taxi'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);
    const result = pilot.taxiToRunway(runwayMock, false, FLIGHT_PHASE.APRON);

    t.deepEqual(result, expectedResult);
});

ava('.taxiToRunway() returns an error when flightPhase is not equal to FLIGHT_PHASE.APRON', (t) => {
    const expectedResult = [false, 'unable to taxi'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);
    const result = pilot.taxiToRunway(runwayMock, true, FLIGHT_PHASE.ARRIVAL);

    t.deepEqual(result, expectedResult);
});

ava('.taxiToRunway() returns a success message when finished', (t) => {
    const expectedResult = [
        true,
        {
            log: 'taxi to runway 19L',
            say: 'taxi to runway one niner left'
        }
    ];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);
    const result = pilot.taxiToRunway(runwayMock, true, FLIGHT_PHASE.APRON);

    t.deepEqual(result, expectedResult);
});
