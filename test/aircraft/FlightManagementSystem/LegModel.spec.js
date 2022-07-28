import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import _map from 'lodash/map';
import AirportModel from '../../../src/assets/scripts/client/airport/AirportModel';
import AirwayModel from '../../../src/assets/scripts/client/navigationLibrary/AirwayModel';
import LegModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/LegModel';
import ProcedureModel from '../../../src/assets/scripts/client/navigationLibrary/ProcedureModel';
// import NavigationLibrary from '../../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../../airport/_mocks/airportJsonMock';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';
import {
    LEG_TYPE,
    PROCEDURE_TYPE
} from '../../../src/assets/scripts/client/constants/routeConstants';

// const holdRouteStringMock = '@COWBY';
// const directRouteStringMockMock = 'COWBY';
// const cowbyFixFixture = navigationLibraryFixture.findFixByName('COWBY');
// const arrivalProcedureRouteStringMock = 'DAG.KEPEC3.KLAS25R';
// const departureProcedureRouteStringMock = 'KLAS25R.COWBY6.DRK';
// const runwayMock = '25R';
// const arrivalFlightPhaseMock = 'CRUISE';
// const departureFlightPhaseMock = 'APRON';

const airwayRouteStringMock = 'CHRLT.V394.LAS';
const directRouteStringMock = 'PGS';
const sidRouteStringMock = 'KLAS25R.BOACH6.TNP';
const shortSidRouteStringMock = 'KLAS07R.TRALR6.MLF';
const starRouteStringMock = 'DAG.KEPEC3.KLAS19R';

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('throws when instantiated with invalid parameters', (t) => {
    t.throws(() => new LegModel());
});

ava('throws when instantiated with route string that should be two separate legs', (t) => {
    const procedureThenDirectRouteString = 'KLAS25R.COWBY6.DRK..PXR';
    const doubleDirectRouteString = 'PGS..DRK';
    const doubleProcedureRouteString = 'KLAS25R.COWBY6.DRK.TYSSN4.KLAS25R';
    const directThenProcedureRouteString = 'PXR..DAG.KEPEC1.KLAS';

    t.throws(() => new LegModel(procedureThenDirectRouteString));
    t.throws(() => new LegModel(doubleDirectRouteString));
    t.throws(() => new LegModel(doubleProcedureRouteString));
    t.throws(() => new LegModel(directThenProcedureRouteString));
});

ava('throws when instantiated with airway route string with airway not defined in navigation library', (t) => {
    const routeStringWithInvalidProcedure = 'KLAS25R.BOACH0.TNP';

    t.throws(() => new LegModel(routeStringWithInvalidProcedure));
});

ava('throws when instantiated with procedure route string with procedure not defined in navigation library', (t) => {
    const routeStringWithInvalidProcedure = 'KLAS25R.BOACH0.TNP';

    t.throws(() => new LegModel(routeStringWithInvalidProcedure));
});

ava('instantiates correctly when given a single airway leg\'s route string', (t) => {
    const model = new LegModel(airwayRouteStringMock);

    t.true(model._airwayModel instanceof AirwayModel);
    t.true(model._legType === LEG_TYPE.AIRWAY);
    t.true(!model._procedureModel);
    t.true(model._routeString === airwayRouteStringMock);
    t.true(model._waypointCollection.length === 4);
});

ava('instantiates correctly when given a single direct leg\'s route string', (t) => {
    const model = new LegModel(directRouteStringMock);

    t.true(!model._airwayModel);
    t.true(model._legType === LEG_TYPE.DIRECT);
    t.true(!model._procedureModel);
    t.true(model._routeString === directRouteStringMock);
    t.true(model._waypointCollection.length === 1);
});

ava('instantiates correctly when given a single SID leg\'s route string', (t) => {
    const model = new LegModel(sidRouteStringMock);

    t.true(!model._airwayModel);
    t.true(model._legType === LEG_TYPE.PROCEDURE);
    t.true(model._procedureModel instanceof ProcedureModel);
    t.true(model._procedureModel.procedureType === PROCEDURE_TYPE.SID);
    t.true(model._routeString === sidRouteStringMock);
    t.true(model._waypointCollection.length === 7);
});

