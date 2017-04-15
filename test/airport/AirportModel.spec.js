import ava from 'ava';
import sinon from 'sinon';

import AirportModel from '../../src/assets/scripts/client/airport/AirportModel';
import { AIRPORT_JSON_KLAS_MOCK } from './_mocks/airportJsonMock';

const onUpdateRunStub = sinon.stub();
const onAirportChange = sinon.stub();

ava('does not throw', (t) => {
    t.notThrows(() => new AirportModel(AIRPORT_JSON_KLAS_MOCK, onUpdateRunStub, onAirportChange));
});
