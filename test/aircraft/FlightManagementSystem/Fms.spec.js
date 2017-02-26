import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';

import Fms from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/Fms';
import {
    navigationLibraryFixture,
    arrivalRouteModelFixture,
    departureRouteModelFixture
} from '../../fixtures/navigationLibraryFixtures';
import {
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK,
    AIRCRAFT_DEFINITION_MOCK
} from '../_mocks/aircraftMocks';

const complexRouteString = 'COWBY..BIKKR..DAG.KEPEC3.KLAS';
const simpleRouteString = ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK.route;
const arrivalProcedureRouteString = 'MLF.GRNPA1.KLAS';
const runwayAssignmentMock = '19L';
const isComplexRoute = true;
const isDeparture = true;
const invalidRouteModel = {
    routeCode: 'a.b.c',
    entry: 'a',
    procedure: 'b',
    exit: 'c'
};

function buildFmsMock(shouldUseComplexRoute = false) {
    let fms = new Fms(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, runwayAssignmentMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);

    if (shouldUseComplexRoute) {
        const aircraftPropsMock = Object.assign({}, ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, { route: complexRouteString });

        fms = new Fms(aircraftPropsMock, runwayAssignmentMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);
    }

    return fms;
}

function buildFmsMockForDeparture() {
    const fms = new Fms(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, runwayAssignmentMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);

    return fms;
}

ava('throws when called without parameters', (t) => {
    t.throws(() => new Fms());
});

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => buildFmsMock());
    t.notThrows(() => buildFmsMock(isComplexRoute));
});

ava('#currentWaypoint returns the first waypoint of the first leg in the #legCollection', (t) => {
    const fms = buildFmsMock();

    t.true(_isEqual(fms.legCollection[0].waypointCollection[0], fms.currentWaypoint));
});

ava('#currentRoute returns a routeString for a procedure route', (t) => {
    const expectedResult = 'dag.kepec3.klas';
    const fms = buildFmsMock();

    t.true(_isEqual(fms.currentRoute, expectedResult));
});

ava('#currentRoute returns a routeString for a complex route', (t) => {
    const expectedResult = 'cowby..bikkr..dag.kepec3.klas';
    const fms = buildFmsMock(isComplexRoute);

    t.true(_isEqual(fms.currentRoute, expectedResult));
});

ava('#flightPlan returns an empty string when no #_previousRouteSegments exist', (t) => {
    const expectedResult = {
        altitude: 41000,
        route: 'cowby..bikkr..dag.kepec3.klas'
    };
    const fms = buildFmsMock(isComplexRoute);

    t.true(_isEqual(fms.flightPlan, expectedResult));
});

ava('.init() calls ._buildLegCollection()', (t) => {
    const fms = buildFmsMock();
    const _buildLegCollectionSpy = sinon.spy(fms, '_buildLegCollection');

    fms.init(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);

    t.true(_buildLegCollectionSpy.calledWithExactly(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK.route));
});

ava('.prependLeg() adds a leg to the beginning of the #legCollection when passed a directRouteString', (t) => {
    const fms = buildFmsMock();

    fms.prependLeg('BIKKR');

    t.true(fms.currentLeg.routeString === 'bikkr');
});

ava('.prependLeg() adds a leg to the beginning of the #legCollection when passed a procedureRouteString', (t) => {
    const fms = buildFmsMock();
    fms.legCollection = [];

    fms.prependLeg('DAG.KEPEC3.KLAS');

    t.true(fms.legCollection.length === 1);
    t.true(fms.legCollection[0].waypointCollection.length === 12);
});

ava('.hasNextWaypoint() returns true if there is a next waypoint', (t) => {
    const fms = buildFmsMock();

    t.true(fms.hasNextWaypoint());
});

ava('.hasNextWaypoint() returns true when the nextWaypoint is part of the nextLeg', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    t.true(fms.hasNextWaypoint());
});

ava('.hasNextWaypoint() returns false when no nextWaypoint exists', (t) => {
    const fms = buildFmsMock();
    fms.skipToWaypoint('prino');

    t.false(fms.hasNextWaypoint());
});

ava('.nextWaypoint() adds current LegModel#routeString to _previousRouteSegments before moving to next waypoint', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    fms.nextWaypoint();

    t.true(fms._previousRouteSegments[0] === 'cowby');
});

