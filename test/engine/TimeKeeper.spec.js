import ava from 'ava';
import TimeKeeper from '../../src/assets/scripts/client/engine/TimeKeeper';

ava('throws when attempting to instantiate', (t) => {
    t.throws(() => new TimeKeeper());
});

ava('.update() increments #_elapsedFrameCount by 1', (t) => {
    t.true(TimeKeeper._elapsedFrameCount === 0);

    TimeKeeper.update();

    t.true(TimeKeeper._elapsedFrameCount === 1);
});

ava('.update() resets #_frameStartTime to #currentTime when elapsed time is > frameDelay', (t) => {
    TimeKeeper._frameStartTime = 10;
    TimeKeeper.update();

    t.true(TimeKeeper._frameStartTime === TimeKeeper._lastFrameTime);
});
