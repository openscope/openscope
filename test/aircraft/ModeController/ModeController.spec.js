import ava from 'ava';

import ModeController from '../../../src/assets/scripts/client/aircraft/ModeControl/ModeController';
import {
    MCP_MODE,
    MCP_MODE_NAME
} from '../../../src/assets/scripts/client/aircraft/ModeControl/modeControlConstants';

ava('does not throw when instantiated without parameters', (t) => {
    t.notThrows(() => new ModeController());
});

ava('.setModeAndValue() sets both a mode and a fieldValue', (t) => {
    const altitudeMock = 13000;
    const controller = new ModeController();

    controller.setModeAndValue(MCP_MODE_NAME.ALTITUDE, MCP_MODE.ALTITUDE.HOLD, altitudeMock);

    t.true(controller.altitudeMode === MCP_MODE.ALTITUDE.HOLD);
    t.true(controller.altitude === altitudeMock);
});
