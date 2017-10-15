import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';

import Fms from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/Fms';
import StaticPositionModel from '../../../src/assets/scripts/client/base/StaticPositionModel';
import { airportModelFixture } from '../../fixtures/airportFixtures';
import { navigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import {
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_DIRECT_ROUTE_STRING_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_WITH_DIRECT_ROUTE_STRING_MOCK,
    AIRCRAFT_DEFINITION_MOCK
} from '../_mocks/aircraftMocks';
import { SNORA_STATIC_POSITION_MODEL } from '../../base/_mocks/positionMocks';
import { INVALID_NUMBER } from '../../../src/assets/scripts/client/constants/globalConstants';
import { PROCEDURE_TYPE } from '../../../src/assets/scripts/client/constants/aircraftConstants';

const directRouteString = 'COWBY';
const invalidDirectRouteStringMock = 'COWBY.BIKKR';
const complexRouteString = 'COWBY..BIKKR..DAG.KEPEC3.KLAS';
const complexRouteStringWithHold = 'COWBY..@BIKKR..DAG.KEPEC3.KLAS';
const complexRouteStringWithVector = 'COWBY..#180..BIKKR..DAG.KEPEC3.KLAS';
const simpleRouteString = ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK.route;
const arrivalProcedureRouteStringMock = 'MLF.GRNPA1.KLAS';
const invalidProcedureRouteStringMock = 'MLF..GRNPA1.KLAS';
const departureProcedureRouteStringMock = 'KLAS.COWBY6.DRK';
const runwayAssignmentMock = airportModelFixture.getRunway('19L');
const isComplexRoute = true;

function buildFmsMock(shouldUseComplexRoute = false, customRouteString = '') {
    let fms = new Fms(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, runwayAssignmentMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);

    if (shouldUseComplexRoute) {
        const aircraftPropsMock = Object.assign({}, ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, { route: complexRouteString });

        fms = new Fms(aircraftPropsMock, runwayAssignmentMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);
    } else if (customRouteString !== '') {
        const aircraftPropsMock = Object.assign({}, ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, { route: customRouteString });

        fms = new Fms(aircraftPropsMock, runwayAssignmentMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);
    }

    return fms;
}

function buildFmsMockForDeparture(customAircraftProps = null) {
    let fms;

    if (customAircraftProps !== null) {
        fms = new Fms(customAircraftProps, runwayAssignmentMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);
    } else {
        fms = new Fms(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, runwayAssignmentMock, AIRCRAFT_DEFINITION_MOCK, navigationLibraryFixture);
    }

    return fms;
}

ava('throws when called without parameters', (t) => {
    t.throws(() => new Fms());
});

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => buildFmsMock());
    t.notThrows(() => buildFmsMock(isComplexRoute));
    t.notThrows(() => buildFmsMock(false, 'COWBY..BIKKR..DAG'));
    t.notThrows(() => buildFmsMockForDeparture());
    t.notThrows(() => buildFmsMockForDeparture(DEPARTURE_AIRCRAFT_INIT_PROPS_WITH_DIRECT_ROUTE_STRING_MOCK));
});

ava('#currentWaypoint returns the first waypoint of the first leg in the #legCollection', (t) => {
    const fms = buildFmsMock();

    t.true(_isEqual(fms.legCollection[0].waypointCollection[0], fms.currentWaypoint));
});

