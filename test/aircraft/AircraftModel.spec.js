import ava from 'ava';
import sinon from 'sinon';
import AircraftModel from '../../src/assets/scripts/client/aircraft/AircraftModel';
import AirportController from '../../src/assets/scripts/client/airport/AirportController';
import NavigationLibrary from '../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import TimeKeeper from '../../src/assets/scripts/client/engine/TimeKeeper';
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
import { MCP_MODE } from '../../src/assets/scripts/client/aircraft/ModeControl/modeControlConstants';
import {
    FLIGHT_PHASE,
    PERFORMANCE
} from '../../src/assets/scripts/client/constants/aircraftConstants';
import { AIRPORT_CONSTANTS } from '../../src/assets/scripts/client/constants/airportConstants';
import { DEFAULT_HOLD_PARAMETERS } from '../../src/assets/scripts/client/constants/waypointConstants';

let sandbox; // using the sinon sandbox ensures stubs are restored after each test

// mocks
const runwayNameMock = '19L';
const runwayModelMock = airportModelFixture.getRunway(runwayNameMock);

function moveAircraftToFix(aircraft, fixName) {
    const { fms } = aircraft;

    while (fms.currentWaypoint._name !== fixName) {
        if (!fms.hasNextWaypoint()) {
            throw Error(`Can not find waypoint ${fixName}`);
        }

        fms.moveToNextWaypoint();
    }

    aircraft.positionModel = NavigationLibrary.findFixByName(fixName).positionModel;
}

ava.beforeEach(() => {
    createNavigationLibraryFixture();
    createAirportControllerFixture();
    sandbox = sinon.createSandbox();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
    resetAirportControllerFixture();
    sandbox.restore();
});

ava('does not throw with valid parameters', (t) => {
    t.notThrows(() => new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK));
});

ava('#targetHeading throws when neither #_targetHeading nor #_targetGroundTrack is not null', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
    model._targetHeading = null;
    model._targetGroundTrack = null;

    t.throws(() => model.targetHeading);
});

ava('#targetHeading calls and returns ._calculateCrabHeadingForGroundTrack() when #_targetGroundTrack is not null and #_targetHeading is null', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
    const groundTrackMock = 1;
    model._targetHeading = null;
    model._targetGroundTrack = groundTrackMock;
    const expectedResult = 2.157;
    const calculateCrabHeadingForGroundTrackStub = sinon.stub(model, '_calculateCrabHeadingForGroundTrack').returns(expectedResult);
    const result = model.targetHeading;

    t.true(result === expectedResult);
    t.true(calculateCrabHeadingForGroundTrackStub.calledWithExactly(groundTrackMock));
});

ava('#targetHeading returns #_targetHeading when #_targetHeading is not null and #_targetGroundTrack is null', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
    const expectedResult = 2.157;
    model._targetHeading = expectedResult;
    model._targetGroundTrack = null;

    t.true(model.targetHeading === expectedResult);
});

ava('#targetHeading setter sets #_targetHeading to the specified value and #_targetGroundTrack to null', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
    const headingMock = 2.157;
    model._targetHeading = null;
    model._targetGroundTrack = 1.648;
    model.targetHeading = headingMock;

    t.true(model._targetHeading === headingMock);
    t.true(model._targetGroundTrack === null);
});

ava('#targetGroundTrack throws when neither #_targetHeading nor #_targetGroundTrack are null', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
    model._targetHeading = null;
    model._targetGroundTrack = null;

    t.throws(() => model.targetGroundTrack);
});

ava('#targetGroundTrack calls and returns ._calculateGroundTrackForHeading() when #_targetHeading is not null and #_targetGroundTrack is null', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
    const headingMock = 1;
    model._targetHeading = headingMock;
    model._targetGroundTrack = null;
    const expectedResult = 2.157;
    const calculateGroundTrackForHeadingStub = sinon.stub(model, '_calculateGroundTrackForHeading').returns(expectedResult);
    const result = model.targetGroundTrack;

    t.true(result === expectedResult);
    t.true(calculateGroundTrackForHeadingStub.calledWithExactly(headingMock));
});

ava('#targetGroundTrack returns #_targetGroundTrack when #_targetGroundTrack is not null and #_targetHeading is null', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
    const expectedResult = 2.157;
    model._targetHeading = null;
    model._targetGroundTrack = expectedResult;

    t.true(model.targetGroundTrack === expectedResult);
});

