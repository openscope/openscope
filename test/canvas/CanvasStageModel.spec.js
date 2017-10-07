import ava from 'ava';
import CanvasStageModel from '../../src/assets/scripts/client/canvas/CanvasStageModel';

ava('throws when called to instantiate', (t) => {
    t.throws(() => new CanvasStageModel());
});
