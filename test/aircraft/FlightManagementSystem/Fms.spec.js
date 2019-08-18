import ava from 'ava';
import sinon from 'sinon';
import _every from 'lodash/every';
import _isArray from 'lodash/isArray';
import Fms from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/Fms';
import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';
// import StaticPositionModel from '../../../src/assets/scripts/client/base/StaticPositionModel';
import { airportModelFixture } from '../../fixtures/airportFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';
import {
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    // ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_DIRECT_ROUTE_STRING_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK
    // DEPARTURE_AIRCRAFT_INIT_PROPS_WITH_DIRECT_ROUTE_STRING_MOCK,
    // AIRCRAFT_DEFINITION_MOCK
} from '../_mocks/aircraftMocks';
import {
    FLIGHT_CATEGORY,
    FLIGHT_PHASE
} from '../../../src/assets/scripts/client/constants/aircraftConstants';
// import { SNORA_STATIC_POSITION_MODEL } from '../../base/_mocks/positionMocks';
import {
    INVALID_NUMBER
} from '../../../src/assets/scripts/client/constants/globalConstants';
// import { PROCEDURE_TYPE } from '../../../src/assets/scripts/client/constants/routeConstants';

// const invalidDirectRouteStringMock = 'COWBY.BIKKR';
// const complexRouteString = 'COWBY..BIKKR..DAG.KEPEC3.KLAS';
// const complexRouteStringWithHold = 'COWBY..@BIKKR..DAG.KEPEC3.KLAS';
// const complexRouteStringWithVector = 'COWBY..#180..BIKKR..DAG.KEPEC3.KLAS';
// const invalidProcedureRouteStringMock = 'MLF..GRNPA1.KLAS';
// const simpleRouteString = ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK.route;
const starRouteStringMock = 'MLF.GRNPA1.KLAS07R';
const sidRouteStringMock = 'KLAS07R.COWBY6.DRK';
const fullRouteStringMock = 'KLAS07R.COWBY6.DRK..OAL..MLF..TNP.KEPEC3.KLAS07R';
const directOnlyRouteStringMock = 'TNP..BIKKR..OAL..MLF..PGS..DRK';
// const isComplexRoute = true;

// helper functions
function buildFmsForAircraftInApronPhaseWithRouteString(routeString) {
    const aircraftPropsMock = Object.assign({}, DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, { routeString });

    return new Fms(aircraftPropsMock);
}
function buildFmsForAircraftInCruisePhaseWithRouteString(routeString) {
    const aircraftPropsMock = Object.assign({}, ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, { routeString });

    return new Fms(aircraftPropsMock);
}

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('throws when called without proper parameters', (t) => {
    t.throws(() => new Fms());
    t.throws(() => new Fms(''));
    t.throws(() => new Fms([]));
    t.throws(() => new Fms({}));
});

ava('throws when instantiated with a route string containing less than two waypoints', (t) => {
    t.throws(() => buildFmsForAircraftInCruisePhaseWithRouteString(''));
    t.throws(() => buildFmsForAircraftInCruisePhaseWithRouteString('COWBY'));
    t.throws(() => buildFmsForAircraftInApronPhaseWithRouteString(''));
    t.throws(() => buildFmsForAircraftInApronPhaseWithRouteString('COWBY'));
});

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => buildFmsForAircraftInCruisePhaseWithRouteString(sidRouteStringMock));
    t.notThrows(() => buildFmsForAircraftInCruisePhaseWithRouteString(starRouteStringMock));
    t.notThrows(() => buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock));
    t.notThrows(() => buildFmsForAircraftInCruisePhaseWithRouteString(directOnlyRouteStringMock));
    t.notThrows(() => buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock));
    t.notThrows(() => buildFmsForAircraftInApronPhaseWithRouteString(starRouteStringMock));
    t.notThrows(() => buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock));
    t.notThrows(() => buildFmsForAircraftInApronPhaseWithRouteString(directOnlyRouteStringMock));
});

ava('#currentLeg returns #_routeStringModel.currentLeg', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);

    t.deepEqual(fms.currentLeg, fms._routeStringModel.currentLeg);
});

ava('#currentWaypoint returns the first waypoint of the #_routeStringModel', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);

    t.deepEqual(fms.currentWaypoint, fms._routeStringModel.waypoints[0]);
});

ava('#nextAltitudeRestrictedWaypoint returns undefined when there are no altitude restricted waypoints remaining', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(directOnlyRouteStringMock);
    const result = fms.nextAltitudeRestrictedWaypoint;

    t.true(typeof result === 'undefined');
});

ava('#nextAltitudeRestrictedWaypoint returns the next waypoint with an altitude restriction', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
    const result = fms.nextAltitudeRestrictedWaypoint;

    t.true(result.name === 'BAKRR');
});

