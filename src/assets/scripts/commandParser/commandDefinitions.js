import {
    zeroArgumentsValidator,
    singleArgumentValidator,
    zeroOrOneArgumentValidator,
    // oneOrTwoArgumentValidator,
    altitudeArgumentValidator
} from './argumentValidators';
import {
    altitudeArgumentParser
} from './argumentParsers';

const noop = (args) => args;

/**
 * @property COMMAND_DEFINITION
 * @type {Object}
 * @final
 */
export const COMMAND_DEFINITION = {
    // these commands accept zero arguments
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
        parse: (arg) => {
            const numberFromString = parseInt(arg, 10);

            // calling method is expecting an array, thus we return an array here
            return [numberFromString];
        }
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
        validate: altitudeArgumentValidator,
        parse: altitudeArgumentParser
    },
    heading: {
        validate: (args) => {

        },
        parse: (args) => {
            console.log('parse', args);
        }
    },
    hold: {
        validate: (args) => {

        },
        parse: (args) => {
            console.log('parse', args);
        }
    }
};
