export const DEPARTURE_PATTERN_MOCK = {
    origin: 'KLAS',
    destination: '',
    category: 'departure',
    route: 'KLAS.BOACH6.HEC',
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
        ['tcx/long', 3],
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
    route: 'BESSI..BOACH..HEC',
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
        ['tcx/long', 3],
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
    route: 'BETHL.GRNPA1.KLAS',
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
        ['tcx/long', 3],
        ['ual', 10],
        ['vrd', 7],
        ['vir', 4],
        ['wja', 7]
    ]
};

export const ARRIVAL_PATTERN_ROUTE_STRING_MOCK = Object.assign(
    {},
    ARRIVAL_PATTERN_MOCK,
    {
        route: 'COWBY..TRALR..GRNPA..PRINO..25R'
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
        route: 'MLF.GRNPA9.KLAS'
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
    route: 'DAG.KEPEC3.KLAS',
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
    route: 'KLAS.COWBY6.GUP',
    altitude: null,
    speed: null,
    method: 'random',
    rate: 5,
    airlines: [
        ['aal', 5],
        ['ual', 2]
    ]
};
