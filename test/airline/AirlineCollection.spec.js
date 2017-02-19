import ava from 'ava';
import _isEqual from 'lodash/isEqual';

import AirlineCollection from '../../src/assets/scripts/client/airline/AirlineCollection';
import AirlineModel from '../../src/assets/scripts/client/airline/AirlineModel';
import { AIRLINE_DEFINITION_LIST_MOCK } from './_mocks/airlineMocks';

ava('throws when called with invalid data', (t) => {
    t.throws(() => new AirlineCollection());
    t.throws(() => new AirlineCollection({}));
    t.throws(() => new AirlineCollection(42));
    t.throws(() => new AirlineCollection('threeve'));
    t.throws(() => new AirlineCollection(false));
});

ava('does not throw when called with valid data', (t) => {
    t.notThrows(() => new AirlineCollection(AIRLINE_DEFINITION_LIST_MOCK));
});

ava('flightNumbers returns a list of flightNumbers from all AirlineModels in the collection', (t) => {
    const expectedResult = ['123', '321', '234', '432'];
    const collection = new AirlineCollection(AIRLINE_DEFINITION_LIST_MOCK);
    collection._items[0].activeFlightNumbers = ['123', '321'];
    collection._items[1].activeFlightNumbers = ['234', '432'];

    t.true(_isEqual(collection.flightNumbers, expectedResult));
});

ava('.findAirlineById() returns an AirlineModel when supplied an airlineId without fleet', (t) => {
    const collection = new AirlineCollection(AIRLINE_DEFINITION_LIST_MOCK);
    const result = collection.findAirlineById('aal');

    t.true(result instanceof AirlineModel);
    t.true(result.icao === 'aal');
});

ava('.findAirlineById() returns an AirlineModel when supplied an airlineId in uppercase without fleet', (t) => {
    const collection = new AirlineCollection(AIRLINE_DEFINITION_LIST_MOCK);
    const result = collection.findAirlineById('AAL');

    t.true(result instanceof AirlineModel);
    t.true(result.icao === 'aal');
});

ava('.findAirlineById() returns an AirlineModel when supplied an airlineId mixed case', (t) => {
    const collection = new AirlineCollection(AIRLINE_DEFINITION_LIST_MOCK);
    const result = collection.findAirlineById('uAl');

    t.true(result instanceof AirlineModel);
    t.true(result.icao === 'ual');
});

ava('.findAirlineById() returns an AirlineModel when supplied an airlineId with fleet', (t) => {
    const collection = new AirlineCollection(AIRLINE_DEFINITION_LIST_MOCK);
    const result = collection.findAirlineById('ual/long');

    t.true(result instanceof AirlineModel);
    t.true(result.icao === 'ual');
});
