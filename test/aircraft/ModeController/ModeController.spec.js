import ava from 'ava';

import ModeController from '../../../src/assets/scripts/client/aircraft/ModeControl/ModeController';
// import {
//     MCP_MODE,
//     MCP_MODE_NAME
// } from '../../../src/assets/scripts/client/aircraft/ModeControl/modeControlConstants';

ava('does not throw when instantiated without parameters', (t) => {
    t.notThrows(() => new ModeController());
});
