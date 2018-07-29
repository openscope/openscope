import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import _isEqual from 'lodash/isEqual';
import _isObject from 'lodash/isObject';
import AircraftModel from '../../../src/assets/scripts/client/aircraft/AircraftModel';
import ModeController from '../../../src/assets/scripts/client/aircraft/ModeControl/ModeController';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import { ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK } from '../_mocks/aircraftMocks';
import {
    createFmsArrivalFixture,
    createFmsDepartureFixture,
    createModeControllerFixture
} from '../../fixtures/aircraftFixtures';
import { airportModelFixture } from '../../fixtures/airportFixtures';
import { createNavigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import { FLIGHT_PHASE } from '../../../src/assets/scripts/client/constants/aircraftConstants';
import { INVALID_NUMBER } from '../../../src/assets/scripts/client/constants/globalConstants';

// mocks
const airportElevationMock = 11;
const airportIcaoMock = 'KLAS';
const airportNameMock = 'McCarran International Airport';
const runwayNameMock = '19L';
const runwayModelMock = airportModelFixture.getRunway(runwayNameMock);
const approachTypeMock = 'ils';

const validRouteStringMock = 'DAG.KEPEC3.KLAS07R';
const complexRouteString = 'COWBY..BIKKR..DAG.KEPEC3.KLAS';
const amendRouteString = 'HITME..HOLDM..BIKKR';
const invalidRouteString = 'A..B.C.D';
const sidIdMock = 'COWBY6';
const waypointNameMock = 'SUNST';
const holdParametersMock = {
    inboundHeading: -1.62476729292438,
    legLength: '1min',
    turnDirection: 'right'
};

const headingMock = 3.141592653589793;
const nextHeadingDegreesMock = 180;

const speedMock = 190;
const cruiseSpeedMock = 460;
const unattainableSpeedMock = 530;

const initialAltitudeMock = 18000;
const nextAltitudeMock = 5000;
const invalidAltitudeMock = 'threeve';

// helpers
function createPilotFixture() {
    return new Pilot(createFmsArrivalFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
}

function buildPilotWithComplexRoute() {
    const pilot = createPilotFixture();

    pilot.replaceFlightPlanWithNewRoute(complexRouteString);

    return pilot;
}

ava('throws when instantiated without parameters', (t) => {
    t.throws(() => new Pilot());
    t.throws(() => new Pilot({}));
    t.throws(() => new Pilot([]));
    t.throws(() => new Pilot('threeve'));
    t.throws(() => new Pilot(42));
    t.throws(() => new Pilot(false));
    t.throws(() => new Pilot(null, createModeControllerFixture()));
    t.throws(() => new Pilot('', createModeControllerFixture()));
    t.throws(() => new Pilot({}, createModeControllerFixture()));
    t.throws(() => new Pilot(createFmsArrivalFixture(), {}));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => createPilotFixture());
});

ava('.shouldExpediteAltitudeChange() sets #shouldExpediteAltitudeChange to true and responds with a success message', (t) => {
    const expectedResult = [true, 'expediting to assigned altitude'];
    const pilot = createPilotFixture();
    const result = pilot.shouldExpediteAltitudeChange();

    t.true(pilot._mcp.shouldExpediteAltitudeChange);
    t.deepEqual(result, expectedResult);
});

ava('.applyArrivalProcedure() returns an error when passed an invalid routeString', (t) => {
    const expectedResult = [false, 'arrival procedure format not understood'];
    const pilot = createPilotFixture();
    const result = pilot.applyArrivalProcedure('~!@#$%', airportNameMock);

    t.true(_isEqual(result, expectedResult));
});

ava('.applyArrivalProcedure() returns an error when passed an invalid procedure name', (t) => {
    const invalidRouteStringMock = 'DAG.~!@#$.KLAS';
    const expectedResult = [false, 'unknown procedure "~!@#$"'];
    const pilot = createPilotFixture();
    const result = pilot.applyArrivalProcedure(invalidRouteStringMock, airportNameMock);

    t.true(_isEqual(result, expectedResult));
});

ava('.applyArrivalProcedure() returns an error when passed a procedure with an invaild entry', (t) => {
    const invalidRouteStringMock = 'a.KEPEC3.KLAS';
    const expectedResult = [false, 'route of "a.KEPEC3.KLAS" is not valid'];
    const pilot = createPilotFixture();
    const result = pilot.applyArrivalProcedure(invalidRouteStringMock, airportNameMock);

    t.true(_isEqual(result, expectedResult));
});

ava('.applyArrivalProcedure() returns a success message after success', (t) => {
    const pilot = createPilotFixture();
    const result = pilot.applyArrivalProcedure(validRouteStringMock, airportNameMock);

    t.true(_isArray(result));
    t.true(result[0]);
    t.true(result[1].log === 'cleared to McCarran International Airport via the KEPEC3 arrival');
    t.true(result[1].say === 'cleared to McCarran International Airport via the KEPEC THREE arrival');
});

ava('.applyArrivalProcedure() calls #_fms.replaceArrivalProcedure() with the correct parameters', (t) => {
    const pilot = createPilotFixture();
    const replaceArrivalProcedureSpy = sinon.spy(pilot._fms, 'replaceArrivalProcedure');

    pilot.applyArrivalProcedure(validRouteStringMock, airportNameMock);

    t.true(replaceArrivalProcedureSpy.calledWithExactly(validRouteStringMock));
});

ava.skip('.applyDepartureProcedure() returns an error when passed an invalid sidId', (t) => {
    const expectedResult = [false, 'SID name not understood'];
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    const result = pilot.applyDepartureProcedure('~!@#$%', airportIcaoMock);

    t.true(_isEqual(result, expectedResult));
    t.false(pilot.hasDepartureClearance);
});

ava.skip('.applyDepartureProcedure() returns an error when passed an invalid runway', (t) => {
    const expectedResult = [false, 'unsure if we can accept that procedure; we don\'t have a runway assignment'];
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    const result = pilot.applyDepartureProcedure(sidIdMock, null, airportIcaoMock);

    t.true(_isEqual(result, expectedResult));
    t.false(pilot.hasDepartureClearance);
});

ava.skip('.applyDepartureProcedure() returns an error when passed a runway incompatable for the route', (t) => {
    const expectedResult = [false, 'unable, the COWBOY SIX departure not valid from Runway ~!@#$%'];
    const invalidRunwayModelMock = {
        name: '~!@#$%'
    };
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    const result = pilot.applyDepartureProcedure(sidIdMock, invalidRunwayModelMock, airportIcaoMock);

    t.true(_isEqual(result, expectedResult));
    t.false(pilot.hasDepartureClearance);
});

ava.skip('.applyDepartureProcedure() should set mcp altitude and speed modes to `VNAV`', (t) => {
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    pilot.applyDepartureProcedure(sidIdMock, airportIcaoMock);

    t.true(pilot._mcp.altitudeMode === 'VNAV');
    t.true(pilot._mcp.speedMode === 'VNAV');
});

ava.skip('.applyDepartureProcedure() returns a success message after success', (t) => {
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    const result = pilot.applyDepartureProcedure(sidIdMock, airportIcaoMock);

    t.true(_isArray(result));
    t.true(result[0]);
    t.true(result[1].log === 'cleared to destination via the COWBY6 departure, then as filed');
    t.true(result[1].say === 'cleared to destination via the Cowboy Six departure, then as filed');
});

ava('.replaceFlightPlanWithNewRoute() returns an error when passed an invalid route', (t) => {
    const expectedResult = [
        false,
        {
            log: 'requested route of "a..b.c.d" is invalid',
            say: 'that route is invalid'
        }
    ];
    const pilot = createPilotFixture();
    const result = pilot.replaceFlightPlanWithNewRoute('a..b.c.d');

    t.true(_isEqual(result, expectedResult));
});

ava('.replaceFlightPlanWithNewRoute() removes an existing route and replaces it with a new one', (t) => {
    const pilot = createPilotFixture();

    pilot.replaceFlightPlanWithNewRoute('COWBY..BIKKR');

    t.true(pilot._fms.currentWaypoint.name === 'COWBY');
});

ava.todo('.replaceFlightPlanWithNewRoute() replaces old route with new one, and skips ahead to the old current waypoint');

ava('.replaceFlightPlanWithNewRoute() returns a success message when finished successfully', (t) => {
    const expectedResult = [
        true,
        {
            log: 'rerouting to: COWBY BIKKR',
            say: 'rerouting as requested'
        }
    ];
    const pilot = createPilotFixture();
    const result = pilot.replaceFlightPlanWithNewRoute('COWBY..BIKKR');

    t.true(_isEqual(result, expectedResult));
});

ava.skip('.applyPartialRouteAmendment() returns an error with passed an invalid routeString', (t) => {
    const expectedResult = [false, 'requested route of "A..B.C.D" is invalid'];
    const pilot = buildPilotWithComplexRoute();
    const result = pilot.applyPartialRouteAmendment(invalidRouteString);

    t.true(_isEqual(result, expectedResult));
});

ava.skip('.applyPartialRouteAmendment() returns an error with passed a routeString without a shared waypoint', (t) => {
    const expectedResult = [false, 'requested route of "HITME..HOLDM" is invalid, it must contain a Waypoint in the current route'];
    const pilot = buildPilotWithComplexRoute();
    const result = pilot.applyPartialRouteAmendment('HITME..HOLDM');

    t.true(_isEqual(result, expectedResult));
});

ava.skip('.applyPartialRouteAmendment() returns to the correct flightPhase after a hold', (t) => {
    const pilot = buildPilotWithComplexRoute();
    pilot._fms.setFlightPhase('HOLD');

    pilot.applyPartialRouteAmendment(amendRouteString);

    t.true(pilot._fms.currentPhase === 'CRUISE');
});

ava.skip('.applyPartialRouteAmendment() returns a success message when complete', (t) => {
    const expectedResult = [
        true,
        {
            log: 'rerouting to: HITME..HOLDM..BIKKR..DAG.KEPEC3.KLAS',
            say: 'rerouting as requested'
        }
    ];
    const pilot = buildPilotWithComplexRoute();
    const result = pilot.applyPartialRouteAmendment(amendRouteString);

    t.true(_isEqual(result, expectedResult));
});

ava('.cancelApproachClearance() returns early if #hasApproachClearance is false', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const result = aircraftModel.pilot.cancelApproachClearance(aircraftModel);
    const expectedResult = [false, 'we have no approach clearance to cancel!'];

    t.deepEqual(result, expectedResult);
});

