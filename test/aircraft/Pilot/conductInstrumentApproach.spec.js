import ava from 'ava';
import sinon from 'sinon';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

import { airportModelFixture } from '../../fixtures/airportFixtures';

const approachTypeMock = 'ils';
const runwayNameMock = '19L';
const runwayModelMock = airportModelFixture.getRunway(runwayNameMock);
const altitudeMock = 7000;
const headingMock = 3.839724354387525; // 220 in degrees

ava('.conductInstrumentApproach() returns error when no runway is provided', (t) => {
    const expectedResult = [false, 'the specified runway does not exist'];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.conductInstrumentApproach(approachTypeMock, null, altitudeMock, headingMock);

    t.deepEqual(result, expectedResult);
});

ava('.conductInstrumentApproach() calls .flyPresentHeading() if the mcp.headingMode !== HOLD', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const maintainPresentHeadingSpy = sinon.spy(pilot, 'maintainPresentHeading');

    pilot._mcp.headingMode = 'LNAV';
    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock, altitudeMock, headingMock);

    t.true(maintainPresentHeadingSpy.calledWithExactly(headingMock));
});

ava('.conductInstrumentApproach() calls .setArrivalRunway() with the runwayName', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const setArrivalRunwaySpy = sinon.spy(pilot._fms, 'setArrivalRunway');

    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock, altitudeMock, headingMock);

    t.true(setArrivalRunwaySpy.calledWithExactly(runwayModelMock));
});

ava('.conductInstrumentApproach() calls ._interceptCourse() with the correct properties', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const _interceptCourseSpy = sinon.spy(pilot, '_interceptCourse');

    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock, altitudeMock, headingMock);

    t.true(_interceptCourseSpy.calledWithExactly(runwayModelMock.positionModel, runwayModelMock.angle));
});

ava('.conductInstrumentApproach() calls ._interceptGlidepath() with the correct properties', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const _interceptGlidepathSpy = sinon.spy(pilot, '_interceptGlidepath');

    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock, altitudeMock, headingMock);

    t.true(_interceptGlidepathSpy.calledWithExactly(
        runwayModelMock.positionModel,
        runwayModelMock.angle,
        runwayModelMock.ils.gs_gradient,
        altitudeMock
    ));
});

ava('.conductInstrumentApproach() returns to the correct flightPhase after a hold', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    pilot._fms.setFlightPhase('HOLD');

    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock, altitudeMock, headingMock);

    t.true(pilot._fms.currentPhase === 'CRUISE');
});

ava('.conductInstrumentApproach() sets #hasApproachClearance to true', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock, altitudeMock, headingMock);

    t.true(pilot.hasApproachClearance);
});

ava('.conductInstrumentApproach() returns a success message', (t) => {
    const expectedResult = [
        true,
        {
            log: 'cleared ILS runway 19L approach',
            say: 'cleared ILS runway one niner left approach'
        }
    ];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock, altitudeMock, headingMock);

    t.deepEqual(result, expectedResult);
});
