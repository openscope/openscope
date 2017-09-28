import ava from 'ava';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import AircraftModel from '../../../src/assets/scripts/client/aircraft/AircraftModel';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import { airportModelFixture } from '../../fixtures/airportFixtures';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import { ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK } from '../_mocks/aircraftMocks';

const altitudeMock = 3468.134982;
const approachTypeMock = 'ils';
const headingMock = 3.141592653589793;
const runwayModelMock = airportModelFixture.getRunway('19L');
const speedMock = 190;

ava('.cancelApproachClearance() returns early if #hasApproachClearance is false', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.cancelApproachClearance(altitudeMock, headingMock);
    const expectedResult = [false, 'we have no approach clearance to cancel!'];

    t.deepEqual(result, expectedResult);
});

ava('.cancelApproachClearance() sets the correct modes and values in the Mcp', (t) => {
    const nextAltitudeMock = 4000;
    const headingBeforeLocalizerInterceptionMock = 3.839724354387525; // 220 in degrees
    const headingAfterLocalizerInterceptionMock = 4.36332;  // appx 250 degrees
    const nextHeadingDegreesMock = 250;
    const shouldExpediteDescentMock = false;
    const shouldUseSoftCeilingMock = false;
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);
    const currentAltitudeMock = 5700;

    aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteDescentMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );
    aircraftModel.pilot.maintainHeading(headingBeforeLocalizerInterceptionMock, nextHeadingDegreesMock, null, false);
    aircraftModel.pilot.maintainSpeed(speedMock, aircraftModel);
    aircraftModel.pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);
    aircraftModel.pilot.cancelApproachClearance(currentAltitudeMock, headingAfterLocalizerInterceptionMock);

    t.true(aircraftModel.pilot._mcp.altitudeMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.altitude === nextAltitudeMock);
    t.true(aircraftModel.pilot._mcp.headingMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.heading === headingAfterLocalizerInterceptionMock);
    t.true(aircraftModel.pilot._mcp.speedMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.speed === speedMock);
});

ava('.cancelApproachClearance() returns a success message when finished', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const expectedResult = [
        true,
        'cancel approach clearance, fly present heading, maintain last assigned altitude and speed'
    ];

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
