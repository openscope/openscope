import ava from 'ava';
import sinon from 'sinon';
import _every from 'lodash/every';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _map from 'lodash/map';
import LegModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/LegModel';
import RouteModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/RouteModel';
import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';
import { createNavigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import { createAirportModelFixture } from '../../fixtures/airportFixtures';

// mocks
const complexRouteStringMock = 'KLAS07R.BOACH6.TNP..OAL..MLF..PGS.TYSSN4.KLAS07R';
const singleFixRouteStringMock = 'DVC';
const singleDirectSegmentRouteStringMock = 'OAL..MLF';
const multiDirectSegmentRouteStringMock = 'OAL..MLF..PGS';
const singleSidProcedureSegmentRouteStringMock = 'KLAS07R.BOACH6.TNP';
const singleStarProcedureSegmentRouteStringMock = 'TNP.KEPEC3.KLAS07R';
const multiProcedureSegmentRouteStringMock = 'KLAS07R.BOACH6.TNP.KEPEC3.KLAS07R';
const nightmareRouteStringMock = 'TNP.KEPEC3.KLAS07R.BOACH6.TNP..OAL..PGS.TYSSN4.KLAS07R.BOACH6.TNP..GUP..IGM';

// fixtures
let navigationLibraryFixture;

ava.beforeEach(() => {
    navigationLibraryFixture = createNavigationLibraryFixture();
});

ava.afterEach(() => {
    navigationLibraryFixture.reset();
});

ava('throws when instantiated without valid parameters', (t) => {
    t.throws(() => new RouteModel());
    t.throws(() => new RouteModel(navigationLibraryFixture));
    t.throws(() => new RouteModel(complexRouteStringMock, navigationLibraryFixture));
    t.throws(() => new RouteModel(navigationLibraryFixture, 3));
});

ava('throws when instantiated with route string containing spaces', (t) => {
    t.throws(() => new RouteModel(navigationLibraryFixture, 'KLAS07R BOACH6 TNP'));
});

ava('does not throw when instantiated with valid parameters', (t) => {
    t.notThrows(() => new RouteModel(navigationLibraryFixture, complexRouteStringMock));
});

ava('instantiates correctly when provided valid single-fix route string', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleFixRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 1);
    t.true(model._navigationLibrary === navigationLibraryFixture);
});

ava('instantiates correctly when provided valid single-segment direct route string', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleDirectSegmentRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 2);
    t.true(model._navigationLibrary === navigationLibraryFixture);
});

ava('instantiates correctly when provided valid single-segment procedural route string', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleSidProcedureSegmentRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 1);
    t.true(model._legCollection[0]._waypointCollection.length === 8);
    t.true(model._navigationLibrary === navigationLibraryFixture);
});

ava('instantiates correctly when provided valid multi-segment direct route string', (t) => {
    const model = new RouteModel(navigationLibraryFixture, multiDirectSegmentRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 3);
    t.true(model._navigationLibrary === navigationLibraryFixture);
});

ava('instantiates correctly when provided valid multi-segment procedural route string', (t) => {
    const model = new RouteModel(navigationLibraryFixture, multiProcedureSegmentRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 2);
    t.true(model._legCollection[0]._waypointCollection.length === 8);
    t.true(model._legCollection[1]._waypointCollection.length === 13);
    t.true(model._navigationLibrary === navigationLibraryFixture);
});

ava('instantiates correctly when provided valid multi-segment mixed route string', (t) => {
    const model = new RouteModel(navigationLibraryFixture, complexRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 4);
    t.true(model._legCollection[0]._waypointCollection.length === 8);
    t.true(model._legCollection[1]._waypointCollection.length === 1);
    t.true(model._legCollection[2]._waypointCollection.length === 1);
    t.true(model._legCollection[3]._waypointCollection.length === 6);
    t.true(model._navigationLibrary === navigationLibraryFixture);
});

