export const TOP_LEVEL_COMMANDS = {
    version: 'version',
    tutorial: 'tutorial',
    auto: 'auto',
    pause: 'pause',
    timewarp: 'timewarp',
    clear: 'clear',
    airport: 'airport',
    rate: 'rate',
    transmit: 'transmit'
};

export const UNICODE_COMMNDS = {
    '\\u2B61': 'altitude',
    '\\u2B63': 'altitude',
    '\\u2BA2': 'heading',
    '\\u2BA3': 'heading'
};



export const COMMANDS = {
    ...TOP_LEVEL_COMMANDS,
    ...UNICODE_COMMNDS,

    taxi: 'taxi',
    wait: 'taxi',
    w: 'taxi',
    sid: 'sid',
    star: 'star',
    caf: 'clearedAsFiled',
    cvs: 'climbViaSID',
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
    hold: 'hold',
    '`': 'moveDataBlock'
};

// function genericZeroArgumentCommand() {}
//
// function genericOneArgumentCommand() {}
//
// function genericTwoArgumentCommand() {}
//
// function genericThreeArgumentCommand() {}
//
// function genericFourArgumentCommand() {}

// export const COMMAND_DEFINITION = {
//     taxi: {},
//     sid: {},
//     star: {},
//     caf: {},
//     cvs: {},
//     dvs: {},
//     climb: {},
//     altitude: {},
//     takeoff: {},
//     heading: {},
//     speed: {},
//     ils: {},
//     reroute: {},
//     route: {},
//     sr: {},
//     fix: {},
//     direct: {},
//     abort: {},
//     hold: {}
// };
