import ava from 'ava';
import AircraftCommandModel
    from '../../../../src/assets/scripts/client/commands/definitions/aircraftCommand/AircraftCommandModel';
import { noop } from '../../../../src/assets/scripts/client/commands/definitions/utils';


ava('noop parser and zeroArgumentsValidator used by abort', t => {
    const model = new AircraftCommandModel('abort');
    const foo = model._commandDefinition.parse.toString();
    const test = noop;
    t.true(foo === test.toString());
});
