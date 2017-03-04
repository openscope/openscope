import ava from 'ava';

import ModeController from '../../../src/assets/scripts/client/aircraft/ModeControl/ModeController';
import {
    MCP_MODE,
    MCP_MODE_NAME
} from '../../../src/assets/scripts/client/aircraft/ModeControl/modeControlConstants';

ava('does not throw when instantiated without parameters', (t) => {
    t.notThrows(() => new ModeController());
});

ava('._setModeSelectorMode() sets modeSelector to the specified value', (t) => {
    const speedModeMock = MCP_MODE.SPEED.VNAV;
    const mcp = new ModeController();

    mcp._setModeSelectorMode(MCP_MODE_NAME.SPEED, speedModeMock);

    t.true(mcp.speedMode === MCP_MODE.SPEED.VNAV);
});
