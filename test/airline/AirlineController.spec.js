import ava from 'ava';
import sinon from 'sinon';

import AirlineController from '../../src/assets/scripts/client/airline/AirlineController';
import { AIRLINE_DEFINITION_LIST_FOR_FIXTURE } from './_mocks/airlineMocks';

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => new AirlineController(AIRLINE_DEFINITION_LIST_FOR_FIXTURE));
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