ava('#targetGroundTrack setter sets #_targetGroundTrack to the specified value and #_targetHeading to null', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK);
    const groundTrackMock = 2.157;
    model._targetHeading = 1.648;
    model._targetGroundTrack = null;
    model.targetGroundTrack = groundTrackMock;

    t.true(model._targetHeading === null);
    t.true(model._targetGroundTrack === groundTrackMock);
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
    const radioCallStub = sandbox.stub(model, 'radioCall').returns((a) => a);
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

    sandbox.stub(model, '_calculateArrivalRunwayModelGlideslopeAltitude').returns(4137);

    const result = model.isAboveGlidepath();

    t.false(result);
});

ava('.isAboveGlidepath() returns false when aircraft altitude is at glideslope altitude', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    model.altitude = 4137;

    sandbox.stub(model, '_calculateArrivalRunwayModelGlideslopeAltitude').returns(4137);

    const result = model.isAboveGlidepath();

    t.false(result);
});

ava('.isAboveGlidepath() returns true when aircraft altitude is above glideslope altitude', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    model.altitude = 5500;

    sandbox.stub(model, '_calculateArrivalRunwayModelGlideslopeAltitude').returns(4137);

    const result = model.isAboveGlidepath();

    t.true(result);
});

ava('.isEstablishedOnCourse() returns false when no arrival runway has been assigned', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    model.fms.arrivalRunwayModel = null;
    const result = model.isEstablishedOnCourse();

    t.false(result);
});

// using `sinon.stub` directly for these tests because the stubs via `sandbox` are not getting restored
// in time for the next assertion that is also stubbing the same methods
ava('.isEstablishedOnCourse() returns false when neither aligned with approach course nor on approach heading', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const isOnApproachCourseStub = sinon.stub(model.fms.arrivalRunwayModel, 'isOnApproachCourse').returns(false);
    const isOnCorrectApproachGroundTrackStub = sinon.stub(model.fms.arrivalRunwayModel, 'isOnCorrectApproachGroundTrack').returns(false);
    const result = model.isEstablishedOnCourse();

    t.false(result);

    isOnApproachCourseStub.restore();
    isOnCorrectApproachGroundTrackStub.restore();
});

ava('.isEstablishedOnCourse() returns false when aligned with approach course but not on approach heading', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const isOnApproachCourseStub = sinon.stub(model.fms.arrivalRunwayModel, 'isOnApproachCourse').returns(true);
    const isOnCorrectApproachGroundTrackStub = sinon.stub(model.fms.arrivalRunwayModel, 'isOnCorrectApproachGroundTrack').returns(false);
    const result = model.isEstablishedOnCourse();

    t.false(result);

    isOnApproachCourseStub.restore();
    isOnCorrectApproachGroundTrackStub.restore();
});

ava('.isEstablishedOnCourse() returns false when on approach heading but not aligned with approach course', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const isOnApproachCourseStub = sinon.stub(model.fms.arrivalRunwayModel, 'isOnApproachCourse').returns(false);
    const isOnCorrectApproachGroundTrackStub = sinon.stub(model.fms.arrivalRunwayModel, 'isOnCorrectApproachGroundTrack').returns(true);
    const result = model.isEstablishedOnCourse();

    t.false(result);

    isOnApproachCourseStub.restore();
    isOnCorrectApproachGroundTrackStub.restore();
});

ava('.isEstablishedOnCourse() returns true when aligned with approach course and on approach heading', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const isOnApproachCourseStub = sinon.stub(model.fms.arrivalRunwayModel, 'isOnApproachCourse').returns(true);
    const isOnCorrectApproachGroundTrackStub = sinon.stub(model.fms.arrivalRunwayModel, 'isOnCorrectApproachGroundTrack').returns(true);
    const result = model.isEstablishedOnCourse();

    t.true(result);

    isOnApproachCourseStub.restore();
    isOnCorrectApproachGroundTrackStub.restore();
});

ava('.isEstablishedOnGlidepath() returns false when too far above glideslope', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const glideslopeAltitude = 4000;
    model.altitude = glideslopeAltitude + PERFORMANCE.MAXIMUM_ALTITUDE_DIFFERENCE_CONSIDERED_ESTABLISHED_ON_GLIDEPATH + 1;

    sandbox.stub(model, '_calculateArrivalRunwayModelGlideslopeAltitude').returns(glideslopeAltitude);

    const result = model.isEstablishedOnGlidepath();

    t.false(result);
});