ava('#currentLeg throws when #_legCollection does not contain at least one leg', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleFixRouteStringMock);

    model._legCollection = [];

    t.throws(() => model.currentLeg);
});

ava('#currentLeg returns the first element of the #_legCollection', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleFixRouteStringMock);
    const result = model.currentLeg;

    t.true(result instanceof LegModel);
    t.true(result.routeString === singleFixRouteStringMock);
});

ava('#currentWaypoint returns the #currentWaypoint on the #currentLeg', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleFixRouteStringMock);
    const expectedResult = model.currentLeg.currentWaypoint;
    const result = model.currentWaypoint;

    t.deepEqual(result, expectedResult);
});

ava('#nextLeg returns null when there are no more legs after the current leg', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleFixRouteStringMock);
    const result = model.nextLeg;

    t.true(result === null);
});

ava('#nextLeg returns the second element of the #_legCollection when it exists', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleDirectSegmentRouteStringMock);
    const result = model.nextLeg;

    t.true(result instanceof LegModel);
    t.true(result.routeString === 'MLF');
});

ava('#nextWaypoint returns null when there are no more waypoints after the current waypoint', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleFixRouteStringMock);
    const result = model.nextWaypoint;

    t.true(result === null);
});

ava('#nextWaypoint returns next waypoint of the current leg when the current leg has another waypoint', (t) => {
    const model = new RouteModel(navigationLibraryFixture, nightmareRouteStringMock);
    const result = model.nextWaypoint;

    t.true(result instanceof WaypointModel);
    t.true(result.name === 'JOTNU');
});

ava('#nextWaypoint returns the first waypoint of the next leg when a nextLeg exists and the current leg does not contain more waypoints', (t) => {
    const model = new RouteModel(navigationLibraryFixture, nightmareRouteStringMock);

    model.skipToWaypointName('PRINO');

    const result = model.nextWaypoint;

    t.true(result instanceof WaypointModel);
    t.true(result.name === 'JESJI');
});

ava('#waypoints returns an array containing the `WaypointModel`s of all legs', (t) => {
    const model = new RouteModel(navigationLibraryFixture, complexRouteStringMock);
    const result = model.waypoints;
    const expectedWaypointNames = ['JESJI', 'BAKRR', 'MINEY', 'HITME', 'BOACH', 'ZELMA',
        'JOTNU', 'TNP', 'OAL', 'MLF', 'PGS', 'CEJAY', 'KADDY', 'TYSSN', 'SUZSI', 'PRINO'
    ];
    const waypointNames = _map(result, (waypointModel) => waypointModel.name);

    t.true(_isArray(result));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava.todo('.absorbRouteModel()');

ava('.calculateSpawnHeading() returns bearing between route\'s first and second waypoints', (t) => {
    const model = new RouteModel(navigationLibraryFixture, 'JESJI..BAKRR');
    const expectedResult = 1.3415936051582544;
    const result = model.calculateSpawnHeading();

    t.true(result === expectedResult);
});

ava('.getAltitudeRestrictedWaypoints() returns an array of WaypointModels that have altitude restrictions', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleSidProcedureSegmentRouteStringMock);
    const result = model.getAltitudeRestrictedWaypoints();
    const expectedWaypointNames = ['BAKRR', 'MINEY', 'BOACH'];
    const waypointNames = result.map((waypoint) => waypoint.name);
    const allWaypointsHaveRestrictions = _every(result, (waypoint) => waypoint.hasAltitudeRestriction);

    t.deepEqual(waypointNames, expectedWaypointNames);
    t.true(allWaypointsHaveRestrictions);
});

ava('.getFullRouteString() returns a route string for the entire route, including past legs, in dot notation', (t) => {
    const model = new RouteModel(navigationLibraryFixture, nightmareRouteStringMock);

    model.skipToWaypointName('GUP');

    const result = model.getFullRouteString();

    t.true(result === nightmareRouteStringMock);
});

