import ava from 'ava';
import _isEqual from 'lodash/isEqual';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import { airportModelFixture } from '../../fixtures/airportFixtures';

const airportElevationMock = 11;
const altitudeMock = 3468.134982;
const approachTypeMock = 'ils';
const headingMock = 3.141592653589793;
const runwayModelMock = airportModelFixture.getRunway('19L');
const speedMock = 190;

ava('.cancelApproachClearance() returns early if #hasApproachClearance is false', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.cancelApproachClearance(altitudeMock, headingMock);
    const expectedResult = [false, 'we have no approach clearance to cancel!'];

    t.true(_isEqual(result, expectedResult));
});

ava('.cancelApproachClearance() sets the correct modes and values in the Mcp', (t) => {
    const currentAltitudeMock = 7000;
    const nextAltitudeMock = 4000;
    const headingBeforeLocalizerInterceptionMock = 3.839724354387525; // 220 in degrees
    const headingAfterLocalizerInterceptionMock = 4.36332;  // appx 250 degrees
    const nextHeadingDegreesMock = 250;
    const currentSpeedMock = 210;
    const nextSpeedMock = 180;
    const shouldExpediteDescentMock = false;
    const shouldUseSoftCeilingMock = false;
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    pilot.maintainAltitude(
        currentAltitudeMock,
        nextAltitudeMock,
        shouldExpediteDescentMock,
        shouldUseSoftCeilingMock,
        airportModelFixture
    );
    pilot.maintainHeading(headingBeforeLocalizerInterceptionMock, nextHeadingDegreesMock, null, false);
    pilot.maintainSpeed(currentSpeedMock, nextSpeedMock);
    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);
    pilot.cancelApproachClearance(currentAltitudeMock, headingAfterLocalizerInterceptionMock);

    t.true(pilot._mcp.altitudeMode === 'HOLD');
    t.true(pilot._mcp.altitude === nextAltitudeMock);
    t.true(pilot._mcp.headingMode === 'HOLD');
    t.true(pilot._mcp.heading === headingAfterLocalizerInterceptionMock);
    t.true(pilot._mcp.speedMode === 'HOLD');
    t.true(pilot._mcp.speed === nextSpeedMock);
});

ava('.cancelApproachClearance() returns a success message when finished', (t) => {
    const expectedResult = [
        true,
        'cancel approach clearance, fly present heading, maintain last assigned altitude and speed'
    ];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);

    const result = pilot.cancelApproachClearance(altitudeMock, headingMock);

    t.deepEqual(result, expectedResult);
});

ava('.cancelApproachClearance() sets #hasApproachClearance to false', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    pilot.hasApproachClearance = true;

    pilot.cancelApproachClearance(altitudeMock, headingMock);

    t.false(pilot.hasApproachClearance);
});
