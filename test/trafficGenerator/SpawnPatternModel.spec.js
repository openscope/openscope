import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';
import _round from 'lodash/round';
import SpawnPatternModel from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternModel';
import {
    createAirportControllerFixture,
    resetAirportControllerFixture
} from '../fixtures/airportFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../fixtures/navigationLibraryFixtures';
import {
    DEPARTURE_PATTERN_MOCK,
    DEPARTURE_PATTERN_ROUTE_STRING_MOCK,
    ARRIVAL_PATTERN_MOCK,
    ARRIVAL_PATTERN_MOCK_ALL_STRINGS,
    ARRIVAL_PATTERN_CYCLIC_MOCK,
    ARRIVAL_PATTERN_WAVE_MOCK,
    ARRIVAL_PATTERN_ROUTE_STRING_MOCK,
    ARRIVAL_PATTERN_FLOAT_RATE_MOCK
} from './_mocks/spawnPatternMocks';
import { INVALID_NUMBER } from '../../src/assets/scripts/client/constants/globalConstants';
import { DEFAULT_SCREEN_POSITION } from '../../src/assets/scripts/client/constants/positionConstants';

ava.beforeEach(() => {
    createNavigationLibraryFixture();
    createAirportControllerFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
    resetAirportControllerFixture();
});

ava('does not throw when called without parameters', (t) => {
    t.notThrows(() => new SpawnPatternModel());
    t.notThrows(() => new SpawnPatternModel([]));
    t.notThrows(() => new SpawnPatternModel({}));
    t.notThrows(() => new SpawnPatternModel(42));
    t.notThrows(() => new SpawnPatternModel(false));
});

ava('.init() throws when called with invalid parameters', (t) => {
    const model = new SpawnPatternModel();

    t.notThrows(() => model.init());
});

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => new SpawnPatternModel(DEPARTURE_PATTERN_MOCK));
    t.notThrows(() => new SpawnPatternModel(DEPARTURE_PATTERN_ROUTE_STRING_MOCK));
    t.notThrows(() => new SpawnPatternModel(ARRIVAL_PATTERN_MOCK));
    t.notThrows(() => new SpawnPatternModel(ARRIVAL_PATTERN_ROUTE_STRING_MOCK));
});

ava('initializes correctly when spawn pattern definition uses string type for number values', (t) => {
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK_ALL_STRINGS);

    t.true(model._minimumAltitude === 36000);
    t.true(model._maximumAltitude === 36000);
    t.true(model.speed === 320);
    t.true(model.rate === 10);
});

ava('initializes correctly when rate is passed as a float', (t) => {
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_FLOAT_RATE_MOCK);

    t.true(model.rate === 3.3);
});

ava('#position defaults to DEFAULT_SCREEN_POSITION', (t) => {
    const model = new SpawnPatternModel(DEPARTURE_PATTERN_MOCK);

    t.true(_isEqual(model.relativePosition, DEFAULT_SCREEN_POSITION));
});

ava('#altitude returns a random altitude rounded to the nearest 1,000ft', (t) => {
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK);
    const result = model.altitude;
    const expectedResult = _round(result, -3);

    t.true(_isEqual(result, expectedResult));
    t.true(typeof result === 'number');
});

ava('#id returns #_id', (t) => {
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK);
    const expectedResult = 'some-value';
    model._id = expectedResult;
    const result = model.id;

    t.true(result === expectedResult);
});

ava('#positionModel returns #_positionModel', (t) => {
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK);
    const expectedResult = 'some-value';
    model._positionModel = expectedResult;
    const result = model.positionModel;

    t.true(result === expectedResult);
});

ava('#airportIcao returns the airport icao when type is arrival', (t) => {
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK);
    const expectedResult = 'KLAS';
    const result = model.airportIcao;

    t.true(result === expectedResult);
});

ava('#airportIcao returns the airport icao when type is departure', (t) => {
    const model = new SpawnPatternModel(DEPARTURE_PATTERN_MOCK);
    const expectedResult = 'KLAS';
    const result = model.airportIcao;

    t.true(result === expectedResult);
});

ava('#airportIcao returns the airport icao when type is overflight', (t) => {
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK);
    const isOverflightStub = sinon.stub(model, 'isOverflight').returns(true);
    const expectedResult = 'overflight';
    const result = model.airportIcao;

    t.true(result === expectedResult);

    isOverflightStub.restore();
});

ava('.cycleStart() returns early if cycleStartTime does not equal -1', (t) => {
    const cycleStartTimeMock = 42;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK);
    model.cycleStartTime = cycleStartTimeMock;

    model.cycleStart(33);

    t.true(model.cycleStartTime === cycleStartTimeMock);
});

ava('.cycleStart() sets cycleStartTime with a startTime + offset', (t) => {
    const cycleStartTimeMock = 42;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK);
    model.offset = 0;
    model.cycleStartTime = INVALID_NUMBER;

    model.cycleStart(cycleStartTimeMock);

    t.true(model.cycleStartTime === cycleStartTimeMock);
});

ava('.getNextDelayValue() returns a random number between minimumDelay and maximumDelay', (t) => {
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK);
    const result = model.getNextDelayValue();

    t.true(typeof result === 'number');
});

ava('.getNextDelayValue() calls ._calculateRandomDelayPeriod() if SPAWN_METHOD.RANDOM', (t) => {
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK);
    const _calculateRandomDelayPeriodSpy = sinon.spy(model, '_calculateRandomDelayPeriod');
    model.method = 'random';

    model.getNextDelayValue();

    t.true(_calculateRandomDelayPeriodSpy.calledOnce);
});