ava('.isEstablishedOnGlidepath() returns false when too far below glideslope', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const glideslopeAltitude = 4000;
    model.altitude = glideslopeAltitude - PERFORMANCE.MAXIMUM_ALTITUDE_DIFFERENCE_CONSIDERED_ESTABLISHED_ON_GLIDEPATH - 1;

    sandbox.stub(model, '_calculateArrivalRunwayModelGlideslopeAltitude').returns(glideslopeAltitude);

    const result = model.isEstablishedOnGlidepath();

    t.false(result);
});

ava('.isEstablishedOnGlidepath() returns true when an acceptable distance above glideslope', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const glideslopeAltitude = 4000;
    model.altitude = glideslopeAltitude + PERFORMANCE.MAXIMUM_ALTITUDE_DIFFERENCE_CONSIDERED_ESTABLISHED_ON_GLIDEPATH;

    sandbox.stub(model, '_calculateArrivalRunwayModelGlideslopeAltitude').returns(glideslopeAltitude);

    const result = model.isEstablishedOnGlidepath();

    t.true(result);
});

ava('.isEstablishedOnGlidepath() returns true when an acceptable distance below glideslope', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const glideslopeAltitude = 4000;
    model.altitude = glideslopeAltitude - PERFORMANCE.MAXIMUM_ALTITUDE_DIFFERENCE_CONSIDERED_ESTABLISHED_ON_GLIDEPATH;

    sandbox.stub(model, '_calculateArrivalRunwayModelGlideslopeAltitude').returns(glideslopeAltitude);

    const result = model.isEstablishedOnGlidepath();

    t.true(result);
});

// using `sinon.stub` directly for these tests because the stubs via `sandbox` are not getting restored
// in time for the next assertion that is also stubbing the same methods
ava('.isOnFinal() returns false when neither on the selected course nor within the final approach fix distance', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const isEstablishedOnCourse = false;
    const distanceToDatum = AIRPORT_CONSTANTS.FINAL_APPROACH_FIX_DISTANCE_NM + 1;
    const isEstablishedOnCourseStub = sinon.stub(model, 'isEstablishedOnCourse').returns(isEstablishedOnCourse);
    const distanceToPositionStub = sinon.stub(model.positionModel, 'distanceToPosition').returns(distanceToDatum);
    const result = model.isOnFinal();

    t.false(result);

    isEstablishedOnCourseStub.restore();
    distanceToPositionStub.restore();
});

ava('.isOnFinal() returns false when on the selected course but not within the final approach fix distance', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const isEstablishedOnCourse = true;
    const distanceToDatum = AIRPORT_CONSTANTS.FINAL_APPROACH_FIX_DISTANCE_NM + 1;
    const isEstablishedOnCourseStub = sinon.stub(model, 'isEstablishedOnCourse').returns(isEstablishedOnCourse);
    const distanceToPositionStub = sinon.stub(model.positionModel, 'distanceToPosition').returns(distanceToDatum);
    const result = model.isOnFinal();

    t.false(result);

    isEstablishedOnCourseStub.restore();
    distanceToPositionStub.restore();
});

ava('.isOnFinal() returns false when within the final approach fix distance but not on the selected course', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const isEstablishedOnCourse = false;
    const distanceToDatum = AIRPORT_CONSTANTS.FINAL_APPROACH_FIX_DISTANCE_NM;
    const isEstablishedOnCourseStub = sinon.stub(model, 'isEstablishedOnCourse').returns(isEstablishedOnCourse);
    const distanceToPositionStub = sinon.stub(model.positionModel, 'distanceToPosition').returns(distanceToDatum);
    const result = model.isOnFinal();

    t.false(result);

    isEstablishedOnCourseStub.restore();
    distanceToPositionStub.restore();
});

