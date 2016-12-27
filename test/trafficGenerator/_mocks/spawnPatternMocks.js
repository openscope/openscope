export const DEPARTURE_PATTERN_MOCK = {
    airlines: [
        ['amx', 2],
        ['aca/long', 4],
        ['asa', 3],
        ['aay', 5],
        ['aal', 0],
        ['baw/long', 5],
        ['cfg/long', 2],
        ['dal', 0],
        ['fft', 0],
        ['hal', 2],
        ['jbu', 0],
        ['kal/long', 2],
        ['nax/long', 5],
        ['swa', 5],
        ['nks', 2],
        ['scx', 5],
        ['tcx/long', 3],
        ['ual', 0],
        ['vrd', 7],
        ['vir', 4],
        ['wja', 7]
    ],
    destinations: [
        'BOACH6', 'COWBY6', 'SHEAD9', 'TRALR6'
    ],
    type: 'random',
    frequency: 20
};

export const ARRIVAL_PATTERN_MOCK = {
    type: 'random',
    route: 'BETHL.GRNPA1.KLAS',
    frequency: 10,
    altitude: [30000, 40000],
    speed: 350,
    airlines: [
        ['aca/long', 4],
        ['aay', 5],
        ['aal', 0],
        ['baw/long', 5],
        ['cfg/long', 2],
        ['dal', 0],
        ['fft', 0],
        ['jbu', 0],
        ['nax/long', 5],
        ['swa', 5],
        ['nks', 2],
        ['scx', 5],
        ['tcx/long', 3],
        ['ual', 0],
        ['vrd', 7],
        ['vir', 4],
        ['wja', 7]
    ]
};

export const SPAWN_PATTERN_LIST = [
    DEPARTURE_PATTERN_MOCK,
    ARRIVAL_PATTERN_MOCK,
    {
        type: 'random',
        route: 'DAG.KEPEC3.KLAS',
        frequency: 5,
        altitude: 28000,
        speed: 350,
        airlines: [
            ['amx', 2],
            ['aay', 5],
            ['aal', 0],
            ['dal', 0],
            ['fft', 0],
            ['jbu', 0],
            ['swa', 5],
            ['nks', 2],
            ['scx', 5],
            ['ual', 0],
            ['vrd', 7]
        ]
    }
];

export const AIRPORT_JSON_FOR_SPAWN_MOCK = {
    departures: DEPARTURE_PATTERN_MOCK,
    arrivals: [
        ARRIVAL_PATTERN_MOCK,
        {
            type: 'random',
            route: 'DAG.KEPEC3.KLAS',
            frequency: 5,
            altitude: 28000,
            speed: 350,
            airlines: [
                ['amx', 2],
                ['aay', 5],
                ['aal', 0],
                ['dal', 0],
                ['fft', 0],
                ['jbu', 0],
                ['swa', 5],
                ['nks', 2],
                ['scx', 5],
                ['ual', 0],
                ['vrd', 7]
            ]
        }
    ]
};
