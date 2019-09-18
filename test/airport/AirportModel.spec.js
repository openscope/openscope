import ava from 'ava';
import sinon from 'sinon';

import AirportModel from '../../src/assets/scripts/client/airport/AirportModel';
import { FLIGHT_CATEGORY } from '../../src/assets/scripts/client/constants/aircraftConstants';
import { AIRPORT_JSON_KLAS_MOCK } from './_mocks/airportJsonMock';

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new AirportModel(AIRPORT_JSON_KLAS_MOCK));
});

ava('#runways retuns an array of RunwayModels with the correct data', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);

    t.true(model.runways[0][0].name === '07L');
    t.true(model.runways[0][1].name === '25R');
    t.deepEqual(model.runways[0][0].relativePosition, [-1.5972765965064895, -0.7590007123826077]);
    t.deepEqual(model.runways[0][1].relativePosition, [2.8236983855119275, 0.17990498917699685]);
});

ava('does not call .setCurrentPosition() when airportData does not have a position value', (t) => {
    const invalidAirportJsonMock = Object.assign({}, AIRPORT_JSON_KLAS_MOCK, { position: null });
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const setCurrentPositionSpy = sinon.spy(model, 'setCurrentPosition');

    model.init(invalidAirportJsonMock);

    t.false(setCurrentPositionSpy.called);
});

ava('calls .setCurrentPosition() when airportData has a position value', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const setCurrentPositionSpy = sinon.spy(model, 'setCurrentPosition');

    model.init(AIRPORT_JSON_KLAS_MOCK);

    t.true(setCurrentPositionSpy.calledOnce);
});

ava('.setCurrentPosition() returns early when passed an invalid coordinate', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    model._positionModel = null;

    model.setCurrentPosition([]);

    t.true(!model._positionModel);
});

ava('.buildAirportAirspace() returns early when passed a null or undefined argument', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    model.airspace = null;

    model.buildAirportAirspace();

    t.true(!model.airspace);
});

ava('.buildRestrictedAreas() returns early when passed a null or undefined argument', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    model.restricted_areas = null;

    model.buildRestrictedAreas();

    t.true(!model.restricted_areas);
});

ava('.updateCurrentWind() returns early when passed a null or undefined argument', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    model.wind.speed = 42;
    model.wind.angle = 42;

    model.updateCurrentWind();

    t.true(model.wind.speed === 42);
    t.true(model.wind.angle === 42);
});

ava('.set() calls .load() when #lodaed is false', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const loadSpy = sinon.spy(model, 'load');
    model.loaded = false;

    model.set(AIRPORT_JSON_KLAS_MOCK);

    t.true(loadSpy.calledWithExactly(AIRPORT_JSON_KLAS_MOCK));
});

ava('.loadTerrain() returns early when #has_terrain is false', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const parseTerrainSpy = sinon.spy(model, 'parseTerrain');
    model.has_terrain = false;

    model.loadTerrain();

    t.false(parseTerrainSpy.calledOnce);
});

ava('.load() calls .onLoadIntialAirportFromJson() when passed an object', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const onLoadIntialAirportFromJsonSpy = sinon.spy(model, 'onLoadIntialAirportFromJson');

    model.load(AIRPORT_JSON_KLAS_MOCK);

    t.true(onLoadIntialAirportFromJsonSpy.calledWithExactly(AIRPORT_JSON_KLAS_MOCK));
});

ava('.load() does not call .onLoadIntialAirportFromJson() when no parameters are received', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const onLoadIntialAirportFromJsonSpy = sinon.spy(model, 'onLoadIntialAirportFromJson');

    model.load();

    t.false(onLoadIntialAirportFromJsonSpy.called);
});

ava('.getRunwayByName() returns null when passed an invalid runwayname', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const result = model.getRunway();

    t.true(!result);
});

ava('.getActiveRunwayForCategory() returns the correct RunwayModel for departure', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const result = model.getActiveRunwayForCategory(FLIGHT_CATEGORY.DEPARTURE);

    t.true(result.name === model.departureRunwayModel.name);
});

ava('.getActiveRunwayForCategory() returns the correct RunwayModel for arrival', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const result = model.getActiveRunwayForCategory(FLIGHT_CATEGORY.ARRIVAL);

    t.true(result.name === model.arrivalRunwayModel.name);
});

ava('.getActiveRunwayForCategory() returns the arrivalRunway when an invalid category is passed', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const result = model.getActiveRunwayForCategory('threeve');

    t.true(result.name === model.arrivalRunwayModel.name);
});

ava('.mapCollection is valid', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);

    t.true(model.mapCollection.hasVisibleMaps);
});

ava.skip('.removeAircraftFromAllRunwayQueues()', (t) => {
    const model = new AirportModel(AIRPORT_JSON_KLAS_MOCK);
    const removeAircraftFromAllRunwayQueuesSpy = sinon.spy(model._runwayCollection, 'removeAircraftFromAllRunwayQueues');
    model.removeAircraftFromAllRunwayQueues({});

    t.true(removeAircraftFromAllRunwayQueuesSpy.calledOnce);
});
