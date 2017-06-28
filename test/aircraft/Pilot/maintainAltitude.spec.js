/* eslint-disable max-len */
import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import _isObject from 'lodash/isObject';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import { airportModelFixture } from '../../fixtures/airportFixtures';

ava('.maintainAltitude() should set mcp.altitude to the correct value when greater than maxAssignableAltitude', (t) => {
    const currentAltitudeMock = 5000;
    const nextAltitudeMock = 100000;
    const shouldExpediteMock = false;
    const shouldUseSoftCeilingMock = true;
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    pilot.maintainAltitude(
        currentAltitudeMock,
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture
    );

    t.true(pilot._mcp.altitudeMode === 'HOLD');
    t.true(pilot._mcp.altitude === 19001);
});

ava('.maintainAltitude() should set mcp.altitudeMode to `HOLD` and set mcp.altitude to the correct value', (t) => {
    const currentAltitudeMock = 5000;
    const nextAltitudeMock = 13000;
    const shouldExpediteMock = false;
    const shouldUseSoftCeilingMock = false;
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    pilot.maintainAltitude(
        currentAltitudeMock,
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture
    );

    t.true(pilot._mcp.altitudeMode === 'HOLD');
    t.true(pilot._mcp.altitude === 13000);
});

ava('.maintainAltitude() calls .shouldExpediteAltitudeChange() when shouldExpedite is true', (t) => {
    const currentAltitudeMock = 5000;
    const nextAltitudeMock = 13000;
    const shouldExpediteMock = true;
    const shouldUseSoftCeilingMock = false;
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const shouldExpediteAltitudeChangeSpy = sinon.spy(pilot, 'shouldExpediteAltitudeChange');

    pilot.maintainAltitude(
        currentAltitudeMock,
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture
    );

    t.true(shouldExpediteAltitudeChangeSpy.calledOnce);
});

ava('.maintainAltitude() returns the correct response strings when shouldExpedite is false', (t) => {
    const currentAltitudeMock = 5000;
    const nextAltitudeMock = 13000;
    const shouldExpediteMock = false;
    const shouldUseSoftCeilingMock = false;
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    const result = pilot.maintainAltitude(
        currentAltitudeMock,
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture
    );

    t.true(_isArray(result));
    t.true(result[0] === true);
    t.true(_isObject(result[1]));
    t.true(result[1].log === 'climb and maintain 13000');
    t.true(result[1].say === 'climb and maintain one three thousand');
});

ava('.maintainAltitude() returns the correct response strings when shouldExpedite is true', (t) => {
    const currentAltitudeMock = 5000;
    const nextAltitudeMock = 41000;
    const shouldExpediteMock = true;
    const shouldUseSoftCeilingMock = false;
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    const result = pilot.maintainAltitude(
        currentAltitudeMock,
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture
    );

    t.true(result[1].log === 'climb and maintain 19000 and expedite');
    t.true(result[1].say === 'climb and maintain flight level one niner zero and expedite');
});

ava('.maintainAltitude() calls .cancelApproachClearance()', (t) => {
    const approachTypeMock = 'ils';
    const runwayModelMock = airportModelFixture.getRunway('19L');
    const altitudeMock = 7000;
    const headingMock = 3.839724354387525; // 220 in degrees
    const currentAltitudeMock = 5000;
    const nextAltitudeMock = 13000;
    const shouldExpediteMock = false;
    const shouldUseSoftCeilingMock = false;
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const cancelApproachClearanceSpy = sinon.spy(pilot, 'cancelApproachClearance');

    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock, altitudeMock, headingMock);

    t.true(pilot.hasApproachClearance);

    pilot.maintainAltitude(
        currentAltitudeMock,
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture
    );

    t.true(cancelApproachClearanceSpy.called);
});
