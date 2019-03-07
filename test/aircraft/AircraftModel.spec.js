import ava from 'ava';
import sinon from 'sinon';
import AircraftModel from '../../src/assets/scripts/client/aircraft/AircraftModel';
import NavigationLibrary from '../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import {
    createAirportControllerFixture,
    resetAirportControllerFixture,
    airportModelFixture
} from '../fixtures/airportFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../fixtures/navigationLibraryFixtures';
import {
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK
} from './_mocks/aircraftMocks';
import {
    FLIGHT_PHASE,
    PERFORMANCE
} from '../../src/assets/scripts/client/constants/aircraftConstants';
import { AIRPORT_CONSTANTS } from '../../src/assets/scripts/client/constants/airportConstants';

let sandbox; // using the sinon sandbox ensures stubs are restored after each test

// mocks
const runwayNameMock = '19L';
const runwayModelMock = airportModelFixture.getRunway(runwayNameMock);

function moveAircraftToFix(aircraft, fixName) {
    const fms = aircraft.fms;

    while (fms.currentWaypoint._name !== fixName) {
        if (!fms.hasNextWaypoint()) {
            throw Error(`Can not find waypoint ${fixName}`);
        }

        fms.moveToNextWaypoint();
    }

    aircraft.positionModel = NavigationLibrary.findFixByName(fixName).positionModel;
}

/* eslint-disable no-unused-vars, no-undef */
ava.beforeEach(() => {
    createNavigationLibraryFixture();
    createAirportControllerFixture();
    sandbox = sinon.sandbox.create();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
    resetAirportControllerFixture();
    sandbox.restore();
});
/* eslint-enable no-unused-vars, no-undef */

ava('does not throw with valid parameters', (t) => {
    t.notThrows(() => new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK));
});

ava('.cancelLanding() returns early when called for an aircraft projection', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const radioCallSpy = sinon.spy(model, 'radioCall');
    model.projected = true;
    const result = model.cancelLanding();

    t.true(typeof result === 'undefined');
    t.true(radioCallSpy.notCalled);
});

ava('.cancelLanding() configures MCP correctly when landing is cancelled at or above the missed approach altitude', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const mcpSetAltitudeFieldValueStub = sinon.spy(model.mcp, 'setAltitudeFieldValue');
    const mcpSetAltitudeHoldStub = sinon.spy(model.mcp, 'setAltitudeHold');
    const mcpSetHeadingFieldValueStub = sinon.spy(model.mcp, 'setHeadingFieldValue');
    const mcpSetHeadingHoldStub = sinon.spy(model.mcp, 'setHeadingHold');
    const setFlightPhaseStub = sinon.spy(model, 'setFlightPhase');
    const radioCallStub = sandbox.stub(model, 'radioCall');
    model.hasApproachClearance = true;
    model.fms.arrivalRunwayModel._positionModel.elevation = 65;
    model.altitude = 5310;
    model.heading = 0.25;
    const expectedRadioTranscript = 'going missed approach, present heading, leveling at 5000';
    const result = model.cancelLanding();

    t.true(typeof result === 'undefined');
    t.true(mcpSetAltitudeFieldValueStub.calledWithExactly(5000));
    t.true(mcpSetAltitudeHoldStub.calledWithExactly());
    t.true(mcpSetHeadingFieldValueStub.calledWithExactly(0.25));
    t.true(mcpSetHeadingHoldStub.calledWithExactly());
    t.true(setFlightPhaseStub.calledWithExactly(FLIGHT_PHASE.DESCENT));
    t.true(radioCallStub.calledWithExactly(expectedRadioTranscript, 'app', true));
});