ava('.isOnFinal() returns true when both on the selected course and within the final approach fix distance', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const isEstablishedOnCourse = true;
    const distanceToDatum = AIRPORT_CONSTANTS.FINAL_APPROACH_FIX_DISTANCE_NM;
    const isEstablishedOnCourseStub = sinon.stub(model, 'isEstablishedOnCourse').returns(isEstablishedOnCourse);
    const distanceToPositionStub = sinon.stub(model.positionModel, 'distanceToPosition').returns(distanceToDatum);
    const result = model.isOnFinal();

    t.true(result);

    isEstablishedOnCourseStub.restore();
    distanceToPositionStub.restore();
});

ava('._calculateArrivalRunwayModelGlideslopeAltitude() returns arrival runway\'s glideslope altitude abeam the specified position', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const runwayElevationMock = 2157;
    const expectedResult = 2261.980164261595 + runwayElevationMock;
    model.fms.arrivalRunwayModel._positionModel.elevation = runwayElevationMock;

    t.true(model.fms.arrivalRunwayModel.name === '07R');

    const { arrivalRunwayModel } = model.fms;
    const distanceOnFinalNm = 7;
    const runwayPositionModel = arrivalRunwayModel.positionModel;
    const magneticBearingFromRunway = arrivalRunwayModel.oppositeAngle;

    model.positionModel.setCoordinates(runwayPositionModel.gps);
    model.positionModel.setCoordinatesByBearingAndDistance(magneticBearingFromRunway, distanceOnFinalNm);

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
    model.targetGroundTrack = 1.5;

    moveAircraftToFix(model, 'KSINO');
    model.updateTarget();

    t.true(model.target.altitude === 17000);
});

ava('.updateTarget() causes arrivals to comply with ABOVE altitude restriction', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.groundSpeed = 320;
    model.targetGroundTrack = 1.5;

    moveAircraftToFix(model, 'LUXOR');
    model.updateTarget();

    t.true(model.target.altitude >= 12000);
});

ava('.updateTarget() causes arrivals to comply with BELOW altitude restriction', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK);
    model.groundSpeed = 320;
    model.targetGroundTrack = 1.5;

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
    model.targetGroundTrack = 1.5;

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
    model.targetGroundTrack = 1.5;
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
    model.targetGroundTrack = 1.5;

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

ava('._calculateCrabHeadingForGroundTrack() returns the heading to face in order for the aircraft to achieve the specified ground track angle', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const groundTrackMock = Math.PI / 2; // 090 heading
    model.trueAirspeed = 50;

    sinon.stub(AirportController.airport_get(), 'getWindVectorAtAltitude').returns([0, -30]); // blowing toward 180 heading

    const expectedResult = Math.atan(40 / 30);
    const result = model._calculateCrabHeadingForGroundTrack(groundTrackMock);

    t.true(result === expectedResult);
    sinon.restore();
});

ava('._calculateGroundTrackForHeading() returns the ground track which results from the aircraft\'s heading and the current winds aloft at their altitude', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const headingMock = Math.PI / 2; // 090 heading
    model.trueAirspeed = 40;

    sinon.stub(AirportController.airport_get(), 'getWindVectorAtAltitude').returns([0, 30]); // blowing toward 360 heading

    const expectedResult = Math.atan(40 / 30);
    const result = model._calculateGroundTrackForHeading(headingMock);

    t.true(result === expectedResult);
    sinon.restore();
});

ava('._calculateTargetedHeadingHold() sets hold timer when !#_isEstablishedOnHoldingPattern and the aircraft reaches the outbound heading', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const currentWaypointModel = model.fms.currentWaypoint;
    const gameTimeMock = 50;
    const inboundHeadingMock = 0;
    const outboundHeadingMock = inboundHeadingMock + Math.PI;
    const legLengthMinutesMock = '2.5min';
    const legLengthSecondsMock = 150;
    const maxAcceptableHeadingMock = outboundHeadingMock;// + PERFORMANCE.MAXIMUM_ANGLE_CONSIDERED_ESTABLISHED_ON_HOLD_COURSE - 0.00000001;
    currentWaypointModel._holdParameters = DEFAULT_HOLD_PARAMETERS;
    currentWaypointModel._holdParameters.inboundHeading = inboundHeadingMock;
    currentWaypointModel._holdParameters.legLength = legLengthMinutesMock;
    currentWaypointModel._isHoldWaypoint = true;
    model.groundTrack = maxAcceptableHeadingMock;

    sinon.stub(model, '_isEstablishedOnHoldingPattern').get(() => true);
    sinon.stub(TimeKeeper, 'accumulatedDeltaTime').get(() => gameTimeMock);
    const setHoldTimerStub = sinon.stub(currentWaypointModel, 'setHoldTimer');
    const expectedTimerTime = gameTimeMock + legLengthSecondsMock;

    model._calculateTargetedHeadingHold();

    t.true(setHoldTimerStub.calledOnce);
    t.true(setHoldTimerStub.calledWithExactly(expectedTimerTime));
    sinon.restore();
});

