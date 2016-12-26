import ava from 'ava';
import _isArray from 'lodash/isArray';

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

ava('#aircraftList returns a list of all aircraft from all fleets for an airline', (t) => {
    const model = new AirlineModel(AIRLINE_DEFINITION_MOCK);

    t.true(_isArray(model.aircraftList));
});

ava('._transformFleetNamesToLowerCase() transforms each type in fleet to lowercase', (t) => {
    const model = new AirlineModel(AIRLINE_DEFINITION_SIMPLE_FLEET_MOCK);

    t.true(model.fleets.default[0][[0]] === 'a319');
});