ava('.getFullRouteStringWithSpaces() returns a route string for the entire route, including past legs, separated by spaces', (t) => {
    const model = new RouteModel(navigationLibraryFixture, nightmareRouteStringMock);

    model.skipToWaypointName('GUP');

    const expectedResult = 'TNP KEPEC3 KLAS07R BOACH6 TNP OAL PGS TYSSN4 KLAS07R BOACH6 TNP GUP IGM';
    const result = model.getFullRouteStringWithSpaces();

    t.true(result === expectedResult);
});

ava('.getRouteString() returns a route string for the remaining legs only, in dot notation', (t) => {
    const model = new RouteModel(navigationLibraryFixture, nightmareRouteStringMock);

    model.skipToWaypointName('GUP');

    const result = model.getRouteString();

    t.true(result === 'GUP..IGM');
});

ava('.getRouteStringWithSpaces() returns a route string for the remaining legs only, separated by spaces', (t) => {
    const model = new RouteModel(navigationLibraryFixture, nightmareRouteStringMock);

    model.skipToWaypointName('GUP');

    const result = model.getRouteStringWithSpaces();

    t.true(result === 'GUP IGM');
});

ava('.getBottomAltitude() returns the lowest bottom altitude of any leg in the #_legCollection', (t) => {
    const model = new RouteModel(navigationLibraryFixture, 'DVC.GRNPA1.KLAS07L..BETHL.GRNPA2.KLAS07L');
    const expectedResult = 7000;
    const result = model.getBottomAltitude();

    t.true(result === expectedResult);
});

ava('.getTopAltitude() returns the highest top altitude of any leg in the #_legCollection', (t) => {
    const model = new RouteModel(navigationLibraryFixture, 'KLAS25R.SHEAD9.KENNO');
    const expectedResult = 11000;
    const result = model.getTopAltitude();

    t.true(result === expectedResult);
});

ava('.hasNextLeg() returns false when the current leg is the last in the #_legCollection', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleSidProcedureSegmentRouteStringMock);
    const result = model.hasNextLeg();

    t.false(result);
});

ava('.hasNextLeg() returns true when there is a leg in the #_legCollection after the current leg', (t) => {
    const model = new RouteModel(navigationLibraryFixture, nightmareRouteStringMock);
    const result = model.hasNextLeg();

    t.true(result);
});

ava('.hasNextWaypoint() returns false when we are at the last waypoint of the last leg', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleFixRouteStringMock);
    const result = model.hasNextWaypoint();

    t.false(result);
});

ava('.hasNextWaypoint() returns true when the current leg contains more waypoints', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleSidProcedureSegmentRouteStringMock);
    const result = model.hasNextWaypoint();

    t.true(result);
});

ava('.hasNextWaypoint() returns true when we are at the last waypoint of a leg that is not the last leg', (t) => {
    const model = new RouteModel(navigationLibraryFixture, multiDirectSegmentRouteStringMock);
    const result = model.hasNextWaypoint();

    t.true(result);
});

ava('.hasWaypointName() returns false when the specified waypoint is not in the route', (t) => {
    const model = new RouteModel(navigationLibraryFixture, 'DVC');
    const result = model.hasWaypointName('MLF');

    t.false(result);
});

ava('.hasWaypointName() returns true when the specified waypoint is in the route', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleSidProcedureSegmentRouteStringMock);
    const result = model.hasWaypointName('ZELMA');

    t.true(result);
});

ava('.moveToNextWaypoint() calls #currentLeg.moveToNextWaypoint() when the current leg contains more waypoints', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleSidProcedureSegmentRouteStringMock);
    const currentLegMoveToNextWaypointSpy = sinon.spy(model.currentLeg, 'moveToNextWaypoint');

    model.moveToNextWaypoint();

    t.true(currentLegMoveToNextWaypointSpy.calledWithExactly());
});