ava('.getNextDelayValue() calls ._calculateNextCyclicDelayPeriod() if SPAWN_METHOD.CYCLIC', (t) => {
    const gameTimeMock = 42;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_CYCLIC_MOCK);
    const _calculateNextCyclicDelayPeriodSpy = sinon.spy(model, '_calculateNextCyclicDelayPeriod');

    model.getNextDelayValue(gameTimeMock);

    t.true(_calculateNextCyclicDelayPeriodSpy.calledWithExactly(gameTimeMock));
});

ava('.getNextDelayValue() calls ._calculateNextSurgeDelayPeriod() if SPAWN_METHOD.SURGE', (t) => {
    const gameTimeMock = 42;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK);
    const _calculateNextSurgeDelayPeriodSpy = sinon.spy(model, '_calculateNextSurgeDelayPeriod');
    model.method = 'surge';

    model.getNextDelayValue(gameTimeMock);

    t.true(_calculateNextSurgeDelayPeriodSpy.calledWithExactly(gameTimeMock));
});

ava('.getNextDelayValue() calls ._calculateNextWaveDelayPeriod() if SPAWN_METHOD.WAVE', (t) => {
    const gameTimeMock = 42;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_WAVE_MOCK);
    const _calculateNextWaveDelayPeriodSpy = sinon.spy(model, '_calculateNextWaveDelayPeriod');

    model.getNextDelayValue(gameTimeMock);

    t.true(_calculateNextWaveDelayPeriodSpy.calledWithExactly(gameTimeMock));
});

ava('._calculateNextCyclicDelayPeriod() returns 360 when gameTime is 0', (t) => {
    const gameTimeMock = 0;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_CYCLIC_MOCK);
    const result = model._calculateNextCyclicDelayPeriod(gameTimeMock);

    t.true(result === 360);
});

ava.skip('._calculateNextWaveDelayPeriod()', (t) => {
    const gameTimeMock = 3320;
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_WAVE_MOCK);
    const result = model._calculateNextWaveDelayPeriod(gameTimeMock);

    // t.true(result === 360);
});

ava('._setMinMaxAltitude() sets _minimumAltitude and _maximumAltitude when an array of numbers is passed ', (t) => {
    // creating new mock here so as not to overwrite and affect original
    const arrivalMock = Object.assign({}, ARRIVAL_PATTERN_MOCK, { altitude: 0 });
    const altitudeMock = [10000, 20000];
    const model = new SpawnPatternModel(arrivalMock);

    model._setMinMaxAltitude(altitudeMock);

    t.true(model._minimumAltitude === altitudeMock[0]);
    t.true(model._maximumAltitude === altitudeMock[1]);
});

ava('._setMinMaxAltitude() sets _minimumAltitude and _maximumAltitude when an array of strings is passed ', (t) => {
    // creating new mock here so as not to overwrite and affect original
    const arrivalMock = Object.assign({}, ARRIVAL_PATTERN_MOCK, { altitude: 0 });
    const altitudeMock = ['10000', '20000'];
    const model = new SpawnPatternModel(arrivalMock);

    model._setMinMaxAltitude(altitudeMock);

    t.true(model._minimumAltitude === 10000);
    t.true(model._maximumAltitude === 20000);
});

ava('._setMinMaxAltitude() sets _minimumAltitude and _maximumAltitude when a number is passed ', (t) => {
    // creating new mock here so as not to overwrite and affect original
    const arrivalMock = Object.assign({}, ARRIVAL_PATTERN_MOCK, { altitude: 0 });
    const altitudeMock = 23000;
    const model = new SpawnPatternModel(arrivalMock);

    model._setMinMaxAltitude(altitudeMock);

    t.true(model._minimumAltitude === altitudeMock);
    t.true(model._maximumAltitude === altitudeMock);
});

ava('._setMinMaxAltitude() sets _minimumAltitude and _maximumAltitude when a string is passed ', (t) => {
    // creating new mock here so as not to overwrite and affect original
    const arrivalMock = Object.assign({}, ARRIVAL_PATTERN_MOCK, { altitude: 0 });
    const altitudeMock = '23000';
    const model = new SpawnPatternModel(arrivalMock);

    model._setMinMaxAltitude(altitudeMock);

    t.true(model._minimumAltitude === 23000);
    t.true(model._maximumAltitude === 23000);
});

ava('._initializePositionAndHeadingForArrival() returns early when spawnPattern.category is departure', (t) => {
    const model = new SpawnPatternModel(DEPARTURE_PATTERN_MOCK);

    model._initializePositionAndHeadingForAirborneAircraft(DEPARTURE_PATTERN_MOCK);

    t.true(model.heading === -999);
    t.true(_isEqual(model.relativePosition, DEFAULT_SCREEN_POSITION));
});

ava('._initializePositionAndHeadingForArrival() calculates aircraft heading and position when provided a route', (t) => {
    const expectedHeadingResult = 4.436187691083426;
    const expectedPositionResult = [220.0165474765974, 137.76227044819646];
    const model = new SpawnPatternModel(ARRIVAL_PATTERN_MOCK);

    model._initializePositionAndHeadingForAirborneAircraft(ARRIVAL_PATTERN_MOCK);

    t.true(model.heading === expectedHeadingResult);
    t.true(_isEqual(model.relativePosition, expectedPositionResult));
});

ava('._calculateSpawnHeading() returns bearing between route\'s first and second waypoints', (t) => {
    const mock = Object.assign(
        {},
        ARRIVAL_PATTERN_MOCK,
        {
            route: 'JESJI..BAKRR'
        }
    );

    const model = new SpawnPatternModel(mock);
    const expectedResult = 1.3415936051582544;
    const result = model._calculateSpawnHeading();

    t.true(result === expectedResult);
});
