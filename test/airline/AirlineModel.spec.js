import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import _isEqual from 'lodash/isEqual';
import _map from 'lodash/map';

import AirlineModel from '../../src/assets/scripts/client/airline/AirlineModel';
import {
    AIRLINE_DEFINITION_MOCK,
    AIRLINE_DEFINITION_SIMPLE_FLEET_MOCK
} from './_mocks/airlineMocks';

ava('throws when called with invalid data', (t) => {
    t.throws(() => new AirlineModel());
    t.throws(() => new AirlineModel([]));
    t.throws(() => new AirlineModel({}));
    t.throws(() => new AirlineModel(42));
    t.throws(() => new AirlineModel('threeve'));
    t.throws(() => new AirlineModel(false));
});

ava('aircraftList returns a list of all aircraft from all fleets', (t) => {
    const model = new AirlineModel(AIRLINE_DEFINITION_MOCK);

    t.true(_isArray(model.aircraftList));
});

ava('flightNumbers returns a list of all activeFlightNumbers', (t) => {
    const model = new AirlineModel(AIRLINE_DEFINITION_MOCK);
    model.activeFlightNumbers = ['1', '2', '3'];

    t.true(_isEqual(model.flightNumbers, ['1', '2', '3']));
});

ava('.getRandomAircraftType() calls _getRandomAircraftTypeFromAllFleets when no parameter is passed', (t) => {
    const model = new AirlineModel(AIRLINE_DEFINITION_MOCK);
    const _getRandomAircraftTypeFromAllFleetsSpy = sinon.spy(model, '_getRandomAircraftTypeFromAllFleets');

    model._getRandomAircraftTypeFromAllFleets();

    t.true(_getRandomAircraftTypeFromAllFleetsSpy.called);
});

ava('.getRandomAircraftType() calls _getRandomAircraftTypeFromFleet when a fleet parameter is passed', (t) => {
    const fleetNameMock = '90long';
    const model = new AirlineModel(AIRLINE_DEFINITION_MOCK);
    const _getRandomAircraftTypeFromFleetSpy = sinon.spy(model, '_getRandomAircraftTypeFromFleet');

    model._getRandomAircraftTypeFromFleet(fleetNameMock);

    t.true(_getRandomAircraftTypeFromFleetSpy.calledWithExactly(fleetNameMock));
});

ava('.removeFlightNumber() calls _deactivateFlightNumber', (t) => {
    const flightNumberMock = '123';
    const model = new AirlineModel(AIRLINE_DEFINITION_MOCK);
    const _deactivateFlightNumberSpy = sinon.spy(model, '_deactivateFlightNumber');
    model.activeFlightNumbers.push(flightNumberMock);

    model.removeFlightNumber(flightNumberMock);

    t.true(_deactivateFlightNumberSpy.calledWithExactly(flightNumberMock));
});

ava('.removeFlightNumber() removes a provided flightNumber from activeFlightNumbers', (t) => {
    const flightNumberMock = '123';
    const model = new AirlineModel(AIRLINE_DEFINITION_MOCK);
    model.activeFlightNumbers.push(flightNumberMock);

    model.removeFlightNumber(flightNumberMock);

    t.true(model.activeFlightNumbers.indexOf(flightNumberMock) === -1);
    t.true(model.activeFlightNumbers.length === 0);
});

ava('.getRandomAircraftType() calls ._getRandomAircraftTypeFromAllFleets() when no fleet is provided', (t) => {
    const model = new AirlineModel(AIRLINE_DEFINITION_MOCK);
    const _getRandomAircraftTypeFromAllFleetsSpy = sinon.spy(model, '_getRandomAircraftTypeFromAllFleets');

    model.getRandomAircraftType();

    t.true(_getRandomAircraftTypeFromAllFleetsSpy.calledOnce);
});

ava('.getRandomAircraftType() calls ._getRandomAircraftTypeFromFleet() fleet is provided', (t) => {
    const fleetNameMock = 'long';
    const model = new AirlineModel(AIRLINE_DEFINITION_MOCK);
    const _getRandomAircraftTypeFromFleetSpy = sinon.spy(model, '_getRandomAircraftTypeFromFleet');

    model.getRandomAircraftType(fleetNameMock);

    t.true(_getRandomAircraftTypeFromFleetSpy.calledWithExactly(fleetNameMock));
});

ava('._getRandomAircraftTypeFromFleet() throws if it received an invalid fleetName', (t) => {
    const fleetNameMock = 'threeve';
    const model = new AirlineModel(AIRLINE_DEFINITION_MOCK);

    t.throws(() => model._getRandomAircraftTypeFromFleet(fleetNameMock));
});

ava('._getRandomAircraftTypeFromFleet() returns a random aircraft types form a specific fleet', (t) => {
    const fleetNameMock = '90long';
    const expectedResult = _map(AIRLINE_DEFINITION_MOCK.fleets['90long'], (aircraft) => aircraft[0]);
    const model = new AirlineModel(AIRLINE_DEFINITION_MOCK);
    const result = model._getRandomAircraftTypeFromFleet(fleetNameMock);

    t.true(expectedResult.indexOf(result) !== -1);
});

ava('._transformFleetNamesToLowerCase() transforms each type in fleet to lowercase', (t) => {
    const model = new AirlineModel(AIRLINE_DEFINITION_SIMPLE_FLEET_MOCK);

    t.true(model.fleets.default[0][[0]] === 'a319');
});

ava('.generateFlightNumber() returns a valid callsign when called', (t) => {
    const model = new AirlineModel(AIRLINE_DEFINITION_SIMPLE_FLEET_MOCK);
    const result = model.generateFlightNumber();
    const regex = /[^A-Z]/;

    t.true(regex.test(result) && result.charAt(0) !== 0);
});

ava('._isActiveFlightNumber() returns false if a given flightNumber is not present in activeFlightNumbers', (t) => {
    const model = new AirlineModel(AIRLINE_DEFINITION_SIMPLE_FLEET_MOCK);

    t.false(model._isActiveFlightNumber('threeve'));
});

ava('._isActiveFlightNumber() returns true if a given flightNumber is present in activeFlightNumbers', (t) => {
    const flightNumberMock = '123';
    const model = new AirlineModel(AIRLINE_DEFINITION_SIMPLE_FLEET_MOCK);
    model.activeFlightNumbers.push(flightNumberMock);

    t.true(model._isActiveFlightNumber(flightNumberMock));
});