ava('.cancelApproachClearance() sets the correct modes and values in the Mcp', (t) => {
    const nextAltitudeMock = 4000;
    const nextHeadingDegreesMock = 250;
    const shouldExpediteDescentMock = false;
    const shouldUseSoftCeilingMock = false;
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());

    aircraftModel.pilot.maintainAltitude(
        nextAltitudeMock,
        shouldExpediteDescentMock,
        shouldUseSoftCeilingMock,
        airportModelFixture,
        aircraftModel
    );
    aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock, null, false);
    aircraftModel.pilot.maintainSpeed(speedMock, aircraftModel);
    aircraftModel.pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);
    aircraftModel.pilot.cancelApproachClearance(aircraftModel);

    t.true(aircraftModel.pilot._mcp.altitudeMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.altitude === nextAltitudeMock);
    t.true(aircraftModel.pilot._mcp.headingMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.heading === aircraftModel.heading);
    t.true(aircraftModel.pilot._mcp.speedMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.speed === speedMock);
});

ava('.cancelApproachClearance() returns a success message when finished', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const expectedResult = [
        true,
        'cancel approach clearance, fly present heading, maintain last assigned altitude and speed'
    ];

    aircraftModel.pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);

    const result = aircraftModel.pilot.cancelApproachClearance(aircraftModel);

    t.deepEqual(result, expectedResult);
});

