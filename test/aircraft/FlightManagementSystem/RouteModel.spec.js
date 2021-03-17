import ava from 'ava';
import sinon from 'sinon';
import _every from 'lodash/every';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _map from 'lodash/map';
import LegModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/LegModel';
import RouteModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/RouteModel';
import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';
import AirportModel from '../../../src/assets/scripts/client/airport/AirportModel';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';
import { createAirportModelFixture } from '../../fixtures/airportFixtures';
import {
    CUSTOM_HOLD_PARAMETERS_EXECPTED,
    CUSTOM_HOLD_PARAMETERS_MOCK,
    EMPTY_HOLD_PARAMETERS_MOCK,
    GRNPA8_HOLD_PARAMETERS_EXPECTED
} from './mocks/holdMocks';

const complexRouteStringMock = 'KLAS07R.BOACH6.TNP..OAL..MLF..PGS.TYSSN4.KLAS07R';
const singleFixRouteStringMock = 'DVC';
const singleDirectSegmentRouteStringMock = 'OAL..MLF';
const multiDirectSegmentRouteStringMock = 'OAL..MLF..PGS';
const singleSidProcedureSegmentRouteStringMock = 'KLAS07R.BOACH6.TNP';
const singleStarProcedureSegmentRouteStringMock = 'TNP.KEPEC3.KLAS07R';
const multiProcedureSegmentRouteStringMock = 'KLAS07R.BOACH6.TNP.KEPEC3.KLAS07R';
const nightmareRouteStringMock = 'TNP.KEPEC3.KLAS07R.BOACH6.TNP..OAL..PGS.TYSSN4.KLAS07R.BOACH6.TNP..GUP..IGM';

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('throws when instantiated without valid parameters', (t) => {
    t.throws(() => new RouteModel());
    t.throws(() => new RouteModel(false));
});

ava('throws when instantiated with route string containing spaces', (t) => {
    t.throws(() => new RouteModel('KLAS07R BOACH6 TNP'));
});

ava('does not throw when instantiated with valid parameters', (t) => {
    t.notThrows(() => new RouteModel(complexRouteStringMock));
});

ava('instantiates correctly when provided valid single-fix route string', (t) => {
    const model = new RouteModel(singleFixRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 1);
});

ava('instantiates correctly when provided valid single-segment direct route string', (t) => {
    const model = new RouteModel(singleDirectSegmentRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 2);
});

ava('instantiates correctly when provided valid single-segment procedural route string', (t) => {
    const model = new RouteModel(singleSidProcedureSegmentRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 1);
    t.true(model._legCollection[0]._waypointCollection.length === 8);
});

ava('instantiates correctly when provided valid multi-segment direct route string', (t) => {
    const model = new RouteModel(multiDirectSegmentRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 3);
});

ava('instantiates correctly when provided valid multi-segment procedural route string', (t) => {
    const model = new RouteModel(multiProcedureSegmentRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 2);
    t.true(model._legCollection[0]._waypointCollection.length === 8);
    t.true(model._legCollection[1]._waypointCollection.length === 13);
});

ava('instantiates correctly when provided valid multi-segment mixed route string', (t) => {
    const model = new RouteModel(complexRouteStringMock);

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 4);
    t.true(model._legCollection[0]._waypointCollection.length === 8);
    t.true(model._legCollection[1]._waypointCollection.length === 1);
    t.true(model._legCollection[2]._waypointCollection.length === 1);
    t.true(model._legCollection[3]._waypointCollection.length === 6);
});

ava('#currentLeg throws when #_legCollection does not contain at least one leg', (t) => {
    const model = new RouteModel(singleFixRouteStringMock);

    model._legCollection = [];

    t.throws(() => model.currentLeg);
});

ava('#currentLeg returns the first element of the #_legCollection', (t) => {
    const model = new RouteModel(singleFixRouteStringMock);
    const result = model.currentLeg;

    t.true(result instanceof LegModel);
    t.true(result.routeString === singleFixRouteStringMock);
});

ava('#legCollection returns the entire #_legCollection', (t) => {
    const model = new RouteModel(singleFixRouteStringMock);
    const expectedResult = model._legCollection;
    const result = model.legCollection;

    t.deepEqual(result, expectedResult);
});

ava('#currentWaypoint returns the #currentWaypoint on the #currentLeg', (t) => {
    const model = new RouteModel(singleFixRouteStringMock);
    const expectedResult = model.currentLeg.currentWaypoint;
    const result = model.currentWaypoint;

    t.deepEqual(result, expectedResult);
});

ava('#nextLeg returns null when there are no more legs after the current leg', (t) => {
    const model = new RouteModel(singleFixRouteStringMock);
    const result = model.nextLeg;

    t.true(!result);
});

ava('#nextLeg returns the second element of the #_legCollection when it exists', (t) => {
    const model = new RouteModel(singleDirectSegmentRouteStringMock);
    const result = model.nextLeg;

    t.true(result instanceof LegModel);
    t.true(result.routeString === 'MLF');
});

ava('#nextWaypoint returns null when there are no more waypoints after the current waypoint', (t) => {
    const model = new RouteModel(singleFixRouteStringMock);
    const result = model.nextWaypoint;

    t.true(!result);
});

ava('#nextWaypoint returns next waypoint of the current leg when the current leg has another waypoint', (t) => {
    const model = new RouteModel(nightmareRouteStringMock);
    const result = model.nextWaypoint;

    t.true(result instanceof WaypointModel);
    t.true(result.name === 'JOTNU');
});

ava('#nextWaypoint returns the first waypoint of the next leg when a nextLeg exists and the current leg does not contain more waypoints', (t) => {
    const model = new RouteModel(nightmareRouteStringMock);

    model.skipToWaypointName('PRINO');

    const result = model.nextWaypoint;

    t.true(result instanceof WaypointModel);
    t.true(result.name === 'JESJI');
});

