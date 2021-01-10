import ava from 'ava';
import { isSystemCommand } from '../../../../src/assets/scripts/client/commands/definitions/systemCommand/systemCommandMap';


ava('isSystemCommand() returns true if command is a system command', t => {
    const systemCommandMock = 'timewarp';
    t.true(isSystemCommand(systemCommandMock));
});

ava('isSystemCommand() returns false if command is not a system command', t => {
    const transmitCommandMock = 'climb';
    t.false(isSystemCommand(transmitCommandMock));
});