ava('.moveToNextWaypoint() calls .moveToNextLeg() when the current leg is at its last waypoint', (t) => {
    const model = new RouteModel(navigationLibraryFixture, multiDirectSegmentRouteStringMock);
    const moveToNextLegSpy = sinon.spy(model, 'moveToNextLeg');

    model.moveToNextWaypoint();

    t.true(moveToNextLegSpy.calledWithExactly());
});

ava('.replaceArrivalProcedure() returns false when route string does not yield a valid leg', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleFixRouteStringMock);
    const result = model.replaceArrivalProcedure('gobbledeegook');

    t.false(result);
    t.true(model.waypoints.length === 1);
});

ava('.replaceArrivalProcedure() appends specified STAR leg as the new last leg when no STAR leg previously existed', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleFixRouteStringMock);
    const result = model.replaceArrivalProcedure(singleStarProcedureSegmentRouteStringMock);

    t.true(result);
    t.true(model.getRouteString() === `${singleFixRouteStringMock}..${singleStarProcedureSegmentRouteStringMock}`);
});

ava('.replaceArrivalProcedure() replaces STAR leg with a new one when the route already has a STAR leg', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleStarProcedureSegmentRouteStringMock);
    const differentStarRouteStringMock = 'TNP.KEPEC3.KLAS25L';
    const result = model.replaceArrivalProcedure(differentStarRouteStringMock);

    t.true(result);
    t.true(model.getRouteString() === differentStarRouteStringMock);
});

ava('.replaceDepartureProcedure() returns false when route string does not yield a valid leg', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleFixRouteStringMock);
    const result = model.replaceDepartureProcedure('gobbledeegook');

    t.false(result);
    t.true(model.waypoints.length === 1);
});

ava('.replaceDepartureProcedure() appends specified SID leg as the new first leg when no SID leg previously existed', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleFixRouteStringMock);
    const result = model.replaceDepartureProcedure(singleSidProcedureSegmentRouteStringMock);

    t.true(result);
    t.true(model.getRouteString() === `${singleSidProcedureSegmentRouteStringMock}..${singleFixRouteStringMock}`);
});

ava('.replaceDepartureProcedure() replaces SID leg with a new one when the route already has a SID leg', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleSidProcedureSegmentRouteStringMock);
    const differentSidRouteStringMock = 'KLAS25L.BOACH6.TNP';
    const result = model.replaceDepartureProcedure(differentSidRouteStringMock);

    t.true(result);
    t.true(model.getRouteString() === differentSidRouteStringMock);
});

ava('.moveToNextLeg() returns early when we are at the last leg in the route', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleSidProcedureSegmentRouteStringMock);

    model.moveToNextLeg();

    t.true(_isEmpty(model._previousLegCollection));
    t.true(model._legCollection.length === 1);
});

ava('.moveToNextLeg() moves the #currentLeg from the #_legCollection to the #_previousLegCollection', (t) => {
    const model = new RouteModel(navigationLibraryFixture, 'OAL..TNP.KEPEC3.KLAS07R');

    t.true(model._previousLegCollection.length === 0);
    t.true(model._legCollection.length === 2);

    model.moveToNextLeg();

    t.true(model._previousLegCollection.length === 1);
    t.true(model._previousLegCollection[0].routeString === 'OAL');
    t.true(model._legCollection.length === 1);
    t.true(model._legCollection[0].routeString === 'TNP.KEPEC3.KLAS07R');
});

ava('.skipToWaypointName() returns false when the specified waypoint is not in the route', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleStarProcedureSegmentRouteStringMock);
    const result = model.skipToWaypointName('gobbledeegook');

    t.false(result);
    t.true(model._legCollection.length === 1);
});

ava('.skipToWaypointName() calls #currentLeg.skipToWaypointName() when current leg contains the specified waypoint', (t) => {
    const model = new RouteModel(navigationLibraryFixture, singleStarProcedureSegmentRouteStringMock);
    const currentLegSkipToWaypointNameSpy = sinon.spy(model.currentLeg, 'skipToWaypointName');
    const waypointNameToSkipTo = 'KEPEC';

    model.skipToWaypointName(waypointNameToSkipTo);

    t.true(currentLegSkipToWaypointNameSpy.calledWithExactly(waypointNameToSkipTo));
});