ava('#nextHardAltitudeRestrictedWaypoint returns undefined when there are no hard-altitude restricted waypoints remaining', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('KLAS01L.TRALR6.MLF');
    const result = fms.nextHardAltitudeRestrictedWaypoint;

    t.true(typeof result === 'undefined');
});

ava('#nextHardAltitudeRestrictedWaypoint returns the next waypoint with a hard-altitude restriction', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('TNP.KEPEC3.KLAS07R');
    const result = fms.nextHardAltitudeRestrictedWaypoint;

    t.true(result.name === 'CLARR');
});

ava('#nextHardSpeedRestrictedWaypoint returns undefined when there are no hard-speed restricted waypoints remaining', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('KLAS01L.TRALR6.MLF');
    const result = fms.nextHardSpeedRestrictedWaypoint;

    t.true(typeof result === 'undefined');
});

ava('#nextHardSpeedRestrictedWaypoint returns the next waypoint with a hard-speed restriction', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString('BCE.GRNPA1.KLAS07R');
    const result = fms.nextHardSpeedRestrictedWaypoint;

    t.true(result.name === 'LUXOR');
});

ava('#nextRestrictedWaypoint returns undefined when there are no restricted waypoints remaining', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(directOnlyRouteStringMock);
    const result = fms.nextRestrictedWaypoint;

    t.true(typeof result === 'undefined');
});

ava('#nextRestrictedWaypoint returns the next waypoint with any altitude/speed restriction', (t) => {
    const fmsWithSoftAltitude = buildFmsForAircraftInApronPhaseWithRouteString('KLAS01R.TRALR6.MLF');
    const fmsWithSoftSpeed = buildFmsForAircraftInApronPhaseWithRouteString('KLAS01L.TRALR6.MLF');

    t.true(fmsWithSoftAltitude.nextRestrictedWaypoint.name === 'RIOOS');
    t.true(fmsWithSoftSpeed.nextRestrictedWaypoint.name === 'NAPSE');
});

ava('#nextSpeedRestrictedWaypoint returns undefined when there are no speed restricted waypoints remaining', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('DRK.ZIMBO1.KLAS07R');
    const result = fms.nextSpeedRestrictedWaypoint;

    t.true(typeof result === 'undefined');
});

ava('#nextSpeedRestrictedWaypoint returns the next waypoint with any speed restriction', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString('DRK.TYSSN4.KLAS07R');
    const result = fms.nextSpeedRestrictedWaypoint;

    t.true(result.name === 'KADDY');
});

ava('#nextWaypoint returns #_routeStringModel.nextWaypoint', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);

    fms.moveToNextWaypoint();

    t.deepEqual(fms.nextWaypoint, fms._routeStringModel.nextWaypoint);
});

ava('#waypoints returns an array containing all the WaypointModels in the route', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
    const result = fms.waypoints;

    t.true(result.length === 20);
    t.true(_every(result, (waypoint) => waypoint instanceof WaypointModel));
});

ava('.activateHoldForWaypointName() returns failure message when the route does not contain the specified waypoint', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeStringModelActivateHoldForWaypointNameSpy = sinon.spy(fms._routeStringModel, 'activateHoldForWaypointName');
    const unknownWaypointName = 'DINGBAT';
    const holdParametersMock = { turnDirection: 'left' };
    const expectedResult = [false, {
        log: `unable to hold at ${unknownWaypointName}; it is not on our route!`,
        say: `unable to hold at ${unknownWaypointName.toLowerCase()}; it is not on our route!`
    }];
    const result = fms.activateHoldForWaypointName(unknownWaypointName, holdParametersMock);

    t.true(routeStringModelActivateHoldForWaypointNameSpy.notCalled);
    t.deepEqual(result, expectedResult);
});

ava('.activateHoldForWaypointName() calls #_routeStringModel.activateHoldForWaypointName() with appropriate parameters', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeStringModelActivateHoldForWaypointNameSpy = sinon.spy(fms._routeStringModel, 'activateHoldForWaypointName');
    const holdWaypointName = 'OAL';
    const holdParametersMock = { turnDirection: 'left' };
    const result = fms.activateHoldForWaypointName(holdWaypointName, holdParametersMock);

    t.true(typeof result === 'undefined');
    t.true(routeStringModelActivateHoldForWaypointNameSpy.calledWithExactly(holdWaypointName, holdParametersMock));
});

ava('.reset() resets all instance properties to appropriate default values', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);

    fms.reset();

    t.true(!fms.arrivalAirportModel);
    t.true(!fms.arrivalRunwayModel);
    t.true(fms.currentPhase === '');
    t.true(!fms.departureAirportModel);
    t.true(!fms.departureRunwayModel);
    t.true(fms.flightPlanAltitude === INVALID_NUMBER);
    t.true(!fms._routeStringModel);
});

ava('._initializeArrivalAirport() returns early when destination ICAO is an empty string', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
    const result = fms.reset()._initializeArrivalAirport('');

    t.true(typeof result === 'undefined');
    t.true(!fms.arrivalAirportModel);
});

