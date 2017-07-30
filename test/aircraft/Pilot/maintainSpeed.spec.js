import ava from 'ava';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

const currentSpeedMock = 250;
const cruiseSpeedMock = 460;

ava('.maintainSpeed() sets the correct Mcp mode and value', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    pilot.maintainSpeed(currentSpeedMock, cruiseSpeedMock);

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
    const result = pilot.maintainSpeed(currentSpeedMock, cruiseSpeedMock);

    t.deepEqual(result, expectedResult);
});
