import ava from 'ava';
import sinon from 'sinon';
import _every from 'lodash/every';
import _filter from 'lodash/filter';
import _isArray from 'lodash/isArray';
import Fms from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/Fms';
import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';
// import StaticPositionModel from '../../../src/assets/scripts/client/base/StaticPositionModel';
import { airportModelFixture } from '../../fixtures/airportFixtures';
import { createNavigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import {
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    // ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_DIRECT_ROUTE_STRING_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK,
    // DEPARTURE_AIRCRAFT_INIT_PROPS_WITH_DIRECT_ROUTE_STRING_MOCK,
    AIRCRAFT_DEFINITION_MOCK
} from '../_mocks/aircraftMocks';
import {
    FLIGHT_CATEGORY,
    FLIGHT_PHASE
} from '../../../src/assets/scripts/client/constants/aircraftConstants';
// import { SNORA_STATIC_POSITION_MODEL } from '../../base/_mocks/positionMocks';
import {
    INVALID_INDEX,
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

// fixtures
let navigationLibraryFixture;

// helper functions
function buildFmsForAircraftInApronPhaseWithRouteString(routeString) {
    const aircraftPropsMock = Object.assign({}, DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, { routeString });

    return new Fms(aircraftPropsMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);
}
function buildFmsForAircraftInCruisePhaseWithRouteString(routeString) {
    const aircraftPropsMock = Object.assign({}, ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, { routeString });

    return new Fms(aircraftPropsMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);
}

ava.before(() => {
    // sinon.stub(global.console, 'error', () => {});
});

ava.after(() => {
    // global.console.error.restore();
});

ava.beforeEach(() => {
    navigationLibraryFixture = createNavigationLibraryFixture();
});

ava.afterEach(() => {
    navigationLibraryFixture = null;
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

ava('#currentLeg returns #_routeModel.currentLeg', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);

    t.deepEqual(fms.currentLeg, fms._routeModel.currentLeg);
});

ava('#currentWaypoint returns the first waypoint of the #_routeModel', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);

    t.deepEqual(fms.currentWaypoint, fms._routeModel.waypoints[0]);
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

ava('#nextWaypoint returns #_routeModel.nextWaypoint', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);

    fms.moveToNextWaypoint();

    t.deepEqual(fms.nextWaypoint, fms._routeModel.nextWaypoint);
});

ava('#waypoints returns an array containing all the WaypointModels in the route', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
    const result = fms.waypoints;

    t.true(result.length === 20);
    t.true(_every(result, (waypoint) => waypoint instanceof WaypointModel));
});

ava('.activateHoldForWaypointName() returns failure message when the route does not contain the specified waypoint', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeModelActivateHoldForWaypointNameSpy = sinon.spy(fms._routeModel, 'activateHoldForWaypointName');
    const unknownWaypointName = 'DINGBAT';
    const holdParametersMock = { turnDirection: 'left' };
    const expectedResult = [false, `unable to hold at ${unknownWaypointName}; it is not on our route!`];
    const result = fms.activateHoldForWaypointName(unknownWaypointName, holdParametersMock);

    t.true(routeModelActivateHoldForWaypointNameSpy.notCalled);
    t.deepEqual(result, expectedResult);
});

ava('.activateHoldForWaypointName() calls #_routeModel.activateHoldForWaypointName() with appropriate parameters', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeModelActivateHoldForWaypointNameSpy = sinon.spy(fms._routeModel, 'activateHoldForWaypointName');
    const holdWaypointName = 'OAL';
    const holdParametersMock = { turnDirection: 'left' };
    const result = fms.activateHoldForWaypointName(holdWaypointName, holdParametersMock);

    t.true(typeof result === 'undefined');
    t.true(routeModelActivateHoldForWaypointNameSpy.calledWithExactly(holdWaypointName, holdParametersMock));
});

ava('.reset() resets all class properties to appropriate default values', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);

    fms.reset();

    t.true(fms.arrivalAirportModel === null);
    t.true(fms.arrivalRunwayModel === null);
    t.true(fms.currentPhase === '');
    t.true(fms.departureAirportModel === null);
    t.true(fms.departureRunwayModel === null);
    t.true(fms.flightPlanAltitude === INVALID_NUMBER);
    t.true(fms._routeModel === null);
});

ava('._initializeArrivalAirport() returns early when destination ICAO is an empty string', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
    const result = fms.reset()._initializeArrivalAirport('');

    t.true(typeof result === 'undefined');
    t.true(fms.arrivalAirportModel === null);
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
    t.true(fms.departureAirportModel === null);
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

ava('.getAltitudeRestrictedWaypoints() returns #_routeModel.getAltitudeRestrictedWaypoints()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);

    t.deepEqual(fms.getAltitudeRestrictedWaypoints(), fms._routeModel.getAltitudeRestrictedWaypoints());
});

ava('.getBottomAltitude() returns #_routeModel.getBottomAltitude()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);

    t.deepEqual(fms.getBottomAltitude(), fms._routeModel.getBottomAltitude());
});

ava('.getFullRouteStringWithoutAirportsWithSpaces calls #_routeModel.getFullRouteStringWithoutAirportsWithSpaces()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString('KLAS07R.COWBY6.DRK');
    const routeModelSpy = sinon.spy(fms._routeModel, 'getFullRouteStringWithoutAirportsWithSpaces');
    const expectedResult = 'COWBY6 DRK';
    const result = fms.getFullRouteStringWithoutAirportsWithSpaces();

    t.true(result === expectedResult);
    t.true(routeModelSpy.calledWithExactly());
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

ava('.getRouteString() returns #_routeModel.getRouteString()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);

    t.deepEqual(fms.getRouteString(), fms._routeModel.getRouteString());
});

