import { singleArgumentValidator, zeroArgumentsValidator, zeroOrOneArgumentValidator } from '../../parsers/argumentValidators';
import { timewarpParser } from '../../parsers/argumentParsers';
import { noop, strToNumArray } from '../utils';

/**
 * Complete map of system commands
 *
 * The values contains `parse` and `validate` functions for each root command. Some commands don't require either function
 * and simply pass the arguments through via `noop`. Other commands commands have very unique demands for how
 * arguments are formatted, these functions let us validate and parse on a case by case basis.
 *
 * @propery SYSTEM_COMMAND_MAP
 * @type {Object}
 * @final
 */
export const SYSTEM_COMMAND_MAP = {
    airac: {
        aliases: ['airac'],
        parse: noop,
        validate: zeroArgumentsValidator
    },
    airport: {
        aliases: ['airport'],
        parse: noop,
        validate: singleArgumentValidator
    },
    auto: {
        aliases: ['auto'],
        parse: noop,
        validate: zeroArgumentsValidator
    },
    clear: {
        aliases: ['clear'],
        parse: noop,
        validate: zeroArgumentsValidator
    },
    pause: {
        aliases: ['pause'],
        parse: noop,
        validate: zeroArgumentsValidator
    },
    rate: {
        // calling method is expecting an array with values that will get spread later, thus we purposely
        // return an array here
        aliases: ['rate'],
        parse: strToNumArray,
        validate: singleArgumentValidator
    },
    timewarp: {
        aliases: ['timewarp', 'tw'],
        parse: timewarpParser,
        validate: zeroOrOneArgumentValidator
    },
    tutorial: {
        aliases: ['tutorial'],
        parse: noop,
        validate: zeroArgumentsValidator
    }
};

/**
 * Encapsulation of boolean logic used to determine if the `callsignOrSystemCommandName`
 * is in fact a system command.
 *
 *
 * @for CommandParser
 * @method _isSystemCommand
 * @param cmd {string}
 * @return {boolean}
 */
export const isSystemCommand = (cmd) => {
    return cmd in SYSTEM_COMMAND_MAP;
};