ava('._initializeArrivalAirport() sets #arrivalAirportModel to the specified destination airport', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
    const result = fms.reset()._initializeArrivalAirport('ksea');

    t.true(typeof result === 'undefined');
    t.true(fms.arrivalAirportModel.icao === 'ksea');
});

ava('._initializeArrivalRunway() returns early when #arrivalAirportModel is null', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
    const setArrivalRunwaySpy = sinon.spy(fms, 'setArrivalRunway');
    const result = fms.reset()._initializeArrivalRunway();

    t.true(typeof result === 'undefined');
    t.true(setArrivalRunwaySpy.notCalled);
});

ava('._initializeArrivalRunway() sets #arrivalRunwayModel to arrival airport\'s standard arrival runway when unable to deduce arrival runway from route', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(directOnlyRouteStringMock);
    const result = fms._initializeArrivalRunway();

    t.true(typeof result === 'undefined');
    t.deepEqual(fms.arrivalRunwayModel, fms.arrivalAirportModel.arrivalRunwayModel);
});

ava('._initializeArrivalRunway() sets #arrivalRunwayModel IAW the route model', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('KLAS07L.COWBY6.DRK..OAL..MLF..TNP.KEPEC3.KLAS07R');
    const result = fms._initializeArrivalRunway();

    t.true(typeof result === 'undefined');
    t.true(fms.arrivalRunwayModel.name === '07R');
});

ava('._initializeDepartureAirport() returns early when destination ICAO is an empty string', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);

    const result = fms.reset()._initializeDepartureAirport('');

    t.true(typeof result === 'undefined');
    t.true(!fms.departureAirportModel);
});

ava('._initializeDepartureAirport() sets #departureAirportModel to the specified origin airport', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
    const result = fms.reset()._initializeDepartureAirport('ksea');

    t.true(typeof result === 'undefined');
    t.true(fms.departureAirportModel.icao === 'ksea');
});

ava('._initializeDepartureRunway() returns early when #departureAirportModel is null', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
    const setDepartureRunwaySpy = sinon.spy(fms, 'setDepartureRunway');
    const result = fms.reset()._initializeDepartureRunway();

    t.true(typeof result === 'undefined');
    t.true(setDepartureRunwaySpy.notCalled);
});

ava('._initializeDepartureRunway() sets #departureRunwayModel to departure airport\'s standard departure runway when unable to deduce departure runway from route', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(starRouteStringMock);
    const result = fms._initializeDepartureRunway();

    t.true(typeof result === 'undefined');
    t.deepEqual(fms.departureRunwayModel, fms.departureAirportModel.departureRunwayModel);
});

ava('._initializeDepartureRunway() sets #departureRunwayModel IAW the route model', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString('KLAS07L.COWBY6.DRK..OAL..MLF..TNP.KEPEC3.KLAS07R');
    const result = fms._initializeDepartureRunway();

    t.true(typeof result === 'undefined');
    t.true(fms.departureRunwayModel.name === '07L');
});

ava('._initializeFlightPhaseForCategory() throws when category is neither arrival nor departure', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);

    t.throws(() => fms._initializeFlightPhaseForCategory('invalidSpawnPatternCategory'));
});

ava('._initializeFlightPhaseForCategory() calls .setFlightPhase() with cruise phase for arrival category', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const setFlightPhaseSpy = sinon.spy(fms, 'setFlightPhase');

    fms._initializeFlightPhaseForCategory(FLIGHT_CATEGORY.ARRIVAL);

    t.true(setFlightPhaseSpy.calledWithExactly(FLIGHT_PHASE.CRUISE));
});

ava('._initializeFlightPhaseForCategory() calls .setFlightPhase() with apron phase for departure category', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
    const setFlightPhaseSpy = sinon.spy(fms, 'setFlightPhase');

    fms._initializeFlightPhaseForCategory(FLIGHT_CATEGORY.DEPARTURE);

    t.true(setFlightPhaseSpy.calledWithExactly(FLIGHT_PHASE.APRON));
});

ava('._initializeFlightPlanAltitude() sets #flightPlanAltitude to specified value when flight is not a departure', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
    const altitudeMock = 12345;
    const ceilingMock = 38000;

    fms.reset()._initializeFlightPlanAltitude(altitudeMock, FLIGHT_CATEGORY.ARRIVAL, { ceiling: ceilingMock });

    t.true(fms.flightPlanAltitude === altitudeMock);
});

ava('._initializeFlightPlanAltitude() sets #flightPlanAltitude to service ceiling when flight is a departure', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
    const altitudeMock = 12345;
    const ceilingMock = 38000;

    fms.reset()._initializeFlightPlanAltitude(altitudeMock, FLIGHT_CATEGORY.DEPARTURE, { ceiling: ceilingMock });

    t.true(fms.flightPlanAltitude === ceilingMock);
});