ava('.getRouteStringWithSpaces() returns #_routeModel.getRouteStringWithSpaces()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);

    t.deepEqual(fms.getRouteStringWithSpaces(), fms._routeModel.getRouteStringWithSpaces());
});

ava('.getSpeedRestrictedWaypoints() returns array of all speed restricted waypoints in route', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('DVC.GRNPA1.KLAS07R');
    const result = fms.getSpeedRestrictedWaypoints();
    const expectedWaypointNames = ['LUXOR', 'FRAWG'];
    const waypointNames = result.map((waypointModel) => waypointModel.name);

    t.true(_isArray(result));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('.getTopAltitude() returns #_routeModel.getTopAltitude()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
    const routeModelGetTopAltitudeSpy = sinon.spy(fms._routeModel, 'getTopAltitude');
    const result = fms.getTopAltitude();

    t.true(routeModelGetTopAltitudeSpy.calledWithExactly());
    t.true(result === fms._routeModel.getTopAltitude());
});

ava('.hasNextWaypoint() returns #_routeModel.hasNextWaypoint()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
    const routeModelHasNextWaypointSpy = sinon.spy(fms._routeModel, 'hasNextWaypoint');
    const result = fms.hasNextWaypoint();

    t.true(routeModelHasNextWaypointSpy.calledWithExactly());
    t.true(result === fms._routeModel.hasNextWaypoint());
});

ava('.hasWaypointName() returns #_routeModel.hasWaypointName()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
    const waypointNameMock = 'DRK';
    const routeModelHasWaypointNameSpy = sinon.spy(fms._routeModel, 'hasWaypointName');
    const result = fms.hasWaypointName(waypointNameMock);

    t.true(routeModelHasWaypointNameSpy.calledWithExactly(waypointNameMock));
    t.true(result === fms._routeModel.hasWaypointName(waypointNameMock));
});

ava('.isArrival() returns true for any arrival flight phase', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const arrivalFlightPhases = [
        FLIGHT_PHASE.CRUISE,
        FLIGHT_PHASE.DESCENT,
        FLIGHT_PHASE.APPROACH,
        FLIGHT_PHASE.LANDING
    ];

    for (let i = 0; i < arrivalFlightPhases.length; i++) {
        fms.currentPhase = arrivalFlightPhases[i];

        t.true(fms.isArrival());
    }
});

ava('.isArrival() returns false for all phases that are not arrival phases', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const arrivalFlightPhases = [
        FLIGHT_PHASE.CRUISE,
        FLIGHT_PHASE.DESCENT,
        FLIGHT_PHASE.APPROACH,
        FLIGHT_PHASE.LANDING
    ];
    const nonArrivalPhases = _filter(FLIGHT_PHASE, (phase) => arrivalFlightPhases.indexOf(phase) === INVALID_INDEX);

    for (let i = 0; i < nonArrivalPhases.length; i++) {
        fms.currentPhase = nonArrivalPhases[i];

        t.false(fms.isArrival());
    }
});

ava('.isDeparture() returns true for any departure flight phase', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const departurePhases = [
        FLIGHT_PHASE.APRON,
        FLIGHT_PHASE.TAXI,
        FLIGHT_PHASE.WAITING,
        FLIGHT_PHASE.TAKEOFF,
        FLIGHT_PHASE.CLIMB
    ];

    for (let i = 0; i < departurePhases.length; i++) {
        fms.currentPhase = departurePhases[i];

        t.true(fms.isDeparture());
    }
});

ava('.isDeparture() returns false for all phases that are not departure phases', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const departurePhases = [
        FLIGHT_PHASE.APRON,
        FLIGHT_PHASE.TAXI,
        FLIGHT_PHASE.WAITING,
        FLIGHT_PHASE.TAKEOFF,
        FLIGHT_PHASE.CLIMB
    ];
    const nonDeparturePhases = _filter(FLIGHT_PHASE, (phase) => departurePhases.indexOf(phase) === INVALID_INDEX);

    for (let i = 0; i < nonDeparturePhases.length; i++) {
        fms.currentPhase = nonDeparturePhases[i];

        t.false(fms.isDeparture());
    }
});

ava('.moveToNextWaypoint() calls #_routeModel.moveToNextWaypoint()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeModelMoveToNextWaypointSpy = sinon.spy(fms._routeModel, 'moveToNextWaypoint');
    const result = fms.moveToNextWaypoint();

    t.true(routeModelMoveToNextWaypointSpy.calledWithExactly());
    t.deepEqual(result, fms._routeModel.moveToNextWaypoint());
});

ava('.replaceArrivalProcedure() returns early when passed a wrong-length route string', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const navigationLibraryHasProcedureSpy = sinon.spy(fms._navigationLibrary, 'hasProcedure');
    const expectedResponse = [false, 'arrival procedure format not understood'];
    const responseForSingleElement = fms.replaceArrivalProcedure('KEPEC3');
    const responseForDoubleElement = fms.replaceArrivalProcedure('KEPEC3.KLAS07R');

    t.true(navigationLibraryHasProcedureSpy.notCalled);
    t.deepEqual(responseForSingleElement, expectedResponse);
    t.deepEqual(responseForDoubleElement, expectedResponse);
});

ava('.replaceArrivalProcedure() returns early when the specified procedure does not exist', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeModelReplaceArrivalProcedureSpy = sinon.spy(fms._routeModel, 'replaceArrivalProcedure');
    const expectedResponse = [false, 'unknown procedure "KEPEC0"'];
    const responseForInvalidProcedure = fms.replaceArrivalProcedure('DAG.KEPEC0.KLAS07R');

    t.true(routeModelReplaceArrivalProcedureSpy.notCalled);
    t.deepEqual(responseForInvalidProcedure, expectedResponse);
});