ava('.cancelLanding() configures MCP correctly when landing cancelled below the missed approach altitude', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const mcpSetAltitudeFieldValueStub = sinon.spy(model.mcp, 'setAltitudeFieldValue');
    const mcpSetAltitudeHoldStub = sinon.spy(model.mcp, 'setAltitudeHold');
    const mcpSetHeadingFieldValueStub = sinon.spy(model.mcp, 'setHeadingFieldValue');
    const mcpSetHeadingHoldStub = sinon.spy(model.mcp, 'setHeadingHold');
    const setFlightPhaseStub = sinon.spy(model, 'setFlightPhase');
    const radioCallStub = sandbox.stub(model, 'radioCall', (a) => a);
    model.hasApproachClearance = true;
    model.fms.arrivalRunwayModel._positionModel.elevation = 65;
    model.altitude = 1300;
    model.heading = 0.25;
    const expectedRadioTranscript = 'going missed approach, present heading, climbing to 3000';
    const result = model.cancelLanding();

    t.true(typeof result === 'undefined');
    t.true(mcpSetAltitudeFieldValueStub.calledWithExactly(3000));
    t.true(mcpSetAltitudeHoldStub.calledWithExactly());
    t.true(mcpSetHeadingFieldValueStub.calledWithExactly(0.25));
    t.true(mcpSetHeadingHoldStub.calledWithExactly());
    t.true(setFlightPhaseStub.calledWithExactly(FLIGHT_PHASE.DESCENT));
    t.true(radioCallStub.calledWithExactly(expectedRadioTranscript, 'app', true));
});

ava('.getViewModel() includes an altitude that has not been rounded beyond the nearest foot', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    model.mcp.altitude = 7777.1234567;

    const { assignedAltitude: result } = model.getViewModel();

    t.true(result === 77.77);
});

ava('.isAboveGlidepath() returns false when aircraft altitude is below glideslope altitude', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    model.altitude = 3000;

    sandbox.stub(model, '_calculateArrivalRunwayModelGlideslopeAltitude', () => 4137);

    const result = model.isAboveGlidepath();

    t.false(result);
});

ava('.isAboveGlidepath() returns false when aircraft altitude is at glideslope altitude', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    model.altitude = 4137;

    sandbox.stub(model, '_calculateArrivalRunwayModelGlideslopeAltitude', () => 4137);

    const result = model.isAboveGlidepath();

    t.false(result);
});

ava('.isAboveGlidepath() returns true when aircraft altitude is above glideslope altitude', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    model.altitude = 5500;

    sandbox.stub(model, '_calculateArrivalRunwayModelGlideslopeAltitude', () => 4137);

    const result = model.isAboveGlidepath();

    t.true(result);
});

ava('.isEstablishedOnCourse() returns false when no arrival runway has been assigned', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    model.fms.arrivalRunwayModel = null;
    const result = model.isEstablishedOnCourse();

    t.false(result);
});

ava('.isEstablishedOnCourse() returns false when neither aligned with approach course nor on approach heading', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);

    sandbox.stub(model.fms.arrivalRunwayModel, 'isOnApproachCourse', () => false);
    sandbox.stub(model.fms.arrivalRunwayModel, 'isOnCorrectApproachHeading', () => false);

    const result = model.isEstablishedOnCourse();

    t.false(result);
});

ava('.isEstablishedOnCourse() returns false when aligned with approach course but not on approach heading', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);

    sandbox.stub(model.fms.arrivalRunwayModel, 'isOnApproachCourse', () => true);
    sandbox.stub(model.fms.arrivalRunwayModel, 'isOnCorrectApproachHeading', () => false);

    const result = model.isEstablishedOnCourse();

    t.false(result);
});

ava('.isEstablishedOnCourse() returns false when on approach heading but not aligned with approach course', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);

    sandbox.stub(model.fms.arrivalRunwayModel, 'isOnApproachCourse', () => false);
    sandbox.stub(model.fms.arrivalRunwayModel, 'isOnCorrectApproachHeading', () => true);

    const result = model.isEstablishedOnCourse();

    t.false(result);
});

ava('.isEstablishedOnCourse() returns true when aligned with approach course and on approach heading', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);

    sandbox.stub(model.fms.arrivalRunwayModel, 'isOnApproachCourse', () => true);
    sandbox.stub(model.fms.arrivalRunwayModel, 'isOnCorrectApproachHeading', () => true);

    const result = model.isEstablishedOnCourse();

    t.true(result);
});

