import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import _map from 'lodash/map';
import AirportModel from '../../../src/assets/scripts/client/airport/AirportModel';
import LegModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/LegModel';
import ProcedureDefinitionModel from '../../../src/assets/scripts/client/navigationLibrary/ProcedureDefinitionModel';
// import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';
import NavigationLibrary from '../../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../../airport/_mocks/airportJsonMock';
// import { HOLD_AT_PRESENT_LOCATION_MOCK } from '../_mocks/aircraftMocks';
// import { createNavigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
// import { INVALID_NUMBER } from '../../../src/assets/scripts/client/constants/globalConstants';
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

// const airwayRouteStringMock = '';
const directRouteStringMock = 'PGS';
const sidRouteStringMock = 'KLAS25R.BOACH6.TNP';
const shortSidRouteStringMock = 'KLAS07R.TRALR6.MLF';
const starRouteStringMock = 'DAG.KEPEC3.KLAS19R';

let navigationLibrary;

ava.beforeEach(() => {
    navigationLibrary = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
});

ava.afterEach(() => {
    navigationLibrary.reset();
});

ava('throws when instantiated with invalid parameters', (t) => {
    t.throws(() => new LegModel());
    t.throws(() => new LegModel(directRouteStringMock));
    t.throws(() => new LegModel(directRouteStringMock, navigationLibrary));
});

ava('throws when instantiated with route string that should be two separate legs', (t) => {
    const procedureThenDirectRouteString = 'KLAS25R.COWBY6.DRK..PXR';
    const doubleDirectRouteString = 'PGS..DRK';
    const doubleProcedureRouteString = 'KLAS25R.COWBY6.DRK.TYSSN4.KLAS25R';
    const directThenProcedureRouteString = 'PXR..DAG.KEPEC1.KLAS';

    t.throws(() => new LegModel(navigationLibrary, procedureThenDirectRouteString));
    t.throws(() => new LegModel(navigationLibrary, doubleDirectRouteString));
    t.throws(() => new LegModel(navigationLibrary, doubleProcedureRouteString));
    t.throws(() => new LegModel(navigationLibrary, directThenProcedureRouteString));
});

ava.todo('throws when instantiated with airway route string with airway not defined in navigation library'/* , (t) => {
    const routeStringWithInvalidProcedure = 'KLAS25R.BOACH0.TNP';

    t.throws(() => new LegModel(navigationLibrary, routeStringWithInvalidProcedure));
}*/);

ava('throws when instantiated with procedure route string with procedure not defined in navigation library', (t) => {
    const routeStringWithInvalidProcedure = 'KLAS25R.BOACH0.TNP';

    t.throws(() => new LegModel(navigationLibrary, routeStringWithInvalidProcedure));
});

ava.todo('instantiates correctly when given a single airway leg\'s route string'/* , (t) => {
    const model = new LegModel(navigationLibrary, airwayRouteStringMock);

    t.true(model._airwayModel === null);
    t.true(model._legType === LEG_TYPE.DIRECT);
    t.true(model._procedureDefinitionModel === null);
    t.true(model._routeString === airwayRouteStringMock);
    t.true(model._waypointCollection.length === 1);
}*/);

ava('instantiates correctly when given a single direct leg\'s route string', (t) => {
    const model = new LegModel(navigationLibrary, directRouteStringMock);

    t.true(model._airwayModel === null);
    t.true(model._legType === LEG_TYPE.DIRECT);
    t.true(model._procedureDefinitionModel === null);
    t.true(model._routeString === directRouteStringMock);
    t.true(model._waypointCollection.length === 1);
});

ava('instantiates correctly when given a single SID leg\'s route string', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);

    t.true(model._airwayModel === null);
    t.true(model._legType === LEG_TYPE.PROCEDURE);
    t.true(model._procedureDefinitionModel instanceof ProcedureDefinitionModel);
    t.true(model._procedureDefinitionModel.procedureType === PROCEDURE_TYPE.SID);
    t.true(model._routeString === sidRouteStringMock);
    t.true(model._waypointCollection.length === 7);
});

