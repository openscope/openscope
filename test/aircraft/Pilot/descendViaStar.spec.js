import ava from 'ava';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    createFmsArrivalFixture,
    createModeControllerFixture
} from '../../fixtures/aircraftFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';

let pilot;

const successResponseMock = [true, 'descend via STAR'];
const failureResponseMock = [false, 'unable to descend via STAR'];
const initialAltitudeMock = 18000;
const nextAltitudeMock = 5000;
const invalidAltitudeMock = 'threeve';

ava.beforeEach(() => {
    createNavigationLibraryFixture();

    const modeControllerFixture = createModeControllerFixture();
    const fmsArrivalFixture = createFmsArrivalFixture();
    pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);

    pilot._mcp.setAltitudeFieldValue(initialAltitudeMock);
    pilot._mcp.setAltitudeHold();
});

ava.afterEach(() => {
    pilot = null;

    resetNavigationLibraryFixture();
});

ava('.descendViaStar() returns early when provided bottom altitude parameter is invalid', (t) => {
    const expectedResponse = [false, 'unable to descend to bottom altitude of threeve'];
    const response = pilot.descendViaStar(invalidAltitudeMock);

    t.deepEqual(response, expectedResponse);
    t.true(pilot._mcp.altitude === initialAltitudeMock);
});

ava('.descendViaStar() returns early when no bottom altitude param provided and FMS has no bottom altitude', (t) => {
    // replace route with one that will have NO altitude restrictions whatsoever
    pilot.replaceFlightPlanWithNewRoute('DAG..MISEN..CLARR..SKEBR..KEPEC..IPUMY..NIPZO..SUNST');

    const response = pilot.descendViaStar();

    t.deepEqual(response, failureResponseMock);
    t.true(pilot._mcp.altitude === initialAltitudeMock);
});

ava('.descendViaStar() returns early when no bottom altitude param provided and FMS bottom altitude is invalid', (t) => {
    // replace route with one that will have NO altitude restrictions whatsoever
    pilot.replaceFlightPlanWithNewRoute('DAG..MISEN..CLARR..SKEBR..KEPEC..IPUMY..NIPZO..SUNST');

    pilot._fms.waypoints[2].altitudeMaximum = invalidAltitudeMock;

    const response = pilot.descendViaStar();

    t.deepEqual(response, failureResponseMock);
    t.true(pilot._mcp.altitude === initialAltitudeMock);
});

ava('.descendViaStar() correctly configures MCP when no bottom altitude parameter provided but FMS has valid bottom altitude', (t) => {
    const response = pilot.descendViaStar();

    t.deepEqual(response, successResponseMock);
    t.true(pilot._mcp.altitudeMode === 'VNAV');
    t.true(pilot._mcp.speedMode === 'VNAV');
    t.true(pilot._mcp.altitude === 8000);
});

ava('.descendViaStar() correctly configures MCP when provided valid bottom altitude parameter', (t) => {
    const response = pilot.descendViaStar(nextAltitudeMock);

    t.deepEqual(response, successResponseMock);
    t.true(pilot._mcp.altitudeMode === 'VNAV');
    t.true(pilot._mcp.altitude === nextAltitudeMock);
});