ava('instantiates correctly when given a single STAR leg\'s route string', (t) => {
    const model = new LegModel(starRouteStringMock);

    t.true(!model._airwayModel);
    t.true(model._legType === LEG_TYPE.PROCEDURE);
    t.true(model._procedureModel instanceof ProcedureModel);
    t.true(model._procedureModel.procedureType === PROCEDURE_TYPE.STAR);
    t.true(model._routeString === starRouteStringMock);
    t.true(model._waypointCollection.length === 13);
});

ava('#currentWaypoint throws when #_waypointCollection is empty', (t) => {
    const model = new LegModel(sidRouteStringMock);

    model.skipAllWaypointsInLeg();

    t.throws(() => model.currentWaypoint);
});

ava('#currentWaypoint returns the first item in #waypointCollection', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const expectedResult = model._waypointCollection[0];
    const result = model.currentWaypoint;

    t.deepEqual(result, expectedResult);
});

ava('#isAirwayLeg returns false when this is not an airway leg', (t) => {
    const model = new LegModel(sidRouteStringMock);

    t.false(model.isAirwayLeg);
});

ava('#isAirwayLeg returns true when this is an airway leg', (t) => {
    const model = new LegModel(airwayRouteStringMock);

    t.true(model.isAirwayLeg);
});

ava('#isDirectLeg returns false when this is not a direct leg', (t) => {
    const model = new LegModel(sidRouteStringMock);

    t.false(model.isDirectLeg);
});

ava('#isDirectLeg returns true when this is a direct leg', (t) => {
    const model = new LegModel(directRouteStringMock);

    t.true(model.isDirectLeg);
});

ava('#isProcedureLeg returns false when this is not a procedure leg', (t) => {
    const model = new LegModel(directRouteStringMock);

    t.false(model.isProcedureLeg);
});

ava('#isProcedureLeg returns true when this is a procedure leg', (t) => {
    const model = new LegModel(sidRouteStringMock);

    t.true(model.isProcedureLeg);
});

ava('#isSidLeg returns false when this is not a SID procedure leg', (t) => {
    const model = new LegModel(starRouteStringMock);

    t.false(model.isSidLeg);
});

ava('#isSidLeg returns true when this is a SID procedure leg', (t) => {
    const model = new LegModel(sidRouteStringMock);

    t.true(model.isSidLeg);
});

ava('#isStarLeg returns false when this is not a SID procedure leg', (t) => {
    const model = new LegModel(sidRouteStringMock);

    t.false(model.isStarLeg);
});

ava('#isStarLeg returns true when this is a SID procedure leg', (t) => {
    const model = new LegModel(starRouteStringMock);

    t.true(model.isStarLeg);
});

ava('#legType returns value of #_legType', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const legTypeMock = 'type-o-da-leg';

    model._legType = legTypeMock;

    t.true(model.legType === legTypeMock);
});

ava('#nextWaypoint returns the second element of #_waypointCollection', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const nextWaypointModel = model._waypointCollection[1];
    const result = model.nextWaypoint;

    t.deepEqual(result, nextWaypointModel);
});

ava('#routeString returns the value of #_routeString', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const result = model.routeString;

    t.deepEqual(result, sidRouteStringMock);
});

ava('#waypoints returns an array containing all `WaypointModel`s', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const result = model.waypoints;
    const expectedWaypointNames = ['RBELL', 'ROPPR', 'RODDD', 'BOACH', 'ZELMA', 'JOTNU', 'TNP'];
    const waypointNames = _map(result, (waypointModel) => waypointModel.name);

    t.true(_isArray(result));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('.activateHoldForWaypointName() returns early when the specified waypoint does not exist in the route', (t) => {
    const model = new LegModel('KEPEC');
    const waypointModel = model._waypointCollection[0];
    const setHoldParametersAndActivateHoldSpy = sinon.spy(waypointModel, 'setHoldParametersAndActivateHold');
    const holdParametersMock = { turnDirection: 'left' };
    const result = model.activateHoldForWaypointName('PRINO', holdParametersMock);

    t.true(typeof result === 'undefined');
    t.true(setHoldParametersAndActivateHoldSpy.notCalled);
});

ava('.activateHoldForWaypointName() calls .setHoldParametersAndActivateHold() with the appropriate arguments', (t) => {
    const model = new LegModel('KEPEC');
    const waypointModel = model._waypointCollection[0];
    const setHoldParametersAndActivateHoldSpy = sinon.spy(waypointModel, 'setHoldParametersAndActivateHold');
    const holdParametersMock = { turnDirection: 'left' };
    const result = model.activateHoldForWaypointName('KEPEC', holdParametersMock);

    t.not(typeof result, 'undefined');
    t.true(setHoldParametersAndActivateHoldSpy.calledWith(holdParametersMock));
});

ava('.getAllWaypointModelsAfterWaypointName() returns an array of all waypoint models after and excluding the specified one', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const lastExcludedWaypoint = 'BOACH';
    const result = model.getAllWaypointModelsAfterWaypointName(lastExcludedWaypoint);
    const expectedRemainingFixNames = ['ZELMA', 'JOTNU', 'TNP'];
    const remainingFixNames = result.map((wp) => wp.name);

    t.deepEqual(remainingFixNames, expectedRemainingFixNames);
});

