import ava from 'ava';
import TimeKeeper from '../../src/assets/scripts/client/engine/TimeKeeper';

ava.afterEach(() => {
    TimeKeeper.reset();
});

ava.serial('throws when attempting to instantiate', (t) => {
    t.throws(() => new TimeKeeper());
});

ava.serial('#deltaTime is the product of #_frameDeltaTime and #_simulationRate', (t) => {
    TimeKeeper._frameDeltaTime = 33;
    TimeKeeper._simulationRate = 1;

    t.true(TimeKeeper.deltaTime === 33);
});

ava.serial('#deltaTime returns a max value of 100', (t) => {
    TimeKeeper._frameDeltaTime = 33;
    TimeKeeper._simulationRate = 10;

    t.true(TimeKeeper.deltaTime === 100);
});

ava.skip('#accumulatedDeltaTime is the sum of each deltaTime value from instantiation to now', (t) => {
    const deltaValues = [];

    deltaValues.push(TimeKeeper.deltaTime);

    TimeKeeper.update();
    deltaValues.push(TimeKeeper.deltaTime);

    TimeKeeper.update();
    deltaValues.push(TimeKeeper.deltaTime);

    TimeKeeper.update();
    deltaValues.push(TimeKeeper.deltaTime);

    const sum = deltaValues.reduce((accumulator, item) => accumulator + item, 0);

    t.true(sum === TimeKeeper.accumulatedDeltaTime);
});

ava.skip('#accumulatedDeltaTime is the sum of each deltaTime value from instantiation to now offset by timewarp', (t) => {
    const deltaValues = [];

    deltaValues.push(TimeKeeper.deltaTime);

    TimeKeeper.update();
    deltaValues.push(TimeKeeper.deltaTime);

    TimeKeeper.update();
    deltaValues.push(TimeKeeper.deltaTime);

    TimeKeeper._simulationRate = 5;

    TimeKeeper.update();
    deltaValues.push(TimeKeeper.deltaTime);

    const sum = deltaValues.reduce((accumulator, item) => accumulator + item, 0);

    t.true(sum === TimeKeeper.accumulatedDeltaTime);
});

ava.serial('.getDeltaTimeForGameStateAndTimewarp() returns 0 when #isPaused is true', (t) => {
    const result = TimeKeeper.getDeltaTimeForGameStateAndTimewarp(true);

    t.true(result === 0);
});

ava.serial('.getDeltaTimeForGameStateAndTimewarp() returns 0 when #deltaTime > 1 and #timewarp is 1', (t) => {
    TimeKeeper._frameDeltaTime = 2;
    TimeKeeper._simulationRate = 1;

    const result = TimeKeeper.getDeltaTimeForGameStateAndTimewarp(false);

    t.true(result === 0);
});

ava.serial('.getDeltaTimeForGameStateAndTimewarp() returns #deltaTime when if conditions are not met', (t) => {
    const result = TimeKeeper.getDeltaTimeForGameStateAndTimewarp(false);

    t.true(result === TimeKeeper.deltaTime);
});

ava.serial('.saveDeltaTimeBeforeFutureTrackCalculation() ', (t) => {
    TimeKeeper._frameDeltaTime = 3;

    TimeKeeper.saveDeltaTimeBeforeFutureTrackCalculation();

    t.true(TimeKeeper._futureTrackDeltaTimeCache === 3);
    t.true(TimeKeeper._frameDeltaTime === 5);
});

ava.serial('.restoreDeltaTimeAfterFutureTrackCalculation() ', (t) => {
    TimeKeeper._frameDeltaTime = 5;
    TimeKeeper._futureTrackDeltaTimeCache = 3;

    TimeKeeper.restoreDeltaTimeAfterFutureTrackCalculation();

    t.true(TimeKeeper._futureTrackDeltaTimeCache === -1);
    t.true(TimeKeeper._frameDeltaTime === 3);
});