ava('._initializePositionInRouteToBeginAtFixName() returns early when flight is a departure', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
    const skipToWaypointNameSpy = sinon.spy(fms, 'skipToWaypointName');

    fms._initializePositionInRouteToBeginAtFixName('COMPS', FLIGHT_CATEGORY.DEPARTURE);

    t.true(skipToWaypointNameSpy.notCalled);
});

ava('._initializePositionInRouteToBeginAtFixName() calls .moveToNextWaypoint() and returns early when no fix specified', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
    const moveToNextWaypointSpy = sinon.spy(fms, 'moveToNextWaypoint');
    const skipToWaypointNameSpy = sinon.spy(fms, 'skipToWaypointName');

    fms._initializePositionInRouteToBeginAtFixName(null, FLIGHT_CATEGORY.ARRIVAL);

    t.true(moveToNextWaypointSpy.calledWithExactly());
    t.true(skipToWaypointNameSpy.notCalled);
});

ava('._initializePositionInRouteToBeginAtFixName() throws when specified waypoint does not exist in the route', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);

    t.throws(() => fms._initializePositionInRouteToBeginAtFixName('ABCDE', FLIGHT_CATEGORY.ARRIVAL));
});

ava('._initializePositionInRouteToBeginAtFixName() calls .skipToWaypointName() when fix is valid and flight is an arrival', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(starRouteStringMock);
    const skipToWaypointNameSpy = sinon.spy(fms, 'skipToWaypointName');
    const fixNameMock = 'GRNPA';

    fms._initializePositionInRouteToBeginAtFixName(fixNameMock, FLIGHT_CATEGORY.ARRIVAL);

    t.true(skipToWaypointNameSpy.calledWithExactly(fixNameMock));
});

ava('.applyPartialRouteAmendment() returns error message without throwing when provided routestring is improperly formatted', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('TNP..BIKKR..OAL..MLF..PGS..DRK');
    const routeStringToApply = 'BIKKR.PGS';
    const absorbRouteStringModelSpy = sinon.spy(fms._routeStringModel, 'absorbRouteStringModel');
    const expectedResult = [false, 'requested route of "BIKKR.PGS" is invalid'];
    const result = fms.applyPartialRouteAmendment(routeStringToApply);

    t.deepEqual(result, expectedResult);
    t.true(absorbRouteStringModelSpy.notCalled);
});

ava('.applyPartialRouteAmendment() calls #_routeStringModel.absorbRouteStringModel() when provided routestring is properly formatted', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('TNP..BIKKR..OAL..MLF..PGS..DRK');
    const routeStringToApply = 'BIKKR..PGS';
    const absorbRouteStringModelSpy = sinon.spy(fms._routeStringModel, 'absorbRouteStringModel');
    const expectedResult = [true, { log: 'rerouting to: BIKKR PGS DRK', say: 'rerouting as requested' }];
    const result = fms.applyPartialRouteAmendment(routeStringToApply);

    t.deepEqual(result, expectedResult);
    t.true(absorbRouteStringModelSpy.args[0].length === 1);
    t.true(absorbRouteStringModelSpy.args[0][0].getRouteString() === routeStringToApply);
});

ava('.getAltitudeRestrictedWaypoints() returns #_routeStringModel.getAltitudeRestrictedWaypoints()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);

    t.deepEqual(fms.getAltitudeRestrictedWaypoints(), fms._routeStringModel.getAltitudeRestrictedWaypoints());
});

ava('.getBottomAltitude() returns #_routeStringModel.getBottomAltitude()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);

    t.deepEqual(fms.getBottomAltitude(), fms._routeStringModel.getBottomAltitude());
});

ava('.getFullRouteStringWithoutAirportsWithSpaces calls #_routeStringModel.getFullRouteStringWithoutAirportsWithSpaces()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString('KLAS07R.COWBY6.DRK');
    const routeStringModelSpy = sinon.spy(fms._routeStringModel, 'getFullRouteStringWithoutAirportsWithSpaces');
    const expectedResult = 'COWBY6 DRK';
    const result = fms.getFullRouteStringWithoutAirportsWithSpaces();

    t.true(result === expectedResult);
    t.true(routeStringModelSpy.calledWithExactly());
});

ava('.getNextWaypointPositionModel() returns #nextWaypoint.positionModel', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);

    t.deepEqual(fms.getNextWaypointPositionModel(), fms.nextWaypoint.positionModel);
});

ava('.getRestrictedWaypoints() returns all waypoints in route that return true for WaypointModel.hasRestriction', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString('KLAS01L.COWBY6.GUP');
    const result = fms.getRestrictedWaypoints();
    const expectedWaypointNames = ['RIOOS', 'MOSBI'];
    const waypointNames = result.map((waypointModel) => waypointModel.name);

    t.true(_isArray(result));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('.getRouteString() returns #_routeStringModel.getRouteString()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);

    t.deepEqual(fms.getRouteString(), fms._routeStringModel.getRouteString());
});

