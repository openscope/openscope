import ava from 'ava';
import sinon from 'sinon';

import AirlineController from '../../src/assets/scripts/client/airline/AirlineController';
import { AIRLINE_DEFINITION_LIST_FOR_FIXTURE } from './_mocks/airlineMocks';

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => new AirlineController(AIRLINE_DEFINITION_LIST_FOR_FIXTURE));
});

ava('.generateFlightNumberWithAirlineModel() throws when it receives anything other than an AirlineModel', (t) => {
    const controller = new AirlineController(AIRLINE_DEFINITION_LIST_FOR_FIXTURE);

    t.throws(() => controller.generateFlightNumberWithAirlineModel({}));
});

ava('.generateFlightNumberWithAirlineModel() returns a new flightNumber', (t) => {
    const controller = new AirlineController(AIRLINE_DEFINITION_LIST_FOR_FIXTURE);
    const airlineModel = controller.airlineCollection._items[0];
    const generateFlightNumberSpy = sinon.spy(airlineModel, 'generateFlightNumber');

    controller.generateFlightNumberWithAirlineModel(airlineModel);

    t.true(generateFlightNumberSpy.called);
});

ava('.generateFlightNumberWithAirlineModel() calls airlineModel.generateFlightNumber() twice if the first return exists in flightNumbers', (t) => {
    const controller = new AirlineController(AIRLINE_DEFINITION_LIST_FOR_FIXTURE);
    const airlineModel = controller.airlineCollection._items[0];
    airlineModel.activeFlightNumbers = ['42'];

    const generateFlightNumberStub = sinon.stub(airlineModel, 'generateFlightNumber');
    generateFlightNumberStub.onFirstCall().returns('42');
    generateFlightNumberStub.onSecondCall().returns('3');

    controller.generateFlightNumberWithAirlineModel(airlineModel);

    t.true(generateFlightNumberStub.calledTwice);

    generateFlightNumberStub.restore();
});

ava('.generateFlightNumberWithAirlineModel() does not set a duplicate flightNumber to the list', (t) => {
    const controller = new AirlineController(AIRLINE_DEFINITION_LIST_FOR_FIXTURE);
    const airlineModel = controller.airlineCollection._items[0];
    airlineModel.activeFlightNumbers = ['42'];

    const generateFlightNumberStub = sinon.stub(airlineModel, 'generateFlightNumber');
    generateFlightNumberStub.onFirstCall().returns('42');
    generateFlightNumberStub.onSecondCall().returns('3');

    controller.generateFlightNumberWithAirlineModel(airlineModel);

    t.true(controller.flightNumbers.length === 2);
    t.true(controller.flightNumbers.indexOf('42') !== -1);
    t.true(controller.flightNumbers.indexOf('3') !== -1);

    generateFlightNumberStub.restore();
});

ava('.generateFlightNumberWithAirlineModel() calls airlineModel.addFlightNumberToInUse() when a unique flightNumber is generated', (t) => {
    const controller = new AirlineController(AIRLINE_DEFINITION_LIST_FOR_FIXTURE);
    const airlineModel = controller.airlineCollection._items[0];
    const addFlightNumberToInUseSpy = sinon.spy(airlineModel, 'addFlightNumberToInUse');
    const result = controller.generateFlightNumberWithAirlineModel(airlineModel);

    t.true(addFlightNumberToInUseSpy.calledWithExactly(result));
});

ava('.generateFlightNumberWithAirlineModel() returns a string', (t) => {
    const controller = new AirlineController(AIRLINE_DEFINITION_LIST_FOR_FIXTURE);
    const airlineModel = controller.airlineCollection._items[0];
    const result = controller.generateFlightNumberWithAirlineModel(airlineModel);

    t.true(typeof result === 'string');
});

ava('.removeFlightNumberFromList() does not throw if an airlineModel is not found', (t) => {
    const airlineMock = 'aal';
    const callsignMock = '123';
    const controller = new AirlineController(AIRLINE_DEFINITION_LIST_FOR_FIXTURE);

    t.notThrows(() => controller.removeFlightNumberFromList(airlineMock, callsignMock));
});

ava('.removeFlightNumberFromList() calls .removeFlightNumber() on the found AirlineModel', (t) => {
    const airlineMock = 'aal';
    const callsignMock = '123';
    const controller = new AirlineController(AIRLINE_DEFINITION_LIST_FOR_FIXTURE);
    const model = controller.findAirlineById(airlineMock);
    const removeFlightNumberSpy = sinon.spy(model, 'removeFlightNumber');

    controller.removeFlightNumberFromList(airlineMock, callsignMock);

    t.true(removeFlightNumberSpy.calledWithExactly(callsignMock));
});

ava('._isActiveFlightNumber() returns true if a given flightNumber exists within any AirlineModel.activeFlightNumbers list', (t) => {
    const invalidFlightNumberMock = 'threeve';
    const validFlightNumberMock = '42';
    const controller = new AirlineController(AIRLINE_DEFINITION_LIST_FOR_FIXTURE);
    controller.airlineCollection._items[0].activeFlightNumbers = [validFlightNumberMock];

    t.false(controller._isActiveFlightNumber(invalidFlightNumberMock));
    t.true(controller._isActiveFlightNumber(validFlightNumberMock));
});
