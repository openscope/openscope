import _findKey from 'lodash/findKey';

/**
 * Complete map of commands
 *
 * This list includes both System and Unicode commands, as well as all the various aircraft
 * commands.
 *
 * Aliased commands map to a single root command that is shared among all aliases. The values
 * here then map to a `AIRCRAFT_COMMAND_DEFINITION` which contains `validate` and `parse` functions for
 * each root command. Some commands have very unique demands for how arguments are formatted,
 * those functions let us do that on a case by case basis.
 *
 * Keys are lowercased here so they can be accessed programatically using input string segments
 * that are converted to lowercase for ease of comparison.
 *
 * @propery AIRCRAFT_COMMAND_MAP
 * @type {Object}
 * @final
 */
export const AIRCRAFT_COMMAND_MAP = {
    abort: {
        aliases: ['abort'],
        functionName: 'runAbort',
        isSystemCommand: false
    },
    airport: {
        aliases: ['airport'],
        functionName: '',
        isSystemCommand: true
    },
    altitude: {
        aliases: ['a', 'altitude', 'c', 'climb', 'd', 'descend'],
        functionName: 'runAltitude',
        isSystemCommand: false
    },
    auto: {
        aliases: ['auto'],
        functionName: '',
        isSystemCommand: true
    },
    clear: {
        aliases: ['clear'],
        functionName: '',
        isSystemCommand: true
    },
    clearedAsFiled: {
        aliases: ['caf', 'clearedAsFiled'],
        functionName: 'runClearedAsFiled',
        isSystemCommand: false
    },
    climbViaSid: {
        aliases: ['climbViaSid', 'cvs'],
        functionName: 'runClimbViaSID',
        isSystemCommand: false
    },
    delete: {
        aliases: ['del', 'delete', 'kill'],
        functionName: 'runDelete',
        isSystemCommand: false
    },
    descendViaStar: {
        aliases: ['descendViaStar', 'dvs'],
        functionName: 'runDescendViaStar',
        isSystemCommand: false
    },
    direct: {
        aliases: ['dct', 'direct', 'pd'],
        functionName: 'runDirect',
        isSystemCommand: false
    },
    expectArrivalRunway: {
        aliases: ['e'],
        functionName: 'runExpectArrivalRunway',
        isSystemCommand: false
    },
    fix: {
        aliases: ['f', 'fix', 'track'],
        functionName: 'runFix',
        isSystemCommand: false
    },
    flyPresentHeading: {
        aliases: ['fph'],
        functionName: 'runFlyPresentHeading',
        isSystemCommand: false
    },
    heading: {
        aliases: ['fh', 'h', 'heading', 't', 'turn'],
        functionName: 'runHeading',
        isSystemCommand: false
    },
    hold: {
        aliases: ['hold'],
        functionName: 'runHold',
        isSystemCommand: false
    },
    land: {
        aliases: ['\\u2b50', '*', 'i', 'ils'],
        functionName: 'runLanding',
        isSystemCommand: false
    },
    moveDataBlock: {
        aliases: ['`'],
        functionName: 'runMoveDataBlock',
        isSystemCommand: false
    },
    pause: {
        aliases: ['pause'],
        functionName: '',
        isSystemCommand: true
    },
    rate: {
        aliases: ['rate'],
        functionName: '',
        isSystemCommand: true
    },
    reroute: {
        aliases: ['reroute', 'rr'],
        functionName: 'runReroute',
        isSystemCommand: false
    },
    route: {
        aliases: ['route'],
        functionName: 'runRoute',
        isSystemCommand: false
    },
    sayAltitude: {
        aliases: ['sa'],
        functionName: 'runSayAltitude',
        isSystemCommand: false
    },
    sayAssignedAltitude: {
        aliases: ['saa'],
        functionName: 'runSayAssignedAltitude',
        isSystemCommand: false
    },
    sayAssignedHeading: {
        aliases: ['sah'],
        functionName: 'runSayAssignedHeading',
        isSystemCommand: false
    },
    sayAssignedSpeed: {
        aliases: ['sas'],
        functionName: 'runSayAssignedSpeed',
        isSystemCommand: false
    },
    sayHeading: {
        aliases: ['sh'],
        functionName: 'runSayHeading',
        isSystemCommand: false
    },
    sayIndicatedAirspeed: {
        aliases: ['si'],
        functionName: 'runSayIndicatedAirspeed',
        isSystemCommand: false
    },
    sayRoute: {
        aliases: ['sr'],
        functionName: 'runSayRoute',
        isSystemCommand: false
    },
    sid: {
        aliases: ['sid'],
        functionName: 'runSID',
        isSystemCommand: false
    },
    speed: {
        aliases: ['-', '+', 'slow', 'sp', 'speed'],
        functionName: 'runSpeed',
        isSystemCommand: false
    },
    squawk: {
        aliases: ['sq', 'squawk'],
        functionName: 'runSquawk',
        isSystemCommand: false
    },
    star: {
        aliases: ['star'],
        functionName: 'runSTAR',
        isSystemCommand: false
    },
    takeoff: {
        aliases: ['cto', 'to', 'takeoff'],
        functionName: 'runTakeoff',
        isSystemCommand: false
    },
    taxi: {
        aliases: ['taxi', 'w', 'wait'],
        functionName: 'runTaxi',
        isSystemCommand: false
    },
    timewarp: {
        aliases: ['timewarp'],
        functionName: '',
        isSystemCommand: true
    },
    transmit: {
        aliases: ['transmit'],
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
export const EXPEDITE = ['expedite', 'x'];

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
