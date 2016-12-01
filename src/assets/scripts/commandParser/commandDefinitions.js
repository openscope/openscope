export const COMMANDS = {
    version: 'version',
    tutorial: 'tutorial',
    auto: 'auto',
    pause: 'pause',
    timewarp: 'timewarp',
    clear: 'clear',
    airport: 'airport',
    rate: 'rate',
    transmit: 'transmit',

    taxi: 'taxi',
    wait: 'taxi',
    w: 'taxi',
    sid: 'sid',
    star: 'star',
    caf: 'caf',
    cvs: 'cvs',
    dvs: 'dvs',
    climb: 'altitude',
    c: 'altitude',
    descend: 'altitude',
    d: 'altitude',
    altitude: 'altitude',
    a: 'altitude',
    takeoff: 'takeoff',
    to: 'takeoff',
    cto: 'takeoff',
    heading: 'heading',
    fh: 'fh',
    h: 'h',
    turn: 'turn',
    t: 't',
    speed: 'speed',
    slow: 'slow',
    sp: 'sp',
    ils: 'ils',
    i: 'i',
    land: 'land',
    l: 'l',
    reroute: 'reroute',
    rr: 'rr',
    route: 'route',
    sr: 'sr',
    f: 'f',
    fix: 'fix',
    track: 'track',
    direct: 'direct',
    pd: 'pd',
    dct: 'dct',
    abort: 'abort',
    hold: 'hold'
};

export const COMMAND_DEFINITION = {
    taxi: {
        argsLength: 0,
        isDeferrable: false
    },
    sid: {
        argsLength: 1,
        isDeferrable: false
    },
    star: {
        argsLength: 1,
        isDeferrable: false
    },
    caf: {
        argsLength: 0,
        isDeferrable: false
    },
    cvs: {
        argsLength: 0,
        isDeferrable: false
    },
    dvs: {
        argsLength: 0,
        isDeferrable: false
    },
    climb: {
        argsLength: 1,
        isDeferrable: false
    },
    altitude: {
        argsLength: 1,
        isDeferrable: false
    },
    takeoff: {
        argsLength: 0,
        isDeferrable: true
    },
};
