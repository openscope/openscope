import ava from 'ava';
import sinon from 'sinon';

import AirportModel from '../../src/assets/scripts/client/airport/AirportModel';
import RunwayModel from '../../src/assets/scripts/client/airport/runway/RunwayModel';
import { FLIGHT_CATEGORY } from '../../src/assets/scripts/client/constants/aircraftConstants';
import { AIRPORT_JSON_KLAS_MOCK } from './_mocks/airportJsonMock';

const onUpdateRunStub = sinon.stub();
const onAirportChange = sinon.stub();

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new AirportModel(AIRPORT_JSON_KLAS_MOCK, onUpdateRunStub, onAirportChange));
});

ava('#runways retuns an array of RunwayModels with the correct data', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK, onUpdateRunStub, onAirportChange);

    t.true(model.runways[0][0].name === '07L');
    t.true(model.runways[0][1].name === '25R');
    t.deepEqual(model.runways[0][0].relativePosition, [-1.5972765965064895, -0.7590007123826077]);
    t.deepEqual(model.runways[0][1].relativePosition, [2.8236983855119275, 0.17990498917699685]);
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

ava('.getActiveRunwayForCategory() returns the correct RunwayModel for departure', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK, onUpdateRunStub, onAirportChange);
    const result = model.getActiveRunwayForCategory(FLIGHT_CATEGORY.DEPARTURE);

    t.true(result.name === model.departureRunway.name);
});

ava('.getActiveRunwayForCategory() returns the correct RunwayModel for arrival', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK, onUpdateRunStub, onAirportChange);
    const result = model.getActiveRunwayForCategory(FLIGHT_CATEGORY.ARRIVAL);

    t.true(result.name === model.arrivalRunway.name);
});

ava('.getActiveRunwayForCategory() returns the arrivalRunway when an invalid category is passed', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK, onUpdateRunStub, onAirportChange);
    const result = model.getActiveRunwayForCategory('threeve');

    t.true(result.name === model.arrivalRunway.name);
});

ava.skip('.removeAircraftFromAllRunwayQueues()', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK, onUpdateRunStub, onAirportChange);
    const removeAircraftFromAllRunwayQueuesSpy = sinon.spy(model._runwayCollection, 'removeAircraftFromAllRunwayQueues');
    model.removeAircraftFromAllRunwayQueues({});

    t.true(removeAircraftFromAllRunwayQueuesSpy.calledOnce);
});