ava('.cancelApproachClearance() sets #hasApproachClearance to false', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());

    aircraftModel.pilot.hasApproachClearance = true;

    aircraftModel.pilot.cancelApproachClearance(aircraftModel);

    t.false(aircraftModel.pilot.hasApproachClearance);
});

ava('.clearedAsFiled() grants pilot departure clearance and returns the correct response strings', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const result = aircraftModel.pilot.clearedAsFiled(aircraftModel);

    t.true(_isArray(result));
    t.true(result[0] === true);
    t.true(_isObject(result[1]));
    t.true(result[1].log === 'cleared to destination as filed');
    t.true(result[1].say === 'cleared to destination as filed');
    t.true(aircraftModel.pilot.hasDepartureClearance === true);
});

ava('.climbViaSID() returns error response if #flightPlanAltitude has not been set', (t) => {
    const expectedResult = [
        false,
        {
            log: 'unable to climb via SID, no altitude assigned',
            say: 'unable to climb via SID, no altitude assigned'
        }
    ];
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    const previousFlightPlanAltitude = pilot._fms.flightPlanAltitude;
    pilot._fms.flightPlanAltitude = INVALID_NUMBER;

    const result = pilot.climbViaSid();

    t.deepEqual(result, expectedResult);

    pilot._fms.flightPlanAltitude = previousFlightPlanAltitude;
});