ava('instantiates correctly when given a single STAR leg\'s route string', (t) => {
    const model = new LegModel(navigationLibrary, starRouteStringMock);

    t.true(model._airwayModel === null);
    t.true(model._legType === LEG_TYPE.PROCEDURE);
    t.true(model._procedureDefinitionModel instanceof ProcedureDefinitionModel);
    t.true(model._procedureDefinitionModel.procedureType === PROCEDURE_TYPE.STAR);
    t.true(model._routeString === starRouteStringMock);
    t.true(model._waypointCollection.length === 13);
});

ava('#currentWaypoint throws when #_waypointCollection is empty', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);

    model.skipAllWaypointsInLeg();

    t.throws(() => model.currentWaypoint);
});

ava('#currentWaypoint returns the first item in #waypointCollection', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);
    const expectedResult = model._waypointCollection[0];
    const result = model.currentWaypoint;

    t.deepEqual(result, expectedResult);
});

ava('#isAirwayLeg returns false when this is not an airway leg', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);

    t.false(model.isAirwayLeg);
});

ava.todo('#isAirwayLeg returns true when this is an airway leg'/* , (t) => {
    const model = new LegModel(navigationLibrary, airwayRouteStringMock);

    t.true(model.isAirwayLeg);
}*/);

ava('#isDirectLeg returns false when this is not a direct leg', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);

    t.false(model.isDirectLeg);
});

ava('#isDirectLeg returns true when this is a direct leg', (t) => {
    const model = new LegModel(navigationLibrary, directRouteStringMock);

    t.true(model.isDirectLeg);
});

ava('#isProcedureLeg returns false when this is not a procedure leg', (t) => {
    const model = new LegModel(navigationLibrary, directRouteStringMock);

    t.false(model.isProcedureLeg);
});

ava('#isProcedureLeg returns true when this is a procedure leg', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);

    t.true(model.isProcedureLeg);
});

ava('#isSidLeg returns false when this is not a SID procedure leg', (t) => {
    const model = new LegModel(navigationLibrary, starRouteStringMock);

    t.false(model.isSidLeg);
});

ava('#isSidLeg returns true when this is a SID procedure leg', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);

    t.true(model.isSidLeg);
});

ava('#isStarLeg returns false when this is not a SID procedure leg', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);

    t.false(model.isStarLeg);
});

ava('#isStarLeg returns true when this is a SID procedure leg', (t) => {
    const model = new LegModel(navigationLibrary, starRouteStringMock);

    t.true(model.isStarLeg);
});

ava('#legType returns value of #_legType', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);
    const legTypeMock = 'type-o-da-leg';

    model._legType = legTypeMock;

    t.true(model.legType === legTypeMock);
});

ava('#nextWaypoint returns the second element of #_waypointCollection', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);
    const nextWaypointModel = model._waypointCollection[1];
    const result = model.nextWaypoint;

    t.deepEqual(result, nextWaypointModel);
});

ava('#routeString returns the value of #_routeString', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);
    const result = model.routeString;

    t.deepEqual(result, sidRouteStringMock);
});

ava('#waypoints returns an array containing all `WaypointModel`s', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);
    const result = model.waypoints;
    const expectedWaypointNames = ['RBELL', 'ROPPR', 'RODDD', 'BOACH', 'ZELMA', 'JOTNU', 'TNP'];
    const waypointNames = _map(result, (waypointModel) => waypointModel.name);

    t.true(_isArray(result));
    t.deepEqual(waypointNames, expectedWaypointNames);
});