ava('._updateTargetedDirectionality() returns early and does not edit #_targetHeading or #_targetGroundTrack when autopilot is off', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const headingMock = 2.15;
    model._targetHeading = headingMock;
    model._targetGroundTrack = headingMock;
    model.mcp.autopilotMode = MCP_MODE.AUTOPILOT.OFF;
    const result = model._updateTargetedDirectionality();

    t.true(typeof result === 'undefined');
    t.true(model._targetHeading === headingMock);
    t.true(model._targetGroundTrack === headingMock);
});

ava('._updateTargetedDirectionality() returns early and does not edit #_targetHeading or #_targetGroundTrack when MCP heading mode is not OFF/HOLD/LNAV/VOR_LOC', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const headingMock = 2.15;
    model._targetHeading = headingMock;
    model._targetGroundTrack = headingMock;
    model.mcp.autopilotMode = 'turbo boost mode';
    const result = model._updateTargetedDirectionality();

    t.true(typeof result === 'undefined');
    t.true(model._targetHeading === headingMock);
    t.true(model._targetGroundTrack === headingMock);
});

ava('._updateTargetedDirectionality() sets target ground track with value from ._calculateTargetedGroundTrackDuringLanding() when flight phase is LANDING', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const groundTrackMock = 2.15;

    sinon.stub(model, '_calculateTargetedGroundTrackDuringLanding').returns(groundTrackMock);
    model.setFlightPhase(FLIGHT_PHASE.LANDING);

    const result = model._updateTargetedDirectionality();

    t.true(typeof result === 'undefined');
    t.true(model._targetGroundTrack === groundTrackMock);
    t.true(model._targetHeading === null);
    sinon.restore();
});

ava('._updateTargetedDirectionality() sets target heading to the aircraft\'s present heading when the MCP heading mode is off', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const headingMock = 2.15;
    model.heading = headingMock;
    model.mcp.headingMode = MCP_MODE.HEADING.OFF;
    const result = model._updateTargetedDirectionality();

    t.true(typeof result === 'undefined');
    t.true(model._targetGroundTrack === null);
    t.true(model._targetHeading === headingMock);
    sinon.restore();
});

ava('._updateTargetedDirectionality() sets target heading to the aircraft\'s MCP heading when the MCP heading mode is HOLD', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const headingMock = 2.15;
    model.mcp.heading = headingMock;
    model.mcp.headingMode = MCP_MODE.HEADING.HOLD;
    const result = model._updateTargetedDirectionality();

    t.true(typeof result === 'undefined');
    t.true(model._targetGroundTrack === null);
    t.true(model._targetHeading === headingMock);
    sinon.restore();
});

ava('._updateTargetedDirectionality() sets target ground track with value from ._calculateTargetedGroundTrackLnav() when the MCP heading mode is LNAV', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const groundTrackMock = 2.15;
    model.mcp.headingMode = MCP_MODE.HEADING.LNAV;

    sinon.stub(model, '_calculateTargetedGroundTrackLnav').returns(groundTrackMock);

    const result = model._updateTargetedDirectionality();

    t.true(typeof result === 'undefined');
    t.true(model._targetGroundTrack === groundTrackMock);
    t.true(model._targetHeading === null);
    sinon.restore();
});

ava('._updateTargetedDirectionality() sets target ground track with value from ._calculateTargetedHeadingToInterceptCourse() when the MCP heading mode is VOR_LOC', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
    const groundTrackMock = 2.15;
    model.mcp.headingMode = MCP_MODE.HEADING.VOR_LOC;

    sinon.stub(model, '_calculateTargetedHeadingToInterceptCourse').returns(groundTrackMock);

    const result = model._updateTargetedDirectionality();

    t.true(typeof result === 'undefined');
    t.true(model._targetGroundTrack === groundTrackMock);
    t.true(model._targetHeading === null);
    sinon.restore();
});
