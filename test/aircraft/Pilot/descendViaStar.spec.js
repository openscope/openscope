import ava from 'ava';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';


ava('.descendViaStar() sets the correct Mcp modes and values', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    pilot.descendViaStar();

    t.true(pilot._mcp.altitudeMode === 'VNAV');
    t.true(pilot._mcp.speedMode === 'VNAV');
    t.true(pilot._mcp.altitude === 8000);
});

ava('.descendViaStar() sets the correct Mcp modes and values when called with an altitude parameter', (t) => {
    const altitudeMock = 3000;
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    pilot.descendViaStar(altitudeMock);

    t.true(pilot._mcp.altitudeMode === 'VNAV');
    t.true(pilot._mcp.speedMode === 'VNAV');
    t.true(pilot._mcp.altitude === altitudeMock);
});

ava('.descendViaStar() returns a success response', (t) => {
    const expectedResult = [
        true,
        {
            log: 'descend via the arrival',
            say: 'descend via the arrival'
        }
    ];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.descendViaStar();

    t.deepEqual(result, expectedResult);
});
