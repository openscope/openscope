import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';

import Fms from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/Fms';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import {
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK,
    AIRCRAFT_DEFINITION_MOCK
} from '../_mocks/aircraftMocks';

const initialRunwayAssignmentMock = '19L';
const isComplexRoute = true;

function buildFmsMock(shouldUseComplexRoute = false) {
    if (shouldUseComplexRoute) {
        const complexRouteString = 'COWBY..BIKKR..DAG.KEPEC3.KLAS';
        const aircraftPropsMock = Object.assign({}, ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, { route: complexRouteString });

        return new Fms(aircraftPropsMock, initialRunwayAssignmentMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);
    }

    return new Fms(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, initialRunwayAssignmentMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);
}

function buildFmsMockForDeparture() {
    const fms = buildFmsMock();
    fms.updateModesForDeparture();

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

ava('.init() calls ._buildInitialLegCollection()', (t) => {
    const fms = buildFmsMock();
    const _buildInitialLegCollectionSpy = sinon.spy(fms, '_buildInitialLegCollection');

    fms.init(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);

    t.true(_buildInitialLegCollectionSpy.calledWithExactly(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK));
});

ava('.getAltitude() returns the cruise altitude for an aircraft type when no altitudeRestriction or modeController altitude is present', (t) => {
    const expectedResult = 41000;
    const fms = buildFmsMockForDeparture();
    const result = fms.getAltitude();

    t.true(result === expectedResult);
});

ava('.getAltitude() returns the waypoint altitudeRestriction when it doesnt equal -1', (t) => {
    const altitudeRestrictionMock = 10000;
    const fms = buildFmsMockForDeparture();
    fms.currentWaypoint.altitudeRestriction = altitudeRestrictionMock;

    const result = fms.getAltitude();

    t.true(result === altitudeRestrictionMock);
});

ava('.getAltitude() returns the modeController.altitude when _modeController.altitudeMode === hold', (t) => {
    const waypointSpeedRestrictionMock = 10000;
    const mcpAltitudeRestrictionMock = 13000;
    const fms = buildFmsMockForDeparture();
    fms.currentWaypoint.altitudeRestriction = waypointSpeedRestrictionMock;
    fms._modeController.altitudeMode = 'HOLD';
    fms._modeController.altitude = mcpAltitudeRestrictionMock;

    const result = fms.getAltitude();

    t.false(result === waypointSpeedRestrictionMock);
    t.true(result === mcpAltitudeRestrictionMock);
});

ava('.getHeading() returns the waypoint headingRestriction when it doesnt equal -999', (t) => {
    const invalidHeadingMock = -999;
    const fms = buildFmsMockForDeparture();

    const result = fms.getHeading();

    t.true(result === invalidHeadingMock);
});

ava('.getHeading() returns the modeController.altitude when _modeController.altitudeMode === hold', (t) => {
    const headingRestrictionMock = 4.23;
    const mcpHeadingRestrictionMock = 3.42;
    const fms = buildFmsMockForDeparture();
    fms._modeController.headingMode = 'HOLD';
    fms._modeController.heading = mcpHeadingRestrictionMock;

    const result = fms.getHeading();

    t.false(result === headingRestrictionMock);
    t.true(result === mcpHeadingRestrictionMock);
});

ava('.getSpeed() returns the cruise speed for an aircraft type when no speedRestriction or modeController speed is present', (t) => {
    const expectedResult = 460;
    const fms = buildFmsMockForDeparture();
    const result = fms.getSpeed();

    t.true(result === expectedResult);
});

ava('.getSpeed() returns the waypoint speedRestriction when it doesnt equal -1', (t) => {
    const speedRestrictionMock = 230;
    const fms = buildFmsMockForDeparture();
    fms.currentWaypoint.speedRestriction = speedRestrictionMock;

    const result = fms.getSpeed();

    t.true(result === speedRestrictionMock);
});

ava('.getSpeed() returns the modeController.speed when _modeController.speedMode === hold', (t) => {
    const waypointSpeedRestrictionMock = 230;
    const mcpSpeedRestrictionMock = 200;
    const fms = buildFmsMockForDeparture();
    fms.currentWaypoint.speedRestriction = waypointSpeedRestrictionMock;
    fms._modeController.speedMode = 'HOLD';
    fms._modeController.speed = mcpSpeedRestrictionMock;

    const result = fms.getSpeed();

    t.false(result === waypointSpeedRestrictionMock);
    t.true(result === mcpSpeedRestrictionMock);
});

ava('.addLegToBeginning() adds a leg to the beginning of the #legCollection when passed a directRouteString', (t) => {
    const fms = buildFmsMock();

    fms.addLegToBeginning('BIKKR');

    t.true(fms.currentLeg.routeString === 'bikkr');
});

ava('.addLegToBeginning() adds a leg to the beginning of the #legCollection when passed a procedureRouteString', (t) => {
    const fms = buildFmsMock();
    fms.legCollection = [];

    fms.addLegToBeginning('DAG.KEPEC3.KLAS');

    t.true(fms.legCollection.length === 1);
    t.true(fms.legCollection[0].waypointCollection.length === 12);
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

ava('.skipToWaypoint() removes all the legs and waypoints in front of the waypoint to skip to', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    fms.skipToWaypoint('DAG');

    t.true(fms.currentLeg.routeString === 'dag.kepec3.klas');
});

ava('._buildInitialLegCollection() returns an array of LegModels', (t) => {
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