ava('.getAllWaypointModelsBeforeWaypointName() returns an array of all waypoint models before and excluding the specified one', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const lastExcludedWaypoint = 'BOACH';
    const result = model.getAllWaypointModelsBeforeWaypointName(lastExcludedWaypoint);
    const expectedRemainingFixNames = ['RBELL', 'ROPPR', 'RODDD'];
    const remainingFixNames = result.map((wp) => wp.name);

    t.deepEqual(remainingFixNames, expectedRemainingFixNames);
});

ava('.getArrivalRunwayAirportIcao() returns null when this is not a STAR leg', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const result = model.getArrivalRunwayAirportIcao();

    t.true(!result);
});

ava('.getArrivalRunwayAirportIcao() returns the first four characters of the STAR exit name', (t) => {
    const model = new LegModel('DAG.KEPEC3.KLAS19R');
    const result = model.getArrivalRunwayAirportIcao();

    t.true(result === 'klas');
});

ava('.getArrivalRunwayName() returns null when this is not a STAR leg', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const result = model.getArrivalRunwayName();

    t.true(!result);
});

ava('.getArrivalRunwayName() returns the all but first four characters of the STAR exit name', (t) => {
    const model = new LegModel('DAG.KEPEC3.KLAS19R');
    const result = model.getArrivalRunwayName();

    t.true(result === '19R');
});

ava('.getBottomAltitude() returns -1 when leg is not a procedure leg', (t) => {
    const model = new LegModel(directRouteStringMock);
    const expectedResult = -1;
    const result = model.getBottomAltitude();

    t.true(result === expectedResult);
});

ava('.getBottomAltitude() returns -1 when procedure leg does not have a bottom altitude', (t) => {
    const model = new LegModel('KLAS19L.COWBY6.DRK');
    const expectedResult = -1;
    const result = model.getBottomAltitude();

    t.true(result === expectedResult);
});

ava('.getBottomAltitude() returns the correct bottom altitude when leg is a procedure leg', (t) => {
    const model = new LegModel(starRouteStringMock);
    const expectedResult = 8000;
    const result = model.getBottomAltitude();

    t.true(result === expectedResult);
});

ava('.getDepartureRunwayAirportIcao() returns null when this is not a SID leg', (t) => {
    const model = new LegModel(starRouteStringMock);
    const result = model.getDepartureRunwayAirportIcao();

    t.true(!result);
});

ava('.getDepartureRunwayAirportIcao() returns the first four characters of the SID entry name', (t) => {
    const model = new LegModel('KLAS25R.BOACH6.TNP');
    const result = model.getDepartureRunwayAirportIcao();

    t.true(result === 'klas');
});

ava('.getDepartureRunwayName() returns null when this is not a SID leg', (t) => {
    const model = new LegModel(starRouteStringMock);
    const result = model.getDepartureRunwayName();

    t.true(!result);
});

ava('.getDepartureRunwayName() returns the all but first four characters of the SID entry name', (t) => {
    const model = new LegModel('KLAS25R.BOACH6.TNP');
    const result = model.getDepartureRunwayName();

    t.true(result === '25R');
});

ava('.getEntryFixName() returns the name of the fix when this leg is a direct leg', (t) => {
    const model = new LegModel('TNP');
    const expectedResult = 'TNP';
    const result = model.getEntryFixName();

    t.true(result === expectedResult);
});

ava('.getEntryFixName() returns route string before the first \'.\' when this leg is a SID leg', (t) => {
    const model = new LegModel('KLAS25R.BOACH6.TNP');
    const expectedResult = 'KLAS25R';
    const result = model.getEntryFixName();

    t.true(result === expectedResult);
});

