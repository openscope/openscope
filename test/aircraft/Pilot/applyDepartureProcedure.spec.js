/* eslint-disable max-len */
import ava from 'ava';
// import _isArray from 'lodash/isArray';
import _isEqual from 'lodash/isEqual'
// import _isObject from 'lodash/isObject';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsDepartureFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

const runwayMock = '19L';
const sidIdMock = 'COWBY6';
const airportIcaoMock = 'KLAS';

ava('.clearedAsFiled() returns an error when passed an invalid sidId', (t) => {
    const expectedResult = [false, 'SID name not understood'];
    const pilot = new Pilot(modeControllerFixture, fmsDepartureFixture);
    const result = pilot.applyDepartureProcedure('~!@#$%', runwayMock, airportIcaoMock);

    t.true(_isEqual(result, expectedResult));
});

ava('.clearedAsFiled() returns an error when passed an invalid runway', (t) => {
    const expectedResult = [false, 'unsure if we can accept that procedure; we don\'t have a runway assignment'];
    const pilot = new Pilot(modeControllerFixture, fmsDepartureFixture);
    const result = pilot.applyDepartureProcedure(sidIdMock, null, airportIcaoMock);

    t.true(_isEqual(result, expectedResult));
});

ava('.clearedAsFiled() returns an error when passed a runway incompatable for the route', (t) => {
    const expectedResult = [false, 'unable, the COWBOY SIX departure not valid from Runway ~!@#$%'];
    const pilot = new Pilot(modeControllerFixture, fmsDepartureFixture);
    const result = pilot.applyDepartureProcedure(sidIdMock, '~!@#$%', airportIcaoMock);

    t.true(_isEqual(result, expectedResult));
});

ava('.clearedAsFiled() should set mcp altitude, heading and speed modes with values', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsDepartureFixture);
    const result = pilot.applyDepartureProcedure(sidIdMock, runwayMock, airportIcaoMock);

    // console.log(result);
});
