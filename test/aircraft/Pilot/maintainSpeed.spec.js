import ava from 'ava';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import AircraftModel from '../../../src/assets/scripts/client/aircraft/AircraftModel';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import { ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK } from '../_mocks/aircraftMocks';

const currentSpeedMock = 320;
const cruiseSpeedMock = 460;
const invalidSpeedMock = 530;
const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

ava('.maintainSpeed() sets the correct Mcp mode and value', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    pilot.maintainSpeed(currentSpeedMock, cruiseSpeedMock, model);

    t.true(pilot._mcp.speedMode === 'HOLD');
    t.true(pilot._mcp.speed === 460);
});

ava('.maintainSpeed() returns a success message when finished', (t) => {
    const expectedResult = [
        true,
        {
            log: 'increase speed to 460',
            say: 'increase speed to four six zero'
        }
    ];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.maintainSpeed(currentSpeedMock, cruiseSpeedMock, model);

    t.deepEqual(result, expectedResult);
});

ava('.maintainSpeed() returns a warning when assigned an unreachable speed', (t) => {
    const expectedResult = [
        false,
        {
            log: 'unable to maintain 530 due to performance limits',
            say: 'unable to maintain five three zero due to performance limits'
        }
    ];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.maintainSpeed(currentSpeedMock, invalidSpeedMock, model);

    t.deepEqual(result, expectedResult);
});
