import Fms from '../../src/assets/scripts/client/aircraft/FlightManagementSystem/Fms';
import ModeController from '../../src/assets/scripts/client/aircraft/ModeControl/ModeController';
import { airportModelFixture } from './airportFixtures';
import { navigationLibraryFixture } from './navigationLibraryFixtures';
import {
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK,
    AIRCRAFT_DEFINITION_MOCK
} from '../aircraft/_mocks/aircraftMocks';

const runwayAssignmentMock = airportModelFixture.getRunway('19L');

export const fmsArrivalFixture = new Fms(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, runwayAssignmentMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);
export const fmsDepartureFixture = new Fms(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, runwayAssignmentMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);
export const modeControllerFixture = new ModeController();
