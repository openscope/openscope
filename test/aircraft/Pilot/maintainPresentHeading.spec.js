import ava from 'ava';
import sinon from 'sinon';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import { airportModelFixture } from '../../fixtures/airportFixtures';

const currentHeadingMock = -1.6302807335875378;

ava('.maintainPresentHeading() sets the #mcp with the correct modes and values', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    pilot.maintainPresentHeading(currentHeadingMock);

    t.true(pilot._mcp.headingMode === 'HOLD');
    t.true(pilot._mcp.heading === -1.6302807335875378);
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

ava('.maintainHeading() calls .cancelApproachClearance()', (t) => {
    const approachTypeMock = 'ils';
    const runwayModelMock = airportModelFixture.getRunway('19L');
    const altitudeMock = 7000;
    const headingMock = 3.839724354387525; // 220 in degrees
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const cancelApproachClearanceSpy = sinon.spy(pilot, 'cancelApproachClearance');

    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock, altitudeMock, headingMock);

    t.true(pilot.hasApproachClearance);

    pilot.maintainPresentHeading(currentHeadingMock);

    t.true(cancelApproachClearanceSpy.called);
});
