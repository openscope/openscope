import {
    convertToThousands,
    convertStringToNumber
} from '../utilities/unitConverters';
import {
    zeroArgumentsValidator,
    singleArgumentValidator,
    zeroOrOneArgumentValidator,
    altitudeValidator,
    headingValidator,
    holdValidator
} from './argumentValidators';
import {
    altitudeParser,
    headingParser,
    holdParser
} from './argumentParsers';

/**
 * A no-op function used for command definitions that do not need a parser
 *
 * This function will immediately return any arguments passed to it and is
 * used in place of an actual parser. this way `command.parse` can still
 * be called even with commands that don't need to be parsed.
 *
 * @function noop
 * @param args {*}
 * @return {*}
 */
const noop = (args) => args;

/**
 * @property COMMAND_DEFINITION
 * @type {Object}
 * @final
 */
export const COMMAND_DEFINITION = {
    // these commands accept zero arguments
    auto: {
        validate: zeroArgumentsValidator,
        parse: noop
    },
    clear: {
        validate: zeroArgumentsValidator,
        parse: noop
    },
    pause: {
        validate: zeroArgumentsValidator,
        parse: noop
    },
    tutorial: {
        validate: zeroArgumentsValidator,
        parse: noop
    },
    version: {
        validate: zeroArgumentsValidator,
        parse: noop
    },

    abort: {
        validate: zeroArgumentsValidator,
        parse: noop
    },
    clearedAsFiled: {
        validate: zeroArgumentsValidator,
        parse: noop
    },
    climbViaSID: {
        validate: zeroArgumentsValidator,
        parse: noop
    },
    debug: {
        validate: zeroArgumentsValidator,
        parse: noop
    },
    delete: {
        validate: zeroArgumentsValidator,
        parse: noop
    },
    descendViaSTAR: {
        validate: zeroArgumentsValidator,
        parse: noop
    },
    flyPresentHeading: {
        validate: zeroArgumentsValidator,
        parse: noop
    },
    land: {
        validate: zeroArgumentsValidator,
        parse: noop
    },
    sayRoute: {
        validate: zeroArgumentsValidator,
        parse: noop
    },
    takeoff: {
        validate: zeroArgumentsValidator,
        parse: noop
    },

    // these commands accept a single argument and may require further parsing, eg: (string -> number)
    '`': {
        validate: singleArgumentValidator,
        // calling method is expecting an array with values that will get spread later, thus we purposly
        // return an array here
        parse: (args) => [convertStringToNumber(args)]
    },
    airport: {
        validate: singleArgumentValidator,
        parse: noop
    },
    rate: {
        validate: singleArgumentValidator,
        // calling method is expecting an array with values that will get spread later, thus we purposly
        // return an array here
        parse: (args) => [convertStringToNumber(args)]
    },
    timewarp: {
        validate: singleArgumentValidator,
        // calling method is expecting an array with values that will get spread later, thus we purposly
        // return an array here
        parse: (args) => [convertStringToNumber(args)]
    },

    direct: {
        validate: singleArgumentValidator,
        parse: noop
    },
    fix: {
        validate: singleArgumentValidator,
        parse: noop
    },
    moveDataBlock: {
        validate: singleArgumentValidator,
        parse: noop
    },
    route: {
        validate: singleArgumentValidator,
        parse: noop
    },
    reroute: {
        validate: singleArgumentValidator,
        parse: noop
    },
    sid: {
        validate: singleArgumentValidator,
        parse: noop
    },
    speed: {
        validate: singleArgumentValidator,
        // calling method is expecting an array with values that will get spread later, thus we purposly
        // return an array here
        parse: (arg) => [convertToThousands(arg)]
    },
    star: {
        validate: singleArgumentValidator,
        parse: noop
    },

    taxi: {
        validate: zeroOrOneArgumentValidator,
        parse: noop
    },

    // these commands have specific argument requirements and may need to be parsed
    // into the correct type (sting -> number)
    altitude: {
        validate: altitudeValidator,
        parse: altitudeParser
    },
    heading: {
        validate: headingValidator,
        parse: headingParser
    },
    hold: {
        validate: holdValidator,
        parse: holdParser
    }
};
