import ava from 'ava';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

const currentHeadingMock = -1.6302807335875378;
const nextHeadingMock = 180;

ava('.maintainHeading() sets the #mco with the correct modes and values', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    pilot.maintainHeading(currentHeadingMock, nextHeadingMock, null, false);

    t.true(pilot._mcp.headingMode === 'HOLD');
    t.true(pilot._mcp.heading === 3.141592653589793);
});

ava('.maintainHeading() returns a success message when incremental is false and no direction is provided', (t) => {
    const expectedResult = [
        true,
        {
            log: 'fly heading 180',
            say: 'fly heading one eight zero'
        }
    ];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.maintainHeading(currentHeadingMock, nextHeadingMock, null, false);

    t.deepEqual(result, expectedResult);
});

ava('.maintainHeading() returns a success message when incremental is true and direction is left', (t) => {
    const directionMock = 'left';
    const expectedResult = [
        true,
        {
            log: 'turn 42 degrees left',
            say: 'turn 42 degrees left'
        }
    ];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.maintainHeading(currentHeadingMock, 42, directionMock, true);

    t.deepEqual(result, expectedResult);
});

ava('.maintainHeading() returns a success message when incremental is true and direction is right', (t) => {
    const directionMock = 'right';
    const expectedResult = [
        true,
        {
            log: 'turn 42 degrees right',
            say: 'turn 42 degrees right'
        }
    ];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.maintainHeading(currentHeadingMock, 42, directionMock, true);

    t.deepEqual(result, expectedResult);
});