ava('.getEntryFixName() returns route string before the first \'.\' when this leg is a STAR leg', (t) => {
    const model = new LegModel('DAG.KEPEC3.KLAS19R');
    const expectedResult = 'DAG';
    const result = model.getEntryFixName();

    t.true(result === expectedResult);
});

ava('.getExitFixName() returns the name of the fix when this leg is a direct leg', (t) => {
    const model = new LegModel('TNP');
    const expectedResult = 'TNP';
    const result = model.getExitFixName();

    t.true(result === expectedResult);
});

ava('.getExitFixName() returns route string after the last \'.\' when this leg is a SID leg', (t) => {
    const model = new LegModel('KLAS25R.BOACH6.TNP');
    const expectedResult = 'TNP';
    const result = model.getExitFixName();

    t.true(result === expectedResult);
});

ava('.getExitFixName() returns route string after the last \'.\' when this leg is a STAR leg', (t) => {
    const model = new LegModel('DAG.KEPEC3.KLAS19R');
    const expectedResult = 'KLAS19R';
    const result = model.getExitFixName();

    t.true(result === expectedResult);
});

ava('.getProcedureIcao() returns undefined when this is not a procedure leg', (t) => {
    const model = new LegModel(directRouteStringMock);
    const result = model.getProcedureIcao();

    t.true(typeof result === 'undefined');
});

ava('.getProcedureIcao() returns the ICAO identifier of the ProcedureModel in use by this leg', (t) => {
    const model = new LegModel('KLAS25R.BOACH6.TNP');
    const expectedResult = 'BOACH6';
    const result = model.getProcedureIcao();

    t.true(result === expectedResult);
});

ava('.getProcedureName() returns undefined when this is not a procedure leg', (t) => {
    const model = new LegModel(directRouteStringMock);
    const result = model.getProcedureName();

    t.true(typeof result === 'undefined');
});

ava('.getProcedureName() returns the name of the ProcedureModel in use by this leg', (t) => {
    const model = new LegModel('KLAS25R.BOACH6.TNP');
    const expectedResult = 'Boach Six';
    const result = model.getProcedureName();

    t.true(result === expectedResult);
});

ava('.getRouteStringWithoutAirports() returns #_routeString when neither a SID or STAR leg', (t) => {
    const model = new LegModel('BOACH');
    const expectedResult = model._routeString;
    const result = model.getRouteStringWithoutAirports();

    t.true(result === expectedResult);
});

ava('.getRouteStringWithoutAirports() returns route string without airport for SID leg', (t) => {
    const model = new LegModel('KLAS25R.BOACH6.TNP');
    const expectedResult = 'BOACH6.TNP';
    const result = model.getRouteStringWithoutAirports();

    t.true(result === expectedResult);
});

ava('.getRouteStringWithoutAirports() returns route string without airport for STAR leg', (t) => {
    const model = new LegModel('DAG.KEPEC3.KLAS19R');
    const expectedResult = 'DAG.KEPEC3';
    const result = model.getRouteStringWithoutAirports();

    t.true(result === expectedResult);
});

ava('.hasWaypointName() throws when the not provided with a waypoint name', (t) => {
    const model = new LegModel(sidRouteStringMock);

    t.throws(() => model.hasWaypointName());
    t.throws(() => model.hasWaypointName(''));
});

ava('.getTopAltitude() returns -1 when leg is not a procedure leg', (t) => {
    const model = new LegModel(directRouteStringMock);
    const expectedResult = -1;
    const result = model.getTopAltitude();

    t.true(result === expectedResult);
});

ava('.getTopAltitude() returns -1 when procedure leg does not have a top altitude', (t) => {
    const model = new LegModel('KLAS19L.COWBY6.DRK');
    const expectedResult = -1;
    const result = model.getTopAltitude();

    t.true(result === expectedResult);
});

ava('.getTopAltitude() returns the correct top altitude when leg is a procedure leg', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const expectedResult = 7000;
    const result = model.getTopAltitude();

    t.true(result === expectedResult);
});

ava('.hasNextWaypoint() returns false when #_waypointCollection has less than two elements', (t) => {
    const model = new LegModel(sidRouteStringMock);

    model._waypointCollection = [model._waypointCollection[0]];

    const result = model.hasNextWaypoint();

    t.true(model._waypointCollection.length === 1);
    t.false(result);
});

