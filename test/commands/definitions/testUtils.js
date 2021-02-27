import { noop, strToNumArray } from '../../../src/assets/scripts/client/commands/aircraftCommand/aircraftCommandDefinitions';
import {
    singleArgumentValidator,
    zeroArgumentsValidator, zeroOrOneArgumentValidator
} from '../../../src/assets/scripts/client/commands/parsers/argumentValidators';
import { AIRCRAFT_COMMAND_MAP } from '../../../src/assets/scripts/client/commands/aircraftCommand/aircraftCommandMap';

export const noopParse = () => {
    const tmp = noop;
    return tmp.toString();
};

export const strToNumArrayParse = () => {
    const tmp = strToNumArray;
    return tmp.toString();
};

export const zeroArgVal = () => {
    const tmp = zeroArgumentsValidator;
    return tmp.toString();
};

export const singleArgVal = () => {
    const tmp = singleArgumentValidator;
    return tmp.toString();
};

export const zeroOrOneArgumentVal = () => {
    const tmp = zeroOrOneArgumentValidator;
    return tmp.toString();
};

export const test_aliases = (t, cmd, t_aliases) => {
    const a = AIRCRAFT_COMMAND_MAP[cmd].aliases;
    t.true(a.length === t_aliases.length);
    for (const alias in t_aliases.values()) {
        t.true(a.includes(alias));
    }
};
export const self_alias = (t, cmd) => {
    const a = AIRCRAFT_COMMAND_MAP[cmd].aliases;
    t.true(a.includes(cmd) && a.length === 1);
};
