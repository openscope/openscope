/* eslint-disable max-len */
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
import { airportModelFixture } from '../../fixtures/airportFixtures';

const airportNameMock = 'Las Vegas International';
const runwayMock = '19L';
const validRouteStringMock = 'DAG.KEPEC3.KLAS';
const invalidRouteStringMock = 'DAG.~!@#$.KLAS';

ava.skip('.applyArrivalProcedure() returns an error when passed an invalid routeString', (t) => {
    const expectedResult = [false, 'STAR name not understood'];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    try {
        const result = pilot.applyArrivalProcedure('~!@#$%', airportNameMock);
    } catch (error) {
        t.true(error === 'TypeError: Invalid routeCode passed to RouteModel. Expected a routeCode of the shape ORIGIN.BASE.DESTINATION but instead received ~!@#$%');
    }
});

ava('.applyArrivalProcedure() returns an error when passed an invalid procedure name', (t) => {
    const expectedResult = [false, 'STAR name not understood'];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.applyArrivalProcedure(invalidRouteStringMock, runwayMock, airportNameMock);

    t.true(_isEqual(result, expectedResult));
});

// copied from applyDepartureProcedure(), update for applyArrivalProcedure()
ava.skip('.applyArrivalProcedure() returns a success message after success', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsDepartureFixture);
    const result = pilot.applyArrivalProcedure(sidIdMock, runwayMock, airportNameMock);

    t.true(_isArray(result));
    t.true(result[0]);
    t.true(result[1].log === 'cleared to destination via the COWBY6 departure, then as filed');
    t.true(result[1].say === 'cleared to destination via the Cowboy Six departure, then as filed');
});
