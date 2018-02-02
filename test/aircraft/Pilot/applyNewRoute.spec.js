import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import NavigationLibrary from '../../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../../airport/_mocks/airportJsonMock';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

// fixtures
let navigationLibraryFixture;

ava.beforeEach(() => {
    navigationLibraryFixture = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
});

ava.afterEach(() => {
    navigationLibraryFixture.reset();
});

ava('.replaceFlightPlanWithNewRoute() returns an error when passed an invalid route', (t) => {
    const expectedResult = [
        false,
        {
            log: 'requested route of "a..b.c.d" is invalid',
            say: 'that route is invalid'
        }
    ];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);
    const result = pilot.replaceFlightPlanWithNewRoute('a..b.c.d');

    t.true(_isEqual(result, expectedResult));
});

ava('.replaceFlightPlanWithNewRoute() removes an existing route and replaces it with a new one', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);

    pilot.replaceFlightPlanWithNewRoute('COWBY..BIKKR..DAG');

    t.true(pilot._fms.currentWaypoint.name === 'COWBY');
});

ava('.replaceFlightPlanWithNewRoute() returns a success message when finished successfully', (t) => {
    const expectedResult = [
        true,
        {
            log: 'rerouting to: COWBY BIKKR DAG',
            say: 'rerouting as requested'
        }
    ];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);
    const result = pilot.replaceFlightPlanWithNewRoute('COWBY..BIKKR..DAG');

    t.true(_isEqual(result, expectedResult));
});
