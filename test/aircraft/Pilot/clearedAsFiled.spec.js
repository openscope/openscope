/* eslint-disable max-len */
import ava from 'ava';
import _isArray from 'lodash/isArray';
import _isObject from 'lodash/isObject';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import { airportModelFixture } from '../../fixtures/airportFixtures';

const runwayMock = '19L';
const cruiseSpeedMock = 460;

ava('.clearedAsFiled() should set mcp altitude, heading and speed modes with values', (t) => {
    const expectedResult = {
        altitudeMode: 'HOLD',
        autopilotMode: 'OFF',
        headingMode: 'LNAV',
        speedMode: 'N1',
        altitude: 19000,
        course: -1,
        heading: 3.3674436372440057,
        speed: 460,
        shouldExpediteAltitudeChange: false
    };
    const initialAltitudeMock = airportModelFixture.initial_alt;
    const { angle: runwayHeadingMock } = airportModelFixture.getRunway(runwayMock);
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);

    pilot.clearedAsFiled(initialAltitudeMock, runwayHeadingMock, cruiseSpeedMock);

    t.true(pilot._mcp.altitudeMode === expectedResult.altitudeMode);
    t.true(pilot._mcp.headingMode === expectedResult.headingMode);
    t.true(pilot._mcp.speedMode === expectedResult.speedMode);
    t.true(pilot._mcp.altitude === expectedResult.altitude);
    t.true(pilot._mcp.course === expectedResult.course);
    t.true(pilot._mcp.heading === expectedResult.heading);
    t.true(pilot._mcp.speed === expectedResult.speed);
});

ava('.clearedAsFiled() should returns the correct response strings', (t) => {
    const initialAltitudeMock = airportModelFixture.initial_alt;
    const { angle: runwayHeadingMock } = airportModelFixture.getRunway(runwayMock);
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.clearedAsFiled(initialAltitudeMock, runwayHeadingMock, cruiseSpeedMock);

    t.true(_isArray(result));
    t.true(result[0] === 'ok');
    t.true(_isObject(result[1]));
    t.true(result[1].log === 'cleared to destination as filed. Climb and maintain 19000, expect 41000 10 minutes after departure');
    t.true(result[1].say === 'cleared to destination as filed. Climb and maintain flight level one niner zero, expect flight level four one zero, one zero minutes after departure');
});
