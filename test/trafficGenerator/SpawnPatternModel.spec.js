/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import sinon from 'sinon';
import _cloneDeep from 'lodash/cloneDeep';
import _isEmpty from 'lodash/isEmpty';
import _isEqual from 'lodash/isEqual';
import _round from 'lodash/round';

import SpawnPatternModel from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternModel';
import AirportController from '../../src/assets/scripts/client/airport/AirportController';
import { airportControllerFixture } from '../fixtures/airportFixtures';
import { navigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';
import {
    spawnPatternModelArrivalFixture,
    spawnPatternModelDepartureFixture
} from '../fixtures/trafficGeneratorFixtures';
import {
    DEPARTURE_PATTERN_MOCK,
    ARRIVAL_PATTERN_MOCK,
    ARRIVAL_PATTERN_ROUTE_STRING_MOCK,
    ARRIVAL_PATTERN_CYCLIC_MOCK,
    ARRIVAL_PATTERN_WAVE_MOCK
} from './_mocks/spawnPatternMocks';

ava('does not throw when called without parameters', (t) => {
    t.notThrows(() => new SpawnPatternModel());
    t.notThrows(() => new SpawnPatternModel([]));
    t.notThrows(() => new SpawnPatternModel({}));
    t.notThrows(() => new SpawnPatternModel(42));
    t.notThrows(() => new SpawnPatternModel('threeve'));
    t.notThrows(() => new SpawnPatternModel(false));
});

ava('.init() throws when called with invalid parameters', (t) => {
    const model = new SpawnPatternModel();

    t.throws(() => model.init(ARRIVAL_PATTERN_MOCK));
    t.throws(() => model.init(ARRIVAL_PATTERN_MOCK, []));
    t.throws(() => model.init(ARRIVAL_PATTERN_MOCK, {}));
    t.throws(() => model.init(ARRIVAL_PATTERN_MOCK, 42));
    t.throws(() => model.init(ARRIVAL_PATTERN_MOCK, 'threeve'));
    t.throws(() => model.init(ARRIVAL_PATTERN_MOCK, false));

    t.throws(() => model.init(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture));
    t.throws(() => model.init(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, []));
    t.throws(() => model.init(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, {}));
    t.throws(() => model.init(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, 42));
    t.throws(() => model.init(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, 'threeve'));
    t.throws(() => model.init(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, false));
});

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture));
    t.notThrows(() => new SpawnPatternModel(ARRIVAL_PATTERN_ROUTE_STRING_MOCK, navigationLibraryFixture, airportControllerFixture));
    t.notThrows(() => new SpawnPatternModel(DEPARTURE_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture));
});

ava('#altitude returns a random altitude rounded to the nearest 1,000ft', (t) => {
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);
    const result = model.altitude;
    const expectedResult = _round(result, -3);

    t.true(_isEqual(result, expectedResult));
});

ava('.getNextDelayValue() returns a random number between #minimumDelay and #maximumDelay', (t) => {
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);
    model._minimumDelay = 0;
    model._maximumDelay = 3;

    const result = model.getNextDelayValue();

    t.true(typeof result === 'number');
});

ava('._calculateNextCyclicDelayPeriod() returns 360 when gameTime is 0', (t) => {
    const gameTimeMock = 0;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_CYCLIC_MOCK, navigationLibraryFixture, airportControllerFixture);
    const result = model._calculateNextCyclicDelayPeriod(gameTimeMock);

    t.true(result === 360);
});

ava.skip('._calculateNextWaveDelayPeriod()', (t) => {
    const gameTimeMock = 3320;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_WAVE_MOCK, navigationLibraryFixture, airportControllerFixture);
    const result = model._calculateNextWaveDelayPeriod(gameTimeMock);

    console.log(result);

    // t.true(result === 360);
});

ava('._setMinMaxAltitude() sets #_minimumAltitude and #_maximumAltitude when an array is passed ', (t) => {
    // creating new mock here so as not to overwrite and affect original
    const arrivalMock = Object.assign({}, ARRIVAL_PATTERN_MOCK, { altitude: 0 });
    const altitudeMock = [10000, 20000];
    const model = new SpawnPatternModel(arrivalMock, navigationLibraryFixture, airportControllerFixture);

    model._setMinMaxAltitude(altitudeMock);

    t.true(model._minimumAltitude === altitudeMock[0]);
    t.true(model._maximumAltitude === altitudeMock[1]);
});

ava('._setMinMaxAltitude() sets #_minimumAltitude and #_maximumAltitude when a number is passed ', (t) => {
    // creating new mock here so as not to overwrite and affect original
    const arrivalMock = Object.assign({}, ARRIVAL_PATTERN_MOCK, { altitude: 0 });
    const altitudeMock = 23000;
    const model = new SpawnPatternModel(arrivalMock, navigationLibraryFixture, airportControllerFixture);

    model._setMinMaxAltitude(altitudeMock);

    t.true(model._minimumAltitude === altitudeMock);
    t.true(model._maximumAltitude === altitudeMock);
});

ava('._calculateMaximumDelayFromRate() returns a number equal to 1hr in miliseconds / #frequency', (t) => {
    const expectedResult = 360;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);
    const result = model._calculateMaximumDelayFromRate();

    t.true(result === expectedResult);
});

// this method of calculating heading and position may not be needed. see notes in actual method
ava.skip('._calculatePositionAndHeadingForArrival() calculates aircraft heading and position when provided list a of fixes', (t) => {
    const expedtedHeadingResult = 0.5812231343277809;
    const expectedPositionResult = [-99.76521626690608, -148.0266530993096];
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);
    // using cloneDeep here so we can set fixes for the fixture without affecting the actual fixture
    const spawnModelFixture = _cloneDeep(spawnPatternModelArrivalFixture);
    spawnModelFixture.fixes = ['DAG', 'MISEN', 'CLARR'];

    model._calculatePositionAndHeadingForArrival(spawnModelFixture);

    t.true(model.heading === expedtedHeadingResult);
    t.true(_isEqual(model.position, expectedPositionResult));
});

ava('._calculatePositionAndHeadingForArrival() returns early when spawnPattern.category is departure', (t) => {
    const model = new SpawnPatternModel(DEPARTURE_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);

    model._calculatePositionAndHeadingForArrival(DEPARTURE_PATTERN_MOCK, navigationLibraryFixture);

    t.true(model.heading === -1);
    t.true(_isEmpty(model.position));
});

ava('._calculatePositionAndHeadingForArrival() calculates aircraft heading and position when provided a route', (t) => {
    const expedtedHeadingResult = -1.8520506712692788;
    const expectedPositionResult = [220.0165474765974,137.76227044819646];
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);

    model._calculatePositionAndHeadingForArrival(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture);

    t.true(model.heading === expedtedHeadingResult);
    t.true(_isEqual(model.position, expectedPositionResult));
});
