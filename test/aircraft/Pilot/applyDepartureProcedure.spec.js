import ava from 'ava';
import _isArray from 'lodash/isArray';
import _isEqual from 'lodash/isEqual';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsDepartureFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

const runwayModelMock = {
    name: '19L'
};
const sidIdMock = 'COWBY6';
const airportIcaoMock = 'KLAS';

ava('.applyDepartureProcedure() returns an error when passed an invalid sidId', (t) => {
    const expectedResult = [false, 'SID name not understood'];
    const pilot = new Pilot(modeControllerFixture, fmsDepartureFixture);
    const result = pilot.applyDepartureProcedure('~!@#$%', runwayModelMock, airportIcaoMock);

    t.true(_isEqual(result, expectedResult));
});

ava('.applyDepartureProcedure() returns an error when passed an invalid runway', (t) => {
    const expectedResult = [false, 'unsure if we can accept that procedure; we don\'t have a runway assignment'];
    const pilot = new Pilot(modeControllerFixture, fmsDepartureFixture);
    const result = pilot.applyDepartureProcedure(sidIdMock, null, airportIcaoMock);

    t.true(_isEqual(result, expectedResult));
});

ava('.applyDepartureProcedure() returns an error when passed a runway incompatable for the route', (t) => {
    const expectedResult = [false, 'unable, the COWBOY SIX departure not valid from Runway ~!@#$%'];
    const invalidRunwayModelMock = {
        name: '~!@#$%'
    };
    const pilot = new Pilot(modeControllerFixture, fmsDepartureFixture);
    const result = pilot.applyDepartureProcedure(sidIdMock, invalidRunwayModelMock, airportIcaoMock);

    t.true(_isEqual(result, expectedResult));
});

ava('.applyDepartureProcedure() should set mcp altitude and speed modes to `VNAV`', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsDepartureFixture);
    pilot.applyDepartureProcedure(sidIdMock, runwayModelMock, airportIcaoMock);

    t.true(pilot._mcp.altitudeMode === 'VNAV');
    t.true(pilot._mcp.speedMode === 'VNAV');
});

ava('.applyDepartureProcedure() returns a success message after success', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsDepartureFixture);
    const result = pilot.applyDepartureProcedure(sidIdMock, runwayModelMock, airportIcaoMock);

    t.true(_isArray(result));
    t.true(result[0]);
    t.true(result[1].log === 'cleared to destination via the COWBY6 departure, then as filed');
    t.true(result[1].say === 'cleared to destination via the Cowboy Six departure, then as filed');
});
