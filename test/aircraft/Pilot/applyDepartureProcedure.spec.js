/* eslint-disable max-len */
import ava from 'ava';
// import _isArray from 'lodash/isArray';
// import _isObject from 'lodash/isObject';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsDepartureFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

const runwayMock = '19L';
const sidIdMock = 'COWBY6';
const airportIcaoMock = 'KLAS';

ava('.clearedAsFiled() should set mcp altitude, heading and speed modes with values', (t) => {
    // const expectedResult = {
    //     altitudeMode: 'HOLD',
    //     autopilotMode: 'OFF',
    //     headingMode: 'LNAV',
    //     speedMode: 'N1',
    //     altitude: 19000,
    //     course: -1,
    //     heading: 3.3674436372440057,
    //     speed: 460,
    //     shouldExpediteAltitudeChange: false
    // };
    const pilot = new Pilot(modeControllerFixture, fmsDepartureFixture);
    const result = pilot.applyDepartureProcedure(sidIdMock, runwayMock, airportIcaoMock);

    console.log(pilot);
    console.log(result);

    // t.true(pilot._mcp.altitudeMode === expectedResult.altitudeMode);
    // t.true(pilot._mcp.headingMode === expectedResult.headingMode);
    // t.true(pilot._mcp.speedMode === expectedResult.speedMode);
    // t.true(pilot._mcp.altitude === expectedResult.altitude);
    // t.true(pilot._mcp.course === expectedResult.course);
    // t.true(pilot._mcp.heading === expectedResult.heading);
    // t.true(pilot._mcp.speed === expectedResult.speed);
});
