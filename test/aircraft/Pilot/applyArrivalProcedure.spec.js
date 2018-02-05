/* eslint-disable max-len */
import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
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

const airportNameMock = 'McCarran International Airport';
const validRouteStringMock = 'DAG.KEPEC3.KLAS07R';

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('.applyArrivalProcedure() returns an error when passed an invalid routeString', (t) => {
    const expectedResult = [false, 'arrival procedure format not understood'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const result = pilot.applyArrivalProcedure('~!@#$%', airportNameMock);

    t.true(_isEqual(result, expectedResult));
});

ava('.applyArrivalProcedure() returns an error when passed an invalid procedure name', (t) => {
    const invalidRouteStringMock = 'DAG.~!@#$.KLAS';
    const expectedResult = [false, 'unknown procedure "~!@#$"'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const result = pilot.applyArrivalProcedure(invalidRouteStringMock, airportNameMock);

    t.true(_isEqual(result, expectedResult));
});

ava('.applyArrivalProcedure() returns an error when passed a procedure with an invalid entry', (t) => {
    const invalidRouteStringMock = 'a.KEPEC3.KLAS';
    const expectedResult = [false, 'route of "a.KEPEC3.KLAS" is not valid'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const result = pilot.applyArrivalProcedure(invalidRouteStringMock, airportNameMock);

    t.true(_isEqual(result, expectedResult));
});

ava('.applyArrivalProcedure() returns a success message after success', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const result = pilot.applyArrivalProcedure(validRouteStringMock, airportNameMock);

    t.true(_isArray(result));
    t.true(result[0]);
    t.true(result[1].log === 'cleared to McCarran International Airport via the KEPEC3 arrival');
    t.true(result[1].say === 'cleared to McCarran International Airport via the KEPEC THREE arrival');
});

ava('.applyArrivalProcedure() calls #_fms.replaceArrivalProcedure() with the correct parameters', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const replaceArrivalProcedureSpy = sinon.spy(pilot._fms, 'replaceArrivalProcedure');

    pilot.applyArrivalProcedure(validRouteStringMock, airportNameMock);

    t.true(replaceArrivalProcedureSpy.calledWithExactly(validRouteStringMock));
});
