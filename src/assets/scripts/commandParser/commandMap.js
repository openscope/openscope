/**
 *
 * @type {Object}
 * @final
 */
export const SYSTEM_COMMANDS = {
    version: 'version',
    tutorial: 'tutorial',
    auto: 'auto',
    pause: 'pause',
    timewarp: 'timewarp',
    clear: 'clear',
    airport: 'airport',
    rate: 'rate',
    '`': 'moveDataBlock',
    transmit: 'transmit'
};

/**
 *
 * @type {Object}
 * @final
 */
const UNICODE_COMMNDS = {
    '\\u2B61': 'altitude',
    '\\u2B63': 'altitude',
    '\\u2BA2': 'heading',
    '\\u2BA3': 'heading'
};

/**
 *
 * @type {Object}
 * @final
 */
export const COMMAND_MAP = {
    ...SYSTEM_COMMANDS,
    ...UNICODE_COMMNDS,

    taxi: 'taxi',
    wait: 'taxi',
    w: 'taxi',
    sid: 'sid',
    star: 'star',
    clearedAsFiled: 'clearedAsFiled',
    caf: 'clearedAsFiled',
    climbViaSID: 'climbViaSID',
    cvs: 'climbViaSID',
    descendViaSTAR: 'descendViaSTAR',
    dvs: 'descendViaSTAR',
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
    sr: 'sayRouter',
    f: 'fix',
    fix: 'fix',
    track: 'fix',
    direct: 'direct',
    pd: 'direct',
    dct: 'direct',
    abort: 'abort',
    hold: 'hold'
};

/**
 * @property EXPEDITE
 * @type {array}
 * @final
 */
export const EXPEDITE = ['expedite', 'x'];
