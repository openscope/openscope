import _findKey from 'lodash/findKey';
import {
    altitudeValidator,
    crossingValidator, fixValidator, headingValidator, holdValidator, optionalAltitudeValidator,
    singleArgumentValidator, squawkValidator, zeroArgumentsValidator,
    zeroOrOneArgumentValidator
} from '../parsers/argumentValidators';
import { convertStringToNumber } from '../../utilities/unitConverters';
import {
    altitudeParser, crossingParser, headingParser, holdParser, optionalAltitudeParser
} from '../parsers/argumentParsers';

import { noop } from '../utils';

/**
 * Complete map of commands
 *
 * This list includes all the various aircraft commands.
 *
 * Aliased commands map to a single root command that is shared among all aliases. The values
 * contains `validate` and `parse` functions for each root command. Some commands have very unique demands for how arguments
 * are formatted,those functions let us do that on a case by case basis.
 *
 * Keys are lowercased here so they can be accessed programmatically.
 * @propery AIRCRAFT_COMMAND_MAP
 * @type {Object}
 * @final
 */
export const AIRCRAFT_COMMAND_MAP = {
    abort: {
        aliases: ['abort'],
        validate: zeroArgumentsValidator,
        parse: noop,
        functionName: 'runAbort'

    },
    altitude: {
        aliases: ['a', 'altitude', 'c', 'climb', 'd', 'descend'],
        parse: altitudeParser,
        validate: altitudeValidator,

        functionName: 'runAltitude'

    },
    clearedAsFiled: {
        aliases: ['caf', 'clearedAsFiled'],
        validate: zeroArgumentsValidator,
        parse: noop,
        functionName: 'runClearedAsFiled'
    },
    climbViaSid: {
        aliases: ['climbViaSid', 'cvs'],
        parse: optionalAltitudeParser,
        validate: optionalAltitudeValidator,

        functionName: 'runClimbViaSID'
    },
    cross: {
        aliases: ['cross', 'cr', 'x'],
        parse: crossingParser,
        validate: crossingValidator,
        functionName: 'runCross'
    },
    delete: {
        aliases: ['del', 'delete', 'kill'],
        validate: zeroArgumentsValidator,
        parse: noop,
        functionName: 'runDelete'
    },
    descendViaStar: {
        aliases: ['descendViaStar', 'dvs'],
        parse: optionalAltitudeParser,
        validate: optionalAltitudeValidator,
        functionName: 'runDescendViaStar'
    },
    direct: {
        aliases: ['dct', 'direct', 'pd'],
        parse: noop,
        validate: singleArgumentValidator,
        functionName: 'runDirect'
    },
    cancelHold: {
        aliases: ['exithold', 'cancelhold', 'continue', 'nohold', 'xh'],
        parse: noop,
        validate: zeroOrOneArgumentValidator,
        functionName: 'runCancelHoldingPattern'
    },
    expectArrivalRunway: {
        aliases: ['e'],
        parse: noop,
        validate: singleArgumentValidator,
        functionName: 'runExpectArrivalRunway'
    },
    fix: {
        aliases: ['f', 'fix', 'track'],
        parse: noop,
        validate: fixValidator,
        functionName: 'runFix'
    },
    flyPresentHeading: {
        aliases: ['fph'],
        parse: noop,
        validate: zeroArgumentsValidator,
        functionName: 'runFlyPresentHeading'
    },
    heading: {
        aliases: ['fh', 'h', 'heading', 't', 'turn'],
        parse: headingParser,
        validate: headingValidator,
        functionName: 'runHeading'
    },
    hold: {
        aliases: ['hold'],
        parse: holdParser,
        validate: holdValidator,
        functionName: 'runHold'
    },
    ils: {
        aliases: ['*', 'i', 'ils'],
        // TODO: split this out to custom parser once the null value is defined
        parse: (args) => [null, args[0]],
        validate: singleArgumentValidator,
        functionName: 'runIls'
    },
    land: {
        aliases: ['land'],
        parse: noop,
        validate: zeroOrOneArgumentValidator,
        functionName: 'runLand'
    },
    moveDataBlock: {
        aliases: ['`'],
        functionName: 'runMoveDataBlock'
    },
    reroute: {
        aliases: ['reroute', 'rr'],
        parse: noop,
        validate: singleArgumentValidator,

        functionName: 'runReroute'
    },
    route: {
        aliases: ['route'],
        parse: noop,
        validate: singleArgumentValidator,
        functionName: 'runRoute'
    },
    sayAltitude: {
        aliases: ['sa'],
        functionName: 'runSayAltitude',
        parse: noop,
        validate: zeroArgumentsValidator
    },
    sayAssignedAltitude: {
        aliases: ['saa'],
        functionName: 'runSayAssignedAltitude'
    },
    sayAssignedHeading: {
        aliases: ['sah'],
        parse: noop,
        validate: zeroArgumentsValidator,
        functionName: 'runSayAssignedHeading'
    },
    sayAssignedSpeed: {
        aliases: ['sas'],
        parse: noop,
        validate: zeroArgumentsValidator,
        functionName: 'runSayAssignedSpeed'
    },
    sayHeading: {
        aliases: ['sh'],
        parse: noop,
        validate: zeroArgumentsValidator,

        functionName: 'runSayHeading'
    },
    sayIndicatedAirspeed: {
        aliases: ['si'],
        parse: noop,
        validate: zeroArgumentsValidator,
        functionName: 'runSayIndicatedAirspeed'
    },
    sayRoute: {
        aliases: ['sr'],
        functionName: 'runSayRoute'
    },
    sid: {
        aliases: ['sid'],
        parse: noop,
        validate: singleArgumentValidator,

        functionName: 'runSID'
    },
    speed: {
        aliases: ['-', '+', 'slow', 'sp', 'speed'],
        // calling method is expecting an array with values that will get spread later, thus we purposly
        // return an array here
        parse: (arg) => [convertStringToNumber(arg)],
        validate: singleArgumentValidator,

        functionName: 'runSpeed'
    },
    squawk: {
        aliases: ['sq', 'squawk'],
        parse: noop,
        validate: squawkValidator,

        functionName: 'runSquawk'
    },
    star: {
        aliases: ['star'],
        parse: noop,
        validate: singleArgumentValidator,
        functionName: 'runSTAR'
    },
    takeoff: {
        aliases: ['/', 'cto', 'to', 'takeoff'],
        parse: noop,
        validate: zeroArgumentsValidator,

        functionName: 'runTakeoff'
    },
    taxi: {
        aliases: ['taxi', 'w', 'wait'],
        parse: noop,
        validate: zeroOrOneArgumentValidator,
        functionName: 'runTaxi',
        isSystemCommand: false
    },
    timewarp: {
        aliases: ['timewarp', 'tw'],
        functionName: '',
        isSystemCommand: true
    },
    tutorial: {
        aliases: ['tutorial'],
        functionName: '',
        isSystemCommand: true
    }
};

/**
 * @property EXPEDITE
 * @type {array}
 * @final
 */
export const EXPEDITE = ['expedite', 'ex'];

/**
 * Get the name of a command when given any of that command's aliases
 *
 * @function findCommandNameWithAlias
 * @param commandAlias {string}
 * @return {string}
 */
export function findCommandNameWithAlias(commandAlias) {
    return _findKey(AIRCRAFT_COMMAND_MAP, (command) => command.aliases.indexOf(commandAlias) !== -1);
}
