export const DEPARTURE_PATTERN_MOCK = {
    origin: 'KLAS',
    destination: '',
    category: 'departure',
    route: 'KLAS07L.BOACH6.HEC',
    altitude: null,
    speed: null,
    method: 'random',
    rate: 5,
    airlines: [
        ['amx', 2],
        ['aca/long', 4],
        ['asa', 3],
        ['aay', 15],
        ['aal', 10],
        ['baw/long', 5],
        ['cfg/long', 2],
        ['dal', 10],
        ['fft', 10],
        ['hal', 2],
        ['jbu', 10],
        ['kal/long', 2],
        ['nax/long', 5],
        ['swa', 15],
        ['nks', 12],
        ['scx', 5],
        ['ual', 10],
        ['vrd', 7],
        ['vir', 4],
        ['wja', 7]
    ]
};

export const DEPARTURE_PATTERN_ROUTE_STRING_MOCK = {
    origin: 'KLAS',
    destination: '',
    category: 'departure',
    route: 'BESSY..BOACH..HEC',
    altitude: null,
    speed: null,
    method: 'random',
    rate: 5,
    airlines: [
        ['amx', 2],
        ['aca/long', 4],
        ['asa', 3],
        ['aay', 15],
        ['aal', 10],
        ['baw/long', 5],
        ['cfg/long', 2],
        ['dal', 10],
        ['fft', 10],
        ['hal', 2],
        ['jbu', 10],
        ['kal/long', 2],
        ['nax/long', 5],
        ['swa', 15],
        ['nks', 12],
        ['scx', 5],
        ['ual', 10],
        ['vrd', 7],
        ['vir', 4],
        ['wja', 7]
    ]
};

export const ARRIVAL_PATTERN_MOCK = {
    origin: '',
    destination: 'KLAS',
    category: 'arrival',
    route: 'BETHL.GRNPA1.KLAS07R',
    altitude: [30000, 40000],
    speed: 320,
    method: 'random',
    rate: 10,
    airlines: [
        ['aca/long', 4],
        ['aay', 15],
        ['aal', 10],
        ['baw/long', 5],
        ['cfg/long', 2],
        ['dal', 10],
        ['fft', 10],
        ['jbu', 10],
        ['nax/long', 5],
        ['swa', 15],
        ['nks', 12],
        ['scx', 5],
        ['ual', 10],
        ['vrd', 7],
        ['vir', 4],
        ['wja', 7]
    ]
};

export const ARRIVAL_PATTERN_MOCK_ALL_STRINGS = {
    origin: '',
    destination: 'KLAS',
    category: 'arrival',
    route: 'BETHL.GRNPA1.KLAS07R',
    altitude: '36000',
    speed: '320',
    method: 'random',
    rate: '10',
    airlines: [
        ['wja', 7]
    ]
};

export const ARRIVAL_PATTERN_FLOAT_RATE_MOCK = {
    origin: '',
    destination: 'KLAS',
    category: 'arrival',
    route: 'BETHL.GRNPA1.KLAS07R',
    altitude: '36000',
    speed: '320',
    method: 'random',
    rate: 3.3,
    airlines: [
        ['wja', 7]
    ]
};

export const ARRIVAL_PATTERN_ROUTE_STRING_MOCK = Object.assign(
    {},
    ARRIVAL_PATTERN_MOCK,
    {
        route: 'COWBY..TRALR..GRNPA..PRINO'
    }
);

export const ARRIVAL_PATTERN_CYCLIC_MOCK = Object.assign(
    {},
    ARRIVAL_PATTERN_MOCK,
    {
        method: 'cyclic'
    }
);

export const ARRIVAL_PATTERN_WAVE_MOCK = Object.assign(
    {},
    ARRIVAL_PATTERN_MOCK,
    {
        method: 'wave'
    }
);

export const ARRIVAL_PATTERN_SINGLE_ENTRY_AND_RWY_MOCK = Object.assign(
    {},
    ARRIVAL_PATTERN_MOCK,
    {
        route: 'MLF.GRNPA9.KLAS07R'
    }
);

export const SPAWN_PATTERN_LIST = [
    DEPARTURE_PATTERN_MOCK,
    ARRIVAL_PATTERN_MOCK
];

export const AIRPORT_JSON_FOR_SPAWN_MOCK = {
    spawnPatterns: SPAWN_PATTERN_LIST
};

// Data here needs to be congruent with data in `airlineCollectionFixture` used in `AircraftTypeDefinitionCollection.spec`
export const SPAWN_PATTERN_MODEL_FOR_ARRIVAL_FIXTURE = {
    origin: '',
    destination: 'KLAS',
    category: 'arrival',
    route: 'DAG.KEPEC3.KLAS07R',
    altitude: 28000,
    speed: 320,
    method: 'random',
    rate: 5,
    airlines: [
        ['aal', 5],
        ['ual', 2]
    ]
};

// Data here needs to be congruent with data in `airlineCollectionFixture` used in `AircraftTypeDefinitionCollection.spec`
export const SPAWN_PATTERN_MODEL_FOR_DEPARTURE_FIXTURE = {
    origin: 'KLAS',
    destination: '',
    category: 'departure',
    route: 'KLAS07L.COWBY6.GUP',
    altitude: null,
    speed: null,
    method: 'random',
    rate: 5,
    airlines: [
        ['aal', 5],
        ['ual', 2]
    ]
};