ava('.climbViaSID() calls ._mcp.setAltitudeFieldValue() and ._mcp.setAltitudeVnav()', (t) => {
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    const setAltitudeFieldValueSpy = sinon.spy(pilot._mcp, 'setAltitudeFieldValue');
    const setAltitudeVnavSpy = sinon.spy(pilot._mcp, 'setAltitudeVnav');

    pilot.climbViaSid();

    t.true(setAltitudeFieldValueSpy.calledWithExactly(pilot._fms.flightPlanAltitude));
    t.true(setAltitudeVnavSpy.calledOnce);
});

ava('.climbViaSID() returns success response when successful', (t) => {
    const expectedResult = [
        true,
        {
            log: 'climb via SID',
            say: 'climb via SID'
        }
    ];
    const pilot = new Pilot(createFmsDepartureFixture(), createModeControllerFixture(), createNavigationLibraryFixture());
    const result = pilot.climbViaSid();

    t.deepEqual(result, expectedResult);
});

ava('.conductInstrumentApproach() returns error when no runway is provided', (t) => {
    const expectedResult = [false, 'the specified runway does not exist'];
    const pilot = createPilotFixture();
    const result = pilot.conductInstrumentApproach(approachTypeMock, null);

    t.deepEqual(result, expectedResult);
});

ava('.conductInstrumentApproach() calls .setArrivalRunway() with the runwayName', (t) => {
    const pilot = createPilotFixture();
    const setArrivalRunwaySpy = sinon.spy(pilot._fms, 'setArrivalRunway');

    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);

    t.true(setArrivalRunwaySpy.calledWithExactly(runwayModelMock));
});

ava('.conductInstrumentApproach() calls ._interceptCourse() with the correct properties', (t) => {
    const pilot = createPilotFixture();
    const _interceptCourseSpy = sinon.spy(pilot, '_interceptCourse');

    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);

    t.true(_interceptCourseSpy.calledWithExactly(runwayModelMock.positionModel, runwayModelMock.angle));
});

ava('.conductInstrumentApproach() calls ._interceptGlidepath() with the correct properties', (t) => {
    const pilot = createPilotFixture();
    const _interceptGlidepathSpy = sinon.spy(pilot, '_interceptGlidepath');

    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);

    t.true(_interceptGlidepathSpy.calledWithExactly(
        runwayModelMock.positionModel,
        runwayModelMock.angle,
        runwayModelMock.ils.glideslopeGradient
    ));
});

