import ava from 'ava';
import _isEqual from 'lodash/isEqual';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('.replaceFlightPlanWithNewRoute() returns an error when passed an invalid route', (t) => {
    const expectedResult = [
        false,
        {
            log: 'requested route of "a..b.c.d" is invalid',
            say: 'that route is invalid'
        }
    ];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const result = pilot.replaceFlightPlanWithNewRoute('a..b.c.d');

    t.true(_isEqual(result, expectedResult));
});

ava('.replaceFlightPlanWithNewRoute() removes an existing route and replaces it with a new one', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);

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
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const result = pilot.replaceFlightPlanWithNewRoute('COWBY..BIKKR..DAG');

    t.true(_isEqual(result, expectedResult));
});
