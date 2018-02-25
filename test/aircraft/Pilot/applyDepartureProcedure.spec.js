import ava from 'ava';
import _isArray from 'lodash/isArray';
import _isEqual from 'lodash/isEqual';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsDepartureFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';

const sidIdMock = 'COWBY6';
const airportIcaoMock = 'KLAS';

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava.skip('.applyDepartureProcedure() returns an error when passed an invalid sidId', (t) => {
    const expectedResult = [false, 'SID name not understood'];
    const pilot = new Pilot(fmsDepartureFixture, modeControllerFixture);
    const result = pilot.applyDepartureProcedure('~!@#$%', airportIcaoMock);

    t.true(_isEqual(result, expectedResult));
    t.false(pilot.hasDepartureClearance);
});

ava.skip('.applyDepartureProcedure() returns an error when passed an invalid runway', (t) => {
    const expectedResult = [false, 'unsure if we can accept that procedure; we don\'t have a runway assignment'];
    const pilot = new Pilot(fmsDepartureFixture, modeControllerFixture);
    const result = pilot.applyDepartureProcedure(sidIdMock, null, airportIcaoMock);

    t.true(_isEqual(result, expectedResult));
    t.false(pilot.hasDepartureClearance);
});

ava.skip('.applyDepartureProcedure() returns an error when passed a runway incompatable for the route', (t) => {
    const expectedResult = [false, 'unable, the COWBOY SIX departure not valid from Runway ~!@#$%'];
    const invalidRunwayModelMock = {
        name: '~!@#$%'
    };
    const pilot = new Pilot(fmsDepartureFixture, modeControllerFixture);
    const result = pilot.applyDepartureProcedure(sidIdMock, invalidRunwayModelMock, airportIcaoMock);

    t.true(_isEqual(result, expectedResult));
    t.false(pilot.hasDepartureClearance);
});

ava.skip('.applyDepartureProcedure() should set mcp altitude and speed modes to `VNAV`', (t) => {
    const pilot = new Pilot(fmsDepartureFixture, modeControllerFixture);
    pilot.applyDepartureProcedure(sidIdMock, airportIcaoMock);

    t.true(pilot._mcp.altitudeMode === 'VNAV');
    t.true(pilot._mcp.speedMode === 'VNAV');
});

ava.skip('.applyDepartureProcedure() returns a success message after success', (t) => {
    const pilot = new Pilot(fmsDepartureFixture, modeControllerFixture);
    const result = pilot.applyDepartureProcedure(sidIdMock, airportIcaoMock);

    t.true(_isArray(result));
    t.true(result[0]);
    t.true(result[1].log === 'cleared to destination via the COWBY6 departure, then as filed');
    t.true(result[1].say === 'cleared to destination via the Cowboy Six departure, then as filed');
});
