import ava from 'ava';
import sinon from 'sinon';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import NavigationLibrary from '../../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../../airport/_mocks/airportJsonMock';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

const waypointNameMock = 'SUNST';
let navigationLibraryFixture;

ava.beforeEach(() => {
    navigationLibraryFixture = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
});

ava.afterEach(() => {
    navigationLibraryFixture.reset();
});


ava('.proceedDirect() returns an error if the waypointName provided is not in the current flightPlan', (t) => {
    const expectedResult = [false, 'cannot proceed direct to ABC, it does not exist in our flight plan'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);
    const result = pilot.proceedDirect('ABC');

    t.deepEqual(result, expectedResult);
});

ava('.proceedDirect() calls ._fms.skipToWaypoint() with the correct arguments', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);
    const skipToWaypointSpy = sinon.spy(pilot._fms, 'skipToWaypoint');

    pilot.proceedDirect(waypointNameMock);

    t.true(skipToWaypointSpy.calledWithExactly(waypointNameMock));
});

ava('.proceedDirect() sets the correct #_mcp mode', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);

    pilot.proceedDirect(waypointNameMock);

    t.true(pilot._mcp.headingMode === 'LNAV');
});

ava('.proceedDirect() returns to the correct flightPhase after a hold', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);
    pilot._fms.setFlightPhase('HOLD');

    pilot.proceedDirect(waypointNameMock);

    t.true(pilot._fms.currentPhase === 'CRUISE');
});

ava('.proceedDirect() returns success message when finished', (t) => {
    const expectedResult = [true, 'proceed direct SUNST'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);
    const result = pilot.proceedDirect(waypointNameMock);

    t.deepEqual(result, expectedResult);
});