ava('.conductInstrumentApproach() calls .exitHold', (t) => {
    const pilot = createPilotFixture();
    const exitHoldSpy = sinon.spy(pilot, 'exitHold');

    pilot._fms.setFlightPhase('HOLD');
    pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);

    t.true(exitHoldSpy.calledWithExactly());
});

ava('.conductInstrumentApproach() sets #hasApproachClearance to true', (t) => {
    const pilot = createPilotFixture();
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
    const pilot = createPilotFixture();
    const result = pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock);

    t.deepEqual(result, expectedResult);
});

ava('.descendViaStar() returns early when provided bottom altitude parameter is invalid', (t) => {
    const pilot = createPilotFixture();

    pilot._mcp.setAltitudeFieldValue(initialAltitudeMock);
    pilot._mcp.setAltitudeHold();

    const expectedResponse = [false, 'unable to descend to bottom altitude of threeve'];
    const response = pilot.descendViaStar(invalidAltitudeMock);

    t.deepEqual(response, expectedResponse);
    t.true(pilot._mcp.altitude === initialAltitudeMock);
});

ava('.descendViaStar() returns early when no bottom altitude param provided and FMS has no bottom altitude', (t) => {
    const pilot = createPilotFixture();
    const failureResponseMock = [false, 'unable to descend via STAR'];

    pilot._mcp.setAltitudeFieldValue(initialAltitudeMock);
    pilot._mcp.setAltitudeHold();

    // replace route with one that will have NO altitude restrictions whatsoever
    pilot.replaceFlightPlanWithNewRoute('DAG..MISEN..CLARR..SKEBR..KEPEC..IPUMY..NIPZO..SUNST');

    const response = pilot.descendViaStar();

    t.deepEqual(response, failureResponseMock);
    t.true(pilot._mcp.altitude === initialAltitudeMock);
});

ava('.descendViaStar() returns early when no bottom altitude param provided and FMS bottom altitude is invalid', (t) => {
    const pilot = createPilotFixture();
    const failureResponseMock = [false, 'unable to descend via STAR'];

    pilot._mcp.setAltitudeFieldValue(initialAltitudeMock);
    pilot._mcp.setAltitudeHold();

    // replace route with one that will have NO altitude restrictions whatsoever
    pilot.replaceFlightPlanWithNewRoute('DAG..MISEN..CLARR..SKEBR..KEPEC..IPUMY..NIPZO..SUNST');

    pilot._fms.waypoints[2].altitudeMaximum = invalidAltitudeMock;

    const response = pilot.descendViaStar();

    t.deepEqual(response, failureResponseMock);
    t.true(pilot._mcp.altitude === initialAltitudeMock);
});

ava('.descendViaStar() correctly configures MCP when no bottom altitude parameter provided but FMS has valid bottom altitude', (t) => {
    const pilot = createPilotFixture();
    const successResponseMock = [true, 'descend via STAR'];

    pilot._mcp.setAltitudeFieldValue(initialAltitudeMock);
    pilot._mcp.setAltitudeHold();

    const response = pilot.descendViaStar();

    t.deepEqual(response, successResponseMock);
    t.true(pilot._mcp.altitudeMode === 'VNAV');
    t.true(pilot._mcp.speedMode === 'VNAV');
    t.true(pilot._mcp.altitude === 8000);
});

ava('.descendViaStar() correctly configures MCP when provided valid bottom altitude parameter', (t) => {
    const pilot = createPilotFixture();
    const successResponseMock = [true, 'descend via STAR'];

    pilot._mcp.setAltitudeFieldValue(initialAltitudeMock);
    pilot._mcp.setAltitudeHold();

    const response = pilot.descendViaStar(nextAltitudeMock);

    t.deepEqual(response, successResponseMock);
    t.true(pilot._mcp.altitudeMode === 'VNAV');
    t.true(pilot._mcp.altitude === nextAltitudeMock);
});

