import ava from 'ava';
import CanvasStageModel from '../../src/assets/scripts/client/canvas/CanvasStageModel';

ava.beforeEach(() => {
    CanvasStageModel._init();
});

ava.afterEach(() => {
    CanvasStageModel.reset();
});

ava('throws when called to instantiate', (t) => {
    t.throws(() => new CanvasStageModel());
});

ava('.translatePixelsToKilometers() divides pixels by scale', (t) => {
    const expectedResult = 12.5;
    const pixelValueMock = 100;
    const result = CanvasStageModel.translatePixelsToKilometers(pixelValueMock);

    t.true(result === expectedResult);
});

ava('.translateKilometersToPixels() multiplies kilometers by scale', (t) => {
    const expectedResult = 100;
    const kilometerValueMock = 12.5;
    const result = CanvasStageModel.translateKilometersToPixels(kilometerValueMock);

    t.true(result === expectedResult);
});