ava('#currentWaypoint.name returns RNAV when the waypoint begins with an underscore', (t) => {
    const fms = buildFmsMock(false, '_NAPSE068..DAG');

    t.true(fms.currentWaypoint.name === 'RNAV');
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

ava('#waypoints returns a single array of all the WaypointModels in the flightPlan', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const result = fms.waypoints;

    t.true(result.length === 15);
});

ava('.getFlightPlanRouteStringWithSpaces() returns a routeString that is a sum of #previousRouteSegments and #currentRoute', (t) => {
    const expectedResult = 'COWBY BIKKR DAG KEPEC3 KLAS';
    const fms = buildFmsMock(isComplexRoute);

    t.true(fms.getFlightPlanRouteStringWithSpaces() === expectedResult);

    fms.nextWaypoint();
    fms.nextWaypoint();
    fms.nextWaypoint();

    t.true(fms.getFlightPlanRouteStringWithSpaces() === expectedResult);
});

ava('.getFlightPlanRouteStringWithSpaces() returns a routeString that is a sum of #previousRouteSegments and #currentRoute', (t) => {
    const expectedResultBeforeReplacement = 'COWBY BIKKR DAG KEPEC3 KLAS';
    const expectedResult = 'COWBY BIKKR MLF GRNPA1 KLAS';
    const fms = buildFmsMock(isComplexRoute);

    t.true(fms.getFlightPlanRouteStringWithSpaces() === expectedResultBeforeReplacement);

    fms.nextWaypoint();
    fms.nextWaypoint();
    fms.replaceArrivalProcedure(arrivalProcedureRouteStringMock, runwayAssignmentMock);

    t.true(fms.getFlightPlanRouteStringWithSpaces() === expectedResult);
});

ava('.init() calls ._buildLegCollection()', (t) => {
    const fms = buildFmsMock();
    const _buildLegCollectionSpy = sinon.spy(fms, '_buildLegCollection');

    fms.init(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, runwayAssignmentMock);

    t.true(_buildLegCollectionSpy.calledWithExactly(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK.route));
});

ava('.setDepartureRunway() sets #departureRunwayModel to the specified runway model', (t) => {
    const nextRunwayFixture = airportModelFixture.getRunway('19R');
    const fms = buildFmsMockForDeparture();

    fms.setDepartureRunway(nextRunwayFixture);

    t.true(_isEqual(fms.departureRunwayModel, nextRunwayFixture));
});

ava('.setDepartureRunway() returns early when the specified runway model is equal to #departureRunwayModel', (t) => {
    const nextRunwayFixture = airportModelFixture.getRunway('19L');
    const fms = buildFmsMockForDeparture();
    const regenerateSidLegSpy = sinon.spy(fms, '_regenerateSidLeg');
    const replaceDepartureProcedureSpy = sinon.spy(fms, 'replaceDepartureProcedure');

    fms.setDepartureRunway(nextRunwayFixture);

    t.true(regenerateSidLegSpy.notCalled);
    t.true(replaceDepartureProcedureSpy.notCalled);
});

ava('.setDepartureRunway() throws when passed a string instead of a RunwayModel', (t) => {
    const nextRunwayName = '19R';
    const fms = buildFmsMockForDeparture();

    t.throws(() => fms.setDepartureRunway(nextRunwayName));
});

ava('.setDepartureRunway() regenerates SID legs for new runway', (t) => {
    const nextRunwayFixture = airportModelFixture.getRunway('19R');
    const fms = buildFmsMockForDeparture();
    const regenerateSidLegSpy = sinon.spy(fms, '_regenerateSidLeg');

    fms.setDepartureRunway(nextRunwayFixture);

    t.true(regenerateSidLegSpy.calledWithExactly());
});

ava('.setArrivalRunway() sets a #arrivalRunwayModel to the specified runway model', (t) => {
    const nextRunwayFixture = airportModelFixture.getRunway('19R');
    const fms = buildFmsMock();

    fms.setArrivalRunway(nextRunwayFixture);

    t.true(_isEqual(fms.arrivalRunwayModel, nextRunwayFixture));
});

ava('.setArrivalRunway() returns early when the specified runway model is equal to #arrivalRunwayModel', (t) => {
    const nextRunwayFixture = airportModelFixture.getRunway('19L');
    const fms = buildFmsMock();
    const regenerateStarLegSpy = sinon.spy(fms, '_regenerateStarLeg');
    const replaceArrivalProcedureSpy = sinon.spy(fms, 'replaceArrivalProcedure');

    fms.setArrivalRunway(nextRunwayFixture);

    t.true(regenerateStarLegSpy.notCalled);
    t.true(replaceArrivalProcedureSpy.notCalled);
});

ava('.setArrivalRunway() throws when passed a string instead of a RunwayModel', (t) => {
    const nextRunwayName = '19R';
    const fms = buildFmsMockForDeparture();

    t.throws(() => fms.setArrivalRunway(nextRunwayName));
});

ava('.setArrivalRunway() regenerates STAR legs for new runway', (t) => {
    const nextRunwayFixture = airportModelFixture.getRunway('19R');
    const fms = buildFmsMock();
    const regenerateStarLegSpy = sinon.spy(fms, '_regenerateStarLeg');

    t.true(fms.arrivalRunwayModel.name === '19L');

    fms.setArrivalRunway(nextRunwayFixture);

    t.true(regenerateStarLegSpy.calledWithExactly());
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
    fms.skipToWaypoint('lefft');

    t.false(fms.hasNextWaypoint());
});

ava('.createLegWithHoldingPattern() calls _createLegWithHoldWaypoint() when holdRouteSegment is GPS', (t) => {
    const inboundHeadingMock = -1.62476729292438;
    const turnDirectionMock = 'left';
    const legLengthMock = '2min';
    const holdRouteSegmentMock = 'GPS';
    const holdPositionMock = SNORA_STATIC_POSITION_MODEL;
    const fms = buildFmsMock(isComplexRoute);
    const _createLegWithHoldWaypointSpy = sinon.spy(fms, '_createLegWithHoldWaypoint');

    fms.createLegWithHoldingPattern(inboundHeadingMock, turnDirectionMock, legLengthMock, holdRouteSegmentMock, holdPositionMock);

    t.true(_createLegWithHoldWaypointSpy.calledOnce);
});

ava('.createLegWithHoldingPattern() prepends LegCollection with hold Waypoint when holdRouteSegment is GPS', (t) => {
    const inboundHeadingMock = -1.62476729292438;
    const turnDirectionMock = 'left';
    const legLengthMock = '2min';
    const holdRouteSegmentMock = 'GPS';
    const holdPositionMock = SNORA_STATIC_POSITION_MODEL;
    const fms = buildFmsMock();

    fms.createLegWithHoldingPattern(inboundHeadingMock, turnDirectionMock, legLengthMock, holdRouteSegmentMock, holdPositionMock);

    t.true(fms.currentWaypoint._turnDirection === 'left');
    t.true(fms.currentWaypoint._legLength === '2min');
    t.true(fms.currentWaypoint.name === 'gps');
    t.true(_isEqual(fms.currentWaypoint.relativePosition, holdPositionMock.relativePosition));
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
    const fms = buildFmsMock();
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

ava('.nextWaypoint() does not call ._moveToNextWaypointInLeg() after calling ._moveToNextLeg() ', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const _moveToNextWaypointInLegSpy = sinon.spy(fms, '_moveToNextWaypointInLeg');


    fms.nextWaypoint();

    t.true(_moveToNextWaypointInLegSpy.notCalled);
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

    t.true(fms.currentLeg.isProcedure);
    t.true(fms.legCollection.length === 1);
    t.true(fms.legCollection[0].waypointCollection.length === 13);
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

ava('.skipToWaypoint() does nothing if the waypoint to skip to is the #currentWaypoint', (t) => {
    const waypointNameMock = 'cowby';
    const fms = buildFmsMock(isComplexRoute);

    fms.skipToWaypoint(waypointNameMock);

    t.true(fms.currentLeg.routeString === waypointNameMock);
});

ava('.skipToWaypoint() skips to a waypoint in a different leg', (t) => {
    const waypointNameMock = 'sunst';
    const fms = buildFmsMock(isComplexRoute);

    fms.skipToWaypoint(waypointNameMock);

    t.true(fms.currentWaypoint.name === waypointNameMock);
});

ava('.getNextWaypointModel() returns the `WaypointModel` for the next Waypoint in the collection', (t) => {
    const fms = buildFmsMock();
    const waypointModel = fms.getNextWaypointModel();
    const expectedResult = 'misen';

    t.true(waypointModel._name === expectedResult);
});

ava('.getNextWaypointModel() returns null when fewer than two WaypointModels remaining in collection', (t) => {
    const fms = buildFmsMock();

    fms.skipToWaypoint('lefft');

    const result = fms.getNextWaypointModel();
    const expectedResult = null;

    t.true(result === expectedResult);
});

ava('.getNextWaypointModel() returns the first `WaypointModel` of the next leg when at the end of the current leg', (t) => {
    const shouldUseComplexRoute = true;
    const fms = buildFmsMock(shouldUseComplexRoute);

    fms.skipToWaypoint('bikkr');

    const waypointModel = fms.getNextWaypointModel();
    const expectedResult = 'dag';

    t.true(waypointModel._name === expectedResult);
});

ava('.getNextWaypointPositionModel() returns the `StaticPositionModel` for the next Waypoint in the collection', (t) => {
    const expectedResult = [-87.64380662924125, -129.57471627889475];
    const fms = buildFmsMock();
    const waypointPosition = fms.getNextWaypointPositionModel();
    const result = waypointPosition.relativePosition;

    t.true(waypointPosition instanceof StaticPositionModel);
    t.true(_isEqual(result, expectedResult));
});

ava.todo('.replaceDepartureProcedure() updates the current runway assignment');

ava('.replaceDepartureProcedure() calls .prependLeg() when no departure procedure exists', (t) => {
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
    t.true(fms.legCollection.length === 1);
});

ava.todo('.replaceArrivalProcedure() updates the current runway assignment');

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

ava('.leaveHoldFlightPhase() returns early when #currentPhase is not HOLD', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const _setFlightPhaseToPreviousFlightPhaseSpy = sinon.spy(fms, '_setFlightPhaseToPreviousFlightPhase');

    fms.leaveHoldFlightPhase();

    t.true(_setFlightPhaseToPreviousFlightPhaseSpy.notCalled);
});

ava('.leaveHoldFlightPhase() calls _setFlightPhaseToPreviousFlightPhase when #currentPhase is HOLD', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    const _setFlightPhaseToPreviousFlightPhaseSpy = sinon.spy(fms, '_setFlightPhaseToPreviousFlightPhase');
    fms.setFlightPhase('HOLD');

    fms.leaveHoldFlightPhase();

    t.true(_setFlightPhaseToPreviousFlightPhaseSpy.calledOnce);
});

ava('._setFlightPhaseToPreviousFlightPhase() reverts #currentPhase to the value that was set previous to HOLD', (t) => {
    const fms = buildFmsMock(isComplexRoute);
    fms.setFlightPhase('HOLD');

    fms._setFlightPhaseToPreviousFlightPhase();

    t.true(fms.currentPhase === 'CRUISE');
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

ava('.isValidRoute() returns true when passed a valid complexRouteString that includes a vector', (t) => {
    const fms = buildFmsMock();

    t.true(fms.isValidRoute(complexRouteStringWithVector, runwayAssignmentMock));
});

ava('.isValidRoute() returns true when passed a valid arrival procedureRouteString', (t) => {
    const fms = buildFmsMock();

    t.true(fms.isValidRoute(arrivalProcedureRouteStringMock, runwayAssignmentMock));
});

ava('.isValidRoute() returns true when passed a valid departure procedureRouteString', (t) => {
    const fms = buildFmsMock();

    t.true(fms.isValidRoute(departureProcedureRouteStringMock, runwayAssignmentMock));
});

ava('.isValidRoute() returns false when passed an invalid use of a directRouteString', (t) => {
    const fms = buildFmsMock();

    t.false(fms.isValidRoute(invalidDirectRouteStringMock, runwayAssignmentMock));
});

ava('.isValidRoute() returns false when passed an invalid use of a procedureRouteString', (t) => {
    const fms = buildFmsMock();

    t.false(fms.isValidRoute(invalidProcedureRouteStringMock, runwayAssignmentMock));
});

ava('.isValidRoute() returns false when passed an empty string', (t) => {
    const fms = buildFmsMock();

    t.false(fms.isValidRoute('', runwayAssignmentMock));
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

ava('.getTopAltitude() returns the highest "AT" or "AT/BELOW" altitude restriction from all the waypoints', (t) => {
    const expectedResult = 24000;
    const fms = buildFmsMock(isComplexRoute);
    const result = fms.getTopAltitude();

    t.true(result === expectedResult);
});

ava('.getBottomAltitude() returns the lowest "AT" or "AT/ABOVE" altitude restriction from all the waypoints', (t) => {
    const expectedResult = 8000;
    const fms = buildFmsMock(isComplexRoute);
    const result = fms.getBottomAltitude();

    t.true(result === expectedResult);
});

ava('.isFollowingSid() retruns true when the current Leg is a SID', (t) => {
    const fms = buildFmsMockForDeparture();

    t.true(fms.isFollowingSid());
    t.false(fms.isFollowingStar());
});

ava('.isFollowingSid() retruns true when the current Leg is a SID', (t) => {
    const fms = buildFmsMock();

    t.true(fms.isFollowingStar());
    t.false(fms.isFollowingSid());
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

    t.true(result === INVALID_NUMBER);
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

ava('._regenerateSidLeg() creates a new SID leg of identical route string for the currently assigned departure runway', (t) => {
    const initialRunwayFixture = airportModelFixture.getRunway('19L');
    const nextRunwayFixture = airportModelFixture.getRunway('19R');
    const fms = buildFmsMockForDeparture();
    const replaceDepartureProcedureSpy = sinon.spy(fms, 'replaceDepartureProcedure');
    const sidLegIndex = fms._findLegIndexForProcedureType(PROCEDURE_TYPE.SID);
    const sidLeg = fms.legCollection[sidLegIndex];
    const oldWaypoints = sidLeg.waypointCollection;

    t.true(_isEqual(fms.departureRunwayModel, initialRunwayFixture));
    t.true(oldWaypoints[0].name === 'fixix');
    t.true(oldWaypoints.length === 7);

    fms.departureRunwayModel = nextRunwayFixture;
    fms._regenerateSidLeg();

    const newWaypoints = fms.legCollection[sidLegIndex].waypointCollection;

    t.true(newWaypoints[0].name === 'jaker');
    t.true(newWaypoints.length === 7);
    t.true(replaceDepartureProcedureSpy.calledWithExactly(sidLeg.routeString, nextRunwayFixture));
});

ava('._regenerateSidLeg() returns early when there is no SID leg in the flightplan', (t) => {
    const fms = buildFmsMock();
    const replaceDepartureProcedureSpy = sinon.spy(fms, 'replaceDepartureProcedure');

    fms.departureRunwayModel = airportModelFixture.getRunway('19R');
    fms._regenerateSidLeg();

    t.true(replaceDepartureProcedureSpy.notCalled);
});

ava('._regenerateStarLeg() creates a new STAR leg of identical route string for the currently assigned arrival runway', (t) => {
    const initialRunwayFixture = airportModelFixture.getRunway('19L');
    const nextRunwayFixture = airportModelFixture.getRunway('19R');
    const fms = buildFmsMock();
    const replaceArrivalProcedureSpy = sinon.spy(fms, 'replaceArrivalProcedure');
    const starLegIndex = fms._findLegIndexForProcedureType(PROCEDURE_TYPE.STAR);
    const starLeg = fms.legCollection[starLegIndex];
    const oldWaypoints = starLeg.waypointCollection;

    t.true(_isEqual(fms.arrivalRunwayModel, initialRunwayFixture));
    t.true(oldWaypoints[12].name === 'lefft');
    t.true(oldWaypoints.length === 13);

    fms.arrivalRunwayModel = nextRunwayFixture;
    fms._regenerateStarLeg();

    const newWaypoints = fms.legCollection[starLegIndex].waypointCollection;

    t.true(newWaypoints[12].name === 'right');
    t.true(newWaypoints.length === 13);
    t.true(replaceArrivalProcedureSpy.calledWithExactly(starLeg.routeString, nextRunwayFixture));
});

ava('._regenerateStarLeg() returns early when there is no STAR leg in the flightplan', (t) => {
    const fms = buildFmsMockForDeparture();
    const replaceArrivalProcedureSpy = sinon.spy(fms, 'replaceArrivalProcedure');

    fms.arrivalRunwayModel = airportModelFixture.getRunway('19R');
    fms._regenerateStarLeg();

    t.true(replaceArrivalProcedureSpy.notCalled);
});

ava('._updatePreviousRouteSegments() does not add a routeString to #_previousRouteSegments when it already exists in the list', (t) => {
    const routeStringMock = 'COWBY';
    const fms = buildFmsMock(isComplexRoute);
    fms._previousRouteSegments[0] = routeStringMock;

    fms._updatePreviousRouteSegments(routeStringMock);

    t.true(fms._previousRouteSegments.length === 1);
});

ava('._updatePreviousRouteSegments() adds a routeString to #_previousRouteSegments when it does not already exist in the list', (t) => {
    const routeStringMock = 'COWBY';
    const fms = buildFmsMock(isComplexRoute);

    fms._updatePreviousRouteSegments(routeStringMock);

    t.true(fms._previousRouteSegments.length === 1);
    t.true(fms._previousRouteSegments[0] === routeStringMock);
});