ava('.replaceArrivalProcedure() does not call ._updateArrivalRunwayFromRoute() when the arrival procedure is not applied successfully', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeModelReplaceArrivalProcedureStub = sinon.stub(fms._routeModel, 'replaceArrivalProcedure', () => false);
    const updateArrivalRunwayFromRouteSpy = sinon.spy(fms, '_updateArrivalRunwayFromRoute');
    const expectedResponse = [false, 'route of "DAG.KEPEC3.KLAS07R" is not valid'];
    const responseForInvalidProcedure = fms.replaceArrivalProcedure('DAG.KEPEC3.KLAS07R');

    routeModelReplaceArrivalProcedureStub.restore();

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
    const navigationLibraryHasProcedureSpy = sinon.spy(fms._navigationLibrary, 'hasProcedure');
    const expectedResponse = [false, 'departure procedure format not understood'];
    const responseForSingleElement = fms.replaceDepartureProcedure('BOACH6');
    const responseForDoubleElement = fms.replaceDepartureProcedure('KLAS07R.BOACH6');

    t.true(navigationLibraryHasProcedureSpy.notCalled);
    t.deepEqual(responseForSingleElement, expectedResponse);
    t.deepEqual(responseForDoubleElement, expectedResponse);
});

ava('.replaceDepartureProcedure() returns early when the specified procedure does not exist', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeModelReplaceDepartureProcedureSpy = sinon.spy(fms._routeModel, 'replaceDepartureProcedure');
    const expectedResponse = [false, 'unknown procedure "BOACH0"'];
    const responseForInvalidProcedure = fms.replaceDepartureProcedure('KLAS07R.BOACH0.TNP');

    t.true(routeModelReplaceDepartureProcedureSpy.notCalled);
    t.deepEqual(responseForInvalidProcedure, expectedResponse);
});

ava('.replaceDepartureProcedure() does not call ._updateDepartureRunwayFromRoute() when the departure procedure is not applied successfully', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeModelReplaceDepartureProcedureStub = sinon.stub(fms._routeModel, 'replaceDepartureProcedure', () => false);
    const updateDepartureRunwayFromRouteSpy = sinon.spy(fms, '_updateDepartureRunwayFromRoute');
    const expectedResponse = [false, 'route of "KLAS07R.BOACH6.TNP" is not valid'];
    const responseForInvalidProcedure = fms.replaceDepartureProcedure('KLAS07R.BOACH6.TNP');

    routeModelReplaceDepartureProcedureStub.restore();

    t.true(updateDepartureRunwayFromRouteSpy.notCalled);
    t.deepEqual(responseForInvalidProcedure, expectedResponse);
});

ava('.replaceDepartureProcedure() calls ._updateDepartureRunwayFromRoute() when the departure procedure is applied successfully', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const updateDepartureRunwayFromRouteSpy = sinon.spy(fms, '_updateDepartureRunwayFromRoute');
    const expectedResponse = [true, ''];
    const response = fms.replaceDepartureProcedure('KLAS07R.BOACH6.TNP');

    t.true(updateDepartureRunwayFromRouteSpy.calledWithExactly());
    t.deepEqual(response, expectedResponse);
});

ava('.replaceFlightPlanWithNewRoute() returns failure response and does not modify route when proposed route is not valid', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
    const invalidProposedRoute = 'KLAS07R.BOACH6.BOP';
    const originalRouteModel = fms._routeModel;
    const skipToWaypointNameSpy = sinon.spy(fms, 'skipToWaypointName');
    const expectedResult = [false, { log: 'requested route of "KLAS07R.BOACH6.BOP" is invalid', say: 'that route is invalid' }];
    const result = fms.replaceFlightPlanWithNewRoute(invalidProposedRoute);

    t.deepEqual(result, expectedResult);
    t.true(skipToWaypointNameSpy.notCalled);
    t.deepEqual(originalRouteModel, fms._routeModel);
});

ava('.replaceFlightPlanWithNewRoute() returns correct response and replaces old route with new route when proposed route is valid', (t) => {
    const fms = buildFmsForAircraftInCruisePhaseWithRouteString('TNP..BIKKR..HEC');
    const proposedRoute = 'JESJI..BAKRR..MINEY..HITME';
    const skipToWaypointNameSpy = sinon.spy(fms, 'skipToWaypointName');
    const expectedResult = [true, { log: 'rerouting to: JESJI BAKRR MINEY HITME', say: 'rerouting as requested' }];
    const result = fms.replaceFlightPlanWithNewRoute(proposedRoute);

    t.deepEqual(result, expectedResult);
    t.true(skipToWaypointNameSpy.calledWithExactly('BIKKR'));
    t.true(fms._routeModel.getRouteString() === proposedRoute);
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

ava('.setArrivalRunway() returns early when the specified runway is already the #arrivalRunwayModel', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const originalRunwayModel = fms.arrivalRunwayModel;
    const routeModelUpdateStarLegForArrivalRunwayModelSpy = sinon.spy(fms._routeModel, 'updateStarLegForArrivalRunwayModel');

    fms.setArrivalRunway(originalRunwayModel);

    t.true(routeModelUpdateStarLegForArrivalRunwayModelSpy.notCalled);
    t.deepEqual(fms.arrivalRunwayModel, originalRunwayModel);
});

ava('.setArrivalRunway() sets #arrivalRunwayModel to the specified RunwayModel', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const nextRunwayModel = airportModelFixture.getRunway('25R');
    const routeModelUpdateStarLegForArrivalRunwayModelSpy = sinon.spy(fms._routeModel, 'updateStarLegForArrivalRunwayModel');

    fms.setArrivalRunway(nextRunwayModel);

    t.true(routeModelUpdateStarLegForArrivalRunwayModelSpy.calledWithExactly(nextRunwayModel));
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
    const routeModelUpdateSidLegForDepartureRunwayModelSpy = sinon.spy(fms._routeModel, 'updateSidLegForDepartureRunwayModel');

    fms.setDepartureRunway(originalRunwayModel);

    t.true(routeModelUpdateSidLegForDepartureRunwayModelSpy.notCalled);
    t.deepEqual(fms.departureRunwayModel, originalRunwayModel);
});

