import ava from 'ava';

import ModeController from '../../../src/assets/scripts/client/aircraft/ModeControl/ModeController';
import {
    MCP_MODE,
    MCP_MODE_NAME
} from '../../../src/assets/scripts/client/aircraft/ModeControl/modeControlConstants';

ava('does not throw when instantiated without parameters', (t) => {
    t.notThrows(() => new ModeController());
});

ava('._setModeSelectorModeAndFieldValue() sets modeSelector and a fieldValue', (t) => {
    const speedMock = 230;
    const controller = new ModeController();

    controller._setModeSelectorModeAndFieldValue(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.VNAV, speedMock);

    t.true(controller.speedMode === MCP_MODE.SPEED.VNAV);
    t.true(controller.speed === speedMock);
});
