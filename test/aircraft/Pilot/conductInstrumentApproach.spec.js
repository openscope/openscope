import ava from 'ava';
import sinon from 'sinon';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';
import { airportModelFixture } from '../../fixtures/airportFixtures';

const approachTypeMock = 'ils';
const runwayNameMock = '19L';
const runwayModelMock = airportModelFixture.getRunway(runwayNameMock);

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('.conductInstrumentApproach() returns error when no runway is provided', (t) => {
    const expectedResult = [false, 'the specified runway does not exist'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const result = pilot.conductInstrumentApproach(approachTypeMock, null);

    t.deepEqual(result, expectedResult);
});

ava('.conductInstrumentApproach() calls .setArrivalRunway() with the runwayName', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const setArrivalRunwaySpy = sinon.spy(pilot._fms, 'setArrivalRunway');

    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);

    t.true(setArrivalRunwaySpy.calledWithExactly(runwayModelMock));
});

ava('.conductInstrumentApproach() calls ._interceptCourse() with the correct properties', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const _interceptCourseSpy = sinon.spy(pilot, '_interceptCourse');

    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);

    t.true(_interceptCourseSpy.calledWithExactly(runwayModelMock.positionModel, runwayModelMock.angle));
});

ava('.conductInstrumentApproach() calls ._interceptGlidepath() with the correct properties', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const _interceptGlidepathSpy = sinon.spy(pilot, '_interceptGlidepath');

    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);

    t.true(_interceptGlidepathSpy.calledWithExactly(
        runwayModelMock.positionModel,
        runwayModelMock.angle,
        runwayModelMock.ils.glideslopeGradient
    ));
});

ava('.conductInstrumentApproach() calls .exitHold', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const exitHoldSpy = sinon.spy(pilot, 'exitHold');

    pilot._fms.setFlightPhase('HOLD');
    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);

    t.true(exitHoldSpy.calledWithExactly());
});

ava('.conductInstrumentApproach() sets #hasApproachClearance to true', (t) => {
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);

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
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const result = pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);

    t.deepEqual(result, expectedResult);
});
