import ava from 'ava';
import _isEqual from 'lodash/isEqual';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

const invalidRouteString = 'A..B.C.D';
const complexRouteString = 'COWBY..BIKKR..DAG.KEPEC3.KLAS';
const amendRouteString = 'HITME..HOLDM..BIKKR';

function buildPilotWithComplexRoute() {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    pilot.applyNewRoute(complexRouteString);

    return pilot;
}

ava('.applyPartialRouteAmendment() returns an error with passed an invalid routeString', (t) => {
    const expectedResult = [false, 'requested route of "A..B.C.D" is invalid'];
    const pilot = buildPilotWithComplexRoute();
    const result = pilot.applyPartialRouteAmendment(invalidRouteString);

    t.true(_isEqual(result, expectedResult));
});

ava('.applyPartialRouteAmendment() returns an error with passed a routeString without a shared waypoint', (t) => {
    const expectedResult = [false, 'requested route of "HITME..HOLDM" is invalid, it must contain a Waypoint in the current route'];
    const pilot = buildPilotWithComplexRoute();
    const result = pilot.applyPartialRouteAmendment('HITME..HOLDM');

    t.true(_isEqual(result, expectedResult));
});

ava('.applyPartialRouteAmendment() returns to the correct flightPhase after a hold', (t) => {
    const pilot = buildPilotWithComplexRoute();
    pilot._fms.setFlightPhase('HOLD');

    pilot.applyPartialRouteAmendment(amendRouteString);

    t.true(pilot._fms.currentPhase === 'CRUISE');
});

ava('.applyPartialRouteAmendment() returns a success message when complete', (t) => {
    const expectedResult = [
        true,
        {
            log: 'rerouting to: HITME..HOLDM..BIKKR..DAG.KEPEC3.KLAS',
            say: 'rerouting as requested'
        }
    ];
    const pilot = buildPilotWithComplexRoute();
    const result = pilot.applyPartialRouteAmendment(amendRouteString);

    t.true(_isEqual(result, expectedResult));
});