ava('#waypoints returns an array containing the `WaypointModel`s of all legs', (t) => {
    const model = new RouteModel(complexRouteStringMock);
    const result = model.waypoints;
    const expectedWaypointNames = ['JESJI', 'BAKRR', 'MINEY', 'HITME', 'BOACH', 'ZELMA',
        'JOTNU', 'TNP', 'OAL', 'MLF', 'PGS', 'CEJAY', 'KADDY', 'TYSSN', 'SUZSI', 'PRINO'
    ];
    const waypointNames = _map(result, (waypointModel) => waypointModel.name);

    t.true(_isArray(result));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('.absorbRouteModel() returns no-continuity message when routes have no common fixes', (t) => {
    const primaryModel = new RouteModel('CLARR..SKEBR..MDDOG..IPUMY');
    const otherModel = new RouteModel('BOACH..CRESO..BLD');
    const expectedResult = [false, 'routes do not have continuity!'];
    const result = primaryModel.absorbRouteModel(otherModel);

    t.deepEqual(result, expectedResult);
});

ava('.absorbRouteModel() calls ._overwriteRouteBetweenWaypointNames() when provided route has two points of continuity with this route', (t) => {
    const primaryModel = new RouteModel('CLARR..SKEBR..MDDOG..IPUMY..TOMIS..LEMNZ..LOOSN');
    const otherModel = new RouteModel('MDDOG..JEBBB..BESSY..LEMNZ');
    const primaryModelOverwriteRouteBetweenWaypointNamesSpy = sinon.spy(primaryModel, '_overwriteRouteBetweenWaypointNames');
    const expectedResult = [true, { log: 'rerouting to: CLARR SKEBR MDDOG JEBBB BESSY LEMNZ LOOSN', say: 'rerouting as requested' }];
    const result = primaryModel.absorbRouteModel(otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModelOverwriteRouteBetweenWaypointNamesSpy.calledWithExactly('MDDOG', 'LEMNZ', otherModel));
});

ava('.absorbRouteModel() calls ._prependRouteModelEndingAtWaypointName() when provided route ends on a waypoint on this route', (t) => {
    const primaryModel = new RouteModel('CHRLT.V394.LAS');
    const otherModel = new RouteModel('GFS..WHIGG..CLARR');
    const primaryModelPrependRouteModelEndingAtWaypointNameSpy = sinon.spy(primaryModel, '_prependRouteModelEndingAtWaypointName');
    const expectedResult = [true, { log: 'rerouting to: GFS WHIGG CLARR V394 LAS', say: 'rerouting as requested' }];
    const result = primaryModel.absorbRouteModel(otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModelPrependRouteModelEndingAtWaypointNameSpy.calledWithExactly('CLARR', otherModel));
});

ava('.absorbRouteModel() calls ._appendRouteModelBeginningAtWaypointName() when provided route that begins on a waypoint on this route', (t) => {
    const primaryModel = new RouteModel('DAG.V394.LAS');
    const otherModel = new RouteModel('CLARR..TRREY..SOSOY');
    const primaryModelAppendRouteModelBeginningAtWaypointNameSpy = sinon.spy(primaryModel, '_appendRouteModelBeginningAtWaypointName');
    const expectedResult = [true, { log: 'rerouting to: DAG V394 CLARR TRREY SOSOY', say: 'rerouting as requested' }];
    const result = primaryModel.absorbRouteModel(otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModelAppendRouteModelBeginningAtWaypointNameSpy.calledWithExactly('CLARR', otherModel));
});

ava('.activateHoldForWaypointName() returns early when the specified waypoint does not exist in the route', (t) => {
    const model = new RouteModel('DAG..KEPEC');
    const legModel1 = model._legCollection[0];
    const legModel2 = model._legCollection[1];
    const activateHoldForWaypointNameSpy1 = sinon.spy(legModel1, 'activateHoldForWaypointName');
    const activateHoldForWaypointNameSpy2 = sinon.spy(legModel2, 'activateHoldForWaypointName');
    const holdParametersMock = { turnDirection: 'left' };
    const result = model.activateHoldForWaypointName('PRINO', holdParametersMock);

    t.true(typeof result === 'undefined');
    t.true(activateHoldForWaypointNameSpy1.notCalled);
    t.true(activateHoldForWaypointNameSpy2.notCalled);
});

ava('.activateHoldForWaypointName() calls LegModel.activateHoldForWaypointName() with the appropriate arguments on the appropriate leg', (t) => {
    const model = new RouteModel('DAG..KEPEC');
    const legModel1 = model._legCollection[0];
    const legModel2 = model._legCollection[1];
    const activateHoldForWaypointNameSpy1 = sinon.spy(legModel1, 'activateHoldForWaypointName');
    const activateHoldForWaypointNameSpy2 = sinon.spy(legModel2, 'activateHoldForWaypointName');
    const holdParametersMock = { turnDirection: 'left' };
    const result = model.activateHoldForWaypointName('KEPEC', holdParametersMock);

    t.not(typeof result, 'undefined');
    t.true(activateHoldForWaypointNameSpy1.notCalled);
    t.true(activateHoldForWaypointNameSpy2.calledWith('KEPEC', holdParametersMock));
});

ava('.activateHoldForWaypointName() uses fallbackHeading as inboundHeading when the specified waypoint is first in the route', (t) => {
    const model = new RouteModel('DAG..KEPEC');
    const fallbackInboundHeading = 1.2;
    const result = model.activateHoldForWaypointName('DAG', EMPTY_HOLD_PARAMETERS_MOCK, fallbackInboundHeading);

    t.is(result.inboundHeading, fallbackInboundHeading);
});

ava('.activateHoldForWaypointName() uses leg course as inboundHeading when the specified waypoint is not first in the route', (t) => {
    const model = new RouteModel('DAG..KEPEC..IPUMY');
    const fallbackInboundHeading = 1.2;
    const expectedInboundHeading = 0.99;
    const result = model.activateHoldForWaypointName('IPUMY', EMPTY_HOLD_PARAMETERS_MOCK, fallbackInboundHeading);
    const roundedHeading = Math.round(result.inboundHeading * 100) / 100;

    t.is(roundedHeading, expectedInboundHeading);
    t.not(result.inboundHeading, fallbackInboundHeading);
});

ava('.activateHoldForWaypointName() returns the correct hold parameters for a procedural hold', (t) => {
    const model = new RouteModel('DAG.GRNPA8.KLAS07R');
    const fallbackInboundHeading = 1.2;
    const result = model.activateHoldForWaypointName('IPUMY', EMPTY_HOLD_PARAMETERS_MOCK, fallbackInboundHeading);

    t.deepEqual(result, GRNPA8_HOLD_PARAMETERS_EXPECTED);
});

ava('.activateHoldForWaypointName() returns the correct hold parameters for a procedural hold with custom holdParameters', (t) => {
    const model = new RouteModel('DAG.GRNPA8.KLAS07R');
    const fallbackInboundHeading = 1.2;
    const result = model.activateHoldForWaypointName('IPUMY', CUSTOM_HOLD_PARAMETERS_MOCK, fallbackInboundHeading);

    t.deepEqual(result, CUSTOM_HOLD_PARAMETERS_EXECPTED);
});

ava('.activateHoldForWaypointName() returns the correct hold parameters for a procedural hold when custom holdParameters had previously been set', (t) => {
    const model = new RouteModel('DAG.GRNPA8.KLAS07R');
    const fallbackInboundHeading = 1.2;
    const customResult = model.activateHoldForWaypointName('IPUMY', CUSTOM_HOLD_PARAMETERS_MOCK, fallbackInboundHeading);
    const result = model.activateHoldForWaypointName('IPUMY', EMPTY_HOLD_PARAMETERS_MOCK, fallbackInboundHeading);

    t.deepEqual(customResult, CUSTOM_HOLD_PARAMETERS_EXECPTED);
    t.deepEqual(result, GRNPA8_HOLD_PARAMETERS_EXPECTED);
});

ava('._createLegModelsFromWaypointModels() returns an array of LegModels matching the specified array of WaypointModels', (t) => {
    const model = new RouteModel('TNP.KEPEC3.KLAS07R');

    model.skipToWaypointName('KIMME');

    const result = model._createLegModelsFromWaypointModels(model.currentLeg._waypointCollection);
    const expectedWaypointNames = ['KIMME', 'CHIPZ', 'POKRR', 'PRINO'];
    const waypointNames = result.map((legModel) => legModel.routeString);

    t.true(_isArray(result));
    t.true(_every(result, (legModel) => legModel instanceof LegModel));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('.getAltitudeRestrictedWaypoints() returns an array of WaypointModels that have altitude restrictions', (t) => {
    const model = new RouteModel(singleSidProcedureSegmentRouteStringMock);
    const result = model.getAltitudeRestrictedWaypoints();
    const expectedWaypointNames = ['BAKRR', 'MINEY', 'BOACH'];
    const waypointNames = result.map((waypoint) => waypoint.name);
    const allWaypointsHaveRestrictions = _every(result, (waypoint) => waypoint.hasAltitudeRestriction);

    t.deepEqual(waypointNames, expectedWaypointNames);
    t.true(allWaypointsHaveRestrictions);
});

ava('.getArrivalRunwayAirportIcao() returns null if there is no STAR leg', (t) => {
    const model = new RouteModel(singleSidProcedureSegmentRouteStringMock);
    const expectedResult = null;
    const result = model.getArrivalRunwayAirportIcao();

    t.true(result === expectedResult);
});

ava('.getArrivalRunwayAirportIcao() returns the appropriate runway\'s airport\'s ICAO identifier', (t) => {
    const model = new RouteModel('TNP.KEPEC3.KLAS07R');
    const expectedResult = 'klas';
    const result = model.getArrivalRunwayAirportIcao();

    t.true(result === expectedResult);
});

ava('.getArrivalRunwayAirportModel() returns null when there is no STAR leg', (t) => {
    const model = new RouteModel(singleSidProcedureSegmentRouteStringMock);
    const expectedResult = null;
    const result = model.getArrivalRunwayAirportModel();

    t.true(result === expectedResult);
});

ava('.getArrivalRunwayAirportModel() returns the appropriate runway\'s AirportModel', (t) => {
    const model = new RouteModel('TNP.KEPEC3.KLAS07R');
    const expectedAirportIcao = 'klas';
    const result = model.getArrivalRunwayAirportModel();

    t.true(result instanceof AirportModel);
    t.true(result.icao === expectedAirportIcao);
});

ava('.getArrivalRunwayName() returns null when there is no STAR leg', (t) => {
    const model = new RouteModel(singleSidProcedureSegmentRouteStringMock);
    const expectedResult = null;
    const result = model.getArrivalRunwayName();

    t.true(result === expectedResult);
});

ava('.getArrivalRunwayName() returns the appropriate runway name', (t) => {
    const model = new RouteModel('TNP.KEPEC3.KLAS07R');
    const expectedResult = '07R';
    const result = model.getArrivalRunwayName();

    t.true(result === expectedResult);
});

ava('.getArrivalRunwayModel() returns null when there is no STAR leg', (t) => {
    const model = new RouteModel(singleSidProcedureSegmentRouteStringMock);
    const expectedResult = null;
    const result = model.getArrivalRunwayModel();

    t.true(result === expectedResult);
});

ava('.getArrivalRunwayModel() returns the appropriate RunwayModel', (t) => {
    const model = new RouteModel('TNP.KEPEC3.KLAS07R');
    const expectedRunwayName = '07R';
    const result = model.getArrivalRunwayModel();

    t.true(result.name === expectedRunwayName);
});

ava('.getBottomAltitude() returns -1 when there is no bottom altitude in the route', (t) => {
    const model = new RouteModel(singleDirectSegmentRouteStringMock);
    const expectedResult = -1;
    const result = model.getBottomAltitude();

    t.true(result === expectedResult);
});

ava('.getBottomAltitude() returns the lowest #altitudeMinimum of any LegModel in the #_legCollection', (t) => {
    const model = new RouteModel('TNP.KEPEC3.KLAS07R..DRK.ZIMBO1.KLAS07R');
    const expectedResult = 6000;
    const result = model.getBottomAltitude();

    t.true(result === expectedResult);
});

ava('.getDepartureRunwayAirportIcao() returns null if there is no SID leg', (t) => {
    const model = new RouteModel(singleStarProcedureSegmentRouteStringMock);
    const expectedResult = null;
    const result = model.getDepartureRunwayAirportIcao();

    t.true(result === expectedResult);
});

ava('.getDepartureRunwayAirportIcao() returns the appropriate runway\'s airport\'s ICAO identifier', (t) => {
    const model = new RouteModel('KLAS07R.BOACH6.TNP');
    const expectedResult = 'klas';
    const result = model.getDepartureRunwayAirportIcao();

    t.true(result === expectedResult);
});

ava('.getDepartureRunwayAirportModel() returns null when there is no SID leg', (t) => {
    const model = new RouteModel(singleStarProcedureSegmentRouteStringMock);
    const expectedResult = null;
    const result = model.getDepartureRunwayAirportModel();

    t.true(result === expectedResult);
});

ava('.getDepartureRunwayAirportModel() returns the appropriate runway\'s AirportModel', (t) => {
    const model = new RouteModel('KLAS07R.BOACH6.TNP');
    const expectedAirportIcao = 'klas';
    const result = model.getDepartureRunwayAirportModel();

    t.true(result instanceof AirportModel);
    t.true(result.icao === expectedAirportIcao);
});

ava('.getDepartureRunwayName() returns null when there is no SID leg', (t) => {
    const model = new RouteModel(singleStarProcedureSegmentRouteStringMock);
    const expectedResult = null;
    const result = model.getDepartureRunwayName();

    t.true(result === expectedResult);
});

ava('.getDepartureRunwayName() returns the appropriate runway name', (t) => {
    const model = new RouteModel('KLAS07R.BOACH6.TNP');
    const expectedResult = '07R';
    const result = model.getDepartureRunwayName();

    t.true(result === expectedResult);
});

ava('.getDepartureRunwayModel() returns null when there is no SID leg', (t) => {
    const model = new RouteModel(singleStarProcedureSegmentRouteStringMock);
    const expectedResult = null;
    const result = model.getDepartureRunwayModel();

    t.true(result === expectedResult);
});

ava('.getDepartureRunwayModel() returns the appropriate RunwayModel', (t) => {
    const model = new RouteModel('KLAS07R.BOACH6.TNP');
    const expectedRunwayName = '07R';
    const result = model.getDepartureRunwayModel();

    t.true(result.name === expectedRunwayName);
});

ava('.getFullRouteString() returns a route string for the entire route, including past legs, in dot notation', (t) => {
    const model = new RouteModel(nightmareRouteStringMock);

    model.skipToWaypointName('GUP');

    const result = model.getFullRouteString();

    t.true(result === nightmareRouteStringMock);
});

ava('.getFullRouteStringWithoutAirportsWithSpaces() returns the full route string, with airports removed, with spaces', (t) => {
    const model = new RouteModel(nightmareRouteStringMock);

    model.skipToWaypointName('GUP');

    const expectedResult = 'TNP KEPEC3 BOACH6 TNP OAL PGS TYSSN4 BOACH6 TNP GUP IGM';
    const result = model.getFullRouteStringWithoutAirportsWithSpaces();

    t.true(result === expectedResult);
});

ava('.getFullRouteStringWithSpaces() returns a route string for the entire route, including past legs, separated by spaces', (t) => {
    const model = new RouteModel(nightmareRouteStringMock);

    model.skipToWaypointName('GUP');

    const expectedResult = 'TNP KEPEC3 KLAS07R BOACH6 TNP OAL PGS TYSSN4 KLAS07R BOACH6 TNP GUP IGM';
    const result = model.getFullRouteStringWithSpaces();

    t.true(result === expectedResult);
});

ava('.getRouteString() returns a route string for the remaining legs only, in dot notation', (t) => {
    const model = new RouteModel(nightmareRouteStringMock);

    model.skipToWaypointName('GUP');

    const result = model.getRouteString();

    t.true(result === 'GUP..IGM');
});

ava('.getRouteStringWithSpaces() returns a route string for the remaining legs only, separated by spaces', (t) => {
    const model = new RouteModel(nightmareRouteStringMock);

    model.skipToWaypointName('GUP');

    const result = model.getRouteStringWithSpaces();

    t.true(result === 'GUP IGM');
});

ava('.getFlightPlanEntry() returns the exit fixname of a SID procedure', (t) => {
    const procedureRouteModel = new RouteModel(singleSidProcedureSegmentRouteStringMock);
    const expectedResult = 'TNP';
    const result = procedureRouteModel.getFlightPlanEntry();

    t.true(result === expectedResult);
});

ava('.getFlightPlanEntry() returns the exit fixname of the SID leg when part of a complex route', (t) => {
    const routeString = 'KLAS07R.BOACH6.TNP..OAL..COWBY';
    const fixRouteModel = new RouteModel(routeString);
    const expectedResult = 'TNP';
    const result = fixRouteModel.getFlightPlanEntry();

    t.true(result === expectedResult);
});

ava('.getFlightPlanEntry() returns first fix in route when no procedure is defined', (t) => {
    const fixRouteModel = new RouteModel(multiDirectSegmentRouteStringMock);
    const expectedResult = 'OAL';
    const result = fixRouteModel.getFlightPlanEntry();

    t.true(result === expectedResult);
});

ava('.getSidIcao() returns undefined when there is no SID leg in the route', (t) => {
    const model = new RouteModel(singleStarProcedureSegmentRouteStringMock);
    const result = model.getSidIcao();

    t.true(typeof result === 'undefined');
});

ava('.getSidIcao() returns the ICAO identifier for the SID procedure in the route', (t) => {
    const model = new RouteModel(complexRouteStringMock);
    const result = model.getSidIcao();

    t.true(result === 'BOACH6');
});

ava('.getSidName() returns undefined when there is no SID leg in the route', (t) => {
    const model = new RouteModel(singleStarProcedureSegmentRouteStringMock);
    const result = model.getSidName();

    t.true(typeof result === 'undefined');
});

ava('.getSidName() returns the spoken name of the SID procedure in the route', (t) => {
    const model = new RouteModel(complexRouteStringMock);
    const result = model.getSidName();

    t.true(result === 'Boach Six');
});

ava('.getStarIcao() returns undefined when there is no STAR leg in the route', (t) => {
    const model = new RouteModel(singleSidProcedureSegmentRouteStringMock);
    const result = model.getStarIcao();

    t.true(typeof result === 'undefined');
});

ava('.getStarIcao() returns the ICAO identifier for the STAR procedure in the route', (t) => {
    const model = new RouteModel(complexRouteStringMock);
    const result = model.getStarIcao();

    t.true(result === 'TYSSN4');
});

ava('.getStarName() returns undefined when there is no STAR leg in the route', (t) => {
    const model = new RouteModel(singleSidProcedureSegmentRouteStringMock);
    const result = model.getStarName();

    t.true(typeof result === 'undefined');
});

ava('.getStarName() returns the spoken name of the STAR procedure in the route', (t) => {
    const model = new RouteModel(complexRouteStringMock);
    const result = model.getStarName();

    t.true(result === 'Tyson Four');
});

ava('.getTopAltitude() returns -1 when there is no top altitude in the route', (t) => {
    const model = new RouteModel(singleDirectSegmentRouteStringMock);
    const expectedResult = -1;
    const result = model.getTopAltitude();

    t.true(result === expectedResult);
});

ava('.getTopAltitude() returns the highest #altitudeMaximum of any LegModel in the #_legCollection', (t) => {
    const model = new RouteModel('KLAS25R.BOACH6.HEC..KLAS25R.SHEAD9.KENNO');
    const expectedResult = 11000;
    const result = model.getTopAltitude();

    t.true(result === expectedResult);
});

ava('.hasNextLeg() returns false when the current leg is the last in the #_legCollection', (t) => {
    const model = new RouteModel(singleSidProcedureSegmentRouteStringMock);
    const result = model.hasNextLeg();

    t.false(result);
});

ava('.hasNextLeg() returns true when there is a leg in the #_legCollection after the current leg', (t) => {
    const model = new RouteModel(nightmareRouteStringMock);
    const result = model.hasNextLeg();

    t.true(result);
});

ava('.hasNextWaypoint() returns false when we are at the last waypoint of the last leg', (t) => {
    const model = new RouteModel(singleFixRouteStringMock);
    const result = model.hasNextWaypoint();

    t.false(result);
});

ava('.hasNextWaypoint() returns true when the current leg contains more waypoints', (t) => {
    const model = new RouteModel(singleSidProcedureSegmentRouteStringMock);
    const result = model.hasNextWaypoint();

    t.true(result);
});

ava('.hasNextWaypoint() returns true when we are at the last waypoint of a leg that is not the last leg', (t) => {
    const model = new RouteModel(multiDirectSegmentRouteStringMock);
    const result = model.hasNextWaypoint();

    t.true(result);
});

ava('.hasWaypointName() returns false when the specified waypoint is not in the route', (t) => {
    const model = new RouteModel('DVC');
    const result = model.hasWaypointName('MLF');

    t.false(result);
});

ava('.hasWaypointName() returns true when the specified waypoint is in the route', (t) => {
    const model = new RouteModel(singleSidProcedureSegmentRouteStringMock);
    const result = model.hasWaypointName('ZELMA');

    t.true(result);
});

ava('.isRunwayModelValidForSid() returns false if passed runway is not an instance of RunwayModel', (t) => {
    const model = new RouteModel(complexRouteStringMock);
    const airportModel = createAirportModelFixture();
    const runwayModel = airportModel.getRunway('00');
    const result = model.isRunwayModelValidForSid(runwayModel);

    t.false(result);
});

ava('.isRunwayModelValidForSid() returns true if the flight plan does not contain a SID', (t) => {
    const model = new RouteModel(multiDirectSegmentRouteStringMock);
    const airportModel = createAirportModelFixture();
    const runwayModel = airportModel.getRunway('01R');
    const result = model.isRunwayModelValidForSid(runwayModel);

    t.true(result);
});

ava('.isRunwayModelValidForSid() returns false if the specified runway exists and is not valid for the assigned SID', (t) => {
    const model = new RouteModel(complexRouteStringMock);
    const airportModel = createAirportModelFixture();
    const runwayModel = airportModel.getRunway('01R');
    const result = model.isRunwayModelValidForSid(runwayModel);

    t.false(result);
});

ava('.isRunwayModelValidForSid() returns true if the specified runway exists and is valid for the assigned SID', (t) => {
    const model = new RouteModel(complexRouteStringMock);
    const airportModel = createAirportModelFixture();
    const runwayModel = airportModel.getRunway('25R');
    const result = model.isRunwayModelValidForSid(runwayModel);

    t.true(result);
});

ava('.isRunwayModelValidForStar() returns false if passed runway is not an instance of RunwayModel', (t) => {
    const model = new RouteModel(complexRouteStringMock);
    const airportModel = createAirportModelFixture();
    const runwayModel = airportModel.getRunway('00');
    const result = model.isRunwayModelValidForStar(runwayModel);

    t.false(result);
});

ava('.isRunwayModelValidForStar() returns true if the flight plan does not contain a STAR', (t) => {
    const model = new RouteModel(multiDirectSegmentRouteStringMock);
    const airportModel = createAirportModelFixture();
    const runwayModel = airportModel.getRunway('01R');
    const result = model.isRunwayModelValidForStar(runwayModel);

    t.true(result);
});

ava('.isRunwayModelValidForStar() returns false if the specified runway exists and is not valid for the assigned STAR', (t) => {
    const model = new RouteModel(complexRouteStringMock);
    const airportModel = createAirportModelFixture();
    const runwayModel = airportModel.getRunway('01R');
    const result = model.isRunwayModelValidForStar(runwayModel);

    t.false(result);
});

ava('.isRunwayModelValidForStar() returns true if the specified runway exists and is valid for the assigned STAR', (t) => {
    const model = new RouteModel(complexRouteStringMock);
    const airportModel = createAirportModelFixture();
    const runwayModel = airportModel.getRunway('25R');
    const result = model.isRunwayModelValidForStar(runwayModel);

    t.true(result);
});

ava('.moveToNextWaypoint() calls #currentLeg.moveToNextWaypoint() when the current leg contains more waypoints', (t) => {
    const model = new RouteModel(singleSidProcedureSegmentRouteStringMock);
    const currentLegMoveToNextWaypointSpy = sinon.spy(model.currentLeg, 'moveToNextWaypoint');

    model.moveToNextWaypoint();

    t.true(currentLegMoveToNextWaypointSpy.calledWithExactly());
});

ava('.moveToNextWaypoint() calls .moveToNextLeg() when the current leg is at its last waypoint', (t) => {
    const model = new RouteModel(multiDirectSegmentRouteStringMock);
    const moveToNextLegSpy = sinon.spy(model, 'moveToNextLeg');

    model.moveToNextWaypoint();

    t.true(moveToNextLegSpy.calledWithExactly());
});

ava('.replaceArrivalProcedure() returns false when route string does not yield a valid leg', (t) => {
    const model = new RouteModel(singleFixRouteStringMock);
    const result = model.replaceArrivalProcedure('gobbledeegook');

    t.false(result);
    t.true(model.waypoints.length === 1);
});

ava('.replaceArrivalProcedure() appends specified STAR leg as the new last leg when no STAR leg previously existed', (t) => {
    const model = new RouteModel(singleFixRouteStringMock);
    const result = model.replaceArrivalProcedure(singleStarProcedureSegmentRouteStringMock);

    t.true(result);
    t.true(model.getRouteString() === `${singleFixRouteStringMock}..${singleStarProcedureSegmentRouteStringMock}`);
});

ava('.replaceArrivalProcedure() replaces STAR leg with a new one when the route already has a STAR leg', (t) => {
    const model = new RouteModel(singleStarProcedureSegmentRouteStringMock);
    const differentStarRouteStringMock = 'TNP.KEPEC3.KLAS25L';
    const result = model.replaceArrivalProcedure(differentStarRouteStringMock);

    t.true(result);
    t.true(model.getRouteString() === differentStarRouteStringMock);
});

ava('.replaceDepartureProcedure() returns false when route string does not yield a valid leg', (t) => {
    const expectedResponse = [false, 'requested route of "GOBBLEDEEGOOK" is invalid'];
    const model = new RouteModel(singleFixRouteStringMock);
    const response = model.replaceDepartureProcedure('gobbledeegook');

    t.deepEqual(response, expectedResponse);
    t.true(model.waypoints.length === 1);
});

ava('.replaceDepartureProcedure() appends specified SID leg as the new first leg when no SID leg previously existed', (t) => {
    const expectedResponse = [true, { log: 'rerouting to: KLAS19L TRALR6 DVC', say: 'rerouting as requested' }];
    const model = new RouteModel(singleFixRouteStringMock);
    const response = model.replaceDepartureProcedure('KLAS19L.TRALR6.DVC');

    t.deepEqual(response, expectedResponse);
    t.true(model.getRouteString() === 'KLAS19L.TRALR6.DVC');
});

ava('.replaceDepartureProcedure() replaces SID leg with a new one when the route already has a SID leg', (t) => {
    const expectedResponse = [true, { log: 'rerouting to: KLAS25L BOACH6 TNP', say: 'rerouting as requested' }];
    const model = new RouteModel(singleSidProcedureSegmentRouteStringMock);
    const differentSidRouteStringMock = 'KLAS25L.BOACH6.TNP';
    const response = model.replaceDepartureProcedure(differentSidRouteStringMock);

    t.deepEqual(response, expectedResponse);
    t.true(model.getRouteString() === differentSidRouteStringMock);
});

ava('.moveToNextLeg() returns early when we are at the last leg in the route', (t) => {
    const model = new RouteModel(singleSidProcedureSegmentRouteStringMock);

    model.moveToNextLeg();

    t.true(_isEmpty(model._previousLegCollection));
    t.true(model._legCollection.length === 1);
});

ava('.moveToNextLeg() moves the #currentLeg from the #_legCollection to the #_previousLegCollection', (t) => {
    const model = new RouteModel('OAL..TNP.KEPEC3.KLAS07R');

    t.true(model._previousLegCollection.length === 0);
    t.true(model._legCollection.length === 2);

    model.moveToNextLeg();

    t.true(model._previousLegCollection.length === 1);
    t.true(model._previousLegCollection[0].routeString === 'OAL');
    t.true(model._legCollection.length === 1);
    t.true(model._legCollection[0].routeString === 'TNP.KEPEC3.KLAS07R');
});

ava('.skipToWaypointName() returns false when the specified waypoint is not in the route', (t) => {
    const model = new RouteModel(singleStarProcedureSegmentRouteStringMock);
    const result = model.skipToWaypointName('gobbledeegook');

    t.false(result);
    t.true(model._legCollection.length === 1);
});

ava('.skipToWaypointName() calls #currentLeg.skipToWaypointName() when current leg contains the specified waypoint', (t) => {
    const model = new RouteModel(singleStarProcedureSegmentRouteStringMock);
    const currentLegSkipToWaypointNameSpy = sinon.spy(model.currentLeg, 'skipToWaypointName');
    const waypointNameToSkipTo = 'KEPEC';

    model.skipToWaypointName(waypointNameToSkipTo);

    t.true(currentLegSkipToWaypointNameSpy.calledWithExactly(waypointNameToSkipTo));
});

ava('.skipToWaypointName() moves appropriate legs/waypoints to previous collections when specified waypoint exists in a future leg', (t) => {
    const model = new RouteModel('OAL..TNP.KEPEC3.KLAS07R');

    model.skipToWaypointName('KEPEC');

    t.true(model._previousLegCollection.length === 1);
    t.true(model._previousLegCollection[0].routeString === 'OAL');
    t.true(model._legCollection.length === 1);
    t.true(model._legCollection[0].routeString === 'TNP.KEPEC3.KLAS07R');
    t.true(model._legCollection[0]._waypointCollection.length === 8);
    t.true(model._legCollection[0]._previousWaypointCollection.length === 5);
});

ava('.updateSidLegForDepartureRunwayModel() returns early when the route contains no SID leg to update', (t) => {
    const routeModel = new RouteModel('OAL..TNP');
    const airportModel = createAirportModelFixture();
    const nextRunwayName = '25L';
    const nextRunwayModel = airportModel.getRunway(nextRunwayName);
    const sidLegUpdateSidRunwaySpy = sinon.spy(routeModel._legCollection[0], 'updateSidLegForDepartureRunwayModel');

    routeModel.updateSidLegForDepartureRunwayModel(nextRunwayModel);

    t.true(sidLegUpdateSidRunwaySpy.notCalled);
});

ava('.updateSidLegForDepartureRunwayModel() calls LegModel.updateStarLegForArrivalRunwayModel() on the SID leg', (t) => {
    const routeModel = new RouteModel('KLAS07R.BOACH6.TNP');
    const airportModel = createAirportModelFixture();
    const nextRunwayName = '25L';
    const nextRunwayModel = airportModel.getRunway(nextRunwayName);
    const sidLegUpdateSidRunwaySpy = sinon.spy(routeModel._legCollection[0], 'updateSidLegForDepartureRunwayModel');

    routeModel.updateSidLegForDepartureRunwayModel(nextRunwayModel);

    t.true(sidLegUpdateSidRunwaySpy.calledWithExactly(nextRunwayModel));
});

ava('.updateStarLegForArrivalRunwayModel() returns early when the route contains no STAR leg to update', (t) => {
    const routeModel = new RouteModel('OAL..TNP');
    const airportModel = createAirportModelFixture();
    const nextRunwayName = '25L';
    const nextRunwayModel = airportModel.getRunway(nextRunwayName);
    const createAmendedStarLegSpy = sinon.spy(routeModel, '_createAmendedStarLegUsingDifferentExitName');

    const result = routeModel.updateStarLegForArrivalRunwayModel(nextRunwayModel);

    t.true(createAmendedStarLegSpy.notCalled);
    t.true(typeof result === 'undefined');
});

ava('.updateStarLegForArrivalRunwayModel() returns early when the runway is not valid for the current STAR', (t) => {
    const routeModel = new RouteModel('DRK.ZIMBO1.KLAS07R');
    const airportModel = createAirportModelFixture();
    const nextRunwayName = '25L';
    const nextRunwayModel = airportModel.getRunway(nextRunwayName);
    const createAmendedStarLegSpy = sinon.spy(routeModel, '_createAmendedStarLegUsingDifferentExitName');
    const result = routeModel.updateStarLegForArrivalRunwayModel(nextRunwayModel);

    t.true(createAmendedStarLegSpy.notCalled);
    t.true(typeof result === 'undefined');
});

ava('.updateStarLegForArrivalRunwayModel() replaces the STAR leg with a newly created one using the correct parameters', (t) => {
    const routeModel = new RouteModel('TNP.KEPEC3.KLAS07R');
    const airportModel = createAirportModelFixture();
    const nextRunwayName = '25L';
    const nextRunwayModel = airportModel.getRunway(nextRunwayName);
    const createAmendedStarLegSpy = sinon.spy(routeModel, '_createAmendedStarLegUsingDifferentExitName');
    const result = routeModel.updateStarLegForArrivalRunwayModel(nextRunwayModel);

    t.true(createAmendedStarLegSpy.calledWithExactly('KLAS25L', 0));
    t.true(typeof result === 'undefined');
});

ava('.reset() clears #_legCollection', (t) => {
    const model = new RouteModel(complexRouteStringMock);

    model.reset();

    t.true(_isArray(model._legCollection));
    t.true(model._legCollection.length === 0);
});

ava('._appendRouteModelBeginningAtWaypointName() throws when leg type is not airway/direct/SID/STAR', (t) => {
    const primaryModel = new RouteModel('CLARR..SKEBR..MDDOG..IPUMY');
    const otherModel = new RouteModel('SKEBR..CRESO..BLD');

    primaryModel._legCollection[1]._legType = 'nonsensical';

    t.throws(() => primaryModel._appendRouteModelBeginningAtWaypointName('SKEBR', otherModel));
});

ava('._appendRouteModelBeginningAtWaypointName() calls ._appendRouteModelOutOfAirwayLeg() when divergent leg is airway leg', (t) => {
    const primaryModel = new RouteModel('DAG.V394.LAS');
    const otherModel = new RouteModel('CLARR..TRREY..SOSOY');
    const primaryModelAppendRouteModelOutOfAirwayLegSpy = sinon.spy(primaryModel, '_appendRouteModelOutOfAirwayLeg');
    const expectedResult = [true, { log: 'rerouting to: DAG V394 CLARR TRREY SOSOY', say: 'rerouting as requested' }];
    const result = primaryModel._appendRouteModelBeginningAtWaypointName('CLARR', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModelAppendRouteModelOutOfAirwayLegSpy.calledWithExactly('CLARR', otherModel));
});

ava('._appendRouteModelBeginningAtWaypointName() calls ._appendRouteModelOutOfDirectLeg() when divergent leg is direct leg', (t) => {
    const primaryModel = new RouteModel('CLARR..SKEBR..MDDOG..IPUMY');
    const otherModel = new RouteModel('SKEBR..CRESO..BLD');
    const primaryModelAppendRouteModelOutOfDirectLegSpy = sinon.spy(primaryModel, '_appendRouteModelOutOfDirectLeg');
    const expectedResult = [true, { log: 'rerouting to: CLARR SKEBR CRESO BLD', say: 'rerouting as requested' }];
    const result = primaryModel._appendRouteModelBeginningAtWaypointName('SKEBR', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModelAppendRouteModelOutOfDirectLegSpy.calledWithExactly('SKEBR', otherModel));
});

ava('._appendRouteModelBeginningAtWaypointName() calls ._appendRouteModelOutOfSidLeg() when divergent leg is SID leg', (t) => {
    const primaryModel = new RouteModel('KLAS07R.BOACH6.HEC');
    const otherModel = new RouteModel('BOACH..SKEBR..TARRK');
    const primaryModelAppendRouteModelOutOfSidLegSpy = sinon.spy(primaryModel, '_appendRouteModelOutOfSidLeg');
    const expectedResult = [true, { log: 'rerouting to: JESJI BAKRR MINEY HITME BOACH SKEBR TARRK', say: 'rerouting as requested' }];
    const result = primaryModel._appendRouteModelBeginningAtWaypointName('BOACH', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModelAppendRouteModelOutOfSidLegSpy.calledWithExactly('BOACH', otherModel));
});

ava('._appendRouteModelBeginningAtWaypointName() calls ._appendRouteModelOutOfStarLeg() when divergent leg is STAR leg', (t) => {
    const primaryModel = new RouteModel('DVC.GRNPA1.KLAS07R');
    const otherModel = new RouteModel('LUXOR..WINDS..CRESO');
    const primaryModelAppendRouteModelOutOfStarLegSpy = sinon.spy(primaryModel, '_appendRouteModelOutOfStarLeg');
    const expectedResult = [true, { log: 'rerouting to: DVC BETHL HOLDM KSINO LUXOR WINDS CRESO', say: 'rerouting as requested' }];
    const result = primaryModel._appendRouteModelBeginningAtWaypointName('LUXOR', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModelAppendRouteModelOutOfStarLegSpy.calledWithExactly('LUXOR', otherModel));
});

ava('._appendRouteModelOutOfAirwayLeg() correctly places RouteModel and adjusts airway exit', (t) => {
    const primaryModel = new RouteModel('DAG.V394.LAS');
    const otherModel = new RouteModel('CLARR..TRREY..SOSOY');
    const expectedResult = [true, { log: 'rerouting to: DAG V394 CLARR TRREY SOSOY', say: 'rerouting as requested' }];
    const result = primaryModel._appendRouteModelOutOfAirwayLeg('CLARR', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModel._legCollection.length === 4);
    t.true(primaryModel._legCollection[0].routeString === 'DAG.V394.CLARR');
    t.true(primaryModel._legCollection[1].routeString === 'CLARR');
    t.true(primaryModel._legCollection[2].routeString === 'TRREY');
    t.true(primaryModel._legCollection[3].routeString === 'SOSOY');
});

ava('._appendRouteModelOutOfDirectLeg() correctly places RouteModel', (t) => {
    const primaryModel = new RouteModel('CLARR..SKEBR..MDDOG..IPUMY');
    const otherModel = new RouteModel('SKEBR..CRESO..BLD');
    const expectedResult = [true, { log: 'rerouting to: CLARR SKEBR CRESO BLD', say: 'rerouting as requested' }];
    const result = primaryModel._appendRouteModelOutOfDirectLeg('SKEBR', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModel._legCollection.length === 4);
    t.true(primaryModel._legCollection[0].routeString === 'CLARR');
    t.true(primaryModel._legCollection[1].routeString === 'SKEBR');
    t.true(primaryModel._legCollection[2].routeString === 'CRESO');
    t.true(primaryModel._legCollection[3].routeString === 'BLD');
});

ava('._appendRouteModelOutOfSidLeg() correctly places RouteModel and explodes remaining SID waypoints into legs', (t) => {
    const primaryModel = new RouteModel('KLAS07R.BOACH6.HEC');
    const otherModel = new RouteModel('BOACH..SKEBR..TARRK');
    const expectedResult = [true, { log: 'rerouting to: JESJI BAKRR MINEY HITME BOACH SKEBR TARRK', say: 'rerouting as requested' }];
    const result = primaryModel._appendRouteModelOutOfSidLeg('BOACH', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModel._legCollection.length === 7);
    t.true(primaryModel._legCollection[0].routeString === 'JESJI');
    t.true(primaryModel._legCollection[1].routeString === 'BAKRR');
    t.true(primaryModel._legCollection[2].routeString === 'MINEY');
    t.true(primaryModel._legCollection[3].routeString === 'HITME');
    t.true(primaryModel._legCollection[4].routeString === 'BOACH');
    t.true(primaryModel._legCollection[5].routeString === 'SKEBR');
    t.true(primaryModel._legCollection[6].routeString === 'TARRK');
});

ava('._appendRouteModelOutOfStarLeg() correctly places RouteModel and changes STAR exit when divergent fix is a valid exit', (t) => {
    const primaryModel = new RouteModel('BCE.GRNPA1.KLAS07R');
    const otherModel = new RouteModel('DUBLX..PRINO..RELIN');
    const expectedResult = [true, { log: 'rerouting to: BCE GRNPA1 DUBLX PRINO RELIN', say: 'rerouting as requested' }];
    const result = primaryModel._appendRouteModelOutOfStarLeg('DUBLX', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModel._legCollection.length === 4);
    t.true(primaryModel._legCollection[0].routeString === 'BCE.GRNPA1.DUBLX');
    t.true(primaryModel._legCollection[1].routeString === 'DUBLX');
    t.true(primaryModel._legCollection[2].routeString === 'PRINO');
    t.true(primaryModel._legCollection[3].routeString === 'RELIN');
});

ava('._appendRouteModelOutOfStarLeg() correctly places RouteModel and explodes remaining STAR waypoints into legs', (t) => {
    const primaryModel = new RouteModel('DVC.GRNPA1.KLAS07R');
    const otherModel = new RouteModel('LUXOR..WINDS..CRESO');
    const expectedResult = [true, { log: 'rerouting to: DVC BETHL HOLDM KSINO LUXOR WINDS CRESO', say: 'rerouting as requested' }];
    const result = primaryModel._appendRouteModelOutOfStarLeg('LUXOR', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModel._legCollection.length === 7);
    t.true(primaryModel._legCollection[0].routeString === 'DVC');
    t.true(primaryModel._legCollection[1].routeString === 'BETHL');
    t.true(primaryModel._legCollection[2].routeString === 'HOLDM');
    t.true(primaryModel._legCollection[3].routeString === 'KSINO');
    t.true(primaryModel._legCollection[4].routeString === 'LUXOR');
    t.true(primaryModel._legCollection[5].routeString === 'WINDS');
    t.true(primaryModel._legCollection[6].routeString === 'CRESO');
});

ava.todo('._combineRouteStrings()');

ava('._createAmendedAirwayLegUsingDifferentEntryName() returns a new LegModel with the same airway and exit, with new specified entry', (t) => {
    const model = new RouteModel('CHRLT.V394.LAS');
    const nextEntryFixName = 'CLARR';
    const legIndex = 0;
    const result = model._createAmendedAirwayLegUsingDifferentEntryName(nextEntryFixName, legIndex);

    t.true(result instanceof LegModel);
    t.true(result.routeString === 'CLARR.V394.LAS');
});

ava('._createAmendedAirwayLegUsingDifferentExitName() returns a new LegModel with same airway and entry, with new specified exit', (t) => {
    const model = new RouteModel('DAG.V394.LAS');
    const nextExitFixName = 'CLARR';
    const legIndex = 0;
    const result = model._createAmendedAirwayLegUsingDifferentExitName(nextExitFixName, legIndex);

    t.true(result instanceof LegModel);
    t.true(result.routeString === 'DAG.V394.CLARR');
});

ava('._createAmendedConvergentLeg() throws when leg is not an airway/direct/SID/STAR leg', (t) => {
    const model = new RouteModel('DAG.V394.LAS');
    const waypointName = 'CLARR';
    const legIndex = 0;

    model._legCollection[legIndex]._legType = 'nonsensical';

    t.throws(() => model._createAmendedConvergentLeg(legIndex, waypointName));
});

ava('._createAmendedConvergentLeg() calls ._createAmendedAirwayLegUsingDifferentEntryName() when leg is an airway leg', (t) => {
    const model = new RouteModel('CHRLT.V394.LAS');
    const waypointName = 'CLARR';
    const legIndex = 0;
    const expectedResult = [model._createAmendedAirwayLegUsingDifferentEntryName(waypointName, legIndex)];
    const createAmendedAirwayLegUsingDifferentEntryNameSpy = sinon.spy(model, '_createAmendedAirwayLegUsingDifferentEntryName');
    const result = model._createAmendedConvergentLeg(legIndex, waypointName);

    t.true(createAmendedAirwayLegUsingDifferentEntryNameSpy.calledWithExactly(waypointName, legIndex));
    t.deepEqual(result, expectedResult);
});

ava('._createAmendedConvergentLeg() returns an empty array when leg is a direct leg', (t) => {
    const model = new RouteModel('CLARR');
    const waypointName = 'CLARR';
    const legIndex = 0;
    const result = model._createAmendedConvergentLeg(legIndex, waypointName);

    t.deepEqual(result, []);
});

ava('._createAmendedConvergentLeg() returns the leg unmodified when convergent waypoint is the SID leg\'s first fix', (t) => {
    const model = new RouteModel('KLAS07R.BOACH6.HEC');
    const waypointName = 'JESJI';
    const legIndex = 0;
    const result = model._createAmendedConvergentLeg(legIndex, waypointName);
    const expectedWaypointNames = ['JESJI', 'BAKRR', 'MINEY', 'HITME', 'BOACH', 'HEC'];
    const waypointNames = _map(result[0].waypoints, (waypointModel) => waypointModel.name);

    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createAmendedConvergentLeg() calls ._createLegsFromSidWaypointsAfterWaypointName() when leg is a SID leg', (t) => {
    const model = new RouteModel('KLAS07R.BOACH6.HEC');
    const waypointName = 'HITME';
    const legIndex = 0;
    const createLegsFromSidWaypointsAfterWaypointNameSpy = sinon.spy(model, '_createLegsFromSidWaypointsAfterWaypointName');
    const result = model._createAmendedConvergentLeg(legIndex, waypointName);
    const waypointNames = result.reduce((names, legModel) => {
        return [...names, ...legModel.waypoints.map(waypointModel => waypointModel.name)];
    }, []);
    const expectedWaypointNames = ['BOACH', 'HEC'];

    t.true(createLegsFromSidWaypointsAfterWaypointNameSpy.calledWithExactly(waypointName, legIndex));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createAmendedConvergentLeg() returns the leg unmodified when convergent waypoint is the STAR leg\'s first fix', (t) => {
    const model = new RouteModel('DVC.GRNPA1.KLAS07R');
    const waypointName = 'DVC';
    const legIndex = 0;
    const expectedWaypointNames = ['DVC', 'BETHL', 'HOLDM', 'KSINO', 'LUXOR', 'GRNPA', 'DUBLX', 'FRAWG', 'TRROP', 'LEMNZ'];
    const result = model._createAmendedConvergentLeg(legIndex, waypointName);
    const waypointNames = result.reduce((names, legModel) => {
        return [...names, ...legModel.waypoints.map(waypointModel => waypointModel.name)];
    }, []);

    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createAmendedConvergentLeg() calls ._createAmendedStarLegUsingDifferentEntryName() when leg is a STAR leg and convergent waypoint is a valid STAR entry', (t) => {
    const model = new RouteModel('DVC.GRNPA1.KLAS07R');
    const waypointName = 'BETHL';
    const legIndex = 0;
    const createAmendedStarLegUsingDifferentEntryNameSpy = sinon.spy(model, '_createAmendedStarLegUsingDifferentEntryName');
    const expectedWaypointNames = ['BETHL', 'HOLDM', 'KSINO', 'LUXOR', 'GRNPA', 'DUBLX', 'FRAWG', 'TRROP', 'LEMNZ'];
    const result = model._createAmendedConvergentLeg(legIndex, waypointName);
    const waypointNames = result.reduce((names, legModel) => {
        return [...names, ...legModel.waypoints.map(waypointModel => waypointModel.name)];
    }, []);

    t.true(createAmendedStarLegUsingDifferentEntryNameSpy.calledWithExactly(waypointName, legIndex));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createAmendedConvergentLeg() calls ._createLegsFromStarWaypointsAfterWaypointName() when leg is a STAR leg and convergent waypoint is a valid STAR entry', (t) => {
    const model = new RouteModel('DVC.GRNPA1.KLAS07R');
    const waypointName = 'FRAWG';
    const legIndex = 0;
    // const expectedResult = model._createLegsFromStarWaypointsAfterWaypointName(waypointName, legIndex);
    const createLegsFromStarWaypointsAfterWaypointNameSpy = sinon.spy(model, '_createLegsFromStarWaypointsAfterWaypointName');
    const expectedWaypointNames = ['TRROP', 'LEMNZ'];
    const result = model._createAmendedConvergentLeg(legIndex, waypointName);
    const waypointNames = result.reduce((names, legModel) => {
        return [...names, ...legModel.waypoints.map(waypointModel => waypointModel.name)];
    }, []);

    t.true(createLegsFromStarWaypointsAfterWaypointNameSpy.calledWithExactly(waypointName, legIndex));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createAmendedDivergentLeg() throws when leg is not an airway/direct/SID/STAR leg', (t) => {
    const model = new RouteModel('DAG.V394.LAS');
    const waypointName = 'CLARR';
    const legIndex = 0;

    model._legCollection[legIndex]._legType = 'nonsensical';

    t.throws(() => model._createAmendedDivergentLeg(legIndex, waypointName));
});

ava('._createAmendedDivergentLeg() calls ._createAmendedAirwayLegUsingDifferentExitName() when leg is an airway leg', (t) => {
    const model = new RouteModel('DAG.V394.LAS');
    const waypointName = 'CLARR';
    const legIndex = 0;
    const createAmendedAirwayLegUsingDifferentExitNameSpy = sinon.spy(model, '_createAmendedAirwayLegUsingDifferentExitName');
    const expectedWaypointNames = ['DAG', 'DISBE', 'CHRLT', 'CLARR'];
    const result = model._createAmendedDivergentLeg(legIndex, waypointName);
    const waypointNames = result.reduce((names, legModel) => {
        return [...names, ...legModel.waypoints.map(waypointModel => waypointModel.name)];
    }, []);

    t.true(createAmendedAirwayLegUsingDifferentExitNameSpy.calledWithExactly(waypointName, legIndex));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createAmendedDivergentLeg() returns an empty array when leg is a direct leg', (t) => {
    const model = new RouteModel('CLARR');
    const waypointName = 'CLARR';
    const legIndex = 0;
    const result = model._createAmendedDivergentLeg(legIndex, waypointName);

    t.deepEqual(result, []);
});

ava('._createAmendedDivergentLeg() returns the leg unmodified when divergent waypoint is the SID leg\'s last fix', (t) => {
    const model = new RouteModel('KLAS07R.BOACH6.HEC');
    const waypointName = 'HEC';
    const legIndex = 0;
    const expectedWaypointNames = ['JESJI', 'BAKRR', 'MINEY', 'HITME', 'BOACH', 'HEC'];
    const result = model._createAmendedDivergentLeg(legIndex, waypointName);
    const waypointNames = result.reduce((names, legModel) => {
        return [...names, ...legModel.waypoints.map(waypointModel => waypointModel.name)];
    }, []);

    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createAmendedDivergentLeg() calls ._createLegsFromSidWaypointsBeforeWaypointName() when leg is a SID leg', (t) => {
    const model = new RouteModel('KLAS07R.BOACH6.HEC');
    const waypointName = 'BOACH';
    const legIndex = 0;
    // const expectedResult = model._createLegsFromSidWaypointsBeforeWaypointName(waypointName, legIndex);
    const createLegsFromSidWaypointsBeforeWaypointNameSpy = sinon.spy(model, '_createLegsFromSidWaypointsBeforeWaypointName');
    const expectedWaypointNames = ['JESJI', 'BAKRR', 'MINEY', 'HITME'];
    const result = model._createAmendedDivergentLeg(legIndex, waypointName);
    const waypointNames = result.reduce((names, legModel) => {
        return [...names, ...legModel.waypoints.map(waypointModel => waypointModel.name)];
    }, []);

    t.true(createLegsFromSidWaypointsBeforeWaypointNameSpy.calledWithExactly(waypointName, legIndex));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createAmendedDivergentLeg() returns the leg unmodified when divergent waypoint is the STAR leg\'s last fix', (t) => {
    const model = new RouteModel('BCE.GRNPA1.KLAS07R');
    const waypointName = 'LEMNZ';
    const legIndex = 0;
    // const expectedResult = [model._legCollection[legIndex]];
    const expectedWaypointNames = ['BCE', 'KSINO', 'LUXOR', 'GRNPA', 'DUBLX', 'FRAWG', 'TRROP', 'LEMNZ'];
    const result = model._createAmendedDivergentLeg(legIndex, waypointName);
    const waypointNames = result.reduce((names, legModel) => {
        return [...names, ...legModel.waypoints.map(waypointModel => waypointModel.name)];
    }, []);

    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createAmendedDivergentLeg() calls ._createAmendedStarLegUsingDifferentExitName() when leg is a STAR leg and convergent waypoint is a valid STAR entry', (t) => {
    const model = new RouteModel('BCE.GRNPA1.KLAS07R');
    const waypointName = 'DUBLX';
    const legIndex = 0;
    // const expectedResult = [model._createAmendedStarLegUsingDifferentExitName(waypointName, legIndex)];
    const createAmendedStarLegUsingDifferentExitNameSpy = sinon.spy(model, '_createAmendedStarLegUsingDifferentExitName');
    const expectedWaypointNames = ['BCE', 'KSINO', 'LUXOR', 'GRNPA', 'DUBLX'];
    const result = model._createAmendedDivergentLeg(legIndex, waypointName);
    const waypointNames = result.reduce((names, legModel) => {
        return [...names, ...legModel.waypoints.map(waypointModel => waypointModel.name)];
    }, []);

    t.true(createAmendedStarLegUsingDifferentExitNameSpy.calledWithExactly(waypointName, legIndex));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createAmendedDivergentLeg() calls ._createLegsFromStarWaypointsBeforeWaypointName() when leg is a STAR leg and convergent waypoint is a valid STAR entry', (t) => {
    const model = new RouteModel('DVC.GRNPA1.KLAS07R');
    const waypointName = 'LUXOR';
    const legIndex = 0;
    // const expectedResult = model._createLegsFromStarWaypointsBeforeWaypointName(waypointName, legIndex);
    const createLegsFromStarWaypointsBeforeWaypointNameSpy = sinon.spy(model, '_createLegsFromStarWaypointsBeforeWaypointName');
    const expectedWaypointNames = ['DVC', 'BETHL', 'HOLDM', 'KSINO'];
    const result = model._createAmendedDivergentLeg(legIndex, waypointName);
    const waypointNames = result.reduce((names, legModel) => {
        return [...names, ...legModel.waypoints.map(waypointModel => waypointModel.name)];
    }, []);

    t.true(createLegsFromStarWaypointsBeforeWaypointNameSpy.calledWithExactly(waypointName, legIndex));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createLegsFromSidWaypointsAfterWaypointName() returns an array of LegModels, one for each WaypointModel in the SID, after the specified one', (t) => {
    const model = new RouteModel('KLAS07R.BOACH6.HEC');
    const nextEntryFixName = 'HITME';
    const legIndex = 0;
    const result = model._createLegsFromSidWaypointsAfterWaypointName(nextEntryFixName, legIndex);
    const expectedWaypointNames = ['BOACH', 'HEC'];
    const waypointNames = _map(result, (legModel) => legModel.routeString);

    t.true(result.every((legModel) => legModel instanceof LegModel));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createLegsFromSidWaypointsBeforeWaypointName() returns an array of LegModels, one for each WaypointModel in the SID, before the specified one', (t) => {
    const model = new RouteModel('KLAS07R.BOACH6.HEC');
    const nextExitFixName = 'BOACH';
    const legIndex = 0;
    const result = model._createLegsFromSidWaypointsBeforeWaypointName(nextExitFixName, legIndex);
    const expectedWaypointNames = ['JESJI', 'BAKRR', 'MINEY', 'HITME'];
    const waypointNames = _map(result, (legModel) => legModel.routeString);

    t.true(result.every((legModel) => legModel instanceof LegModel));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createLegsFromStarWaypointsAfterWaypointName() returns an array of LegModels, one for each WaypointModel in the STAR, after the specified one', (t) => {
    const model = new RouteModel('DVC.GRNPA1.KLAS07R');
    const nextEntryFixName = 'FRAWG';
    const legIndex = 0;
    const result = model._createLegsFromStarWaypointsAfterWaypointName(nextEntryFixName, legIndex);
    const expectedWaypointNames = ['TRROP', 'LEMNZ'];
    const waypointNames = _map(result, (legModel) => legModel.routeString);

    t.true(result.every((legModel) => legModel instanceof LegModel));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createLegsFromStarWaypointsBeforeWaypointName() returns an array of LegModels, one for each WaypointModel in the STAR, before the specified one', (t) => {
    const model = new RouteModel('DVC.GRNPA1.KLAS07R');
    const nextExitFixName = 'LUXOR';
    const legIndex = 0;
    const result = model._createLegsFromStarWaypointsBeforeWaypointName(nextExitFixName, legIndex);
    const expectedWaypointNames = ['DVC', 'BETHL', 'HOLDM', 'KSINO'];
    const waypointNames = _map(result, (legModel) => legModel.routeString);

    t.true(result.every((legModel) => legModel instanceof LegModel));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._createAmendedStarLegUsingDifferentEntryName() returns a new LegModel with the same STAR and exit, with new specified entry', (t) => {
    const model = new RouteModel('DVC.GRNPA1.KLAS07R');
    const nextEntryFixName = 'BETHL';
    const legIndex = 0;
    const result = model._createAmendedStarLegUsingDifferentEntryName(nextEntryFixName, legIndex);

    t.true(result instanceof LegModel);
    t.true(result.routeString === 'BETHL.GRNPA1.KLAS07R');
});

ava('._createAmendedStarLegUsingDifferentExitName returns a new LegModel with the same STAR and entry, with new specified exit', (t) => {
    const model = new RouteModel('BCE.GRNPA1.KLAS07R');
    const nextExitFixName = 'DUBLX';
    const legIndex = 0;
    const result = model._createAmendedStarLegUsingDifferentExitName(nextExitFixName, legIndex);

    t.true(result instanceof LegModel);
    t.true(result.routeString === 'BCE.GRNPA1.DUBLX');
});

ava.todo('._createLegModelsFromWaypointModels()');

ava.todo('._divideRouteStringIntoSegments()');

ava.todo('._findConvergentWaypointNameWithRouteModel()');

ava.todo('._findIndexOfLegContainingWaypointName()');

ava.todo('._findSidLegIndex()');
ava.todo('._findSidLeg()');

ava.todo('._findStarLegIndex()');

ava.todo('._generateLegsFromRouteString()');

ava('._getPastAndPresentLegModels() returns #_previousLegCollection concatenated with #_legCollection', (t) => {
    const model = new RouteModel(nightmareRouteStringMock);

    model.skipToWaypointName('GUP');

    const expectedResult = [
        ...model._previousLegCollection,
        ...model._legCollection
    ];
    const result = model._getPastAndPresentLegModels();

    t.deepEqual(result, expectedResult);
});

ava('._overwriteRouteBetweenWaypointNames() adjusts divergent/convergent legs and replaces middle content correctly', (t) => {
    const primaryModel = new RouteModel('KLAS07R.TRALR6.BCE.J11.DRK');
    const otherModel = new RouteModel('BCE..NAVHO');
    const expectedResult = [true, { log: 'rerouting to: KLAS07R TRALR6 BCE NAVHO J11 DRK', say: 'rerouting as requested' }];
    const result = primaryModel._overwriteRouteBetweenWaypointNames('BCE', 'NAVHO', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModel._legCollection.length === 4);
    t.true(primaryModel._legCollection[0].routeString === 'KLAS07R.TRALR6.BCE');
    t.true(primaryModel._legCollection[1].routeString === 'BCE');
    t.true(primaryModel._legCollection[2].routeString === 'NAVHO');
    t.true(primaryModel._legCollection[3].routeString === 'NAVHO.J11.DRK');
});

ava('._prependRouteModelEndingAtWaypointName() throws when leg type is not airway/direct/SID/STAR', (t) => {
    const primaryModel = new RouteModel('CLARR..SKEBR..MDDOG..IPUMY');
    const otherModel = new RouteModel('BOACH..MDDOG');

    primaryModel._legCollection[2]._legType = 'nonsensical';

    t.throws(() => primaryModel._prependRouteModelEndingAtWaypointName('MDDOG', otherModel));
});

ava('._prependRouteModelEndingAtWaypointName() calls ._prependRouteModelIntoAirwayLeg() when convergent leg is airway leg', (t) => {
    const primaryModel = new RouteModel('CHRLT.V394.LAS');
    const otherModel = new RouteModel('GFS..WHIGG..CLARR');
    const primaryModelPrependRouteModelIntoAirwayLegSpy = sinon.spy(primaryModel, '_prependRouteModelIntoAirwayLeg');
    const expectedResult = [true, { log: 'rerouting to: GFS WHIGG CLARR V394 LAS', say: 'rerouting as requested' }];
    const result = primaryModel._prependRouteModelEndingAtWaypointName('CLARR', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModelPrependRouteModelIntoAirwayLegSpy.calledWithExactly('CLARR', otherModel));
});

ava('._prependRouteModelEndingAtWaypointName() calls ._prependRouteModelIntoDirectLeg() when convergent leg is direct leg', (t) => {
    const primaryModel = new RouteModel('CLARR..SKEBR..MDDOG..IPUMY');
    const otherModel = new RouteModel('BOACH..MDDOG');
    const primaryModelPrependRouteModelIntoDirectLegSpy = sinon.spy(primaryModel, '_prependRouteModelIntoDirectLeg');
    const expectedResult = [true, { log: 'rerouting to: BOACH MDDOG IPUMY', say: 'rerouting as requested' }];
    const result = primaryModel._prependRouteModelEndingAtWaypointName('MDDOG', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModelPrependRouteModelIntoDirectLegSpy.calledWithExactly('MDDOG', otherModel));
});

ava('._prependRouteModelEndingAtWaypointName() calls ._prependRouteModelIntoSidLeg() when convergent leg is SID leg', (t) => {
    const primaryModel = new RouteModel('KLAS07R.BOACH6.HEC');
    const otherModel = new RouteModel('IPUMY..HITME');
    const primaryModelPrependRouteModelIntoSidLegSpy = sinon.spy(primaryModel, '_prependRouteModelIntoSidLeg');
    const expectedResult = [true, { log: 'rerouting to: IPUMY HITME BOACH HEC', say: 'rerouting as requested' }];
    const result = primaryModel._prependRouteModelEndingAtWaypointName('HITME', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModelPrependRouteModelIntoSidLegSpy.calledWithExactly('HITME', otherModel));
});

ava('._prependRouteModelEndingAtWaypointName() calls ._prependRouteModelIntoStarLeg() when convergent leg is STAR leg', (t) => {
    const primaryModel = new RouteModel('DVC.GRNPA1.KLAS07R');
    const otherModel = new RouteModel('GUP..PGA..BETHL');
    const primaryModelPrependRouteModelIntoStarLegSpy = sinon.spy(primaryModel, '_prependRouteModelIntoStarLeg');
    const expectedResult = [true, { log: 'rerouting to: GUP PGA BETHL GRNPA1 KLAS07R', say: 'rerouting as requested' }];
    const result = primaryModel._prependRouteModelEndingAtWaypointName('BETHL', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModelPrependRouteModelIntoStarLegSpy.calledWithExactly('BETHL', otherModel));
});

ava('._prependRouteModelIntoAirwayLeg() correctly places RouteModel and adjusts airway entry', (t) => {
    const primaryModel = new RouteModel('CHRLT.V394.LAS');
    const otherModel = new RouteModel('GFS..WHIGG..CLARR');
    const expectedResult = [true, { log: 'rerouting to: GFS WHIGG CLARR V394 LAS', say: 'rerouting as requested' }];
    const result = primaryModel._prependRouteModelIntoAirwayLeg('CLARR', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModel._legCollection.length === 4);
    t.true(primaryModel._legCollection[0].routeString === 'GFS');
    t.true(primaryModel._legCollection[1].routeString === 'WHIGG');
    t.true(primaryModel._legCollection[2].routeString === 'CLARR');
    t.true(primaryModel._legCollection[3].routeString === 'CLARR.V394.LAS');
});

ava('._prependRouteModelIntoDirectLeg() correctly places RouteModel', (t) => {
    const primaryModel = new RouteModel('CLARR..SKEBR..MDDOG..IPUMY');
    const otherModel = new RouteModel('BOACH..MDDOG');
    const expectedResult = [true, { log: 'rerouting to: BOACH MDDOG IPUMY', say: 'rerouting as requested' }];
    const result = primaryModel._prependRouteModelIntoDirectLeg('MDDOG', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModel._legCollection.length === 3);
    t.true(primaryModel._legCollection[0].routeString === 'BOACH');
    t.true(primaryModel._legCollection[1].routeString === 'MDDOG');
    t.true(primaryModel._legCollection[2].routeString === 'IPUMY');
});

ava('._prependRouteModelIntoSidLeg() correctly places RouteModel and explodes remaining SID waypoints into legs', (t) => {
    const primaryModel = new RouteModel('KLAS07R.BOACH6.HEC');
    const otherModel = new RouteModel('IPUMY..HITME');
    const expectedResult = [true, { log: 'rerouting to: IPUMY HITME BOACH HEC', say: 'rerouting as requested' }];
    const result = primaryModel._prependRouteModelIntoSidLeg('HITME', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModel._legCollection.length === 4);
    t.true(primaryModel._legCollection[0].routeString === 'IPUMY');
    t.true(primaryModel._legCollection[1].routeString === 'HITME');
    t.true(primaryModel._legCollection[2].routeString === 'BOACH');
    t.true(primaryModel._legCollection[3].routeString === 'HEC');
});

ava('._prependRouteModelIntoStarLeg() correctly places RouteModel and changes STAR entry when route ends at an entry', (t) => {
    const primaryModel = new RouteModel('DVC.GRNPA1.KLAS07R');
    const otherModel = new RouteModel('GUP..PGA..BETHL');
    const expectedResult = [true, { log: 'rerouting to: GUP PGA BETHL GRNPA1 KLAS07R', say: 'rerouting as requested' }];
    const result = primaryModel._prependRouteModelIntoStarLeg('BETHL', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModel._legCollection.length === 4);
    t.true(primaryModel._legCollection[0].routeString === 'GUP');
    t.true(primaryModel._legCollection[1].routeString === 'PGA');
    t.true(primaryModel._legCollection[2].routeString === 'BETHL');
    t.true(primaryModel._legCollection[3].routeString === 'BETHL.GRNPA1.KLAS07R');
});

ava('._prependRouteModelIntoStarLeg() correctly places RouteModel and explodes remaining STAR waypoints into legs', (t) => {
    const primaryModel = new RouteModel('DVC.GRNPA1.KLAS07R');
    const otherModel = new RouteModel('PGA..FRAWG');
    const expectedResult = [true, { log: 'rerouting to: PGA FRAWG TRROP LEMNZ', say: 'rerouting as requested' }];
    const result = primaryModel._prependRouteModelIntoStarLeg('FRAWG', otherModel);

    t.deepEqual(result, expectedResult);
    t.true(primaryModel._legCollection.length === 4);
    t.true(primaryModel._legCollection[0].routeString === 'PGA');
    t.true(primaryModel._legCollection[1].routeString === 'FRAWG');
    t.true(primaryModel._legCollection[2].routeString === 'TRROP');
    t.true(primaryModel._legCollection[3].routeString === 'LEMNZ');
});
