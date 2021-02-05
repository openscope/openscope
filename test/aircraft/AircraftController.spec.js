import ava from 'ava';
// import sinon from 'sinon';

import AircraftController from '../../src/assets/scripts/client/aircraft/AircraftController';
import { AIRCRAFT_DEFINITION_LIST_MOCK } from './_mocks/aircraftMocks';
import { airlineControllerFixture } from '../fixtures/airlineFixtures';
import { scopeModelFixture } from '../fixtures/scopeFixtures';
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

ava('throws when called with invalid parameters', (t) => {
    t.throws(() => new AircraftController());
    t.throws(() => new AircraftController({}));
    t.throws(() => new AircraftController([]));
    t.throws(() => new AircraftController(42));
    t.throws(() => new AircraftController('threeve'));
    t.throws(() => new AircraftController(false));

    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK));
    // TODO: these fail because validation for airlineController is not strict enough, only checks for "must be an object"
    // t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, {}));
    // t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, []));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, 42));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, 'threeve'));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, false));

    // TODO: these fail because there is no validation for scopeModel
    // t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture));
    // t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, 42));
    // t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, 'threeve'));
    // t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, false));

    // TODO: fails, etc
    // t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, scopeModelFixture));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, 42, scopeModelFixture));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, 'threeve', scopeModelFixture));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, false, scopeModelFixture));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, scopeModelFixture));
});

// ava('.createAircraftWithSpawnPatternModel() calls ._buildAircraftProps()', (t) => {
//     const controller = new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, scopeModelFixture);
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
//     const controller = new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, scopeModelFixture);
//     const removeFlightNumberFromListSpy = sinon.spy(controller._airlineController, 'removeFlightNumberFromList');
//
//     controller.removeFlightNumberFromList({ airlineId: 'aal', callsign: '123' });
//
//     t.true(removeFlightNumberFromListSpy.calledOnce);
// });
