/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';

import SpawnPatternModel from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternModel';
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
});

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => new SpawnPatternModel(ARRIVAL_PATTERN_MOCK));
    t.notThrows(() => new SpawnPatternModel(DEPARTURE_PATTERN_MOCK));
});

ava('.getRandomDelayValue() returns a random number between #minimumDelay and #maximumDelay', (t) => {
    const expectedResultRange = [0, 1, 2, 3];
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK);
    model._minimumDelay = 0;
    model._maximumDelay = 3;

    const result = model.getRandomDelayValue();

    t.true(expectedResultRange.indexOf(result) !== -1);
});

ava('._setMinMaxAltitude() sets #_minimumAltitude and #_maximumAltitude when an array is passed ', (t) => {
    // creating new mock here so as not to overwrite and affect original
    const arrivalMock = Object.assign({}, ARRIVAL_PATTERN_MOCK, { altitude: 0 });
    const altitudeMock = [10000, 20000];
    const model = new SpawnPatternModel(arrivalMock);

    model._setMinMaxAltitude(altitudeMock);

    t.true(model._minimumAltitude === altitudeMock[0]);
    t.true(model._maximumAltitude === altitudeMock[1]);
});

ava('._setMinMaxAltitude() sets #_minimumAltitude and #_maximumAltitude when a number is passed ', (t) => {
    // creating new mock here so as not to overwrite and affect original
    const arrivalMock = Object.assign({}, ARRIVAL_PATTERN_MOCK, { altitude: 0 });
    const altitudeMock = 23000;
    const model = new SpawnPatternModel(arrivalMock);

    model._setMinMaxAltitude(altitudeMock);

    t.true(model._minimumAltitude === altitudeMock);
    t.true(model._maximumAltitude === altitudeMock);
});

ava('._calculateMaximumMsDelayFromFrequency() returns a number equal to 1hr in miliseconds / #frequency', (t) => {
    const expectedResult = 360000;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK);
    const result = model._calculateMaximumMsDelayFromFrequency();

    t.true(result === expectedResult);
});