// ava('.init() calls ._buildWaypointCollection()', (t) => {
//     const model = new LegModel(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const _buildWaypointCollectionSpy = sinon.spy(model, '_buildWaypointCollection');
//
//     model.init(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock);
//
//     t.true(_buildWaypointCollectionSpy.calledWithExactly(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock, undefined));
// });
//
// ava('.destroy() calls ._destroyWaypointCollection()', (t) => {
//     const model = new LegModel(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const _destroyWaypointCollectionSpy = sinon.spy(model, '_destroyWaypointCollection');
//
//     model.destroy();
//
//     t.true(_destroyWaypointCollectionSpy.calledOnce);
// });
//
// ava('.skipToWaypointAtIndex() drops n number of WaypointModels from the left of #waypointCollection', (t) => {
//     const model = new LegModel(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//
//     model.skipToWaypointAtIndex(3);
//
//     t.true(model.waypointCollection.length === 10);
//     t.true(model.currentWaypoint.name === 'skebr');
// });
//
// ava('.getTopAltitude() returns -1 if a leg when #isProcedure is false', (t) => {
//     const model = new LegModel(directRouteStringMockMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const result = model.getTopAltitude();
//
//     t.true(result === INVALID_NUMBER);
// });
//
// ava('.getTopAltitude() calls `._findMinOrMaxAltitudeInProcedure()`', (t) => {
//     const model = new LegModel(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const _findMinOrMaxAltitudeInProcedureSpy = sinon.spy(model, '_findMinOrMaxAltitudeInProcedure');
//
//     model.getTopAltitude();
//
//     t.true(_findMinOrMaxAltitudeInProcedureSpy.calledWithExactly(true));
// });
//
// ava('.getTopAltitude() returns the highest "AT" or "AT/BELOW" altitude restriction value in the #waypointCollection when #isProcedure is true', (t) => {
//     const model = new LegModel(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const result = model.getTopAltitude();
//
//     t.true(result === 24000);
// });
//
// ava('.getBottomAltitude() returns -1 if a leg when #isProcedure is false', (t) => {
//     const model = new LegModel(directRouteStringMockMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const result = model.getBottomAltitude();
//
//     t.true(result === INVALID_NUMBER);
// });
//
// ava('.getBottomAltitude() calls `._findMinOrMaxAltitudeInProcedure()`', (t) => {
//     const model = new LegModel(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const _findMinOrMaxAltitudeInProcedureSpy = sinon.spy(model, '_findMinOrMaxAltitudeInProcedure');
//
//     model.getBottomAltitude();
//
//     t.true(_findMinOrMaxAltitudeInProcedureSpy.calledWithExactly(false));
// });
//
// ava('.getBottomAltitude() returns the lowest "AT" or "AT/ABOVE" altitude restriction value in the #waypointCollection when #isProcedure is true', (t) => {
//     const model = new LegModel(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const result = model.getBottomAltitude();
//
//     t.true(result === 8000);
// });

ava('.hasWaypointName() throws when the not provided with a waypoint name', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);

    t.throws(() => model.hasWaypointName());
    t.throws(() => model.hasWaypointName(''));
});

ava('.hasWaypointName() returns false when the specified waypoint does not exist in the #waypointCollection', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);

    t.false(model.hasWaypointName('ABC'));
});

ava('.hasWaypointName() returns true when the specified waypoint exists within the #waypointCollection', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);

    t.true(model.hasWaypointName('BOACH'));
});

ava('.getBottomAltitude() returns -1 when leg is not a procedure leg', (t) => {
    const model = new LegModel(navigationLibrary, directRouteStringMock);
    const expectedResult = -1;
    const result = model.getBottomAltitude();

    t.true(result === expectedResult);
});

ava('.getBottomAltitude() returns -1 when procedure leg does not have a bottom altitude', (t) => {
    const model = new LegModel(navigationLibrary, 'KLAS19L.COWBY6.DRK');
    const expectedResult = -1;
    const result = model.getBottomAltitude();

    t.true(result === expectedResult);
});

ava('.getBottomAltitude() returns the correct bottom altitude when leg is a procedure leg', (t) => {
    const model = new LegModel(navigationLibrary, starRouteStringMock);
    const expectedResult = 8000;
    const result = model.getBottomAltitude();

    t.true(result === expectedResult);
});

ava('.getTopAltitude() returns -1 when leg is not a procedure leg', (t) => {
    const model = new LegModel(navigationLibrary, directRouteStringMock);
    const expectedResult = -1;
    const result = model.getTopAltitude();

    t.true(result === expectedResult);
});

ava('.getTopAltitude() returns -1 when procedure leg does not have a top altitude', (t) => {
    const model = new LegModel(navigationLibrary, 'KLAS19L.COWBY6.DRK');
    const expectedResult = -1;
    const result = model.getTopAltitude();

    t.true(result === expectedResult);
});

ava('.getTopAltitude() returns the correct top altitude when leg is a procedure leg', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);
    const expectedResult = 7000;
    const result = model.getTopAltitude();

    t.true(result === expectedResult);
});

