import ava from 'ava';
// import sinon from 'sinon';
// import _isArray from 'lodash/isArray';
// import _isEqual from 'lodash/isEqual';
// import _isObject from 'lodash/isObject';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

const headingMock = 3.141592653589793;
const speedMock = 190;
const airportElevationMock = 11;

ava('.cancelApproachClearance() sets the correct modes and values in the Mcp', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    pilot.cancelApproachClearance(headingMock, speedMock, airportElevationMock);

    t.true(pilot._mcp.altitudeMode === 'HOLD');
    t.true(pilot._mcp.altitude === 1100);
    t.true(pilot._mcp.headingMode === 'HOLD');
    t.true(pilot._mcp.heading === headingMock);
    t.true(pilot._mcp.speedMode === 'HOLD');
    t.true(pilot._mcp.speed === 190);
});

ava('.cancelApproachClearance() returns a success message when finished', (t) => {
    const expectedResult = [
        true,
        {
            log: 'cancel approach clearance, fly present heading, maintain 1100',
            say: 'cancel approach clearance, fly present heading, maintain one thousand one hundred'
        }
    ];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.cancelApproachClearance(headingMock, speedMock, airportElevationMock);

    t.deepEqual(result, expectedResult);
});
