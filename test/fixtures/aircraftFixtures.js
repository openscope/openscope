import Fms from '../../src/assets/scripts/client/aircraft/FlightManagementSystem/Fms';
import ModeController from '../../src/assets/scripts/client/aircraft/ModeControl/ModeController';
// import { airportModelFixture } from './airportFixtures';
import {
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK
} from '../aircraft/_mocks/aircraftMocks';

// mocks
// const runwayAssignmentMock = airportModelFixture.getRunway('19L');

// fixtures
export const fmsArrivalFixture = new Fms(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
export const fmsDepartureFixture = new Fms(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
export const modeControllerFixture = new ModeController();

// Below we create some helper functions that can be imported and run to generate the above
// fixtures to prevent mutation when importing only the fixtures and using them in test
export function createFmsArrivalFixture() {
    return new Fms(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
}

export function createFmsDepartureFixture() {
    return new Fms(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
}

export function createModeControllerFixture() {
    return new ModeController();
}
