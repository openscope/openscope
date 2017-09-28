import ava from 'ava';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import AircraftModel from '../../../src/assets/scripts/client/aircraft/AircraftModel';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import { ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK } from '../_mocks/aircraftMocks';

const cruiseSpeedMock = 460;
const unattainableSpeedMock = 530;
const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

ava('.maintainSpeed() sets the correct Mcp mode and value', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const expectedResult = [
        true,
        {
            log: 'increase speed to 460',
            say: 'increase speed to four six zero'
        }
    ];
    const result = pilot.maintainSpeed(cruiseSpeedMock, model);

    t.true(pilot._mcp.speedMode === 'HOLD');
    t.true(pilot._mcp.speed === 460);
    t.deepEqual(result, expectedResult);
});

ava('.maintainSpeed() returns early with a warning when assigned an unreachable speed', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const expectedResult = [
        false,
        {
            log: 'unable to maintain 530 knots due to performance',
            say: 'unable to maintain five three zero knots due to performance'
        }
    ];
    const result = pilot.maintainSpeed(unattainableSpeedMock, model);

    t.deepEqual(result, expectedResult);
});
