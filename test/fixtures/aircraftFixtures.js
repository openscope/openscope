import Fms from '../../src/assets/scripts/client/aircraft/FlightManagementSystem/Fms';
import ModeController from '../../src/assets/scripts/client/aircraft/ModeControl/ModeController';
import { navigationLibraryFixture } from './navigationLibraryFixtures';
import {
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    AIRCRAFT_DEFINITION_MOCK
} from '../aircraft/_mocks/aircraftMocks';

export const fmsFixture = new Fms(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, '19L', AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);
export const modeControllerFixture = new ModeController();