ava('.hasNextWaypoint() returns true when #_waypointCollection has at least two elements', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const result = model.hasNextWaypoint();

    t.true(model._waypointCollection.length > 1);
    t.true(result);
});

ava('.hasWaypointName() returns false when the specified waypoint does not exist in the #waypointCollection', (t) => {
    const model = new LegModel(sidRouteStringMock);

    t.false(model.hasWaypointName('ABC'));
});

ava('.hasWaypointName() returns true when the specified waypoint exists within the #waypointCollection', (t) => {
    const model = new LegModel(sidRouteStringMock);

    t.true(model.hasWaypointName('BOACH'));
});

ava('.moveToNextWaypoint() moves #currentWaypoint into the #_previousWaypointCollection', (t) => {
    const model = new LegModel(sidRouteStringMock);

    t.true(model._previousWaypointCollection.length === 0);
    t.true(model._waypointCollection.length === 7);

    model.moveToNextWaypoint();

    t.true(model._previousWaypointCollection.length === 1);
    t.true(model._waypointCollection.length === 6);
});

ava('.skipAllWaypointsInLeg() moves entire #_waypointCollection into the #_previousWaypointCollection', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const oldWaypointCollection = model._waypointCollection;

    t.true(model._previousWaypointCollection.length === 0);
    t.true(model._waypointCollection.length === 7);

    model.skipAllWaypointsInLeg();

    t.deepEqual(model._waypointCollection, []);
    t.deepEqual(model._previousWaypointCollection, oldWaypointCollection);
});

ava('.skipToWaypointName() returns false early when the specified waypoint is not in the leg', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const fixNotInLeg = 'ABCDE';
    const oldCurrentWaypointName = model.currentWaypoint.name;
    const result = model.skipToWaypointName(fixNotInLeg);
    const currentWaypointName = model.currentWaypoint.name;

    t.false(result);
    t.true(currentWaypointName === oldCurrentWaypointName);
});

ava('.skipToWaypointName() moves all waypoints before the specified waypoint to the #_previousWaypointCollection', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const expectedPreviousFixNames = ['RBELL', 'ROPPR', 'RODDD'];
    const expectedRemainingFixNames = ['BOACH', 'ZELMA', 'JOTNU', 'TNP'];
    const result = model.skipToWaypointName('BOACH');
    const previousFixNames = model._previousWaypointCollection.map((wp) => wp.name);
    const remainingFixNames = model._waypointCollection.map((wp) => wp.name);

    t.true(result);
    t.deepEqual(previousFixNames, expectedPreviousFixNames);
    t.deepEqual(remainingFixNames, expectedRemainingFixNames);
});

ava('.reset() calls ._resetWaypointCollection()', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const resetWaypointCollectionSpy = sinon.spy(model, '_resetWaypointCollection');

    model.reset();

    t.true(resetWaypointCollectionSpy.calledWithExactly());
});

ava('.reset() resets to default all properties', (t) => {
    const model = new LegModel(sidRouteStringMock);

    model.reset();

    t.true(!model._airwayModel);
    t.true(model._legType === '');
    t.true(!model._procedureModel);
    t.deepEqual(model._previousWaypointCollection, []);
    t.true(model._routeString === '');
    t.deepEqual(model._waypointCollection, []);
});

ava('.updateSidLegForDepartureRunwayModel() returns early when this is not a SID leg', (t) => {
    const starLegModel = new LegModel(starRouteStringMock);
    const directLegModel = new LegModel(directRouteStringMock);
    const airport = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const runwayModel = airport.getRunway('01L');
    const starLegGenerateWaypointCollectionSpy = sinon.spy(starLegModel, '_generateWaypointCollection');
    const directLegGenerateWaypointCollectionSpy = sinon.spy(directLegModel, '_generateWaypointCollection');

    starLegModel.updateSidLegForDepartureRunwayModel(runwayModel);
    directLegModel.updateSidLegForDepartureRunwayModel(runwayModel);

    t.true(starLegGenerateWaypointCollectionSpy.notCalled);
    t.true(directLegGenerateWaypointCollectionSpy.notCalled);
});

ava('.updateSidLegForDepartureRunwayModel() returns early when the specified runway is already the one in use', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const airport = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const currentRunwayModel = airport.getRunway('25R');
    const generateWaypointCollectionSpy = sinon.spy(model, '_generateWaypointCollection');

    model.updateSidLegForDepartureRunwayModel(currentRunwayModel);

    t.true(generateWaypointCollectionSpy.notCalled);
});