ava('.skipToWaypointName() returns false early when the specified waypoint is not in the leg', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);
    const fixNotInLeg = 'ABCDE';
    const oldCurrentWaypointName = model.currentWaypoint.name;
    const result = model.skipToWaypointName(fixNotInLeg);
    const currentWaypointName = model.currentWaypoint.name;

    t.false(result);
    t.true(currentWaypointName === oldCurrentWaypointName);
});

ava('.skipToWaypointName() moves all waypoints before the specified waypoint to the #_previousWaypointCollection', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);
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
    const model = new LegModel(navigationLibrary, sidRouteStringMock);
    const resetWaypointCollectionSpy = sinon.spy(model, '_resetWaypointCollection');

    model.reset();

    t.true(resetWaypointCollectionSpy.calledWithExactly());
});

ava('.reset() resets to default all properties', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);

    model.reset();

    t.true(model._airwayModel === null);
    t.true(model._legType === '');
    t.true(model._procedureDefinitionModel === null);
    t.deepEqual(model._previousWaypointCollection, []);
    t.true(model._routeString === '');
    t.deepEqual(model._waypointCollection, []);
});

ava('.updateSidLegForDepartureRunwayModel() returns early when this is not a SID leg', (t) => {
    const starLegModel = new LegModel(navigationLibrary, starRouteStringMock);
    const directLegModel = new LegModel(navigationLibrary, directRouteStringMock);
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
    const model = new LegModel(navigationLibrary, sidRouteStringMock);
    const airport = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const currentRunwayModel = airport.getRunway('25R');
    const generateWaypointCollectionSpy = sinon.spy(model, '_generateWaypointCollection');

    model.updateSidLegForDepartureRunwayModel(currentRunwayModel);

    t.true(generateWaypointCollectionSpy.notCalled);
});

ava('.updateSidLegForDepartureRunwayModel() returns early when the SID is not valid for the specified runway', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);
    const airport = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const illegalRunwayModel = airport.getRunway('01R');
    const generateWaypointCollectionSpy = sinon.spy(model, '_generateWaypointCollection');

    model.updateSidLegForDepartureRunwayModel(illegalRunwayModel);

    t.true(generateWaypointCollectionSpy.notCalled);
});

ava('.updateSidLegForDepartureRunwayModel() regenerates #_waypointCollection IAW the new departure runway', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);
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
    const sidLegModel = new LegModel(navigationLibrary, sidRouteStringMock);
    const directLegModel = new LegModel(navigationLibrary, directRouteStringMock);
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
    const model = new LegModel(navigationLibrary, starRouteStringMock);
    const airport = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const currentRunwayModel = airport.getRunway('19R');
    const generateWaypointCollectionSpy = sinon.spy(model, '_generateWaypointCollection');

    model.updateStarLegForArrivalRunwayModel(currentRunwayModel);

    t.true(generateWaypointCollectionSpy.notCalled);
});

ava('.updateStarLegForArrivalRunwayModel() returns early when the STAR is not valid for the specified runway', (t) => {
    const model = new LegModel(navigationLibrary, starRouteStringMock);
    const airport = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const illegalRunwayModel = airport.getRunway('01R');
    const generateWaypointCollectionSpy = sinon.spy(model, '_generateWaypointCollection');

    model.updateStarLegForArrivalRunwayModel(illegalRunwayModel);

    t.true(generateWaypointCollectionSpy.notCalled);
});

ava('.updateStarLegForArrivalRunwayModel() regenerates #_waypointCollection IAW the new departure runway', (t) => {
    const model = new LegModel(navigationLibrary, starRouteStringMock);
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

ava('._resetWaypointCollection() calls .skipAllWaypointsInLeg()', (t) => {
    const model = new LegModel(navigationLibrary, shortSidRouteStringMock);
    const skipAllWaypointsInLegSpy = sinon.spy(model, 'skipAllWaypointsInLeg');

    model._resetWaypointCollection();

    t.true(skipAllWaypointsInLegSpy.calledWithExactly());
});

ava('._resetWaypointCollection() calls .reset() method of all waypoints', (t) => {
    const model = new LegModel(navigationLibrary, shortSidRouteStringMock);

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
//     t.true(result[0].timer === -999);
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
