import ava from 'ava';
import sinon from 'sinon';
import AircraftModel from '../../../src/assets/scripts/client/aircraft/AircraftModel';
import { ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK } from '../_mocks/aircraftMocks';
import { airportModelFixture } from '../../fixtures/airportFixtures';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';

ava('.maintainPresentHeading() sets the #mcp with the correct modes and values', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

    aircraftModel.pilot.maintainPresentHeading(aircraftModel);

    t.true(aircraftModel.pilot._mcp.headingMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.heading === aircraftModel.heading);
});

ava('.maintainPresentHeading() returns a success message when finished', (t) => {
    const expectedResult = [
        true,
        {
            log: 'fly present heading',
            say: 'fly present heading'
        }
    ];
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);
    const result = aircraftModel.pilot.maintainPresentHeading(aircraftModel);

    t.deepEqual(result, expectedResult);
});

ava('.maintainPresentHeading() calls .cancelApproachClearance()', (t) => {
    const approachTypeMock = 'ils';
    const runwayModelMock = airportModelFixture.getRunway('19L');
    const altitudeMock = 7000;
    const headingMock = 3.839724354387525; // 220 in degrees
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);
    const cancelApproachClearanceSpy = sinon.spy(aircraftModel.pilot, 'cancelApproachClearance');

    aircraftModel.pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock, altitudeMock, headingMock);

    t.true(aircraftModel.pilot.hasApproachClearance);

    aircraftModel.pilot.maintainPresentHeading(aircraftModel);

    t.true(cancelApproachClearanceSpy.called);
});