ava('.goAround() sets the correct Mcp modes and values', (t) => {
    const pilot = createPilotFixture();

    pilot.goAround(headingMock, speedMock, airportElevationMock);

    t.true(pilot._mcp.altitudeMode === 'HOLD');
    t.true(pilot._mcp.altitude === 1100);
    t.true(pilot._mcp.headingMode === 'HOLD');
    t.true(pilot._mcp.heading === headingMock);
    t.true(pilot._mcp.speedMode === 'HOLD');
    t.true(pilot._mcp.speed === 190);
});

ava('.goAround() returns a success message', (t) => {
    const expectedResult = [
        true,
        {
            log: 'go around, fly present heading, maintain 1100',
            say: 'go around, fly present heading, maintain one thousand one hundred'
        }
    ];
    const pilot = createPilotFixture();
    const result = pilot.goAround(headingMock, speedMock, airportElevationMock);

    t.deepEqual(result, expectedResult);
});

ava('.initiateHoldingPattern() returns error response when specified fix is not in the route', (t) => {
    const expectedResult = [false, 'unable to hold at COWBY; it is not on our route!'];
    const pilot = createPilotFixture();
    const result = pilot.initiateHoldingPattern('COWBY', holdParametersMock);

    t.deepEqual(result, expectedResult);
});

ava('.initiateHoldingPattern() returns correct readback when hold implemented successfully', (t) => {
    const expectedResult = [true, 'hold east of KEPEC, right turns, 1min legs'];
    const pilot = createPilotFixture();
    const result = pilot.initiateHoldingPattern('KEPEC', holdParametersMock);

    t.deepEqual(result, expectedResult);
});

ava('.maintainAltitude() returns early responding that they are unable to maintain the requested altitude', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
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
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
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
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
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
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
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
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
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
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
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

ava('.maintainHeading() sets the #mcp with the correct modes and values', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());

    aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock, null, false);

    t.true(aircraftModel.pilot._mcp.headingMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.heading === 3.141592653589793);
});

ava('.maintainHeading() calls .exitHold()', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const exitHoldSpy = sinon.spy(aircraftModel.pilot, 'exitHold');

    aircraftModel.pilot._fms.setFlightPhase('HOLD');
    aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock, null, false);

    t.true(exitHoldSpy.calledWithExactly());
});

ava('.maintainHeading() returns a success message when incremental is false and no direction is provided', (t) => {
    const expectedResult = [
        true,
        {
            log: 'fly heading 180',
            say: 'fly heading one eight zero'
        }
    ];
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const result = aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock, null, false);

    t.deepEqual(result, expectedResult);
});

ava('.maintainHeading() returns a success message when incremental is true and direction is left', (t) => {
    const directionMock = 'left';
    const expectedResult = [
        true,
        {
            log: 'turn 42 degrees left',
            say: 'turn 42 degrees left'
        }
    ];
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const result = aircraftModel.pilot.maintainHeading(aircraftModel, 42, directionMock, true);

    t.deepEqual(result, expectedResult);
});

ava('.maintainHeading() returns a success message when incremental is true and direction is right', (t) => {
    const directionMock = 'right';
    const expectedResult = [
        true,
        {
            log: 'turn 42 degrees right',
            say: 'turn 42 degrees right'
        }
    ];
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const result = aircraftModel.pilot.maintainHeading(aircraftModel, 42, directionMock, true);

    t.deepEqual(result, expectedResult);
});

ava('.maintainHeading() calls .cancelApproachClearance()', (t) => {
    const approachTypeMock = 'ils';
    const runwayModelMock = airportModelFixture.getRunway('19L');
    const altitudeMock = 7000;
    const headingMock = 3.839724354387525; // 220 in degrees
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const cancelApproachClearanceSpy = sinon.spy(aircraftModel.pilot, 'cancelApproachClearance');

    aircraftModel.pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock, altitudeMock, headingMock);

    t.true(aircraftModel.pilot.hasApproachClearance);

    aircraftModel.pilot.maintainHeading(aircraftModel, nextHeadingDegreesMock);

    t.true(cancelApproachClearanceSpy.called);
});

