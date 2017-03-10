import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';

import Fms from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/Fms';
import LegModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/LegModel';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import {
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK,
    AIRCRAFT_DEFINITION_MOCK,
    HOLD_WAYPOINT_MOCK
} from '../_mocks/aircraftMocks';

const directRouteString = 'COWBY';
const complexRouteString = 'COWBY..BIKKR..DAG.KEPEC3.KLAS';
const complexRouteStringWithHold = 'COWBY..@BIKKR..DAG.KEPEC3.KLAS';
const simpleRouteString = ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK.route;
const arrivalProcedureRouteStringMock = 'MLF.GRNPA1.KLAS';
const departureProcedureRouteStringMock = 'KLAS.COWBY6.DRK';
const runwayAssignmentMock = '19L';
const isComplexRoute = true;

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

// TODO: these next two skipped tests need a LegModelFixturewhich does not yet exist
ava.skip('.prependLeg() adds a leg to the beginning of the #legCollection when passed a directRouteString', (t) => {
    const fms = buildFmsMock();

    fms.prependLeg('BIKKR');

    t.true(fms.currentLeg.routeString === 'bikkr');
});

ava.skip('.prependLeg() adds a leg to the beginning of the #legCollection when passed a procedureRouteString', (t) => {
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

ava('.createLegWithHoldingPattern() calls _createLegWithHoldWaypoint() when holdRouteSegment is GPS', (t) => {
    const inboundHeadingMock = -1.62476729292438;
    const turnDirectionMock = 'left';
    const legLengthMock = '2min';
    const holdRouteSegmentMock = 'GPS';
    const holdFixLocationMock = [113.4636606631233, 6.12969620221002];
    const fms = buildFmsMock(isComplexRoute);
    const _createLegWithHoldWaypointSpy = sinon.spy(fms, '_createLegWithHoldWaypoint');

    fms.createLegWithHoldingPattern(inboundHeadingMock, turnDirectionMock, legLengthMock, holdRouteSegmentMock, holdFixLocationMock);

    t.true(_createLegWithHoldWaypointSpy.calledOnce);
});

ava('.createLegWithHoldingPattern() prepends LegCollection with hold Waypoint when holdRouteSegment is GPS', (t) => {
    const inboundHeadingMock = -1.62476729292438;
    const turnDirectionMock = 'left';
    const legLengthMock = '2min';
    const holdRouteSegmentMock = 'GPS';
    const holdFixLocationMock = [113.4636606631233, 6.12969620221002];
    const fms = buildFmsMock(isComplexRoute);

    fms.createLegWithHoldingPattern(inboundHeadingMock, turnDirectionMock, legLengthMock, holdRouteSegmentMock, holdFixLocationMock);

    t.true(fms.currentWaypoint._turnDirection === 'left');
    t.true(fms.currentWaypoint._legLength === '2min');
    t.true(fms.currentWaypoint.name === 'gps');
    t.true(_isEqual(fms.currentWaypoint.position, holdFixLocationMock));
});

ava('.createLegWithHoldingPattern() calls ._findLegAndWaypointIndexForWaypointName() when holdRouteSegment is a FixName', (t) => {
    const inboundHeadingMock = -1.62476729292438;
    const turnDirection = 'left';
    const legLength = '2min';
    const holdRouteSegment = '@BIKKR';
    const holdFixLocation = [113.4636606631233, 6.12969620221002];
    const fms = buildFmsMock(isComplexRoute);
    const _findLegAndWaypointIndexForWaypointNameSpy = sinon.spy(fms, '_findLegAndWaypointIndexForWaypointName');

    fms.createLegWithHoldingPattern(inboundHeadingMock, turnDirection, legLength, holdRouteSegment, holdFixLocation);

    t.true(_findLegAndWaypointIndexForWaypointNameSpy.calledWithExactly('BIKKR'));
});

ava('.createLegWithHoldingPattern() skips to a Waypoint and adds hold props to existing Waypoint', (t) => {
    const inboundHeadingMock = -1.62476729292438;
    const turnDirectionMock = 'left';
    const legLengthMock = '2min';
    const holdRouteSegmentMock = '@BIKKR';
    const holdFixLocationMock = [113.4636606631233, 6.12969620221002];
    const fms = buildFmsMock(isComplexRoute);

    fms.createLegWithHoldingPattern(inboundHeadingMock, turnDirectionMock, legLengthMock, holdRouteSegmentMock, holdFixLocationMock);

    t.true(fms.currentWaypoint.name === 'bikkr');
});

ava('.createLegWithHoldingPattern() prepends a LegModel Waypoint when a fixName is supplied that is not already in the flightPlan', (t) => {
    const inboundHeadingMock = -1.62476729292438;
    const turnDirectionMock = 'left';
    const legLengthMock = '3min';
    const holdRouteSegmentMock = '@CEASR';
    const holdFixLocationMock = [113.4636606631233, 6.12969620221002];
    const fms = buildFmsMock(isComplexRoute);

    fms.createLegWithHoldingPattern(inboundHeadingMock, turnDirectionMock, legLengthMock, holdRouteSegmentMock, holdFixLocationMock);

    t.true(fms.currentWaypoint.name === 'ceasr');
    t.true(fms.currentWaypoint._turnDirection === turnDirectionMock);
    t.true(fms.currentWaypoint._legLength === legLengthMock);
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

ava('.replaceDepartureProcedure() returns early if the nextRouteString matches the current route', (t) => {
    const routeStringMock = DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK.route;
    const fms = buildFmsMockForDeparture();
    const _findLegIndexForProcedureTypeSpy = sinon.spy(fms, '_findLegIndexForProcedureType');

    fms.replaceDepartureProcedure(routeStringMock, runwayAssignmentMock);

    t.false(_findLegIndexForProcedureTypeSpy.called);
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

ava('.replaceArrivalProcedure() returns early if the nextRouteString matches the current route', (t) => {
    const routeStringMock = ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK.route;
    const fms = buildFmsMock();
    const _findLegIndexForProcedureTypeSpy = sinon.spy(fms, '_findLegIndexForProcedureType');

    fms.replaceArrivalProcedure(routeStringMock, runwayAssignmentMock);

    t.false(_findLegIndexForProcedureTypeSpy.called);
});

ava('.replaceArrivalProcedure() calls .appendLeg() when no departure procedure exists', (t) => {
    const fms = buildFmsMock();
    const appendLegSpy = sinon.spy(fms, 'appendLeg');

    fms._destroyLegCollection();
    fms.replaceArrivalProcedure(arrivalProcedureRouteStringMock, runwayAssignmentMock);

    t.true(appendLegSpy.calledOnce);
});

ava('.replaceArrivalProcedure() returns undefined after success', (t) => {
    const fms = buildFmsMock();
    const result = fms.replaceArrivalProcedure(arrivalProcedureRouteStringMock, runwayAssignmentMock);

    t.true(typeof result === 'undefined');
});

ava('.replaceArrivalProcedure() replaces the currentLeg with the new route', (t) => {
    const fms = buildFmsMock();

    t.false(fms.currentLeg.routeString === arrivalProcedureRouteStringMock.toLowerCase());

    fms.replaceArrivalProcedure(arrivalProcedureRouteStringMock, runwayAssignmentMock);

    t.true(fms.currentLeg.routeString === arrivalProcedureRouteStringMock.toLowerCase());
});

ava('.replaceRouteUpToSharedRouteSegment() calls ._trimLegCollectionAtIndex() with an index of the matching LegModel', (t) => {
    const routeAmmendment = 'HITME..HOLDM..BIKKR..DAG';
    const fms = buildFmsMock(isComplexRoute);
    const _trimLegCollectionAtIndexSpy = sinon.spy(fms, '_trimLegCollectionAtIndex');
    // custom route addition here to give us a little wiggle room for the test
    fms.replaceFlightPlanWithNewRoute('COWBY..SUNST..BIKKR..DAG.KEPEC3.KLAS');

    fms.replaceRouteUpToSharedRouteSegment(routeAmmendment);

    t.true(_trimLegCollectionAtIndexSpy.calledWithExactly(2));
});

ava('.replaceRouteUpToSharedRouteSegment() calls ._prependLegCollectionWithRouteAmendment() with an array of routeSegments', (t) => {
    const expectedResult = ['hitme', 'holdm'];
    const routeAmmendment = 'HITME..HOLDM..BIKKR..DAG';
    const fms = buildFmsMock(isComplexRoute);
    const _prependLegCollectionWithRouteAmendmentSpy = sinon.spy(fms, '_prependLegCollectionWithRouteAmendment');
    // custom route addition here to give us a little wiggle room for the test
    fms.replaceFlightPlanWithNewRoute('COWBY..SUNST..BIKKR..DAG.KEPEC3.KLAS');

    fms.replaceRouteUpToSharedRouteSegment(routeAmmendment);

    t.true(_prependLegCollectionWithRouteAmendmentSpy.calledWithExactly(expectedResult));
});

ava('.replaceRouteUpToSharedRouteSegment() adds a new LegModel for each new routeSegment up to a shared LegModel.routeString', (t) => {
    const expectedResult = ['hitme', 'holdm', 'bikkr'];
    const routeAmmendment = 'HITME..HOLDM..BIKKR..DAG';
    const fms = buildFmsMock(isComplexRoute);
    // custom route addition here to give us a little wiggle room for the test
    fms.replaceFlightPlanWithNewRoute('COWBY..SUNST..BIKKR..DAG.KEPEC3.KLAS');

    fms.replaceRouteUpToSharedRouteSegment(routeAmmendment);

    t.true(fms.legCollection[0].routeString === expectedResult[0]);
    t.true(fms.legCollection[1].routeString === expectedResult[1]);
    t.true(fms.legCollection[2].routeString === expectedResult[2]);
});

ava('.isValidRoute() returns true when passed a valid directRouteString', (t) => {
    const fms = buildFmsMock();

    t.true(fms.isValidRoute(directRouteString, runwayAssignmentMock));
});

ava('.isValidRoute() returns true when passed a valid complexRouteString', (t) => {
    const fms = buildFmsMock();

    t.true(fms.isValidRoute(complexRouteString, runwayAssignmentMock));
});

ava('.isValidRoute() returns true when passed a valid complexRouteString that includes a hold', (t) => {
    const fms = buildFmsMock();

    t.true(fms.isValidRoute(complexRouteStringWithHold, runwayAssignmentMock));
});

ava('.isValidRoute() returns true when passed a valid arrival procedureRouteString', (t) => {
    const fms = buildFmsMock();

    t.true(fms.isValidRoute(arrivalProcedureRouteStringMock, runwayAssignmentMock));
});

ava('.isValidRoute() returns true when passed a valid departure procedureRouteString', (t) => {
    const fms = buildFmsMock();

    t.true(fms.isValidRoute(departureProcedureRouteStringMock, runwayAssignmentMock));
});

ava('.isValidProcedureRoute() returns false when passed an invalid route', (t) => {
    const invalidRouteString = 'a.b.c';
    const fms = buildFmsMock();

    t.false(fms.isValidProcedureRoute(invalidRouteString, runwayAssignmentMock, 'arrival'));
    t.false(fms.isValidProcedureRoute(invalidRouteString, runwayAssignmentMock, 'departure'));
});

ava.before(() => {
    sinon.stub(global.console, 'error', () => {});
});

ava.after(() => {
    global.console.error.restore();
});

ava('.isValidProcedureRoute() returns early if passed a malformed RouteString', (t) => {
    const invalidRouteStringMock = 'a.b';
    const fms = buildFmsMock();
    const hasLegWithRouteStringSpy = sinon.spy(fms, 'hasLegWithRouteString');

    t.false(fms.isValidProcedureRoute(invalidRouteStringMock, runwayAssignmentMock, 'arrival'));
    t.false(hasLegWithRouteStringSpy.called);
});

ava('.isValidProcedureRoute() calls ._translateProcedureNameToFlightPhase() when no flightPhase is passed', (t) => {
    const procedureRouteStringMock = 'dag.kepec3.klas';
    const fms = buildFmsMock();
    const _translateProcedureNameToFlightPhaseSpy = sinon.spy(fms, '_translateProcedureNameToFlightPhase');

    t.true(fms.isValidProcedureRoute(procedureRouteStringMock, runwayAssignmentMock));
    t.true(_translateProcedureNameToFlightPhaseSpy.called);
});

ava('.isValidProcedureRoute() returns true if the passed route already exists within the #legCollection', (t) => {
    const procedureRouteStringMock = 'dag.kepec3.klas';
    const fms = buildFmsMock();
    const result = fms.isValidProcedureRoute(procedureRouteStringMock, runwayAssignmentMock, 'arrival');

    t.true(result);
});

ava('.isValidProcedureRoute() returns true if the passed route is a valid arrival route', (t) => {
    const fms = buildFmsMock();
    const result = fms.isValidProcedureRoute(arrivalProcedureRouteStringMock, runwayAssignmentMock, 'arrival');

    t.true(result);
});

ava('.isValidProcedureRoute() returns true if the passed route is a valid departure route', (t) => {
    const fms = buildFmsMock();
    const result = fms.isValidProcedureRoute(departureProcedureRouteStringMock, runwayAssignmentMock, 'departure');

    t.true(result);
});

ava('.isValidRouteAmendment() returns true when a routeAmmendment contains a routeSegment that exists in the flightPlan', (t) => {
    const routeAmmendmentMock = 'HITME..HOLDM..BIKKR';
    const fms = buildFmsMock(isComplexRoute);

    t.true(fms.isValidRouteAmendment(routeAmmendmentMock));
});

ava('.isValidRouteAmendment() returns false when a routeAmmendment does not contain a routeSegment that exists in the flightPlan', (t) => {
    const routeAmmendmentMock = 'HITME..HOLDM';
    const fms = buildFmsMock(isComplexRoute);

    t.false(fms.isValidRouteAmendment(routeAmmendmentMock));
});

ava('.hasWaypoint() returns false if a waypoint does not exist within the current flightPlan', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    t.false(fms.hasWaypoint('ABC'));
});

ava('.hasWaypoint() returns true if a waypoint does exist within the current flightPlan', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    // waypoint from within the KEPEC3 arrival
    t.true(fms.hasWaypoint('SUNST'));
});

ava('.hasLegWithRouteString() returns false if a LegModel can not be found that matches a provided routeString', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    t.false(fms.hasLegWithRouteString('abc'));
});

ava('.hasLegWithRouteString() returns true if a LegModel can be found that matches a provided routeString in any case', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    t.true(fms.hasLegWithRouteString('coWbY'));
});

ava('.getTopAltitude() returns the top altitudeRestriction from all the waypoints', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const result = fms.getTopAltitude();

    t.true(result === 24000);
});

ava('.getBottomAltitude() returns the bottom altitudeRestriction from all the waypoints', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const result = fms.getBottomAltitude();

    t.true(result === 24000);
});

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

