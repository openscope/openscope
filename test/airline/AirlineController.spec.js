import ava from 'ava';

import AirlineController from '../../src/assets/scripts/client/airline/AirlineController';
import { AIRLINE_DEFINITION_LIST_FOR_FIXTURE } from './_mocks/airlineMocks';

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => new AirlineController(AIRLINE_DEFINITION_LIST_FOR_FIXTURE));
});