ava('.nextWaypoint() calls ._moveToNextLeg() if the current waypointCollection.length === 0', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const _moveToNextLegSpy = sinon.spy(fms, '_moveToNextLeg');
    fms.legCollection[0].waypointCollection = [];

    fms.nextWaypoint();

    t.true(_moveToNextLegSpy.calledOnce);
});

ava('.nextWaypoint() calls ._moveToNextWaypointInLeg() if the current waypointCollection.length > 1', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const _moveToNextWaypointInLegSpy = sinon.spy(fms, '_moveToNextWaypointInLeg');

    fms.nextWaypoint();

    t.true(_moveToNextWaypointInLegSpy.calledOnce);
});

ava('.nextWaypoint() removes the first LegModel from legCollection when the first Leg has no waypoints', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const length = fms.legCollection.length;
    fms.legCollection[0].waypointCollection = [];

    fms.nextWaypoint();

    t.true(fms.legCollection.length === length - 1);
});

ava('.replaceCurrentFlightPlan() calls ._destroyLegCollection()', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const _destroyLegCollectionSpy = sinon.spy(fms, '_destroyLegCollection');

    fms.replaceCurrentFlightPlan(simpleRouteString);

    t.true(_destroyLegCollectionSpy.calledOnce);
});

ava('.replaceCurrentFlightPlan() calls ._buildLegCollection()', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const _buildLegCollectionSpy = sinon.spy(fms, '_buildLegCollection');

    fms.replaceCurrentFlightPlan(simpleRouteString);

    t.true(_buildLegCollectionSpy.calledWithExactly(simpleRouteString));
});

ava('.replaceCurrentFlightPlan() creates new LegModels from a routeString and adds them to the #legCollection', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    fms.replaceCurrentFlightPlan(simpleRouteString);

    t.true(fms.currentLeg._isProcedure);
    t.true(fms.legCollection.length === 1);
    t.true(fms.legCollection[0].waypointCollection.length === 12);
});

ava('.skipToWaypoint() calls ._collectRouteStringsForLegsToBeDropped()', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const _collectRouteStringsForLegsToBeDroppedSpy = sinon.spy(fms, '_collectRouteStringsForLegsToBeDropped');

    fms.skipToWaypoint('DAG');

    t.true(_collectRouteStringsForLegsToBeDroppedSpy.calledOnce);
});

ava('.skipToWaypoint() removes all the legs and waypoints in front of the waypoint to skip to', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    fms.skipToWaypoint('DAG');

    t.true(fms.currentLeg.routeString === 'dag.kepec3.klas');
});

ava('.skipToWaypoint() does nothing is the waypoint to skip to is the #currentWaypoint', (t) => {
    const waypointNameMock = 'cowby';
    const fms = buildFmsMock(isComplexRoute);

    fms.skipToWaypoint(waypointNameMock);

    t.true(fms.currentLeg.routeString === waypointNameMock);
});

ava('.getNextWaypointPosition() returns the position array for the next Waypoint in the collection', (t) => {
    const expectedResult = [-87.64380662924125, -129.57471627889475];
    const fms = buildFmsMock();
    const result = fms.getNextWaypointPosition();

    t.true(_isEqual(result, expectedResult));
});

ava.skip('.replaceDepartureProcedure() returns early if the nextRouteString matches the current route', (t) => {
    const nextRouteStringMock = 'KLAS.TRALR6.MLF';
    const routeStringMock = DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK.route;
    const fms = buildFmsMockForDeparture();

    fms.replaceDepartureProcedure(routeStringMock, runwayAssignmentMock);
});

ava('.replaceDepartureProcedure() calls prepend leg when no departure procedure exists', (t) => {
    const nextRouteStringMock = 'KLAS.TRALR6.MLF';
    const fms = buildFmsMockForDeparture();
    const prependLegSpy = sinon.spy(fms, 'prependLeg');

    fms._destroyLegCollection();
    fms.replaceDepartureProcedure(nextRouteStringMock, runwayAssignmentMock);

    t.true(prependLegSpy.calledOnce);
});