ava('.isEstablishedOnGlidepath() returns false when too far above glideslope', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const glideslopeAltitude = 4000;
    model.altitude = glideslopeAltitude + PERFORMANCE.MAXIMUM_ALTITUDE_DIFFERENCE_CONSIDERED_ESTABLISHED_ON_GLIDEPATH + 1;

    sandbox.stub(model, '_calculateArrivalRunwayModelGlideslopeAltitude', () => glideslopeAltitude);

    const result = model.isEstablishedOnGlidepath();

    t.false(result);
});

ava('.isEstablishedOnGlidepath() returns false when too far below glideslope', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const glideslopeAltitude = 4000;
    model.altitude = glideslopeAltitude - PERFORMANCE.MAXIMUM_ALTITUDE_DIFFERENCE_CONSIDERED_ESTABLISHED_ON_GLIDEPATH - 1;

    sandbox.stub(model, '_calculateArrivalRunwayModelGlideslopeAltitude', () => glideslopeAltitude);

    const result = model.isEstablishedOnGlidepath();

    t.false(result);
});

ava('.isEstablishedOnGlidepath() returns true when an acceptable distance above glideslope', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const glideslopeAltitude = 4000;
    model.altitude = glideslopeAltitude + PERFORMANCE.MAXIMUM_ALTITUDE_DIFFERENCE_CONSIDERED_ESTABLISHED_ON_GLIDEPATH;

    sandbox.stub(model, '_calculateArrivalRunwayModelGlideslopeAltitude', () => glideslopeAltitude);

    const result = model.isEstablishedOnGlidepath();

    t.true(result);
});

ava('.isEstablishedOnGlidepath() returns true when an acceptable distance below glideslope', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const glideslopeAltitude = 4000;
    model.altitude = glideslopeAltitude - PERFORMANCE.MAXIMUM_ALTITUDE_DIFFERENCE_CONSIDERED_ESTABLISHED_ON_GLIDEPATH;

    sandbox.stub(model, '_calculateArrivalRunwayModelGlideslopeAltitude', () => glideslopeAltitude);

    const result = model.isEstablishedOnGlidepath();

    t.true(result);
});

ava('.isOnFinal() returns false when neither on the selected course nor within the final approach fix distance', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const isEstablishedOnCourse = false;
    const distanceToDatum = AIRPORT_CONSTANTS.FINAL_APPROACH_FIX_DISTANCE_NM + 1;

    sandbox.stub(model, 'isEstablishedOnCourse', () => isEstablishedOnCourse);
    sandbox.stub(model.positionModel, 'distanceToPosition', () => distanceToDatum);

    const result = model.isOnFinal();

    t.false(result);
});

ava('.isOnFinal() returns false when on the selected course but not within the final approach fix distance', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const isEstablishedOnCourse = true;
    const distanceToDatum = AIRPORT_CONSTANTS.FINAL_APPROACH_FIX_DISTANCE_NM + 1;

    sandbox.stub(model, 'isEstablishedOnCourse', () => isEstablishedOnCourse);
    sandbox.stub(model.positionModel, 'distanceToPosition', () => distanceToDatum);

    const result = model.isOnFinal();

    t.false(result);
});

ava('.isOnFinal() returns false when within the final approach fix distance but not on the selected course', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const isEstablishedOnCourse = false;
    const distanceToDatum = AIRPORT_CONSTANTS.FINAL_APPROACH_FIX_DISTANCE_NM;

    sandbox.stub(model, 'isEstablishedOnCourse', () => isEstablishedOnCourse);
    sandbox.stub(model.positionModel, 'distanceToPosition', () => distanceToDatum);

    const result = model.isOnFinal();

    t.false(result);
});

ava('.isOnFinal() returns true when both on the selected course and within the final approach fix distance', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const isEstablishedOnCourse = true;
    const distanceToDatum = AIRPORT_CONSTANTS.FINAL_APPROACH_FIX_DISTANCE_NM;

    sandbox.stub(model, 'isEstablishedOnCourse', () => isEstablishedOnCourse);
    sandbox.stub(model.positionModel, 'distanceToPosition', () => distanceToDatum);

    const result = model.isOnFinal();

    t.true(result);
});

