import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import _isEqual from 'lodash/isEqual';
import _isObject from 'lodash/isObject';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

const invalidRouteString = 'a..b.c.d';
const complexRouteString = 'COWBY..BIKKR..DAG.KEPEC3.KLAS';
const amendRouteString = 'HITME..HOLDM..BIKKR';
const runwayMock = '19L';;

function buildPilotWithComplexRoute() {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    pilot.applyNewRoute(complexRouteString);

    return pilot;
}

ava('.applyPartialRouteAmendment() returns an error with passed an invalid routeString', (t) => {
    const expectedResult = [false, 'requested route of "a..b.c.d" is invalid'];
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

ava('.applyPartialRouteAmendment() returns a success message when complete', (t) => {
    const expectedResult = [
        true,
        {
            log: 'rerouting to: hitme..holdm..bikkr..dag.kepec3.klas',
            say: 'rerouting as requested'
        }
    ];
    const pilot = buildPilotWithComplexRoute();
    const result = pilot.applyPartialRouteAmendment(amendRouteString);

    t.true(_isEqual(result, expectedResult));
});
