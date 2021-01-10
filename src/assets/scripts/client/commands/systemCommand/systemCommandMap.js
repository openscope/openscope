import { singleArgumentValidator, zeroArgumentsValidator, zeroOrOneArgumentValidator } from '../parsers/argumentValidators';
import { convertStringToNumber } from '../../utilities/unitConverters';
import { timewarpParser } from '../parsers/argumentParsers';
import { noop } from '../utils';

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
        parse: noop,
        validate: zeroArgumentsValidator
    },
    airport: {
        parse: noop,
        validate: singleArgumentValidator
    },

    auto: {
        parse: noop,
        validate: zeroArgumentsValidator
    },
    clear: {
        parse: noop,
        validate: zeroArgumentsValidator
    },
    debug: {
        parse: noop,
        // todo hat entry in commands
        validate: zeroArgumentsValidator
    },
    pause: {
        parse: noop,
        validate: zeroArgumentsValidator
    },

    rate: {
        // calling method is expecting an array with values that will get spread later, thus we purposely
        // return an array here
        parse: (args) => [convertStringToNumber(args)],
        validate: singleArgumentValidator
    },
    timewarp: {
        parse: timewarpParser,
        validate: zeroOrOneArgumentValidator
    },
    // todo
    transmit: {},
    tutorial: {
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
