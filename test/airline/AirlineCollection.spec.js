import ava from 'ava';

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

ava('.findAirlineById() returns an AirlineModel when supplied an airlineId without fleet', (t) => {
    const collection = new AirlineCollection(AIRLINE_DEFINITION_LIST_MOCK);
    const result = collection.findAirlineById('aal');

    t.true(result instanceof AirlineModel);
    t.true(result.icao === 'aal');
});

ava('.findAirlineById() returns an AirlineModel when supplied an airlineId with fleet', (t) => {
    const collection = new AirlineCollection(AIRLINE_DEFINITION_LIST_MOCK);
    const result = collection.findAirlineById('ual/long');

    t.true(result instanceof AirlineModel);
    t.true(result.icao === 'ual');
});