ava('.replaceDepartureProcedure() returns undefined after success', (t) => {
    const nextRouteStringMock = 'KLAS.TRALR6.MLF';
    const fms = buildFmsMockForDeparture();
    const result = fms.replaceDepartureProcedure(nextRouteStringMock, runwayAssignmentMock);

    t.true(typeof result === 'undefined');
});

ava('.replaceDepartureProcedure() replaces the currentLeg with the new route', (t) => {
    const nextRouteStringMock = 'KLAS.TRALR6.MLF';
    const fms = buildFmsMockForDeparture();

    t.false(fms.currentLeg.routeString === nextRouteStringMock.toLowerCase());

    fms.replaceDepartureProcedure(nextRouteStringMock, runwayAssignmentMock);

    t.true(fms.currentLeg.routeString === nextRouteStringMock.toLowerCase());
});

ava.skip('.replaceArrivalProcedure() returns early if the nextRouteString matches the current route', (t) => {
    const routeStringMock = ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK.route;
    const fms = buildFmsMock();

    fms.replaceArrivalProcedure(routeStringMock, runwayAssignmentMock);
});

ava('.replaceArrivalProcedure() calls prepend leg when no departure procedure exists', (t) => {
    const fms = buildFmsMock();
    const prependLegSpy = sinon.spy(fms, 'prependLeg');

    fms._destroyLegCollection();
    fms.replaceArrivalProcedure(arrivalProcedureRouteString, runwayAssignmentMock);

    t.true(prependLegSpy.calledOnce);
});

ava('.replaceArrivalProcedure() returns undefined after success', (t) => {
    const fms = buildFmsMock();
    const result = fms.replaceArrivalProcedure(arrivalProcedureRouteString, runwayAssignmentMock);

    t.true(typeof result === 'undefined');
});

ava('.replaceArrivalProcedure() replaces the currentLeg with the new route', (t) => {
    const fms = buildFmsMock();

    t.false(fms.currentLeg.routeString === arrivalProcedureRouteString.toLowerCase());

    fms.replaceArrivalProcedure(arrivalProcedureRouteString, runwayAssignmentMock);

    t.true(fms.currentLeg.routeString === arrivalProcedureRouteString.toLowerCase());
});

ava('.isValidProcedureRoute() returns false when passed an invalid route', (t) => {
    const fms = buildFmsMock();

    t.false(fms.isValidProcedureRoute(invalidRouteModel, runwayAssignmentMock, 'arrival'));
    t.false(fms.isValidProcedureRoute(invalidRouteModel, runwayAssignmentMock, 'departure'));
});

ava('.isValidProcedureRoute() returns true if the passed route already exists within the #legCollection', (t) => {
    const procedureRouteStringMock = { routeCode: 'dag.kepec3.klas' };
    const fms = buildFmsMock();
    const result = fms.isValidProcedureRoute(procedureRouteStringMock, runwayAssignmentMock, 'arrival');

    t.true(result);
});

ava('.isValidProcedureRoute() returns true if the passed route is a valid arrival route', (t) => {
    const fms = buildFmsMock();
    const result = fms.isValidProcedureRoute(arrivalRouteModelFixture, runwayAssignmentMock, 'arrival');

    t.true(result);
});

ava('.isValidProcedureRoute() returns true if the passed route is a valid departure route', (t) => {
    const fms = buildFmsMock();
    const result = fms.isValidProcedureRoute(departureRouteModelFixture, runwayAssignmentMock, 'departure');

    t.true(result);
});

ava.todo('.hasNextWaypoint()');
ava.todo('.hasLegWithRouteString()');

ava('._buildLegCollection() returns an array of LegModels', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    t.true(fms.legCollection.length === 3);
});

ava('._findLegAndWaypointIndexForWaypointName() returns an object with keys legIndex and waypointIndex', (t) => {
    const expectedResult = {
        legIndex: 2,
        waypointIndex: 0
    };
    const fms = buildFmsMock(isComplexRoute);
    const result = fms._findLegAndWaypointIndexForWaypointName('dag');

    t.true(_isEqual(result, expectedResult));
});

ava.todo('._findLegIndexForProcedureType()');

ava('._destroyLegCollection() clears the #legCollection', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    fms._destroyLegCollection();

    t.true(fms.legCollection.length === 0);
});

ava.todo('._replaceLegAtIndexWithRouteString()');