ava('.getRouteStringWithSpaces() returns #_routeStringModel.getRouteStringWithSpaces()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);

    t.deepEqual(fms.getRouteStringWithSpaces(), fms._routeStringModel.getRouteStringWithSpaces());
});

ava('.getSpeedRestrictedWaypoints() returns array of all speed restricted waypoints in route', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('DVC.GRNPA1.KLAS07R');
    const result = fms.getSpeedRestrictedWaypoints();
    const expectedWaypointNames = ['LUXOR', 'FRAWG'];
    const waypointNames = result.map((waypointModel) => waypointModel.name);

    t.true(_isArray(result));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('.getSidIcao() returns #_routeStringModel.getSidIcao()', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('DVC.GRNPA1.KLAS07R');
    const expectedResult = fms._routeStringModel.getSidIcao();
    const result = fms.getSidIcao();

    t.true(result === expectedResult);
});

ava('.getSidName() returns #_routeStringModel.getSidName()', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('DVC.GRNPA1.KLAS07R');
    const expectedResult = fms._routeStringModel.getSidName();
    const result = fms.getSidName();

    t.true(result === expectedResult);
});

ava('.getTopAltitude() returns #_routeStringModel.getTopAltitude()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
    const routeStringModelGetTopAltitudeSpy = sinon.spy(fms._routeStringModel, 'getTopAltitude');
    const result = fms.getTopAltitude();

    t.true(routeStringModelGetTopAltitudeSpy.calledWithExactly());
    t.true(result === fms._routeStringModel.getTopAltitude());
});

ava('.hasNextWaypoint() returns #_routeStringModel.hasNextWaypoint()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
    const routeStringModelHasNextWaypointSpy = sinon.spy(fms._routeStringModel, 'hasNextWaypoint');
    const result = fms.hasNextWaypoint();

    t.true(routeStringModelHasNextWaypointSpy.calledWithExactly());
    t.true(result === fms._routeStringModel.hasNextWaypoint());
});

ava('.hasWaypointName() returns #_routeStringModel.hasWaypointName()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
    const waypointNameMock = 'DRK';
    const routeStringModelHasWaypointNameSpy = sinon.spy(fms._routeStringModel, 'hasWaypointName');
    const result = fms.hasWaypointName(waypointNameMock);

    t.true(routeStringModelHasWaypointNameSpy.calledWithExactly(waypointNameMock));
    t.true(result === fms._routeStringModel.hasWaypointName(waypointNameMock));
});

ava('.isArrival() returns true for any arrival flight', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
    t.true(fms.isArrival());
});

ava('.isArrival() returns false for departing flights', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    t.false(fms.isArrival());
});

ava('.isDeparture() returns true for any departure flight', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    t.true(fms.isDeparture());
});

ava('.isDeparture() returns false for any arriving flight', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
    t.false(fms.isDeparture());
});

ava('.moveToNextWaypoint() calls #_routeStringModel.moveToNextWaypoint()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeStringModelMoveToNextWaypointSpy = sinon.spy(fms._routeStringModel, 'moveToNextWaypoint');
    const result = fms.moveToNextWaypoint();

    t.true(routeStringModelMoveToNextWaypointSpy.calledWithExactly());
    t.deepEqual(result, fms._routeStringModel.moveToNextWaypoint());
});

ava('.replaceArrivalProcedure() returns early when passed a wrong-length route string', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const expectedResponse = [false, 'arrival procedure format not understood'];
    const responseForSingleElement = fms.replaceArrivalProcedure('KEPEC3');
    const responseForDoubleElement = fms.replaceArrivalProcedure('KEPEC3.KLAS07R');

    t.deepEqual(responseForSingleElement, expectedResponse);
    t.deepEqual(responseForDoubleElement, expectedResponse);
});

ava('.replaceArrivalProcedure() returns early when the specified procedure does not exist', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeStringModelReplaceArrivalProcedureSpy = sinon.spy(fms._routeStringModel, 'replaceArrivalProcedure');
    const expectedResponse = [false, 'unknown procedure "KEPEC0"'];
    const responseForInvalidProcedure = fms.replaceArrivalProcedure('DAG.KEPEC0.KLAS07R');

    t.true(routeStringModelReplaceArrivalProcedureSpy.notCalled);
    t.deepEqual(responseForInvalidProcedure, expectedResponse);
});

ava('.replaceArrivalProcedure() does not call ._updateArrivalRunwayFromRoute() when the arrival procedure is not applied successfully', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeStringModelReplaceArrivalProcedureStub = sinon.stub(fms._routeStringModel, 'replaceArrivalProcedure').returns(false);
    const updateArrivalRunwayFromRouteSpy = sinon.spy(fms, '_updateArrivalRunwayFromRoute');
    const expectedResponse = [false, 'route of "DAG.KEPEC3.KLAS07R" is not valid'];
    const responseForInvalidProcedure = fms.replaceArrivalProcedure('DAG.KEPEC3.KLAS07R');

    routeStringModelReplaceArrivalProcedureStub.restore();

    t.true(updateArrivalRunwayFromRouteSpy.notCalled);
    t.deepEqual(responseForInvalidProcedure, expectedResponse);
});

