/**
 * List of System Commands
 *
 * When a command is parsed, the value here will be used for the `name` property
 * of the `AircraftCommandParser`
 *
 * @property SYSTEM_COMMANDS
 * @type {Object}
 * @final
 */
export const SYSTEM_COMMANDS = {
    auto: 'auto',
    clear: 'clear',
    pause: 'pause',
    tutorial: 'tutorial',

    // single arg commands
    '`': 'moveDataBlock',
    airport: 'airport',
    rate: 'rate',
    timewarp: 'timewarp',
    transmit: 'transmit'
};

/**
 * Some commands are converted to unicode (to provide arrow characters) for specific shortkeys
 *
 * This maps those unicode values, converted to a string, to the correct root command
 *
 * @property UNICODE_COMMANDS
 * @type {Object}
 * @final
 */
const UNICODE_COMMANDS = {
    '\\u2B50': 'land'
};

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
    ...SYSTEM_COMMANDS,
    ...UNICODE_COMMANDS,

    abort: 'abort',
    taxi: 'taxi',
    wait: 'taxi',
    w: 'taxi',
    sid: 'sid',
    star: 'star',
    clearedAsFiled: 'clearedAsFiled',
    caf: 'clearedAsFiled',
    climbViaSID: 'climbViaSID',
    cvs: 'climbViaSID',
    descendViaStar: 'descendViaStar',
    dvs: 'descendViaStar',
    climb: 'altitude',
    c: 'altitude',
    descend: 'altitude',
    d: 'altitude',
    altitude: 'altitude',
    a: 'altitude',
    takeoff: 'takeoff',
    to: 'takeoff',
    cto: 'takeoff',
    fph: 'flyPresentHeading',
    heading: 'heading',
    fh: 'heading',
    h: 'heading',
    turn: 'heading',
    t: 'heading',
    speed: 'speed',
    slow: 'speed',
    sp: 'speed',
    '+': 'speed',
    '-': 'speed',
    ils: 'land',
    i: 'land',
    land: 'land',
    l: 'land',
    '*': 'land',
    reroute: 'reroute',
    rr: 'reroute',
    route: 'route',
    f: 'fix',
    fix: 'fix',
    track: 'fix',
    direct: 'direct',
    pd: 'direct',
    dct: 'direct',
    hold: 'hold',
    squawk: 'squawk',
    sq: 'squawk',
    delete: 'delete',
    del: 'delete',
    kill: 'delete',
    sa: 'sayAltitude',
    saa: 'sayAssignedAltitude',
    sh: 'sayHeading',
    sah: 'sayAssignedHeading',
    si: 'sayIndicatedAirspeed',
    sas: 'sayAssignedSpeed'
};

/**
 * @property EXPEDITE
 * @type {array}
 * @final
 */
export const EXPEDITE = ['expedite', 'x'];
