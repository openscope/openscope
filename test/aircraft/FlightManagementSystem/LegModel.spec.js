import ava from 'ava';
import sinon from 'sinon';
// import _isArray from 'lodash/isArray';
// import _isEqual from 'lodash/isEqual';
import LegModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/LegModel';
import ProcedureDefinitionModel from '../../../src/assets/scripts/client/navigationLibrary/Procedure/ProcedureDefinitionModel';
import ProcedureWaypointModel from '../../../src/assets/scripts/client/navigationLibrary/Procedure/ProcedureWaypointModel';
import NavigationLibrary from '../../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../../airport/_mocks/airportJsonMock';
// import { HOLD_AT_PRESENT_LOCATION_MOCK } from '../_mocks/aircraftMocks';
// import { createNavigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
// import { INVALID_NUMBER } from '../../../src/assets/scripts/client/constants/globalConstants';
import { PROCEDURE_TYPE } from '../../../src/assets/scripts/client/constants/aircraftConstants';
import { LEG_TYPE } from '../../../src/assets/scripts/client/constants/navigation/waypointConstants';

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
// ava('.getProcedureTopAltitude() returns -1 if a leg when #isProcedure is false', (t) => {
//     const model = new LegModel(directRouteStringMockMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const result = model.getProcedureTopAltitude();
//
//     t.true(result === INVALID_NUMBER);
// });
//
// ava('.getProcedureTopAltitude() calls `._findMinOrMaxAltitudeInProcedure()`', (t) => {
//     const model = new LegModel(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const _findMinOrMaxAltitudeInProcedureSpy = sinon.spy(model, '_findMinOrMaxAltitudeInProcedure');
//
//     model.getProcedureTopAltitude();
//
//     t.true(_findMinOrMaxAltitudeInProcedureSpy.calledWithExactly(true));
// });
//
// ava('.getProcedureTopAltitude() returns the highest "AT" or "AT/BELOW" altitude restriction value in the #waypointCollection when #isProcedure is true', (t) => {
//     const model = new LegModel(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const result = model.getProcedureTopAltitude();
//
//     t.true(result === 24000);
// });
//
// ava('.getProcedureBottomAltitude() returns -1 if a leg when #isProcedure is false', (t) => {
//     const model = new LegModel(directRouteStringMockMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const result = model.getProcedureBottomAltitude();
//
//     t.true(result === INVALID_NUMBER);
// });
//
// ava('.getProcedureBottomAltitude() calls `._findMinOrMaxAltitudeInProcedure()`', (t) => {
//     const model = new LegModel(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const _findMinOrMaxAltitudeInProcedureSpy = sinon.spy(model, '_findMinOrMaxAltitudeInProcedure');
//
//     model.getProcedureBottomAltitude();
//
//     t.true(_findMinOrMaxAltitudeInProcedureSpy.calledWithExactly(false));
// });
//
// ava('.getProcedureBottomAltitude() returns the lowest "AT" or "AT/ABOVE" altitude restriction value in the #waypointCollection when #isProcedure is true', (t) => {
//     const model = new LegModel(arrivalProcedureRouteStringMock, runwayMock, arrivalFlightPhaseMock, navigationLibraryFixture);
//     const result = model.getProcedureBottomAltitude();
//
//     t.true(result === 8000);
// });

ava('.hasWaypoint() returns false when the specified waypoint does not exist in the #waypointCollection', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);

    t.false(model.hasWaypoint('ABC'));
});

ava('.hasWaypoint() returns true when the specified waypoint exists within the #waypointCollection', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);

    t.true(model.hasWaypoint('BOACH'));
});

ava('.getProcedureBottomAltitude() returns -1 when leg is not a procedure leg', (t) => {
    const model = new LegModel(navigationLibrary, directRouteStringMock);
    const expectedResult = -1;
    const result = model.getProcedureBottomAltitude();

    t.true(result === expectedResult);
});

ava('.getProcedureBottomAltitude() returns the correct bottom altitude when leg is a procedure leg', (t) => {
    const model = new LegModel(navigationLibrary, starRouteStringMock);
    const expectedResult = 8000;
    const result = model.getProcedureBottomAltitude();

    t.true(result === expectedResult);
});

ava('.getProcedureTopAltitude() returns -1 when leg is not a procedure leg', (t) => {
    const model = new LegModel(navigationLibrary, directRouteStringMock);
    const expectedResult = -1;
    const result = model.getProcedureTopAltitude();

    t.true(result === expectedResult);
});

ava('.getProcedureTopAltitude() returns the correct bottom altitude when leg is a procedure leg', (t) => {
    const model = new LegModel(navigationLibrary, sidRouteStringMock);
    const expectedResult = 7000;
    const result = model.getProcedureTopAltitude();

    t.true(result === expectedResult);
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