ava('._calculateArrivalRunwayModelGlideslopeAltitude() returns arrival runway\'s glideslope altitude abeam the specified position', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const expectedResult = 3994.129742601768;

    t.true(model.fms.arrivalRunwayModel.name === '07R');

    // TODO: why does this not work?
    // const arrivalRunwayModel = model.fms.arrivalRunwayModel;
    // const distanceOnFinalNm = 7;
    // model.positionModel.setCoordinates(arrivalRunwayModel.positionModel.gps);
    // model.positionModel.setCoordinatesByBearingAndDistance(arrivalRunwayModel.oppositeAngle, distanceOnFinalNm);

    // using this direct coordinate instead of calculating it above
    model.positionModel.setCoordinates([36.0383336961, -115.26973855167]);

    const result = model._calculateArrivalRunwayModelGlideslopeAltitude();

    t.true(result === expectedResult);
});

ava('.matchCallsign() returns false when passed a flightnumber that is not included in #callsign', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);

    t.false(model.matchCallsign('42'));
});

ava('.matchCallsign() returns true when passed `*`', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);

    t.true(model.matchCallsign('*'));
});

ava('.matchCallsign() returns true when passed a flightnumber that is included in #callsign', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);

    t.true(model.matchCallsign('1567'));
});

ava('.matchCallsign() returns true when passed a lowercase callsign that matches #callsign', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);

    t.true(model.matchCallsign('ual1567'));
});

ava('.matchCallsign() returns true when passed a mixed case callsign that matches #callsign', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);

    t.true(model.matchCallsign('uAl1567'));
});

ava('.updateTarget() causes arrivals to comply with AT altitude restriction', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.groundSpeed = 320;

    moveAircraftToFix(model, 'KSINO');
    model.updateTarget();

    t.true(model.target.altitude === 17000);
});

ava('.updateTarget() causes arrivals to comply with ABOVE altitude restriction', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.groundSpeed = 320;

    moveAircraftToFix(model, 'LUXOR');
    model.updateTarget();

    t.true(model.target.altitude >= 12000);
});

ava('.updateTarget() causes arrivals to comply with BELOW altitude restriction', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.groundSpeed = 320;

    moveAircraftToFix(model, 'GRNPA');
    model.updateTarget();

    t.true(model.target.altitude <= 11000);
});

ava('.updateTarget() causes departures to comply with AT altitude restriction', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.speed = 320;
    model.altitude = 3000;

    moveAircraftToFix(model, 'ROPPR');
    model.mcp.enable();

    model.fms.departureAirportModel = airportModelFixture;

    model.pilot.climbViaSid(model, 31000);
    model.updateTarget();

    t.true(model.target.altitude === 7000);
});

ava('.updateTarget() causes departures to comply with ABOVE altitude restriction', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.speed = 320;
    model.altitude = 3000;

    moveAircraftToFix(model, 'CEASR');
    model.mcp.enable();

    model.fms.departureAirportModel = airportModelFixture;

    model.pilot.climbViaSid(model, 31000);
    model.updateTarget();

    t.true(model.target.altitude >= 8000);
    t.true(model.target.altitude <= 14000);
});

ava('.updateTarget() causes departures to comply with BELOW altitude restriction', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.speed = 320;
    model.altitude = 3000;

    moveAircraftToFix(model, 'WILLW');
    model.mcp.enable();

    model.fms.departureAirportModel = airportModelFixture;

    model.pilot.climbViaSid(model, 31000);
    model.updateTarget();

    t.true(model.target.altitude <= 14000);
});

ava('.updateTarget() causes arrivals to descend to the assigned altitude if there is no restriction', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.groundSpeed = 320;

    moveAircraftToFix(model, 'LEMNZ');
    model.pilot.descendViaStar(model, 5000);
    model.updateTarget();

    t.true(model.target.altitude === 5000);
});

ava('.updateTarget() causes departures to climb to cruise altitude if there is no restriction', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.speed = 320;
    model.altitude = 3000;

    moveAircraftToFix(model, 'TRALR');
    model.mcp.enable();

    model.fms.departureAirportModel = airportModelFixture;

    model.pilot.climbViaSid(model, 31000);
    model.updateTarget();

    t.true(model.target.altitude === 19000);
});