ava('.maintainPresentHeading() sets the #mcp with the correct modes and values', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());

    aircraftModel.pilot.maintainPresentHeading(aircraftModel);

    t.true(aircraftModel.pilot._mcp.headingMode === 'HOLD');
    t.true(aircraftModel.pilot._mcp.heading === aircraftModel.heading);
});

ava('.maintainPresentHeading() returns a success message when finished', (t) => {
    const expectedResult = [
        true,
        {
            log: 'fly present heading',
            say: 'fly present heading'
        }
    ];
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const result = aircraftModel.pilot.maintainPresentHeading(aircraftModel);

    t.deepEqual(result, expectedResult);
});

ava('.maintainPresentHeading() calls .cancelApproachClearance()', (t) => {
    const approachTypeMock = 'ils';
    const runwayModelMock = airportModelFixture.getRunway('19L');
    const altitudeMock = 7000;
    const headingMock = 3.839724354387525; // 220 in degrees
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const cancelApproachClearanceSpy = sinon.spy(aircraftModel.pilot, 'cancelApproachClearance');

    aircraftModel.pilot.conductInstrumentApproach(approachTypeMock, runwayModelMock, altitudeMock, headingMock);

    t.true(aircraftModel.pilot.hasApproachClearance);

    aircraftModel.pilot.maintainPresentHeading(aircraftModel);

    t.true(cancelApproachClearanceSpy.called);
});

ava('.maintainSpeed() sets the correct Mcp mode and value', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const pilot = createPilotFixture();
    const expectedResult = [
        true,
        {
            log: 'increase speed to 460',
            say: 'increase speed to four six zero'
        }
    ];
    const result = pilot.maintainSpeed(cruiseSpeedMock, aircraftModel);

    t.true(pilot._mcp.speedMode === 'HOLD');
    t.true(pilot._mcp.speed === 460);
    t.deepEqual(result, expectedResult);
});

ava('.maintainSpeed() returns early with a warning when assigned an unreachable speed', (t) => {
    const aircraftModel = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, createNavigationLibraryFixture());
    const pilot = createPilotFixture();
    const expectedResult = [
        false,
        {
            log: 'unable to maintain 530 knots due to performance',
            say: 'unable to maintain five three zero knots due to performance'
        }
    ];
    const result = pilot.maintainSpeed(unattainableSpeedMock, aircraftModel);

    t.deepEqual(result, expectedResult);
});

ava('.proceedDirect() returns an error if the waypointName provided is not in the current flightPlan', (t) => {
    const expectedResult = [false, 'cannot proceed direct to ABC, it does not exist in our flight plan'];
    const pilot = createPilotFixture();
    const result = pilot.proceedDirect('ABC');

    t.deepEqual(result, expectedResult);
});

ava('.proceedDirect() calls ._fms.skipToWaypointName() with the correct arguments', (t) => {
    const pilot = createPilotFixture();
    const skipToWaypointNameSpy = sinon.spy(pilot._fms, 'skipToWaypointName');

    pilot.proceedDirect(waypointNameMock);

    t.true(skipToWaypointNameSpy.calledWithExactly(waypointNameMock));
});

ava('.proceedDirect() sets the correct #_mcp mode', (t) => {
    const pilot = createPilotFixture();

    pilot.proceedDirect(waypointNameMock);

    t.true(pilot._mcp.headingMode === 'LNAV');
});

ava('.proceedDirect() calls .exitHold()', (t) => {
    const pilot = createPilotFixture();
    const exitHoldSpy = sinon.spy(pilot, 'exitHold');

    pilot._fms.setFlightPhase('HOLD');
    pilot.proceedDirect(waypointNameMock);

    t.true(exitHoldSpy.calledWithExactly());
});