ava('.setDepartureRunway() sets #departureRunwayModel to the specified RunwayModel', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const nextRunwayModel = airportModelFixture.getRunway('25R');
    const routeModelUpdateSidLegForDepartureRunwayModelSpy = sinon.spy(fms._routeModel, 'updateSidLegForDepartureRunwayModel');

    fms.setDepartureRunway(nextRunwayModel);

    t.true(routeModelUpdateSidLegForDepartureRunwayModelSpy.calledWithExactly(nextRunwayModel));
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

ava('.skipToWaypointName() returns #_routeModel.skipToWaypointName()', (t) => {
    const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
    const routeModelSkipTowWaypointNameSpy = sinon.spy(fms._routeModel, 'skipToWaypointName');
    const nextWaypointNameMock = 'MLF';
    const result = fms.skipToWaypointName(nextWaypointNameMock);

    t.true(result);
    t.true(routeModelSkipTowWaypointNameSpy.calledWithExactly(nextWaypointNameMock));
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

    fms._routeModel.reset();

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

// ava('#routeString returns a routeString for a procedure route', (t) => {
//     const expectedResult = 'dag.kepec3.klas';
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//
//     t.true(_isEqual(fms.getRouteString(), expectedResult));
// });
//
// ava('#routeString returns a routeString for a complex route', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     t.true(_isEqual(fms.getRouteString(), fullRouteStringMock));
// });
//
// ava('.getRouteStringWithSpaces() returns a routeString that is a sum of #previousRouteSegments and #currentRoute', (t) => {
//     const expectedResult = 'COWBY BIKKR DAG KEPEC3 KLAS';
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     t.true(fms.getRouteStringWithSpaces() === expectedResult);
//
//     fms.moveToNextWaypoint();
//     fms.moveToNextWaypoint();
//     fms.moveToNextWaypoint();
//
//     t.true(fms.getRouteStringWithSpaces() === expectedResult);
// });
//
// ava('.getRouteStringWithSpaces() returns a routeString that is a sum of #previousRouteSegments and #currentRoute', (t) => {
//     const expectedResultBeforeReplacement = 'COWBY BIKKR DAG KEPEC3 KLAS';
//     const expectedResult = 'COWBY BIKKR MLF GRNPA1 KLAS';
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     t.true(fms.getRouteStringWithSpaces() === expectedResultBeforeReplacement);
//
//     fms.moveToNextWaypoint();
//     fms.moveToNextWaypoint();
//     fms.replaceArrivalProcedure(starRouteStringMock, runwayAssignmentMock);
//
//     t.true(fms.getRouteStringWithSpaces() === expectedResult);
// });
//
// ava('.init() calls ._buildLegCollection()', (t) => {
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//     const _buildLegCollectionSpy = sinon.spy(fms, '_buildLegCollection');
//
//     fms.init(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, runwayAssignmentMock);
//
//     t.true(_buildLegCollectionSpy.calledWithExactly(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK.route));
// });
//
// ava('.setDepartureRunway() sets #departureRunwayModel to the specified runway model', (t) => {
//     const nextRunwayFixture = airportModelFixture.getRunway('19R');
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
//
//     fms.setDepartureRunway(nextRunwayFixture);
//
//     t.true(_isEqual(fms.departureRunwayModel, nextRunwayFixture));
// });
//
// ava('.setDepartureRunway() returns early when the specified runway model is equal to #departureRunwayModel', (t) => {
//     const nextRunwayFixture = airportModelFixture.getRunway('19L');
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
//     const regenerateSidLegSpy = sinon.spy(fms, '_regenerateSidLeg');
//     const replaceDepartureProcedureSpy = sinon.spy(fms, 'replaceDepartureProcedure');
//
//     fms.setDepartureRunway(nextRunwayFixture);
//
//     t.true(regenerateSidLegSpy.notCalled);
//     t.true(replaceDepartureProcedureSpy.notCalled);
// });
//
// ava('.setDepartureRunway() throws when passed a string instead of a RunwayModel', (t) => {
//     const nextRunwayName = '19R';
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
//
//     t.throws(() => fms.setDepartureRunway(nextRunwayName));
// });
//
// ava('.setDepartureRunway() regenerates SID legs for new runway', (t) => {
//     const nextRunwayFixture = airportModelFixture.getRunway('19R');
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
//     const regenerateSidLegSpy = sinon.spy(fms, '_regenerateSidLeg');
//
//     fms.setDepartureRunway(nextRunwayFixture);
//
//     t.true(regenerateSidLegSpy.calledWithExactly());
// });
//
// ava('.setArrivalRunway() sets a #arrivalRunwayModel to the specified runway model', (t) => {
//     const nextRunwayFixture = airportModelFixture.getRunway('19R');
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//
//     fms.setArrivalRunway(nextRunwayFixture);
//
//     t.true(_isEqual(fms.arrivalRunwayModel, nextRunwayFixture));
// });
//
// ava('.setArrivalRunway() returns early when the specified runway model is equal to #arrivalRunwayModel', (t) => {
//     const nextRunwayFixture = airportModelFixture.getRunway('19L');
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//     const regenerateStarLegSpy = sinon.spy(fms, '_regenerateStarLeg');
//     const replaceArrivalProcedureSpy = sinon.spy(fms, 'replaceArrivalProcedure');
//
//     fms.setArrivalRunway(nextRunwayFixture);
//
//     t.true(regenerateStarLegSpy.notCalled);
//     t.true(replaceArrivalProcedureSpy.notCalled);
// });
//
// ava('.setArrivalRunway() throws when passed a string instead of a RunwayModel', (t) => {
//     const nextRunwayName = '19R';
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
//
//     t.throws(() => fms.setArrivalRunway(nextRunwayName));
// });
//
// ava('.setArrivalRunway() regenerates STAR legs for new runway', (t) => {
//     const nextRunwayFixture = airportModelFixture.getRunway('19R');
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//     const regenerateStarLegSpy = sinon.spy(fms, '_regenerateStarLeg');
//
//     t.true(fms.arrivalRunwayModel.name === '19L');
//
//     fms.setArrivalRunway(nextRunwayFixture);
//
//     t.true(regenerateStarLegSpy.calledWithExactly());
// });
//
// ava('.hasNextWaypoint() returns true if there is a next waypoint', (t) => {
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//
//     t.true(fms.hasNextWaypoint());
// });
//
// ava('.hasNextWaypoint() returns true when the nextWaypoint is part of the nextLeg', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     t.true(fms.hasNextWaypoint());
// });
//
// ava('.hasNextWaypoint() returns false when no nextWaypoint exists', (t) => {
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//     fms.skipToWaypointName('lefft');
//
//     t.false(fms.hasNextWaypoint());
// });
//
// ava('.createLegWithHoldingPattern() calls _createLegWithHoldWaypoint() when holdRouteSegment is GPS', (t) => {
//     const inboundHeadingMock = -1.62476729292438;
//     const turnDirectionMock = 'left';
//     const legLengthMock = '2min';
//     const holdRouteSegmentMock = 'GPS';
//     const holdPositionMock = SNORA_STATIC_POSITION_MODEL;
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const _createLegWithHoldWaypointSpy = sinon.spy(fms, '_createLegWithHoldWaypoint');
//
//     fms.createLegWithHoldingPattern(inboundHeadingMock, turnDirectionMock, legLengthMock, holdRouteSegmentMock, holdPositionMock);
//
//     t.true(_createLegWithHoldWaypointSpy.calledOnce);
// });
//
// ava('.createLegWithHoldingPattern() prepends LegCollection with hold Waypoint when holdRouteSegment is GPS', (t) => {
//     const inboundHeadingMock = -1.62476729292438;
//     const turnDirectionMock = 'left';
//     const legLengthMock = '2min';
//     const holdRouteSegmentMock = 'GPS';
//     const holdPositionMock = SNORA_STATIC_POSITION_MODEL;
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//
//     fms.createLegWithHoldingPattern(inboundHeadingMock, turnDirectionMock, legLengthMock, holdRouteSegmentMock, holdPositionMock);
//
//     t.true(fms.currentWaypoint._turnDirection === 'left');
//     t.true(fms.currentWaypoint._legLength === '2min');
//     t.true(fms.currentWaypoint.name === 'gps');
//     t.true(_isEqual(fms.currentWaypoint.relativePosition, holdPositionMock.relativePosition));
// });
//
// ava('.createLegWithHoldingPattern() calls ._findLegAndWaypointIndexForWaypointName() when holdRouteSegment is a FixName', (t) => {
//     const inboundHeadingMock = -1.62476729292438;
//     const turnDirection = 'left';
//     const legLength = '2min';
//     const holdRouteSegment = '@BIKKR';
//     const holdFixLocation = [113.4636606631233, 6.12969620221002];
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const _findLegAndWaypointIndexForWaypointNameSpy = sinon.spy(fms, '_findLegAndWaypointIndexForWaypointName');
//
//     fms.createLegWithHoldingPattern(inboundHeadingMock, turnDirection, legLength, holdRouteSegment, holdFixLocation);
//
//     t.true(_findLegAndWaypointIndexForWaypointNameSpy.calledWithExactly('BIKKR'));
// });
//
// ava('.createLegWithHoldingPattern() skips to a Waypoint and adds hold props to existing Waypoint', (t) => {
//     const inboundHeadingMock = -1.62476729292438;
//     const turnDirectionMock = 'left';
//     const legLengthMock = '2min';
//     const holdRouteSegmentMock = '@BIKKR';
//     const holdFixLocationMock = [113.4636606631233, 6.12969620221002];
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     fms.createLegWithHoldingPattern(inboundHeadingMock, turnDirectionMock, legLengthMock, holdRouteSegmentMock, holdFixLocationMock);
//
//     t.true(fms.currentWaypoint.name === 'bikkr');
// });
//
// ava('.createLegWithHoldingPattern() prepends a LegModel Waypoint when a fixName is supplied that is not already in the flightPlan', (t) => {
//     const inboundHeadingMock = -1.62476729292438;
//     const turnDirectionMock = 'left';
//     const legLengthMock = '3min';
//     const holdRouteSegmentMock = '@CEASR';
//     const holdFixLocationMock = [113.4636606631233, 6.12969620221002];
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     fms.createLegWithHoldingPattern(inboundHeadingMock, turnDirectionMock, legLengthMock, holdRouteSegmentMock, holdFixLocationMock);
//
//     t.true(fms.currentWaypoint.name === 'ceasr');
//     t.true(fms.currentWaypoint._turnDirection === turnDirectionMock);
//     t.true(fms.currentWaypoint._legLength === legLengthMock);
// });
//
// ava('.moveToNextWaypoint() adds current LegModel#routeString to _previousRouteSegments before moving to next waypoint', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     fms.moveToNextWaypoint();
//
//     t.true(fms._previousRouteSegments[0] === 'cowby');
// });
//
// ava('.moveToNextWaypoint() calls ._moveToNextLeg() if the current waypointCollection.length === 0', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const _moveToNextLegSpy = sinon.spy(fms, '_moveToNextLeg');
//     fms.legCollection[0].waypointCollection = [];
//
//     fms.moveToNextWaypoint();
//
//     t.true(_moveToNextLegSpy.calledOnce);
// });
//
// ava('.moveToNextWaypoint() calls ._moveToNextWaypointInLeg() if the current waypointCollection.length > 1', (t) => {
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//     const _moveToNextWaypointInLegSpy = sinon.spy(fms, '_moveToNextWaypointInLeg');
//
//     fms.moveToNextWaypoint();
//
//     t.true(_moveToNextWaypointInLegSpy.calledOnce);
// });
//
// ava('.moveToNextWaypoint() removes the first LegModel from legCollection when the first Leg has no waypoints', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const length = fms.legCollection.length;
//     fms.legCollection[0].waypointCollection = [];
//
//     fms.moveToNextWaypoint();
//
//     t.true(fms.legCollection.length === length - 1);
// });
//
// ava('.moveToNextWaypoint() does not call ._moveToNextWaypointInLeg() after calling ._moveToNextLeg() ', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const _moveToNextWaypointInLegSpy = sinon.spy(fms, '_moveToNextWaypointInLeg');
//
//
//     fms.moveToNextWaypoint();
//
//     t.true(_moveToNextWaypointInLegSpy.notCalled);
// });
//
// ava('.replaceFlightPlanWithNewRoute() calls ._destroyLegCollection()', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const _destroyLegCollectionSpy = sinon.spy(fms, '_destroyLegCollection');
//
//     fms.replaceFlightPlanWithNewRoute(simpleRouteString);
//
//     t.true(_destroyLegCollectionSpy.calledOnce);
// });
//
// ava('.replaceFlightPlanWithNewRoute() calls ._buildLegCollection()', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const _buildLegCollectionSpy = sinon.spy(fms, '_buildLegCollection');
//
//     fms.replaceFlightPlanWithNewRoute(simpleRouteString);
//
//     t.true(_buildLegCollectionSpy.calledWithExactly(simpleRouteString));
// });
//
// ava('.replaceFlightPlanWithNewRoute() creates new LegModels from a routeString and adds them to the #legCollection', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     fms.replaceFlightPlanWithNewRoute(simpleRouteString);
//
//     t.true(fms.currentLeg.isProcedure);
//     t.true(fms.legCollection.length === 1);
//     t.true(fms.legCollection[0].waypointCollection.length === 13);
// });
//
// ava('.skipToWaypointName() calls ._collectRouteStringsForLegsToBeDropped()', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const _collectRouteStringsForLegsToBeDroppedSpy = sinon.spy(fms, '_collectRouteStringsForLegsToBeDropped');
//
//     fms.skipToWaypointName('DAG');
//
//     t.true(_collectRouteStringsForLegsToBeDroppedSpy.calledOnce);
// });
//
// ava('.skipToWaypointName() removes all the legs and waypoints in front of the waypoint to skip to', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     fms.skipToWaypointName('DAG');
//
//     t.true(fms.currentLeg.routeString === 'dag.kepec3.klas');
// });
//
// ava('.skipToWaypointName() does nothing if the waypoint to skip to is the #currentWaypoint', (t) => {
//     const waypointNameMock = 'cowby';
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     fms.skipToWaypointName(waypointNameMock);
//
//     t.true(fms.currentLeg.routeString === waypointNameMock);
// });
//
// ava('.skipToWaypointName() skips to a waypoint in a different leg', (t) => {
//     const waypointNameMock = 'sunst';
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     fms.skipToWaypointName(waypointNameMock);
//
//     t.true(fms.currentWaypoint.name === waypointNameMock);
// });
//
// ava('.getNextWaypointPositionModel() returns the `StaticPositionModel` for the next Waypoint in the collection', (t) => {
//     const expectedResult = [-87.64380662924125, -129.57471627889475];
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//     const waypointPosition = fms.getNextWaypointPositionModel();
//     const result = waypointPosition.relativePosition;
//
//     t.true(waypointPosition instanceof StaticPositionModel);
//     t.true(_isEqual(result, expectedResult));
// });
//
// ava.todo('.replaceDepartureProcedure() updates the current runway assignment');
//
// ava('.replaceDepartureProcedure() calls .prependLeg() when no departure procedure exists', (t) => {
//     const nextRouteStringMock = 'KLAS.TRALR6.MLF';
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
//     const prependLegSpy = sinon.spy(fms, 'prependLeg');
//
//     fms._destroyLegCollection();
//     fms.replaceDepartureProcedure(nextRouteStringMock, runwayAssignmentMock);
//
//     t.true(prependLegSpy.calledOnce);
// });
//
// ava('.replaceDepartureProcedure() returns undefined after success', (t) => {
//     const nextRouteStringMock = 'KLAS.TRALR6.MLF';
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
//     const result = fms.replaceDepartureProcedure(nextRouteStringMock, runwayAssignmentMock);
//
//     t.true(typeof result === 'undefined');
// });
//
// ava('.replaceDepartureProcedure() replaces the currentLeg with the new route', (t) => {
//     const nextRouteStringMock = 'KLAS.TRALR6.MLF';
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
//
//     t.false(fms.currentLeg.routeString === nextRouteStringMock.toLowerCase());
//
//     fms.replaceDepartureProcedure(nextRouteStringMock, runwayAssignmentMock);
//
//     t.true(fms.currentLeg.routeString === nextRouteStringMock.toLowerCase());
//     t.true(fms.legCollection.length === 1);
// });
//
// ava.todo('.replaceArrivalProcedure() updates the current runway assignment');
//
// ava('.replaceArrivalProcedure() calls .appendLeg() when no departure procedure exists', (t) => {
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//     const appendLegSpy = sinon.spy(fms, 'appendLeg');
//
//     fms._destroyLegCollection();
//     fms.replaceArrivalProcedure(starRouteStringMock, runwayAssignmentMock);
//
//     t.true(appendLegSpy.calledOnce);
// });
//
// ava('.replaceArrivalProcedure() returns undefined after success', (t) => {
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//     const result = fms.replaceArrivalProcedure(starRouteStringMock, runwayAssignmentMock);
//
//     t.true(typeof result === 'undefined');
// });
//
// ava('.replaceArrivalProcedure() replaces the currentLeg with the new route', (t) => {
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//
//     t.false(fms.currentLeg.routeString === starRouteStringMock.toLowerCase());
//
//     fms.replaceArrivalProcedure(starRouteStringMock, runwayAssignmentMock);
//
//     t.true(fms.currentLeg.routeString === starRouteStringMock.toLowerCase());
// });
//
// ava('.replaceRouteUpToSharedRouteSegment() calls ._trimLegCollectionAtIndex() with an index of the matching LegModel', (t) => {
//     const routeAmmendment = 'HITME..HOLDM..BIKKR..DAG';
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const _trimLegCollectionAtIndexSpy = sinon.spy(fms, '_trimLegCollectionAtIndex');
//     // custom route addition here to give us a little wiggle room for the test
//     fms.replaceFlightPlanWithNewRoute('COWBY..SUNST..BIKKR..DAG.KEPEC3.KLAS');
//
//     fms.replaceRouteUpToSharedRouteSegment(routeAmmendment);
//
//     t.true(_trimLegCollectionAtIndexSpy.calledWithExactly(2));
// });
//
// ava('.replaceRouteUpToSharedRouteSegment() calls ._prependLegCollectionWithRouteAmendment() with an array of routeSegments', (t) => {
//     const expectedResult = ['hitme', 'holdm'];
//     const routeAmmendment = 'HITME..HOLDM..BIKKR..DAG';
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const _prependLegCollectionWithRouteAmendmentSpy = sinon.spy(fms, '_prependLegCollectionWithRouteAmendment');
//     // custom route addition here to give us a little wiggle room for the test
//     fms.replaceFlightPlanWithNewRoute('COWBY..SUNST..BIKKR..DAG.KEPEC3.KLAS');
//
//     fms.replaceRouteUpToSharedRouteSegment(routeAmmendment);
//
//     t.true(_prependLegCollectionWithRouteAmendmentSpy.calledWithExactly(expectedResult));
// });
//
// ava('.replaceRouteUpToSharedRouteSegment() adds a new LegModel for each new routeSegment up to a shared LegModel.routeString', (t) => {
//     const expectedResult = ['hitme', 'holdm', 'bikkr'];
//     const routeAmmendment = 'HITME..HOLDM..BIKKR..DAG';
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     // custom route addition here to give us a little wiggle room for the test
//     fms.replaceFlightPlanWithNewRoute('COWBY..SUNST..BIKKR..DAG.KEPEC3.KLAS');
//
//     fms.replaceRouteUpToSharedRouteSegment(routeAmmendment);
//
//     t.true(fms.legCollection[0].routeString === expectedResult[0]);
//     t.true(fms.legCollection[1].routeString === expectedResult[1]);
//     t.true(fms.legCollection[2].routeString === expectedResult[2]);
// });
//
// ava('.leaveHoldFlightPhase() returns early when #currentPhase is not HOLD', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const _setFlightPhaseToPreviousFlightPhaseSpy = sinon.spy(fms, '_setFlightPhaseToPreviousFlightPhase');
//
//     fms.leaveHoldFlightPhase();
//
//     t.true(_setFlightPhaseToPreviousFlightPhaseSpy.notCalled);
// });
//
// ava('.leaveHoldFlightPhase() calls _setFlightPhaseToPreviousFlightPhase when #currentPhase is HOLD', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const _setFlightPhaseToPreviousFlightPhaseSpy = sinon.spy(fms, '_setFlightPhaseToPreviousFlightPhase');
//     fms.setFlightPhase('HOLD');
//
//     fms.leaveHoldFlightPhase();
//
//     t.true(_setFlightPhaseToPreviousFlightPhaseSpy.calledOnce);
// });
//
// ava('._setFlightPhaseToPreviousFlightPhase() reverts #currentPhase to the value that was set previous to HOLD', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     fms.setFlightPhase('HOLD');
//
//     fms._setFlightPhaseToPreviousFlightPhase();
//
//     t.true(fms.currentPhase === 'CRUISE');
// });
//
// ava('.isValidRouteAmendment() returns true when a routeAmmendment contains a routeSegment that exists in the flightPlan', (t) => {
//     const routeAmmendmentMock = 'HITME..HOLDM..BIKKR';
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     t.true(fms.isValidRouteAmendment(routeAmmendmentMock));
// });
//
// ava('.isValidRouteAmendment() returns false when a routeAmmendment does not contain a routeSegment that exists in the flightPlan', (t) => {
//     const routeAmmendmentMock = 'HITME..HOLDM';
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     t.false(fms.isValidRouteAmendment(routeAmmendmentMock));
// });
//
// ava('.hasWaypointName() returns false if a waypoint does not exist within the current flightPlan', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     t.false(fms.hasWaypointName('ABC'));
// });
//
// ava('.hasWaypointName() returns true if a waypoint does exist within the current flightPlan', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     // waypoint from within the KEPEC3 arrival
//     t.true(fms.hasWaypointName('SUNST'));
// });
//
// ava('.getTopAltitude() returns the highest "AT" or "AT/BELOW" altitude restriction from all the waypoints', (t) => {
//     const expectedResult = 24000;
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const result = fms.getTopAltitude();
//
//     t.true(result === expectedResult);
// });
//
// ava('.getBottomAltitude() returns the lowest "AT" or "AT/ABOVE" altitude restriction from all the waypoints', (t) => {
//     const expectedResult = 8000;
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const result = fms.getBottomAltitude();
//
//     t.true(result === expectedResult);
// });
//
// ava('.isFollowingSid() retruns true when the current Leg is a SID', (t) => {
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
//
//     t.true(fms.isFollowingSid());
//     t.false(fms.isFollowingStar());
// });
//
// ava('.isFollowingSid() retruns true when the current Leg is a SID', (t) => {
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//
//     t.true(fms.isFollowingStar());
//     t.false(fms.isFollowingSid());
// });
//
// ava('._buildLegCollection() returns an array of LegModels', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     t.true(fms.legCollection.length === 3);
// });
//
// ava('._findLegAndWaypointIndexForWaypointName() returns an object with keys legIndex and waypointIndex', (t) => {
//     const expectedResult = {
//         legIndex: 2,
//         waypointIndex: 0
//     };
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const result = fms._findLegAndWaypointIndexForWaypointName('dag');
//
//     t.true(_isEqual(result, expectedResult));
// });
//
// ava('._findLegIndexForProcedureType() returns -1 when a procedure type cannot be found', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const result = fms._findLegIndexForProcedureType('SID');
//
//     t.true(result === INVALID_NUMBER);
// });
//
// ava('._findLegIndexForProcedureType() returns an array index for a specific procedure type', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     const result = fms._findLegIndexForProcedureType('STAR');
//
//     t.true(result === 2);
// });
//
// ava('._destroyLegCollection() clears the #legCollection', (t) => {
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     fms._destroyLegCollection();
//
//     t.true(fms.legCollection.length === 0);
// });
//
// ava('._regenerateSidLeg() creates a new SID leg of identical route string for the currently assigned departure runway', (t) => {
//     const initialRunwayFixture = airportModelFixture.getRunway('19L');
//     const nextRunwayFixture = airportModelFixture.getRunway('19R');
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
//     const replaceDepartureProcedureSpy = sinon.spy(fms, 'replaceDepartureProcedure');
//     const sidLegIndex = fms._findLegIndexForProcedureType(PROCEDURE_TYPE.SID);
//     const sidLeg = fms.legCollection[sidLegIndex];
//     const oldWaypoints = sidLeg.waypointCollection;
//
//     t.true(_isEqual(fms.departureRunwayModel, initialRunwayFixture));
//     t.true(oldWaypoints[0].name === 'fixix');
//     t.true(oldWaypoints.length === 7);
//
//     fms.departureRunwayModel = nextRunwayFixture;
//     fms._regenerateSidLeg();
//
//     const newWaypoints = fms.legCollection[sidLegIndex].waypointCollection;
//
//     t.true(newWaypoints[0].name === 'jaker');
//     t.true(newWaypoints.length === 7);
//     t.true(replaceDepartureProcedureSpy.calledWithExactly(sidLeg.routeString, nextRunwayFixture));
// });
//
// ava('._regenerateSidLeg() returns early when there is no SID leg in the flightplan', (t) => {
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//     const replaceDepartureProcedureSpy = sinon.spy(fms, 'replaceDepartureProcedure');
//
//     fms.departureRunwayModel = airportModelFixture.getRunway('19R');
//     fms._regenerateSidLeg();
//
//     t.true(replaceDepartureProcedureSpy.notCalled);
// });
//
// ava('._regenerateStarLeg() creates a new STAR leg of identical route string for the currently assigned arrival runway', (t) => {
//     const initialRunwayFixture = airportModelFixture.getRunway('19L');
//     const nextRunwayFixture = airportModelFixture.getRunway('19R');
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(fullRouteStringMock);
//     const replaceArrivalProcedureSpy = sinon.spy(fms, 'replaceArrivalProcedure');
//     const starLegIndex = fms._findLegIndexForProcedureType(PROCEDURE_TYPE.STAR);
//     const starLeg = fms.legCollection[starLegIndex];
//     const oldWaypoints = starLeg.waypointCollection;
//
//     t.true(_isEqual(fms.arrivalRunwayModel, initialRunwayFixture));
//     t.true(oldWaypoints[12].name === 'lefft');
//     t.true(oldWaypoints.length === 13);
//
//     fms.arrivalRunwayModel = nextRunwayFixture;
//     fms._regenerateStarLeg();
//
//     const newWaypoints = fms.legCollection[starLegIndex].waypointCollection;
//
//     t.true(newWaypoints[12].name === 'right');
//     t.true(newWaypoints.length === 13);
//     t.true(replaceArrivalProcedureSpy.calledWithExactly(starLeg.routeString, nextRunwayFixture));
// });
//
// ava('._regenerateStarLeg() returns early when there is no STAR leg in the flightplan', (t) => {
//     const fms = buildFmsForAircraftInApronPhaseWithRouteString(sidRouteStringMock);
//     const replaceArrivalProcedureSpy = sinon.spy(fms, 'replaceArrivalProcedure');
//
//     fms.arrivalRunwayModel = airportModelFixture.getRunway('19R');
//     fms._regenerateStarLeg();
//
//     t.true(replaceArrivalProcedureSpy.notCalled);
// });
//
// ava('._updatePreviousRouteSegments() does not add a routeString to #_previousRouteSegments when it already exists in the list', (t) => {
//     const routeStringMock = 'COWBY';
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//     fms._previousRouteSegments[0] = routeStringMock;
//
//     fms._updatePreviousRouteSegments(routeStringMock);
//
//     t.true(fms._previousRouteSegments.length === 1);
// });
//
// ava('._updatePreviousRouteSegments() adds a routeString to #_previousRouteSegments when it does not already exist in the list', (t) => {
//     const routeStringMock = 'COWBY';
//     const fms = buildFmsForAircraftInCruisePhaseWithRouteString(fullRouteStringMock);
//
//     fms._updatePreviousRouteSegments(routeStringMock);
//
//     t.true(fms._previousRouteSegments.length === 1);
//     t.true(fms._previousRouteSegments[0] === routeStringMock);
// });
