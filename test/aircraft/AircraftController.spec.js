import ava from 'ava';
// import sinon from 'sinon';

// import AircraftController from '../../src/assets/scripts/client/aircraft/AircraftController';
// import { AIRCRAFT_DEFINITION_LIST_MOCK } from './_mocks/aircraftMocks';
// import { airlineControllerFixture } from '../fixtures/airlineFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../fixtures/navigationLibraryFixtures';
// import { spawnPatternModelArrivalFixture } from '../fixtures/trafficGeneratorFixtures';

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava.todo('Tests not available for AircraftController due to $ import');

// ava('throws when called with invalid parameters', (t) => {
//     t.throws(() => new AircraftController());
//     t.throws(() => new AircraftController({}));
//     t.throws(() => new AircraftController([]));
//     t.throws(() => new AircraftController(42));
//     t.throws(() => new AircraftController('threeve'));
//     t.throws(() => new AircraftController(false));
//
//     t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK));
//     t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, {}));
//     t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, []));
//     t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, 42));
//     t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, 'threeve'));
//     t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, false));
//
//     t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture));
//     t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, 42));
//     t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, 'threeve'));
//     t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, false));
//
//     t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, navigationLibraryFixture));
//     t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, 42, navigationLibraryFixture));
//     t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, 'threeve', navigationLibraryFixture));
//     t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, false, navigationLibraryFixture));
// });
//
// ava('does not throw when passed valid parameters', (t) => {
//     t.notThrows(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, navigationLibraryFixture));
// });
//
// ava('.createAircraftWithSpawnPatternModel() calls ._buildAircraftProps()', (t) => {
//     const controller = new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, navigationLibraryFixture);
//     const _buildAircraftPropsSpy = sinon.spy(controller, '_buildAircraftProps');
//     const _createAircraftWithInitializationPropsStub = sinon.stub(controller, '_createAircraftWithInitializationProps');
//
//     controller.createAircraftWithSpawnPatternModel(spawnPatternModelArrivalFixture);
//
//     t.true(_buildAircraftPropsSpy.calledWithExactly(spawnPatternModelArrivalFixture));
//
//     _createAircraftWithInitializationPropsStub.restore();
// });
//
// ava('.removeFlightNumberFromList() calls _airlineController.removeFlightNumberFromList() with an airlineId and a flightNumber', (t) => {
//     const controller = new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, navigationLibraryFixture);
//     const removeFlightNumberFromListSpy = sinon.spy(controller._airlineController, 'removeFlightNumberFromList');
//
//     controller.removeFlightNumberFromList({ airlineId: 'aal', callsign: '123' });
//
//     t.true(removeFlightNumberFromListSpy.calledOnce);
// });