ava('.updateTarget() causes arrivals to descend to the assigned altitude if the minimal altitude restriction is above the assigned altitude', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.groundSpeed = 320;

    moveAircraftToFix(model, 'TRROP');
    model.pilot.descendViaStar(model, 5000);
    model.updateTarget();

    t.true(model.target.altitude === 5000);
});

ava('.updateTarget() causes departures to climb to cruise altitude if the maximum altitude restriction is below the cruise altitude', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.speed = 320;
    model.altitude = 3000;

    moveAircraftToFix(model, 'BIKKR');
    model.mcp.enable();

    model.fms.departureAirportModel = airportModelFixture;

    model.pilot.climbViaSid(model, 31000);
    model.updateTarget();

    t.true(model.target.altitude === 19000);
});

ava('.updateTarget() causes arrivals to climb to comply with minimal altitude restriction', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.groundSpeed = 320;
    model.altitude = 7000;

    moveAircraftToFix(model, 'LUXOR');
    model.pilot.descendViaStar(model, 5000);
    model.updateTarget();

    t.true(model.target.altitude === 12000);
});

ava('.updateTarget() causes departures to descend to comply with maximum altitude restriction', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.speed = 320;
    model.groundSpeed = 320;
    model.altitude = 15000;

    moveAircraftToFix(model, 'WILLW');
    model.mcp.enable();

    model.fms.departureAirportModel = airportModelFixture;

    model.pilot.climbViaSid(model, 31000);
    model.updateTarget();

    t.true(model.target.altitude === 14000);
});

ava('.updateTarget() causes arrivals to prioritize clearance over restriction', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.groundSpeed = 320;

    moveAircraftToFix(model, 'GRNPA');
    model.pilot.descendViaStar(model, 15000);
    model.updateTarget();

    t.true(model.target.altitude === 15000);
});

ava('.updateTarget() causes departures to prioritize clearance over restriction', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.speed = 320;
    model.altitude = 3000;

    moveAircraftToFix(model, 'CEASR');
    model.mcp.enable();

    model.fms.departureAirportModel = airportModelFixture;

    model.pilot.climbViaSid(model, 7000);
    model.updateTarget();

    t.true(model.target.altitude === 7000);
});

ava('.taxiToRunway() returns an error when the aircraft is airborne', (t) => {
    const expectedResult = [false, 'unable to taxi, we\'re already airborne'];
    const arrival = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const arrivalResult = arrival.taxiToRunway(runwayModelMock);

    t.deepEqual(arrivalResult, expectedResult);

    const departure = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
    departure.altitude = 28000;

    const departureResult = departure.taxiToRunway(runwayModelMock);
    t.deepEqual(departureResult, expectedResult);
});

ava('.taxiToRunway() returns an error when the aircraft is taking off', (t) => {
    const aircraftModel = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);

    aircraftModel.fms.currentPhase = FLIGHT_PHASE.TAKEOFF;

    const expectedResult = [false, 'unable to taxi, we\'re already taking off'];
    const result = aircraftModel.taxiToRunway(runwayModelMock);

    t.deepEqual(result, expectedResult);
    t.true(aircraftModel.flightPhase === FLIGHT_PHASE.TAKEOFF);
});

ava('.taxiToRunway() returns an error when the aircraft has landed', (t) => {
    const expectedResult = [false, 'unable to taxi to runway, we have just landed'];
    const arrival = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    arrival.altitude = arrival.fms.arrivalAirportModel.elevation;

    const arrivalResult = arrival.taxiToRunway(runwayModelMock);

    t.deepEqual(arrivalResult, expectedResult);
});

ava('.taxiToRunway() returns a success message when finished', (t) => {
    const expectedResult = [
        true,
        {
            log: 'taxi to and hold short of Runway 19L',
            say: 'taxi to and hold short of Runway one niner left'
        }
    ];
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
    const result = model.taxiToRunway(runwayModelMock);

    t.deepEqual(result, expectedResult);
    t.deepEqual(model.flightPhase, FLIGHT_PHASE.TAXI);
    t.deepEqual(model.fms.departureRunwayModel, runwayModelMock);
});