ava('.updateSidLegForDepartureRunwayModel() returns early when the SID is not valid for the specified runway', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const airport = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const illegalRunwayModel = airport.getRunway('01R');
    const generateWaypointCollectionSpy = sinon.spy(model, '_generateWaypointCollection');

    model.updateSidLegForDepartureRunwayModel(illegalRunwayModel);

    t.true(generateWaypointCollectionSpy.notCalled);
});

ava('.updateSidLegForDepartureRunwayModel() regenerates #_waypointCollection IAW the new departure runway', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const airport = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const runwayModel = airport.getRunway('01L');
    const generateWaypointCollectionSpy = sinon.spy(model, '_generateWaypointCollection');

    model.updateSidLegForDepartureRunwayModel(runwayModel);

    const expectedWaypointNames = ['BESSY', 'WITLA', 'JEBBB', 'BOACH', 'ZELMA', 'JOTNU', 'TNP'];
    const waypointNames = model.waypoints.map((waypoint) => waypoint.name);

    t.true(generateWaypointCollectionSpy.calledWithExactly('KLAS01L', 'TNP'));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('.updateStarLegForArrivalRunwayModel() returns early when this is not a STAR leg', (t) => {
    const sidLegModel = new LegModel(sidRouteStringMock);
    const directLegModel = new LegModel(directRouteStringMock);
    const airport = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const runwayModel = airport.getRunway('01L');
    const sidLegGenerateWaypointCollectionSpy = sinon.spy(sidLegModel, '_generateWaypointCollection');
    const directLegGenerateWaypointCollectionSpy = sinon.spy(directLegModel, '_generateWaypointCollection');

    sidLegModel.updateStarLegForArrivalRunwayModel(runwayModel);
    directLegModel.updateStarLegForArrivalRunwayModel(runwayModel);

    t.true(sidLegGenerateWaypointCollectionSpy.notCalled);
    t.true(directLegGenerateWaypointCollectionSpy.notCalled);
});

ava('.updateStarLegForArrivalRunwayModel() returns early when the specified runway is already the one in use', (t) => {
    const model = new LegModel(starRouteStringMock);
    const airport = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const currentRunwayModel = airport.getRunway('19R');
    const generateWaypointCollectionSpy = sinon.spy(model, '_generateWaypointCollection');

    model.updateStarLegForArrivalRunwayModel(currentRunwayModel);

    t.true(generateWaypointCollectionSpy.notCalled);
});

ava('.updateStarLegForArrivalRunwayModel() returns early when the STAR is not valid for the specified runway', (t) => {
    const model = new LegModel(starRouteStringMock);
    const airport = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const illegalRunwayModel = airport.getRunway('01R');
    const generateWaypointCollectionSpy = sinon.spy(model, '_generateWaypointCollection');

    model.updateStarLegForArrivalRunwayModel(illegalRunwayModel);

    t.true(generateWaypointCollectionSpy.notCalled);
});

ava('.updateStarLegForArrivalRunwayModel() regenerates #_waypointCollection IAW the new departure runway', (t) => {
    const model = new LegModel(starRouteStringMock);
    const airport = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const runwayModel = airport.getRunway('01L');
    const generateWaypointCollectionSpy = sinon.spy(model, '_generateWaypointCollection');

    model.updateStarLegForArrivalRunwayModel(runwayModel);

    const expectedWaypointNames = ['DAG', 'MISEN', 'CLARR', 'SKEBR', 'KEPEC',
        'IPUMY', 'NIPZO', 'SUNST', 'KIMME', 'CHIPZ', 'POKRR', 'PRINO'
    ];
    const waypointNames = model.waypoints.map((waypoint) => waypoint.name);

    t.true(generateWaypointCollectionSpy.calledWithExactly('DAG', 'KLAS01L'));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

ava('._findIndexOfWaypointName() returns -1 when no waypoint in the #waypointCollection has the specified name', (t) => {
    const model = new LegModel(sidRouteStringMock);
    const expectedResult = -1;
    const result = model._findIndexOfWaypointName('thisFixIsNotInTheRoute');

    t.true(result === expectedResult);
});

ava('._findIndexOfWaypointName() returns the index of the WaypointModel in the #waypointCollection with the specified name', (t) => {
    const model = new LegModel('KLAS25R.BOACH6.TNP');
    const expectedResult = 3;
    const result = model._findIndexOfWaypointName('BOACH');

    t.true(result === expectedResult);
});

ava('._resetWaypointCollection() calls .skipAllWaypointsInLeg()', (t) => {
    const model = new LegModel(shortSidRouteStringMock);
    const skipAllWaypointsInLegSpy = sinon.spy(model, 'skipAllWaypointsInLeg');

    model._resetWaypointCollection();

    t.true(skipAllWaypointsInLegSpy.calledWithExactly());
});

ava('._resetWaypointCollection() calls .reset() method of all waypoints', (t) => {
    const model = new LegModel(shortSidRouteStringMock);

    model.skipAllWaypointsInLeg();

    const jesjiWaypointResetSpy = sinon.spy(model._previousWaypointCollection[0], 'reset');
    const bakrrWaypointResetSpy = sinon.spy(model._previousWaypointCollection[1], 'reset');
    const tralrWaypointResetSpy = sinon.spy(model._previousWaypointCollection[2], 'reset');
    const mlfWaypointResetSpy = sinon.spy(model._previousWaypointCollection[3], 'reset');

    model._resetWaypointCollection();

    t.true(model._previousWaypointCollection.length === 4);
    t.true(jesjiWaypointResetSpy.calledWithExactly());
    t.true(bakrrWaypointResetSpy.calledWithExactly());
    t.true(tralrWaypointResetSpy.calledWithExactly());
    t.true(mlfWaypointResetSpy.calledWithExactly());
});

ava('._verifyAirwayAndEntryAndExitAreValid() throws when #_airwayModel is null', (t) => {
    const model = new LegModel(directRouteStringMock);

    t.throws(() => model._verifyAirwayAndEntryAndExitAreValid('entryName', 'exitName'));
});

ava('._verifyAirwayAndEntryAndExitAreValid() throws when the specified entry is not on the airway', (t) => {
    const model = new LegModel('CHRLT.V394.LAS');
    const invalidEntryName = 'invalidEntry';
    const validExitName = 'SUVIE';

    t.throws(() => model._verifyAirwayAndEntryAndExitAreValid(invalidEntryName, validExitName));
});

ava('._verifyAirwayAndEntryAndExitAreValid() throws when the specified exit is not on the airway', (t) => {
    const model = new LegModel('CHRLT.V394.LAS');
    const validEntryName = 'DISBE';
    const invalidExitName = 'invalidExit';

    t.throws(() => model._verifyAirwayAndEntryAndExitAreValid(validEntryName, invalidExitName));
});

ava('._verifyAirwayAndEntryAndExitAreValid() does not throw when the specified entry and exit are both on the airway', (t) => {
    const model = new LegModel('CHRLT.V394.LAS');
    const validEntryName = 'DISBE';
    const validExitName = 'SUVIE';

    t.notThrows(() => model._verifyAirwayAndEntryAndExitAreValid(validEntryName, validExitName));
});

ava('._verifyProcedureAndEntryAndExitAreValid() throws when #_procedureModel is null', (t) => {
    const model = new LegModel(directRouteStringMock);

    t.throws(() => model._verifyProcedureAndEntryAndExitAreValid('entryName', 'exitName'));
});

ava('._verifyProcedureAndEntryAndExitAreValid() throws when the specified entry is not valid for the procedure', (t) => {
    const model = new LegModel('KLAS25R.BOACH6.TNP');
    const invalidEntryName = 'invalidEntry';
    const validExitName = 'HEC';

    t.throws(() => model._verifyProcedureAndEntryAndExitAreValid(invalidEntryName, validExitName));
});

ava('._verifyProcedureAndEntryAndExitAreValid() throws when the specified exit is not valid for the procedure', (t) => {
    const model = new LegModel('KLAS25R.BOACH6.TNP');
    const validEntryName = 'KLAS25L';
    const invalidExitName = 'invalidExit';

    t.throws(() => model._verifyProcedureAndEntryAndExitAreValid(validEntryName, invalidExitName));
});

ava('._verifyProcedureAndEntryAndExitAreValid() does not throw when the specified entry and exit are valid for the procedure', (t) => {
    const model = new LegModel('KLAS25R.BOACH6.TNP');
    const validEntryName = 'KLAS25L';
    const validExitName = 'HEC';

    t.notThrows(() => model._verifyProcedureAndEntryAndExitAreValid(validEntryName, validExitName));
});

// ava('._buildWaypointForDirectRoute() returns an array with a single instance of a WaypointModel', (t) => {
//     const model = new LegModel(directRouteStringMockMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const result = model._buildWaypointForDirectRoute(directRouteStringMockMock);
//
//     t.true(_isArray(result));
//     t.true(result[0] instanceof WaypointModel);
//     t.true(result[0].name === 'cowby');
// });
//
// ava('._buildWaypointForHoldingPattern() returns an array with a single instance of a WaypointModel with hold properties for a Fix', (t) => {
//     const model = new LegModel(directRouteStringMockMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const result = model._buildWaypointForHoldingPattern(holdRouteStringMock);
//
//     t.true(_isArray(result));
//     t.true(result[0] instanceof WaypointModel);
//     t.true(result[0].isHold);
//     t.true(result[0].name === 'cowby');
//     t.true(result[0].altitudeMaximum === INVALID_NUMBER);
//     t.true(result[0].altitudeMinimum === INVALID_NUMBER);
//     t.true(result[0].speedMaximum === INVALID_NUMBER);
//     t.true(result[0].speedMinimum === INVALID_NUMBER);
//     t.true(result[0]._turnDirection === 'right');
//     t.true(result[0]._legLength === '1min');
//     t.true(result[0].timer === INVALID_NUMBER);
// });
//
// ava('._buildWaypointForHoldingPatternAtPosition() returns an array with a single instance of a WaypointModel with hold properties for GPS', (t) => {
//     const model = new LegModel(HOLD_AT_PRESENT_LOCATION_MOCK.name, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture, HOLD_AT_PRESENT_LOCATION_MOCK);
//     const result = model._buildWaypointForHoldingPatternAtPosition(HOLD_AT_PRESENT_LOCATION_MOCK);
//
//     t.true(_isArray(result));
//     t.true(result[0] instanceof WaypointModel);
//     t.true(result[0].isHold);
//     t.true(result[0].name === 'gps');
//     t.true(result[0].altitudeMaximum === INVALID_NUMBER);
//     t.true(result[0].altitudeMinimum === INVALID_NUMBER);
//     t.true(result[0].speedMaximum === INVALID_NUMBER);
//     t.true(result[0].speedMinimum === INVALID_NUMBER);
//     t.true(result[0]._turnDirection === 'left');
//     t.true(result[0]._legLength === '3min');
//     t.true(result[0].timer === -999);
// });
//
// ava('._buildWaypointForHoldingPatternAtPosition() returns the same position for a hold Waypoint at a fix vs position', (t) => {
//     const model = new LegModel(HOLD_AT_PRESENT_LOCATION_MOCK.name, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture, HOLD_AT_PRESENT_LOCATION_MOCK);
//     const fixResult = model._buildWaypointForHoldingPattern(holdRouteStringMock);
//     const positionalHoldingProps = Object.assign(HOLD_AT_PRESENT_LOCATION_MOCK, { positionModel: cowbyFixFixture.positionModel });
//     const positionResult = model._buildWaypointForHoldingPatternAtPosition(positionalHoldingProps);
//
//     t.true(_isEqual(fixResult[0].relativePosition, positionResult[0].relativePosition));
// });
//
// ava('._buildWaypointCollectionForProcedureRoute() returns a list of WaypointModels', (t) => {
//     const model = new LegModel(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const result = model._buildWaypointCollectionForProcedureRoute(arrivalProcedureRouteStringMock, runwayMock);
//
//     t.plan(result.length);
//     for (let i = 0; i < result.length; i++) {
//         t.true(result[i] instanceof WaypointModel);
//     }
// });
//
// ava('._buildProcedureType() returns early when #routeString is a directRouteStringMock', (t) => {
//     const model = new LegModel(directRouteStringMockMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//
//     t.true(model.procedureType === '');
// });
//
// ava('._buildProcedureType() sets #procedureType as `SID` the #routeString is a procedureType and #flightPhase is departure', (t) => {
//     const model = new LegModel(departureProcedureRouteStringMock, runwayMock, departureFlightPhaseMock, navigationLibraryFixture);
//
//     t.true(model.procedureType === 'SID');
// });
//
// ava('._buildProcedureType() sets #procedureType as `STAR` the #routeString is a procedureType and #flightPhase is arrival', (t) => {
//     const model = new LegModel(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//
//     t.true(model.procedureType === 'STAR');
// });
