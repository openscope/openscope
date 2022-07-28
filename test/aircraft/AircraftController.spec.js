import ava from 'ava';
// import sinon from 'sinon';

import AircraftController from '../../src/assets/scripts/client/aircraft/AircraftController';
import { AIRCRAFT_DEFINITION_LIST_MOCK } from './_mocks/aircraftMocks';
import { airlineControllerFixture } from '../fixtures/airlineFixtures';
import { scopeModelFixture } from '../fixtures/scopeFixtures';
// import { spawnPatternModelArrivalFixture } from '../fixtures/trafficGeneratorFixtures';

ava('throws when called with missing parameters', (t) => {
    const expectedMessage = /Invalid parameter\(s\) passed to AircraftController constructor\. Expected aircraftTypeDefinitionList, airlineController and scopeModel to be defined, but received .*/;

    t.throws(() => new AircraftController(), {
        instanceOf: TypeError,
        message: expectedMessage
    });

    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(airlineControllerFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });

    t.throws(() => new AircraftController(airlineControllerFixture, scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });

    t.throws(() => new AircraftController(null, airlineControllerFixture, scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, null, scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, null), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('throws when called with invalid aircraftTypeDefinitionList', (t) => {
    const expectedMessage = /Invalid aircraftTypeDefinitionList passed to AircraftController constructor\. Expected a non-empty array, but received .*/;

    t.throws(() => new AircraftController({}, airlineControllerFixture, scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController([], airlineControllerFixture, scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(42, airlineControllerFixture, scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController('threeve', airlineControllerFixture, scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(false, airlineControllerFixture, scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('throws when called with invalid airlineController', (t) => {
    const expectedMessage = /Invalid airlineController passed to AircraftController constructor\. Expected instance of AirlineController, but received .*/;

    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, {}, scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, [], scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, 42, scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, 'threeve', scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, false, scopeModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('throws when called with invalid scopeModel', (t) => {
    const expectedMessage = /Invalid scopeModel passed to AircraftController constructor\. Expected instance of ScopeModel, but received .*/;

    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, {}), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, []), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, 42), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, 'threeve'), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, false), {
        instanceOf: TypeError,
        message: expectedMessage
    });
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
