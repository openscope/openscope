import ava from 'ava';
import sinon from 'sinon';
import AircraftModel from '../../../src/assets/scripts/client/aircraft/AircraftModel';
import { airportModelFixture } from '../../fixtures/airportFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';
import { ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK } from '../_mocks/aircraftMocks';

const nextHeadingDegreesMock = 180;

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('.maintainHeading() sets the #mcp with the correct modes and values', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);

    aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock, null, false);

    t.true(aircraftModel.pilot._mcp.headingMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.heading === 3.141592653589793);
});

ava('.maintainHeading() calls .exitHold()', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const exitHoldSpy = sinon.spy(aircraftModel.pilot, 'exitHold');

    aircraftModel.pilot._fms.setFlightPhase('HOLD');
    aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock, null, false);

    t.true(exitHoldSpy.calledWithExactly());
});

ava('.maintainHeading() returns a success message when incremental is false and no direction is provided', (t) => {
    const expectedResult = [
        true,
        {
            log: 'fly heading 180',
            say: 'fly heading one eight zero'
        }
    ];
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const result = aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock, null, false);

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
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const result = aircraftModel.pilot.maintainHeading(aircraftModel, 42, directionMock, true);

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
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const result = aircraftModel.pilot.maintainHeading(aircraftModel, 42, directionMock, true);

    t.deepEqual(result, expectedResult);
});

ava('.maintainHeading() calls .cancelApproachClearance()', (t) => {
    const approachTypeMock = 'ils';
    const runwayModelMock = airportModelFixture.getRunway('19L');
    const altitudeMock = 7000;
    const headingMock = 3.839724354387525; // 220 in degrees
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const cancelApproachClearanceSpy = sinon.spy(aircraftModel.pilot, 'cancelApproachClearance');

    aircraftModel.pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock, altitudeMock, headingMock);

    t.true(aircraftModel.pilot.hasApproachClearance);

    aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock);

    t.true(cancelApproachClearanceSpy.called);
});
