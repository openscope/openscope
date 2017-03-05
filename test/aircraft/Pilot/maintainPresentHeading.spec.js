import ava from 'ava';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

const currentHeadingMock = -1.6302807335875378;

ava('.maintainPresentHeading() sets the #mcp with the correct modes and values', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    pilot.maintainPresentHeading(currentHeadingMock);

    t.true(pilot._mcp.headingMode === 'HOLD');
    t.true(pilot._mcp.heading === 267);
});

ava('.maintainPresentHeading() returns a success message when finished', (t) => {
    const expectedResult = [
        true,
        {
            log: 'fly present heading',
            say: 'fly present heading'
        }
    ];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.maintainPresentHeading(currentHeadingMock);

    t.deepEqual(result, expectedResult);
});
