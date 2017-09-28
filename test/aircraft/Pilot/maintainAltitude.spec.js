/* eslint-disable max-len */
import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import _isObject from 'lodash/isObject';
import AircraftModel from '../../../src/assets/scripts/client/aircraft/AircraftModel';
import { airportModelFixture } from '../../fixtures/airportFixtures';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import { ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK } from '../_mocks/aircraftMocks';


ava('.maintainAltitude() returns early responding that they are unable to maintain the requested altitude', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);
    const nextAltitudeMock = 90000;
    const shouldExpediteMock = false;
    const shouldUseSoftCeilingMock = true;
    const expectedResult = [
        false,
        {
            log: 'unable to maintain 90000 due to performance',
            say: 'unable to maintain flight level niner zero zero due to performance'
        }
    ];

    const result = aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );

    t.true(aircraftModel.mcp.altitudeMode === 'VNAV');
    t.true(aircraftModel.mcp.altitude === aircraftModel.altitude);
    t.deepEqual(result, expectedResult);
});

ava('.maintainAltitude() should set mcp.altitudeMode to `HOLD` and set mcp.altitude to the correct value', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);
    const nextAltitudeMock = 13000;
    const shouldExpediteMock = false;
    const shouldUseSoftCeilingMock = false;

    aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );

    t.true(aircraftModel.mcp.altitudeMode === 'HOLD');
    t.true(aircraftModel.mcp.altitude === 13000);
});

ava('.maintainAltitude() calls .shouldExpediteAltitudeChange() when shouldExpedite is true', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);
    const nextAltitudeMock = 13000;
    const shouldExpediteMock = true;
    const shouldUseSoftCeilingMock = false;
    const shouldExpediteAltitudeChangeSpy = sinon.spy(aircraftModel.pilot, 'shouldExpediteAltitudeChange');

    aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );

    t.true(shouldExpediteAltitudeChangeSpy.calledOnce);
});

ava('.maintainAltitude() returns the correct response strings when shouldExpedite is false', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);
    const nextAltitudeMock = 13000;
    const shouldExpediteMock = false;
    const shouldUseSoftCeilingMock = false;

    const result = aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );

    t.true(_isArray(result));
    t.true(result[0] === true);
    t.true(_isObject(result[1]));
    t.true(result[1].log === 'descend and maintain 13000');
    t.true(result[1].say === 'descend and maintain one three thousand');
});

ava('.maintainAltitude() returns the correct response strings when shouldExpedite is true', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);
    const nextAltitudeMock = 19000;
    const shouldExpediteMock = true;
    const shouldUseSoftCeilingMock = false;

    const result = aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );

    t.true(result[1].log === 'descend and maintain 19000 and expedite');
    t.true(result[1].say === 'descend and maintain flight level one niner zero and expedite');
});

ava('.maintainAltitude() calls .cancelApproachClearance()', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);
    const approachTypeMock = 'ils';
    const runwayModelMock = airportModelFixture.getRunway('19L');
    const altitudeMock = 7000;
    const headingMock = 3.839724354387525; // 220 in degrees
    const nextAltitudeMock = 13000;
    const shouldExpediteMock = false;
    const shouldUseSoftCeilingMock = false;
    const cancelApproachClearanceSpy = sinon.spy(aircraftModel.pilot, 'cancelApproachClearance');

    aircraftModel.pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock, altitudeMock, headingMock);

    t.true(aircraftModel.pilot.hasApproachClearance);

    aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );

    t.true(cancelApproachClearanceSpy.called);
});