ava('.proceedDirect() returns success message when finished', (t) => {
    const expectedResult = [true, 'proceed direct SUNST'];
    const pilot = createPilotFixture();
    const result = pilot.proceedDirect(waypointNameMock);

    t.deepEqual(result, expectedResult);
});

ava('.sayTargetHeading() returns a message when #headingMode is HOLD', (t) => {
    const modeController = new ModeController();
    const pilot = new Pilot(createFmsArrivalFixture(), modeController, createNavigationLibraryFixture());
    const expectedResult = [
        true,
        {
            log: 'we\'re assigned heading 180',
            say: 'we\'re assigned heading one eight zero'
        }
    ];
    pilot._mcp.headingMode = 'HOLD';
    pilot._mcp.heading = 3.141592653589793;

    const result = pilot.sayTargetHeading();

    t.deepEqual(result, expectedResult);
});

ava('.sayTargetHeading() returns a message when #headingMode is VOR/LOC', (t) => {
    const modeController = new ModeController();
    const pilot = new Pilot(createFmsArrivalFixture(), modeController, createNavigationLibraryFixture());
    const expectedResult = [
        true,
        {
            log: 'we\'re joining a course of 180',
            say: 'we\'re joining a course of one eight zero'
        }
    ];
    pilot._mcp.headingMode = 'VOR_LOC';
    pilot._mcp.course = 180;

    const result = pilot.sayTargetHeading();

    t.deepEqual(result, expectedResult);
});

ava.todo('.sayTargetHeading() returns a message when #headingMode is LNAV');

ava('.sayTargetHeading() returns a message when #headingMode is OFF', (t) => {
    const modeController = new ModeController();
    const pilot = new Pilot(createFmsArrivalFixture(), modeController, createNavigationLibraryFixture());
    const expectedResult = [
        true,
        {
            log: 'we haven\'t been assigned a heading',
            say: 'we haven\'t been assigned a heading'
        }
    ];
    const result = pilot.sayTargetHeading();

    t.deepEqual(result, expectedResult);
});

ava('.taxiToRunway() returns an error when flightPhase is equal to FLIGHT_PHASE.TAXI', (t) => {
    const expectedResult = [false, 'already taxiing'];
    const pilot = createPilotFixture();
    const result = pilot.taxiToRunway(runwayModelMock, true, FLIGHT_PHASE.TAXI);

    t.deepEqual(result, expectedResult);
});

ava('.taxiToRunway() returns an error when flightPhase is equal to FLIGHT_PHASE.WAITING', (t) => {
    const expectedResult = [false, 'already taxiied and waiting in runway queue'];
    const pilot = createPilotFixture();
    const result = pilot.taxiToRunway(runwayModelMock, true, FLIGHT_PHASE.WAITING);

    t.deepEqual(result, expectedResult);
});

ava('.taxiToRunway() returns an error when isDeparture is false', (t) => {
    const expectedResult = [false, 'unable to taxi'];
    const pilot = createPilotFixture();
    const result = pilot.taxiToRunway(runwayModelMock, false, FLIGHT_PHASE.APRON);

    t.deepEqual(result, expectedResult);
});

ava('.taxiToRunway() returns an error when flightPhase is not equal to FLIGHT_PHASE.APRON', (t) => {
    const expectedResult = [false, 'unable to taxi'];
    const pilot = createPilotFixture();
    const result = pilot.taxiToRunway(runwayModelMock, true, FLIGHT_PHASE.ARRIVAL);

    t.deepEqual(result, expectedResult);
});

ava('.taxiToRunway() returns a success message when finished', (t) => {
    const expectedResult = [
        true,
        {
            log: 'taxi to runway 19L',
            say: 'taxi to runway one niner left'
        }
    ];
    const pilot = createPilotFixture();
    const result = pilot.taxiToRunway(runwayModelMock, true, FLIGHT_PHASE.APRON);

    t.deepEqual(result, expectedResult);
});
