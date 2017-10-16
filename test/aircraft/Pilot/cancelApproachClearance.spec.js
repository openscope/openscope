import ava from 'ava';
import AircraftModel from '../../../src/assets/scripts/client/aircraft/AircraftModel';
import { airportModelFixture } from '../../fixtures/airportFixtures';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import { ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK } from '../_mocks/aircraftMocks';

const approachTypeMock = 'ils';
const runwayModelMock = airportModelFixture.getRunway('19L');
const speedMock = 190;

ava('.cancelApproachClearance() returns early if #hasApproachClearance is false', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);
    const result = aircraftModel.pilot.cancelApproachClearance(aircraftModel);
    const expectedResult = [false, 'we have no approach clearance to cancel!'];

    t.deepEqual(result, expectedResult);
});

ava('.cancelApproachClearance() sets the correct modes and values in the Mcp', (t) => {
    const nextAltitudeMock = 4000;
    const nextHeadingDegreesMock = 250;
    const shouldExpediteDescentMock = false;
    const shouldUseSoftCeilingMock = false;
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

    aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteDescentMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );
    aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock, null, false);
    aircraftModel.pilot.maintainSpeed(speedMock, aircraftModel);
    aircraftModel.pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);
    aircraftModel.pilot.cancelApproachClearance(aircraftModel);

    t.true(aircraftModel.pilot._mcp.altitudeMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.altitude === nextAltitudeMock);
    t.true(aircraftModel.pilot._mcp.headingMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.heading === aircraftModel.heading);
    t.true(aircraftModel.pilot._mcp.speedMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.speed === speedMock);
});

ava('.cancelApproachClearance() returns a success message when finished', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);
    const expectedResult = [
        true,
        'cancel approach clearance, fly present heading, maintain last assigned altitude and speed'
    ];

    aircraftModel.pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);

    const result = aircraftModel.pilot.cancelApproachClearance(aircraftModel);

    t.deepEqual(result, expectedResult);
});

ava('.cancelApproachClearance() sets #hasApproachClearance to false', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

    aircraftModel.pilot.hasApproachClearance = true;

    aircraftModel.pilot.cancelApproachClearance(aircraftModel);

    t.false(aircraftModel.pilot.hasApproachClearance);
});