ava('.replaceArrivalProcedure() calls ._updateArrivalRunwayFromRoute() when the arrival procedure is applied successfully', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const updateArrivalRunwayFromRouteSpy = sinon.spy(fms, '_updateArrivalRunwayFromRoute');
    const expectedResponse = [true, ''];
    const response = fms.replaceArrivalProcedure('DAG.KEPEC3.KLAS07R');

    t.true(updateArrivalRunwayFromRouteSpy.calledWithExactly());
    t.deepEqual(response, expectedResponse);
});

ava('.replaceDepartureProcedure() returns early when passed a wrong-length route string', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const expectedResponse = [false, 'departure procedure format not understood'];
    const response = fms.replaceDepartureProcedure('KLAS07R.BOACH6.BOACH6.BOACH6');

    t.deepEqual(response, expectedResponse);
});

ava('.replaceDepartureProcedure() returns early when the specified procedure does not exist', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeStringModelReplaceDepartureProcedureSpy = sinon.spy(fms._routeStringModel, 'replaceDepartureProcedure');
    const expectedResponse = [false, 'unknown procedure "BOACH0"'];
    const responseForInvalidProcedure = fms.replaceDepartureProcedure('KLAS07R.BOACH0.TNP');

    t.true(routeStringModelReplaceDepartureProcedureSpy.notCalled);
    t.deepEqual(responseForInvalidProcedure, expectedResponse);
});

ava('.replaceDepartureProcedure() does not call ._updateDepartureRunwayFromRoute() when the departure procedure is not applied successfully', (t) => {
    const expectedResponse = [false, 'route of "KLAS07R.BOACH6.TNP" is not valid'];
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeStringModelReplaceDepartureProcedureStub = sinon.stub(fms._routeStringModel, 'replaceDepartureProcedure').returns(expectedResponse);
    const updateDepartureRunwayFromRouteSpy = sinon.spy(fms, '_updateDepartureRunwayFromRoute');
    const responseForInvalidProcedure = fms.replaceDepartureProcedure('KLAS07R.BOACH6.TNP');

    routeStringModelReplaceDepartureProcedureStub.restore();

    t.true(updateDepartureRunwayFromRouteSpy.notCalled);
    t.deepEqual(responseForInvalidProcedure, expectedResponse);
});

ava('.replaceDepartureProcedure() calls ._updateDepartureRunwayFromRoute() and updates route when the departure procedure is applied successfully', (t) => {
    const expectedRouteString = 'KLAS07R.BOACH6.TNP.KEPEC3.KLAS07R';
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const updateDepartureRunwayFromRouteSpy = sinon.spy(fms, '_updateDepartureRunwayFromRoute');
    const expectedResponse = [true, { log: 'rerouting to: KLAS07R BOACH6 TNP KEPEC3 KLAS07R', say: 'rerouting as requested' }];
    const response = fms.replaceDepartureProcedure('KLAS07R.BOACH6.TNP');

    t.true(updateDepartureRunwayFromRouteSpy.calledWithExactly());
    t.deepEqual(response, expectedResponse);
    t.true(expectedRouteString === fms.getRouteString());
});

ava('.replaceFlightPlanWithNewRoute() returns failure response and does not modify route when proposed route is not valid', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
    const invalidProposedRoute = 'KLAS07R.BOACH6.BOP';
    const originalRouteStringModel = fms._routeStringModel;
    const skipToWaypointNameSpy = sinon.spy(fms, 'skipToWaypointName');
    const expectedResult = [false, { log: 'requested route of "KLAS07R.BOACH6.BOP" is invalid', say: 'that route is invalid' }];
    const result = fms.replaceFlightPlanWithNewRoute(invalidProposedRoute);

    t.deepEqual(result, expectedResult);
    t.true(skipToWaypointNameSpy.notCalled);
    t.deepEqual(originalRouteStringModel, fms._routeStringModel);
});

ava('.replaceFlightPlanWithNewRoute() returns correct response and replaces old route with new route when proposed route is valid', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('TNP..BIKKR..HEC');
    const proposedRoute = 'JESJI..BAKRR..MINEY..HITME';
    const skipToWaypointNameSpy = sinon.spy(fms, 'skipToWaypointName');
    const expectedResult = [true, { log: 'rerouting to: JESJI BAKRR MINEY HITME', say: 'rerouting as requested' }];
    const result = fms.replaceFlightPlanWithNewRoute(proposedRoute);

    t.deepEqual(result, expectedResult);
    t.true(skipToWaypointNameSpy.calledWithExactly('BIKKR'));
    t.true(fms._routeStringModel.getRouteString() === proposedRoute);
});