ava('._findLegIndexForProcedureType() returns -1 when a procedure type cannot be found', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const result = fms._findLegIndexForProcedureType('SID');

    t.true(result === -1);
});


ava('._findLegIndexForProcedureType() returns an array index for a specific procedure type', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const result = fms._findLegIndexForProcedureType('STAR');

    t.true(result === 2);
});

ava('._destroyLegCollection() clears the #legCollection', (t) => {
    const fms = buildFmsMock(isComplexRoute);

    fms._destroyLegCollection();

    t.true(fms.legCollection.length === 0);
});

ava('._prependLegCollectionWithRouteAmendment() adds LegModels for each directRouteString in an array', (t) => {
    const routeAmmendmentMock = ['hitme', 'holdm'];
    const fms = buildFmsMock(isComplexRoute);

    fms._prependLegCollectionWithRouteAmendment(routeAmmendmentMock);

    t.true(fms.legCollection[0].routeString === routeAmmendmentMock[0]);
    t.true(fms.legCollection[1].routeString === routeAmmendmentMock[1]);
});

ava('._prependLegCollectionWithRouteAmendment() adds LegModels for each routeString in an array', (t) => {
    const routeAmmendmentMock = ['hitme', 'dag.kepec3.klas'];
    const fms = buildFmsMock(isComplexRoute);

    fms._prependLegCollectionWithRouteAmendment(routeAmmendmentMock);

    t.true(fms.legCollection[0].routeString === routeAmmendmentMock[0]);
    t.true(fms.legCollection[1].routeString === routeAmmendmentMock[1]);
});
