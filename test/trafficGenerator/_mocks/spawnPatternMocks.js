export const DEPARTURE_PATTERN_MOCK = {
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
    ],
    destination: '',
    origin: 'KLAS',
    category: 'departure',
    route: 'KLAS.BOACH6.HEC',
    altitude: null,
    method: 'random',
    rate: 5,
    speed: null
};

export const ARRIVAL_PATTERN_MOCK = {
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
    ],
    destination: 'KLAS',
    origin: '',
    category: 'arrival',
    route: 'BETHL.GRNPA1.KLAS',
    altitude: [30000, 40000],
    method: 'random',
    rate: 10,
    speed: 320
};

export const SPAWN_PATTERN_LIST = [
    DEPARTURE_PATTERN_MOCK,
    ARRIVAL_PATTERN_MOCK
];

export const AIRPORT_JSON_FOR_SPAWN_MOCK = {
    spawnPatterns: SPAWN_PATTERN_LIST
};

// Data here needs to be congruent with data in `airlineCollectionFixture` used in `AircraftCollection.spec`
export const SPAWN_PATTERN_MODEL_FOR_ARRIVAL_FIXTURE = {
    destination: 'KLAS',
    origin: '',
    category: 'arrival',
    route: 'DAG.KEPEC3.KLAS',
    altitude: 28000,
    method: 'random',
    rate: 5,
    speed: 320,
    airlines: [
        ['aal', 5],
        ['ual', 2]
    ]
};

// Data here needs to be congruent with data in `airlineCollectionFixture` used in `AircraftCollection.spec`
export const SPAWN_PATTERN_MODEL_FOR_DEPARTURE_FIXTURE = {
    destination: '',
    origin: 'KLAS',
    category: 'departure',
    route: 'KLAS.COWBY6.GUP',
    altitude: null,
    method: 'random',
    rate: 5,
    speed: null,
    airlines: [
        ['aal', 5],
        ['ual', 2]
    ]
};
