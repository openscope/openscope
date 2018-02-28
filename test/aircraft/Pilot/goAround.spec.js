import ava from 'ava';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';

const headingMock = 3.141592653589793;
const speedMock = 190;
const airportElevationMock = 11;

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('.goAround() sets the correct Mcp modes and values', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);

    pilot.goAround(headingMock, speedMock, airportElevationMock);

    t.true(pilot._mcp.altitudeMode === 'HOLD');
    t.true(pilot._mcp.altitude === 1100);
    t.true(pilot._mcp.headingMode === 'HOLD');
    t.true(pilot._mcp.heading === headingMock);
    t.true(pilot._mcp.speedMode === 'HOLD');
    t.true(pilot._mcp.speed === 190);
});

ava('.goAround() returns a success message', (t) => {
    const expectedResult = [
        true,
        {
            log: 'go around, fly present heading, maintain 1100',
            say: 'go around, fly present heading, maintain one thousand one hundred'
        }
    ];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const result = pilot.goAround(headingMock, speedMock, airportElevationMock);

    t.deepEqual(result, expectedResult);
});