ava.serial('.setPause() does not update #_isPaused when nextPause is the same value', (t) => {
    TimeKeeper._isPaused = false;
    TimeKeeper.setPause(false);

    t.false(TimeKeeper._isPaused);
});

ava.serial('.setPause() updates #_isPaused when nextPause is a different value', (t) => {
    TimeKeeper._isPaused = false;
    TimeKeeper.setPause(true);

    t.true(TimeKeeper._isPaused);
});

ava.serial('.update() increments #_elapsedFrameCount by 1', (t) => {
    t.true(TimeKeeper._elapsedFrameCount === 0);

    TimeKeeper.update();

    t.true(TimeKeeper._elapsedFrameCount === 1);
});

ava.serial('.update() resets #_frameStartTimestamp to #currentTime when elapsed time is > frameDelay', (t) => {
    TimeKeeper._frameStartTimestamp = 10;
    TimeKeeper.update();

    t.true(TimeKeeper._frameStartTimestamp === TimeKeeper._previousFrameTimestamp);
});

ava.serial('.update() recalculates the #_frameStep value based on the current #_simulationRate value', (t) => {
    TimeKeeper._simulationRate = 1;
    TimeKeeper.update();

    t.true(TimeKeeper._frameStep === 30);

    TimeKeeper._simulationRate = 2;
    TimeKeeper.update();

    t.true(TimeKeeper._frameStep === 27);

    TimeKeeper._simulationRate = 5;
    TimeKeeper.update();

    t.true(TimeKeeper._frameStep === 17);

    TimeKeeper._simulationRate = 25;
    TimeKeeper.update();

    t.true(TimeKeeper._frameStep === 1);

    TimeKeeper._simulationRate = 50;
    TimeKeeper.update();

    t.true(TimeKeeper._frameStep === 1);
});

ava.serial('.updateTimescale() only accepts positive numbers', (t) => {
    TimeKeeper._simulationRate = 1;

    TimeKeeper.updateSimulationRate(-3);

    t.true(TimeKeeper._simulationRate === 1);
});

ava.serial('.updateTimescale() updates #timescale value', (t) => {
    TimeKeeper._simulationRate = 1;

    TimeKeeper.updateSimulationRate(3);

    t.true(TimeKeeper._simulationRate === 3);
});

ava.serial('._isReturningFromPauseAndNotFutureTrack() returns false when #_frameDeltaTime is > than 1 and #_simulationRate is 1', (t) => {
    TimeKeeper._frameDeltaTime = 0.5;
    TimeKeeper._simulationRate = 1;
    TimeKeeper._futureTrackDeltaTimeCache = -1;

    t.false(TimeKeeper._isReturningFromPauseAndNotFutureTrack());
});

ava.serial('._isReturningFromPauseAndNotFutureTrack() returns false #_simulationRate is not === 1', (t) => {
    TimeKeeper._frameDeltaTime = 0.5;
    TimeKeeper._simulationRate = 2;
    TimeKeeper._futureTrackDeltaTimeCache = -1;

    t.false(TimeKeeper._isReturningFromPauseAndNotFutureTrack());
});

ava.serial('._isReturningFromPauseAndNotFutureTrack() returns false #_futureTrackDeltaTimeCache is not === -1', (t) => {
    TimeKeeper._frameDeltaTime = 0.5;
    TimeKeeper._simulationRate = 1;
    TimeKeeper._futureTrackDeltaTimeCache = 5;

    t.false(TimeKeeper._isReturningFromPauseAndNotFutureTrack());
});

ava.serial('._isReturningFromPauseAndNotFutureTrack() returns true only when all three conditions are met', (t) => {
    TimeKeeper._frameDeltaTime = 2;
    TimeKeeper._simulationRate = 1;
    TimeKeeper._futureTrackDeltaTimeCache = -1;

    t.true(TimeKeeper._isReturningFromPauseAndNotFutureTrack());
});
