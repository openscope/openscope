import ava from 'ava';
import sinon from 'sinon';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';

const waypointNameMock = 'SUNST';

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('.proceedDirect() returns an error if the waypointName provided is not in the current flightPlan', (t) => {
    const expectedResult = [false, 'cannot proceed direct to ABC, it does not exist in our flight plan'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const result = pilot.proceedDirect('ABC');

    t.deepEqual(result, expectedResult);
});

ava('.proceedDirect() calls ._fms.skipToWaypointName() with the correct arguments', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const skipToWaypointNameSpy = sinon.spy(pilot._fms, 'skipToWaypointName');

    pilot.proceedDirect(waypointNameMock);

    t.true(skipToWaypointNameSpy.calledWithExactly(waypointNameMock));
});

ava('.proceedDirect() sets the correct #_mcp mode', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);

    pilot.proceedDirect(waypointNameMock);

    t.true(pilot._mcp.headingMode === 'LNAV');
});

ava('.proceedDirect() calls .exitHold()', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const exitHoldSpy = sinon.spy(pilot, 'exitHold');

    pilot._fms.setFlightPhase('HOLD');
    pilot.proceedDirect(waypointNameMock);

    t.true(exitHoldSpy.calledWithExactly());
});

ava('.proceedDirect() returns success message when finished', (t) => {
    const expectedResult = [true, 'proceed direct SUNST'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const result = pilot.proceedDirect(waypointNameMock);

    t.deepEqual(result, expectedResult);
});
