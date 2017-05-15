import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';
import _round from 'lodash/round';
import SpawnPatternModel from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternModel';
import { airportControllerFixture } from '../fixtures/airportFixtures';
import { navigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';
import {
    DEPARTURE_PATTERN_MOCK,
    ARRIVAL_PATTERN_MOCK,
    ARRIVAL_PATTERN_CYCLIC_MOCK,
    ARRIVAL_PATTERN_WAVE_MOCK
} from './_mocks/spawnPatternMocks';
import { DEFAULT_SCREEN_POSITION } from '../../src/assets/scripts/client/constants/positionConstants';

ava('does not throw when called without parameters', (t) => {
    t.notThrows(() => new SpawnPatternModel());
    t.notThrows(() => new SpawnPatternModel([]));
    t.notThrows(() => new SpawnPatternModel({}));
    t.notThrows(() => new SpawnPatternModel(42));
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
    t.notThrows(() => new SpawnPatternModel(DEPARTURE_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture));
});

ava('#position defaults to DEFAULT_SCREEN_POSITION', (t) => {
    const model = new SpawnPatternModel(DEPARTURE_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);

    t.true(_isEqual(model.relativePosition, DEFAULT_SCREEN_POSITION));
});

ava('#altitude returns a random altitude rounded to the nearest 1,000ft', (t) => {
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);
    const result = model.altitude;
    const expectedResult = _round(result, -3);

    t.true(_isEqual(result, expectedResult));
});

ava('.cycleStart() returns early if cycleStartTime does not equal -1', (t) => {
    const cycleStartTimeMock = 42;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);
    model.cycleStartTime = cycleStartTimeMock;

    model.cycleStart(33);

    t.true(model.cycleStartTime === cycleStartTimeMock);
});

ava('.cycleStart() sets cycleStartTime with a startTime + offset', (t) => {
    const cycleStartTimeMock = 42;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);
    model.offset = 0;
    model.cycleStartTime = -1;

    model.cycleStart(cycleStartTimeMock);

    t.true(model.cycleStartTime === cycleStartTimeMock);
});

ava('.getNextDelayValue() returns a random number between minimumDelay and maximumDelay', (t) => {
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);
    model._minimumDelay = 0;
    model._maximumDelay = 3;

    const result = model.getNextDelayValue();

    t.true(typeof result === 'number');
});

ava('.getNextDelayValue() calls ._calculateRandomDelayPeriod() if SPAWN_METHOD.RANDOM', (t) => {
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);
    const _calculateRandomDelayPeriodSpy = sinon.spy(model, '_calculateRandomDelayPeriod');
    model.method = 'random';

    model.getNextDelayValue();

    t.true(_calculateRandomDelayPeriodSpy.calledOnce);
});

ava('.getNextDelayValue() calls ._calculateNextCyclicDelayPeriod() if SPAWN_METHOD.CYCLIC', (t) => {
    const gameTimeMock = 42;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_CYCLIC_MOCK, navigationLibraryFixture, airportControllerFixture);
    const _calculateNextCyclicDelayPeriodSpy = sinon.spy(model, '_calculateNextCyclicDelayPeriod');

    model.getNextDelayValue(gameTimeMock);

    t.true(_calculateNextCyclicDelayPeriodSpy.calledWithExactly(gameTimeMock));
});

ava('.getNextDelayValue() calls ._calculateNextSurgeDelayPeriod() if SPAWN_METHOD.SURGE', (t) => {
    const gameTimeMock = 42;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);
    const _calculateNextSurgeDelayPeriodSpy = sinon.spy(model, '_calculateNextSurgeDelayPeriod');
    model.method = 'surge';

    model.getNextDelayValue(gameTimeMock);

    t.true(_calculateNextSurgeDelayPeriodSpy.calledWithExactly(gameTimeMock));
});

ava('.getNextDelayValue() calls ._calculateNextWaveDelayPeriod() if SPAWN_METHOD.WAVE', (t) => {
    const gameTimeMock = 42;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_WAVE_MOCK, navigationLibraryFixture, airportControllerFixture);
    const _calculateNextWaveDelayPeriodSpy = sinon.spy(model, '_calculateNextWaveDelayPeriod');

    model.getNextDelayValue(gameTimeMock);

    t.true(_calculateNextWaveDelayPeriodSpy.calledWithExactly(gameTimeMock));
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

    // t.true(result === 360);
});

ava('._setMinMaxAltitude() sets _minimumAltitude and _maximumAltitude when an array is passed ', (t) => {
    // creating new mock here so as not to overwrite and affect original
    const arrivalMock = Object.assign({}, ARRIVAL_PATTERN_MOCK, { altitude: 0 });
    const altitudeMock = [10000, 20000];
    const model = new SpawnPatternModel(arrivalMock, navigationLibraryFixture, airportControllerFixture);

    model._setMinMaxAltitude(altitudeMock);

    t.true(model._minimumAltitude === altitudeMock[0]);
    t.true(model._maximumAltitude === altitudeMock[1]);
});

ava('._setMinMaxAltitude() sets _minimumAltitude and _maximumAltitude when a number is passed ', (t) => {
    // creating new mock here so as not to overwrite and affect original
    const arrivalMock = Object.assign({}, ARRIVAL_PATTERN_MOCK, { altitude: 0 });
    const altitudeMock = 23000;
    const model = new SpawnPatternModel(arrivalMock, navigationLibraryFixture, airportControllerFixture);

    model._setMinMaxAltitude(altitudeMock);

    t.true(model._minimumAltitude === altitudeMock);
    t.true(model._maximumAltitude === altitudeMock);
});

ava('._calculateMaximumDelayFromSpawnRate() returns a number equal to 1hr in miliseconds / frequency', (t) => {
    const expectedResult = 360;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);
    const result = model._calculateMaximumDelayFromSpawnRate();

    t.true(result === expectedResult);
});

ava('._calculatePositionAndHeadingForArrival() returns early when spawnPattern.category is departure', (t) => {
    const model = new SpawnPatternModel(DEPARTURE_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);

    model._calculatePositionAndHeadingForArrival(DEPARTURE_PATTERN_MOCK, navigationLibraryFixture);

    t.true(model.heading === -999);
    t.true(_isEqual(model.relativePosition, DEFAULT_SCREEN_POSITION));
});

ava('._calculatePositionAndHeadingForArrival() calculates aircraft heading and position when provided a route', (t) => {
    const expectedHeadingResult = 4.436187691083426;
    const expectedPositionResult = [220.0165474765974, 137.76227044819646];
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture, airportControllerFixture);

    model._calculatePositionAndHeadingForArrival(ARRIVAL_PATTERN_MOCK, navigationLibraryFixture);

    t.true(model.heading === expectedHeadingResult);
    t.true(_isEqual(model.relativePosition, expectedPositionResult));
});