ava('.setArrivalRunway() throws when passed something other than a RunwayModel instance', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);

    t.throws(() => fms.setArrivalRunway());
    t.throws(() => fms.setArrivalRunway({}));
    t.throws(() => fms.setArrivalRunway([]));
    t.throws(() => fms.setArrivalRunway(''));
    t.throws(() => fms.setArrivalRunway(15));
    t.throws(() => fms.setArrivalRunway('hello'));
});

ava('.updateStarLegForArrivalRunway() throws when passed something other than a RunwayModel instance', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);

    t.throws(() => fms.updateStarLegForArrivalRunway());
    t.throws(() => fms.updateStarLegForArrivalRunway({}));
    t.throws(() => fms.updateStarLegForArrivalRunway([]));
    t.throws(() => fms.updateStarLegForArrivalRunway(''));
    t.throws(() => fms.updateStarLegForArrivalRunway(15));
    t.throws(() => fms.updateStarLegForArrivalRunway('hello'));
});

ava('.updateStarLegForArrivalRunway() returns early when the specified runway is already the #arrivalRunwayModel', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
    const originalRunwayModel = fms.arrivalRunwayModel;
    const routeStringModelUpdateStarLegForArrivalRunwayModelSpy = sinon.spy(fms._routeStringModel, 'updateStarLegForArrivalRunwayModel');

    const expectedResult = [true, { log: `expect Runway ${originalRunwayModel.name}`, say: `expect Runway ${originalRunwayModel.getRadioName()}` }];
    const result = fms.updateStarLegForArrivalRunway(originalRunwayModel);

    t.deepEqual(result, expectedResult);
    t.true(routeStringModelUpdateStarLegForArrivalRunwayModelSpy.notCalled);
    t.deepEqual(fms.arrivalRunwayModel, originalRunwayModel);
});

ava('.updateStarLegForArrivalRunway() returns early when the specified runway is not valid for the currently assigned STAR', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
    const originalRunwayModel = fms.arrivalRunwayModel;
    const nextRunwayModel = airportModelFixture.getRunway('01R');
    const routeStringModelUpdateStarLegForArrivalRunwayModelSpy = sinon.spy(fms._routeStringModel, 'updateStarLegForArrivalRunwayModel');
    const expectedResult = [false, {
        log: 'unable, according to our charts, Runway 01R is not valid for the KEPEC3 arrival, expecting Runway 07R instead',
        say: 'unable, according to our charts, Runway zero one right is not valid for the Kepec Three arrival, expecting Runway zero seven right instead'
    }];
    const result = fms.updateStarLegForArrivalRunway(nextRunwayModel);

    t.deepEqual(result, expectedResult);
    t.true(routeStringModelUpdateStarLegForArrivalRunwayModelSpy.notCalled);
    t.deepEqual(fms.arrivalRunwayModel, originalRunwayModel);
});

ava('.updateStarLegForArrivalRunway() sets #arrivalRunwayModel to the specified RunwayModel', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const nextRunwayModel = airportModelFixture.getRunway('25R');
    const routeStringModelUpdateStarLegForArrivalRunwayModelSpy = sinon.spy(fms._routeStringModel, 'updateStarLegForArrivalRunwayModel');

    const expectedResult = [true, { log: `expecting Runway ${nextRunwayModel.name}`, say: `expecting Runway ${nextRunwayModel.getRadioName()}` }];
    const result = fms.updateStarLegForArrivalRunway(nextRunwayModel);

    t.deepEqual(result, expectedResult);
    t.true(routeStringModelUpdateStarLegForArrivalRunwayModelSpy.calledWithExactly(nextRunwayModel));
    t.deepEqual(fms.arrivalRunwayModel, nextRunwayModel);
});

ava('.setDepartureRunway() throws when passed something other than a RunwayModel instance', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);

    t.throws(() => fms.setDepartureRunway());
    t.throws(() => fms.setDepartureRunway({}));
    t.throws(() => fms.setDepartureRunway([]));
    t.throws(() => fms.setDepartureRunway(''));
    t.throws(() => fms.setDepartureRunway(15));
    t.throws(() => fms.setDepartureRunway('hello'));
});

ava('.setDepartureRunway() returns early when the specified runway is already the #departureRunwayModel', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const originalRunwayModel = fms.departureRunwayModel;
    const routeStringModelUpdateSidLegForDepartureRunwayModelSpy = sinon.spy(fms._routeStringModel, 'updateSidLegForDepartureRunwayModel');

    fms.setDepartureRunway(originalRunwayModel);

    t.true(routeStringModelUpdateSidLegForDepartureRunwayModelSpy.notCalled);
    t.deepEqual(fms.departureRunwayModel, originalRunwayModel);
});

