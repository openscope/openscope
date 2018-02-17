export const AIRLINE_DEFINITION_MOCK = {
    name: 'American Airlines',
    icao: 'AAL',
    callsignFormats: [
        '##@@',
        '###',
        '##',
        '#'
    ],
    fleets: {
        '90long': [
            ['DC10', 57],
            ['B752', 77],
            ['MD11', 47]
        ],
        '90default': [
            ['B732', 20],
            ['B733', 30],
            ['B735', 10],
            ['B738', 1],
            ['MD82', 80],
            ['F100', 20]
        ],
        long: [
            ['A332', 15],
            ['A333', 9],
            ['B752', 57],
            ['B763', 40],
            ['B772', 47],
            ['B77W', 20],
            ['B788', 15]
        ],
        default: [
            ['A319', 125],
            ['A320', 54],
            ['A321', 180],
            ['B738', 269],
            ['E190', 20],
            ['MD82', 42],
            ['MD83', 51]
        ]
    }
};

export const AIRLINE_DEFINITION_SIMPLE_FLEET_MOCK = {
    name: 'American Airlines',
    icao: 'aal',
    callsignFormats: [
        '##@@',
        '###',
        '##',
        '#'
    ],
    fleets: {
        default: [
            ['A319', 125],
            ['B738', 269]
        ]
    }
};

export const NOVEMBER_AIRLINE_MOCK = {
    name: 'FastGA',
    icao: 'fastga',
    callsign: {
        name: 'November',
        length: 5,
        alpha: true,
        prefix: 'N'
    },
    fleets: {
        default: [
            ['E50P', 1],
            ['E55P', 1],
            ['E545', 1],
            ['E135', 1],
            ['C510', 1],
            ['C550', 2],
            ['C750', 1]
        ]
    }
};


export const AIRLINE_DEFINITION_LIST_MOCK = [
    AIRLINE_DEFINITION_MOCK,
    {
        name: 'United Airlines',
        icao: 'ual',
        callsign: {
            name: 'United',
            length: 3
        },
        fleets: {
            '90long': [
                ['B762', 15],
                ['B752', 15],
                ['DC10', 5],
                ['B744', 23]
            ],
            '90default': [
                ['B722', 15],
                ['B735', 7],
                ['B733', 15]
            ],
            long: [
                ['B744', 24],
                ['B752', 96],
                ['B753', 21],
                ['B763', 35],
                ['B772', 22],
                ['b77l', 55],
                ['B788', 11]
            ],
            default: [
                ['A319', 55],
                ['A320', 97],
                ['B737', 36],
                ['B738', 130],
                ['B739', 97]
            ]
        }
    }
];

// Data here needs to be congruent with data in `AIRCRAFT_DEFINITION_LIST_MOCK` used in `AircraftTypeDefinitionCollection.spec`
export const AIRLINE_DEFINITION_LIST_FOR_FIXTURE = [
    {
        name: 'American Airlines',
        icao: 'aal',
        callsign: {
            name: 'American',
            length: 3
        },
        fleets: {
            default: [
                ['A320', 125],
                ['B737', 269]
            ]
        }
    },
    {
        name: 'United Airlines',
        icao: 'ual',
        callsign: {
            name: 'United',
            length: 3
        },
        fleets: {
            default: [
                ['A320', 55],
                ['B737', 233]
            ]
        }
    }
];