ava('.skipToWaypointName() moves appropriate legs/waypoints to previous collections when specified waypoint exists in a future leg', (t) => {
    const model = new RouteModel(navigationLibraryFixture, 'OAL..TNP.KEPEC3.KLAS07R');

    model.skipToWaypointName('KEPEC');

    t.true(model._previousLegCollection.length === 1);
    t.true(model._previousLegCollection[0].routeString === 'OAL');
    t.true(model._legCollection.length === 1);
    t.true(model._legCollection[0].routeString === 'TNP.KEPEC3.KLAS07R');
    t.true(model._legCollection[0]._waypointCollection.length === 8);
    t.true(model._legCollection[0]._previousWaypointCollection.length === 5);
});

ava('.updateSidLegForDepartureRunwayModel() returns early when the route contains no SID leg to update', (t) => {
    const routeModel = new RouteModel(navigationLibraryFixture, 'OAL..TNP');
    const airportModel = createAirportModelFixture();
    const nextRunwayName = '25L';
    const nextRunwayModel = airportModel.getRunway(nextRunwayName);
    const sidLegUpdateSidRunwaySpy = sinon.spy(routeModel._legCollection[0], 'updateSidLegForDepartureRunwayModel');

    routeModel.updateSidLegForDepartureRunwayModel(nextRunwayModel);

    t.true(sidLegUpdateSidRunwaySpy.notCalled);
});

ava('.updateSidLegForDepartureRunwayModel() calls LegModel.updateStarLegForArrivalRunwayModel() on the SID leg', (t) => {
    const routeModel = new RouteModel(navigationLibraryFixture, 'KLAS07R.BOACH6.TNP');
    const airportModel = createAirportModelFixture();
    const nextRunwayName = '25L';
    const nextRunwayModel = airportModel.getRunway(nextRunwayName);
    const sidLegUpdateSidRunwaySpy = sinon.spy(routeModel._legCollection[0], 'updateSidLegForDepartureRunwayModel');

    routeModel.updateSidLegForDepartureRunwayModel(nextRunwayModel);

    t.true(sidLegUpdateSidRunwaySpy.calledWithExactly(nextRunwayModel));
});

ava('.updateStarLegForArrivalRunwayModel() returns early when the route contains no STAR leg to update', (t) => {
    const routeModel = new RouteModel(navigationLibraryFixture, 'OAL..TNP');
    const airportModel = createAirportModelFixture();
    const nextRunwayName = '25L';
    const nextRunwayModel = airportModel.getRunway(nextRunwayName);
    const starLegUpdateSidRunwaySpy = sinon.spy(routeModel._legCollection[0], 'updateStarLegForArrivalRunwayModel');

    routeModel.updateStarLegForArrivalRunwayModel(nextRunwayModel);

    t.true(starLegUpdateSidRunwaySpy.notCalled);
});

ava('.updateStarLegForArrivalRunwayModel() calls LegModel.updateStarLegForArrivalRunwayModel() on the STAR leg', (t) => {
    const routeModel = new RouteModel(navigationLibraryFixture, 'TNP.KEPEC3.KLAS07R');
    const airportModel = createAirportModelFixture();
    const nextRunwayName = '25L';
    const nextRunwayModel = airportModel.getRunway(nextRunwayName);
    const starLegUpdateSidRunwaySpy = sinon.spy(routeModel._legCollection[0], 'updateStarLegForArrivalRunwayModel');

    routeModel.updateStarLegForArrivalRunwayModel(nextRunwayModel);

    t.true(starLegUpdateSidRunwaySpy.calledWithExactly(nextRunwayModel));
});

ava('.reset() clears #_legCollection', (t) => {
    const model = new RouteModel(navigationLibraryFixture, complexRouteStringMock);

    model.reset();

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 0);
});
