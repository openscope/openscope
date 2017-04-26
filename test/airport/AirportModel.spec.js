import ava from 'ava';
import sinon from 'sinon';

import AirportModel from '../../src/assets/scripts/client/airport/AirportModel';
import RunwayModel from '../../src/assets/scripts/client/airport/runway/RunwayModel';
import { AIRPORT_JSON_KLAS_MOCK } from './_mocks/airportJsonMock';

const onUpdateRunStub = sinon.stub();
const onAirportChange = sinon.stub();

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new AirportModel(AIRPORT_JSON_KLAS_MOCK, onUpdateRunStub, onAirportChange));
});

ava('.updateRunway() calls #_runwayCollection.findBestRunwayForWind()', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK, onUpdateRunStub, onAirportChange);
    const findBestRunwayForWindSpy = sinon.spy(model._runwayCollection, 'findBestRunwayForWind');

    model.updateRunway();

    t.true(findBestRunwayForWindSpy.called);
});

ava('.getRunwayByName() returns null when passed an invalid runwayname', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK, onUpdateRunStub, onAirportChange);
    const result = model.getRunway();

    t.true(result === null);
});

ava('.removeAircraftFromAllRunwayQueues()', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK, onUpdateRunStub, onAirportChange);
    const removeAircraftFromAllRunwayQueuesSpy = sinon.spy(model._runwayCollection, 'removeAircraftFromAllRunwayQueues');
    model.removeAircraftFromAllRunwayQueues({});

    t.true(removeAircraftFromAllRunwayQueuesSpy.calledOnce);
});