ava('.setDepartureRunway() sets #departureRunwayModel to the specified RunwayModel', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const nextRunwayModel = airportModelFixture.getRunway('25R');
    const routeStringModelUpdateSidLegForDepartureRunwayModelSpy = sinon.spy(fms._routeStringModel, 'updateSidLegForDepartureRunwayModel');

    fms.setDepartureRunway(nextRunwayModel);

    t.true(routeStringModelUpdateSidLegForDepartureRunwayModelSpy.calledWithExactly(nextRunwayModel));
    t.deepEqual(fms.departureRunwayModel, nextRunwayModel);
});

ava('.setFlightPhase() throws if specified phase is not a member of the `FLIGHT_PHASE` enum', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);

    t.throws(() => fms.setFlightPhase());
    t.throws(() => fms.setFlightPhase({}));
    t.throws(() => fms.setFlightPhase([]));
    t.throws(() => fms.setFlightPhase(80));
    t.throws(() => fms.setFlightPhase(''));
    t.throws(() => fms.setFlightPhase('dEsCeNt'));
});

ava('.setFlightPhase() sets #currentPhase to the specified flight phase', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);

    t.true(fms.currentPhase === FLIGHT_PHASE.APRON);

    fms.setFlightPhase(FLIGHT_PHASE.CRUISE);

    t.true(fms.currentPhase === FLIGHT_PHASE.CRUISE);
});

ava('.skipToWaypointName() returns #_routeStringModel.skipToWaypointName()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeStringModelSkipTowWaypointNameSpy = sinon.spy(fms._routeStringModel, 'skipToWaypointName');
    const nextWaypointNameMock = 'MLF';
    const result = fms.skipToWaypointName(nextWaypointNameMock);

    t.true(result);
    t.true(routeStringModelSkipTowWaypointNameSpy.calledWithExactly(nextWaypointNameMock));
});

ava('._updateArrivalRunwayFromRoute() returns early when arrival runway cannot be deduced from route', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
    const setArrivalRunwaySpy = sinon.spy(fms, 'setArrivalRunway');
    const result = fms._updateArrivalRunwayFromRoute();

    t.true(typeof result === 'undefined');
    t.true(setArrivalRunwaySpy.notCalled);
});

ava('._updateArrivalRunwayFromRoute() calls .setArrivalRunway() IAW the route\'s arrival runway', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('MLF.GRNPA1.KLAS07R');
    const setArrivalRunwaySpy = sinon.spy(fms, 'setArrivalRunway');
    const expectedRunwayModel = fms.arrivalAirportModel.getRunway('07R');
    const result = fms._updateArrivalRunwayFromRoute();

    t.true(typeof result === 'undefined');
    t.true(setArrivalRunwaySpy.calledWithExactly(expectedRunwayModel));
});

ava('._updateDepartureRunwayFromRoute() returns early when departure runway cannot be deduced from route', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(starRouteStringMock);
    const setDepartureRunwaySpy = sinon.spy(fms, 'setDepartureRunway');
    const result = fms._updateDepartureRunwayFromRoute();

    t.true(typeof result === 'undefined');
    t.true(setDepartureRunwaySpy.notCalled);
});

ava('._updateDepartureRunwayFromRoute() calls .setDepartureRunway() IAW the route\'s departure runway', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('KLAS07R.COWBY6.DRK');
    const setDepartureRunwaySpy = sinon.spy(fms, 'setDepartureRunway');
    const expectedRunwayModel = fms.arrivalAirportModel.getRunway('07R');
    const result = fms._updateDepartureRunwayFromRoute();

    t.true(typeof result === 'undefined');
    t.true(setDepartureRunwaySpy.calledWithExactly(expectedRunwayModel));
});

ava('._verifyRouteContainsMultipleWaypoints() throws when route has zero waypoints', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);

    fms._routeStringModel.reset();

    t.true(fms.waypoints.length === 0);
    t.throws(() => fms._verifyRouteContainsMultipleWaypoints());
});

ava('._verifyRouteContainsMultipleWaypoints() throws when route has one waypoint', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);

    fms.replaceFlightPlanWithNewRoute('DRK');

    t.true(fms.waypoints.length === 1);
    t.throws(() => fms._verifyRouteContainsMultipleWaypoints());
});

ava('._verifyRouteContainsMultipleWaypoints() does not throw when route has more than one waypoint', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);

    fms.replaceFlightPlanWithNewRoute('DRK..MLF');

    t.true(fms.waypoints.length === 2);
    t.notThrows(() => fms._verifyRouteContainsMultipleWaypoints());
});

ava('.getInitialClimbClearance() returns the airport initial climb altitude when the SID\'s altitude is undefined', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);

    t.true(fms.getInitialClimbClearance() === 19000);
});

ava('.getInitialClimbClearance() returns the SID\'s altitude when defined', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString('KLAS07R.BOACH6.HEC');

    t.true(fms.getInitialClimbClearance() === 7000);
});
