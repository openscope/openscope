import { noop, strToNumArray } from '../../../src/assets/scripts/client/commands/aircraftCommand/aircraftCommandDefinitions';
import {
    singleArgumentValidator,
    zeroArgumentsValidator, zeroOrOneArgumentValidator
} from '../../../src/assets/scripts/client/commands/parsers/argumentValidators';


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

export const test_aliases = (t, map, cmd, t_aliases) => {
    const a = map[cmd].aliases;
    t.true(a.length === t_aliases.length);
    for (const alias in t_aliases.values()) {
        t.true(a.includes(alias));
    }
};
export const self_alias = (t, map, cmd) => {
    const a = map[cmd].aliases;
    t.true(a.includes(cmd) && a.length === 1);
};
