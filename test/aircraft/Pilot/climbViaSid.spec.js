import ava from 'ava';
import sinon from 'sinon';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import NavigationLibrary from '../../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../../airport/_mocks/airportJsonMock';
import {
    fmsDepartureFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import { INVALID_NUMBER } from '../../../src/assets/scripts/client/constants/globalConstants';

let navigationLibraryFixture;

ava.beforeEach(() => {
    navigationLibraryFixture = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
});

ava.afterEach(() => {
    navigationLibraryFixture.reset();
});

// let pilot = null;
// ava.beforeEach(() => {
//     pilot = new Pilot(fmsDepartureFixture, modeControllerFixture, navigationLibraryFixture);
// });
//
// ava.afterEach(() => {
//     pilot = null;
// });

ava('.climbViaSID() returns error response if #flightPlanAltitude has not been set', (t) => {
    const expectedResult = [
        false,
        {
            log: 'unable to climb via SID, no altitude assigned',
            say: 'unable to climb via SID, no altitude assigned'
        }
    ];
    const pilot = new Pilot(fmsDepartureFixture, modeControllerFixture, navigationLibraryFixture);
    const previousFlightPlanAltitude = pilot._fms.flightPlanAltitude;
    pilot._fms.flightPlanAltitude = INVALID_NUMBER;

    const result = pilot.climbViaSid();

    t.deepEqual(result, expectedResult);

    pilot._fms.flightPlanAltitude = previousFlightPlanAltitude;
});

ava('.climbViaSID() calls ._mcp.setAltitudeFieldValue() and ._mcp.setAltitudeVnav()', (t) => {
    const pilot = new Pilot(fmsDepartureFixture, modeControllerFixture, navigationLibraryFixture);
    const setAltitudeFieldValueSpy = sinon.spy(pilot._mcp, 'setAltitudeFieldValue');
    const setAltitudeVnavSpy = sinon.spy(pilot._mcp, 'setAltitudeVnav');

    pilot.climbViaSid();

    t.true(setAltitudeFieldValueSpy.calledWithExactly(pilot._fms.flightPlanAltitude));
    t.true(setAltitudeVnavSpy.calledOnce);
});

ava('.climbViaSID() returns success response when successful', (t) => {
    const expectedResult = [
        true,
        {
            log: 'climb via SID',
            say: 'climb via SID'
        }
    ];
    const pilot = new Pilot(fmsDepartureFixture, modeControllerFixture, navigationLibraryFixture);
    const result = pilot.climbViaSid();

    t.deepEqual(result, expectedResult);
});
