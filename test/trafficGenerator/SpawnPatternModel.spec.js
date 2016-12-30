/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import _cloneDeep from 'lodash/cloneDeep';
import _isEmpty from 'lodash/isEmpty';
import _isEqual from 'lodash/isEqual';

import SpawnPatternModel from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternModel';
import { navigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';
import {
    spawnPatternModelArrivalFixture,
    spawnPatternModelDepartureFixture
} from '../fixtures/trafficGeneratorFixtures';
import {
    DEPARTURE_PATTERN_MOCK,
    ARRIVAL_PATTERN_MOCK
} from './_mocks/spawnPatternMocks';

ava('throws when called with invalid parameters', (t) => {
    t.throws(() => new SpawnPatternModel());
    t.throws(() => new SpawnPatternModel([]));
    t.throws(() => new SpawnPatternModel({}));
    t.throws(() => new SpawnPatternModel(42));
    t.throws(() => new SpawnPatternModel('threeve'));
    t.throws(() => new SpawnPatternModel(false));

    t.throws(() => new SpawnPatternModel(navigationLibraryFixture));
    t.throws(() => new SpawnPatternModel([], navigationLibraryFixture));
    t.throws(() => new SpawnPatternModel({}, navigationLibraryFixture));
    t.throws(() => new SpawnPatternModel(42, navigationLibraryFixture));
    t.throws(() => new SpawnPatternModel('threeve', navigationLibraryFixture));
    t.throws(() => new SpawnPatternModel(false, navigationLibraryFixture));
});

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture));
    t.notThrows(() => new SpawnPatternModel(DEPARTURE_PATTERN_MOCK, navigationLibraryFixture));
});

ava('.getRandomDelayValue() returns a random number between #minimumDelay and #maximumDelay', (t) => {
    const expectedResultRange = [0, 1, 2, 3];
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture);
    model._minimumDelay = 0;
    model._maximumDelay = 3;

    const result = model.getRandomDelayValue();

    t.true(expectedResultRange.indexOf(result) !== -1);
});

ava('._setMinMaxAltitude() sets #_minimumAltitude and #_maximumAltitude when an array is passed ', (t) => {
    // creating new mock here so as not to overwrite and affect original
    const arrivalMock = Object.assign({}, ARRIVAL_PATTERN_MOCK, { altitude: 0 });
    const altitudeMock = [10000, 20000];
    const model = new SpawnPatternModel(arrivalMock, navigationLibraryFixture);

    model._setMinMaxAltitude(altitudeMock);

    t.true(model._minimumAltitude === altitudeMock[0]);
    t.true(model._maximumAltitude === altitudeMock[1]);
});

ava('._setMinMaxAltitude() sets #_minimumAltitude and #_maximumAltitude when a number is passed ', (t) => {
    // creating new mock here so as not to overwrite and affect original
    const arrivalMock = Object.assign({}, ARRIVAL_PATTERN_MOCK, { altitude: 0 });
    const altitudeMock = 23000;
    const model = new SpawnPatternModel(arrivalMock, navigationLibraryFixture);

    model._setMinMaxAltitude(altitudeMock);

    t.true(model._minimumAltitude === altitudeMock);
    t.true(model._maximumAltitude === altitudeMock);
});

ava('._calculateMaximumMsDelayFromFrequency() returns a number equal to 1hr in miliseconds / #frequency', (t) => {
    const expectedResult = 360000;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture);
    const result = model._calculateMaximumMsDelayFromFrequency();

    t.true(result === expectedResult);
});

// this method of calculating heading and position may not be needed. see notes in actual method
ava.skip('._calculatePositionAndHeadingForArrival() calculates aircraft heading and position when provided list a of fixes', (t) => {
    const expedtedHeadingResult = 0.5812231343277809;
    const expectedPositionResult = [-99.76521626690608, -148.0266530993096];
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture);
    // using cloneDeep here so we can set fixes for the fixture without affecting the actual fixture
    const spawnModelFixture = _cloneDeep(spawnPatternModelArrivalFixture);
    spawnModelFixture.fixes = ['DAG', 'MISEN', 'CLARR'];

    model._calculatePostiionAndHeadingForArrival(spawnModelFixture);

    t.true(model.heading === expedtedHeadingResult);
    t.true(_isEqual(model.position, expectedPositionResult));
});

ava('._calculatePostiionAndHeadingForArrival() returns early when spawnPattern.category is departure', (t) => {
    const model = new SpawnPatternModel(DEPARTURE_PATTERN_MOCK, navigationLibraryFixture);

    model._calculatePostiionAndHeadingForArrival(spawnPatternModelDepartureFixture, navigationLibraryFixture);

    t.true(model.heading === -1);
    t.true(_isEmpty(model.position));
});

ava('._calculatePostiionAndHeadingForArrival() calculates aircraft heading and position when provided a route', (t) => {
    const expedtedHeadingResult = 0.5812231343277809;
    const expectedPositionResult = [-99.76521626690608, -148.0266530993096];
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture);

    model._calculatePostiionAndHeadingForArrival(spawnPatternModelArrivalFixture, navigationLibraryFixture);

    t.true(model.heading === expedtedHeadingResult);
    t.true(_isEqual(model.position, expectedPositionResult));
});
