import AircraftModel from '../../../src/assets/scripts/client/aircraft/AircraftModel';
import { createNavigationLibraryFixture } from '../../fixtures/navigationLibraryFixtures';
import { POSITION_MODEL_MOCK } from '../../base/_mocks/positionMocks';
// import { INVALID_NUMBER } from '../../../src/assets/scripts/client/constants/globalConstants';

// fixtures
const navigationLibraryFixture = createNavigationLibraryFixture();

export const AIRCRAFT_DEFINITION_MOCK = {
    name: 'Boeing 737-700',
    icao: 'B737',
    engines: {
        number: 2,
        type: 'J'
    },
    weightClass: 'L',
    category: {
        srs: 3,
        lahso: 8,
        recat: 'D'
    },
    ceiling: 41000,
    rate: {
        climb: 3000,
        descent: 3000,
        accelerate: 7,
        decelerate: 3
    },
    runway: {
        takeoff: 2.042,
        landing: 1.372
    },
    speed: {
        min: 110,
        landing: 125,
        cruise: 460,
        cruiseM: null,
        max: 525,
        maxM: null
    },
    capability: {
        ils: true,
        fix: true
    }
};

export const AIRCRAFT_DEFINITION_MOCK_HEAVY = {
    name: 'Boeing 787-9 Dreamliner',
    icao: 'B789',
    engines: {
        number: 2,
        type: 'J'
    },
    weightClass: 'H',
    category: {
        srs: 3,
        lahso: 7,
        recat: 'B'
    },
    ceiling: 43000,
    rate: {
        climb: 2700,
        descent: 2800,
        accelerate: 7,
        decelerate: 4
    },
    runway: {
        takeoff: 2.900,
        landing: 1.738
    },
    speed: {
        min: 120,
        landing: 130,
        cruise: 487,
        cruiseM: 0.85,
        max: 516,
        maxM: 0.90
    },
    capability: {
        ils: true,
        fix: true
    }
};

export const AIRCRAFT_DEFINITION_MOCK_SUPER = {
    name: 'Airbus A380-800',
    icao: 'A388',
    engines: {
        number: 4,
        type: 'J'
    },
    weightClass: 'J',
    category: {
        srs: 3,
        lahso: 10,
        recat: 'A'
    },
    ceiling: 43000,
    rate: {
        climb:      2500,
        descent:    2000,
        accelerate: 6,
        decelerate: 4
    },
    runway: {
        takeoff: 3.000,
        landing: 3.000
    },
    speed:{
        min:     125,
        landing: 135,
        cruiseM: 0.85,
        cruise:  560,
        max:     595,
        maxM:    0.89
    },
    capability: {
        ils: true,
        fix: true
    }
};

export const AIRCRAFT_DEFINITION_LIST_MOCK = [
    AIRCRAFT_DEFINITION_MOCK,
    {
        name: 'Airbus A320',
        icao: 'A320',
        engines: {
            number: 2,
            type: 'J'
        },
        weightClass: 'L',
        category: {
            srs: 3,
            lahso: 7,
            recat: 'D'
        },
        ceiling: 39000,
        rate: {
            climb: 3500,
            descent: 3000,
            accelerate: 7,
            decelerate: 4
        },
        runway: {
            takeoff: 1.900,
            landing: 1.400
        },
        speed: {
            min: 115,
            landing: 130,
            cruise: 454,
            cruiseM: null,
            max: 487,
            maxM: 0.83
        },
        capability: {
            ils: true,
            fix: true
        }
    }
];

export const DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK = {
    transponderCode: 3377,
    callsign: '1567',
    destination: '',
    origin: 'KLAS',
    fleet: 'default',
    airline: 'ual',
    airlineCallsign: 'speedbird',
    altitude: 28000,
    speed: 320,
    category: 'departure',
    icao: 'b737',
    // TODO: this may need to be a fixture for `AircraftTypeDefinitionModel`
    model: AIRCRAFT_DEFINITION_MOCK,
    positionModel: POSITION_MODEL_MOCK,
    routeString: 'KLAS07R.COWBY6.GUP'
};

// export const DEPARTURE_AIRCRAFT_INIT_PROPS_WITH_DIRECT_ROUTE_STRING_MOCK = Object.assign(
//     {},
//     DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK,
//     {
//         routeString: 'BESSY..BOACH..HEC'
//     }
// );

export const DEPARTURE_AIRCRAFT_MODEL_MOCK = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

export const DEPARTURE_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK = Object.assign(
    {},
    DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK,
    {
        routeString: 'KLAS25R.TRALR6.MLF'
    }
);

export const ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK = {
    transponderCode: 3377,
    callsign: '432',
    destination: 'KLAS',
    origin: '',
    fleet: 'default',
    airline: 'aal',
    airlineCallsign: 'speedbird',
    altitude: 28000,
    speed: 320,
    category: 'arrival',
    icao: 'b737',
    // TODO: this may need to be a fixture for `AircraftTypeDefinitionModel`
    model: AIRCRAFT_DEFINITION_MOCK,
    positionModel: POSITION_MODEL_MOCK,
    routeString: 'DAG.KEPEC3.KLAS07R'
};

export const ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK_HEAVY = {
    transponderCode: 1356,
    callsign: '99',
    destination: 'KATL',
    origin: '',
    fleet: 'default',
    airline: 'ual',
    airlineCallsign: 'united',
    altitude: 27000,
    speed: 375,
    category: 'arrival',
    icao: 'b789',
    // TODO: this may need to be a fixture for `AircraftTypeDefinitionModel`
    model: AIRCRAFT_DEFINITION_MOCK_HEAVY,
    positionModel: POSITION_MODEL_MOCK,
    routeString: 'DAG.KEPEC3.KLAS07R'  //TODO: this is an invalid route for KATL, but I used it because valid routes weren't working
};

export const ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK_SUPER = {
    transponderCode: 6375,
    callsign: '11',
    destination: 'OMDB',
    origin: '',
    fleet: 'default',
    airline: 'uae',
    airlineCallsign: 'emirates',
    altitude: 18000,
    speed: 375,
    category: 'arrival',
    icao: 'a388',
    // TODO: this may need to be a fixture for `AircraftTypeDefinitionModel`
    model: AIRCRAFT_DEFINITION_MOCK_SUPER,
    positionModel: POSITION_MODEL_MOCK,
    routeString: 'DAG.KEPEC3.KLAS07R'  //TODO: this is an invalid route for KATL, but I used it because valid routes weren't working
};

export const ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK = Object.assign(
    {},
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    {
        routeString: 'MLF.GRNPA2.KLAS07R'
    }
);

// export const ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_DIRECT_ROUTE_STRING_MOCK = {
//     callsign: '432',
//     destination: 'KLAS',
//     fleet: 'default',
//     airline: 'aal',
//     airlineCallsign: 'speedbird',
//     altitude: 28000,
//     speed: 320,
//     category: 'arrival',
//     icao: 'b737',
//     model: AIRCRAFT_DEFINITION_MOCK,
//     positionModel: POSITION_MODEL_MOCK,
//     routeString: 'COWBY..BIKKR..DAG',
//     waypoints: []
// };

export const ARRIVAL_AIRCRAFT_MODEL_MOCK = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);
export const ARRIVAL_AIRCRAFT_MODEL_MOCK_HEAVY = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK_HEAVY, navigationLibraryFixture);
export const ARRIVAL_AIRCRAFT_MODEL_MOCK_SUPER = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK_SUPER, navigationLibraryFixture);

// export const HOLD_WAYPOINT_MOCK = {
//     turnDirection: 'left',
//     legLength: '3min',
//     name: '@COWBY',
//     positionModel: STATIC_POSITION_MODEL_MOCK,
//     altitudeMaximum: INVALID_NUMBER,
//     altitudeMinimum: INVALID_NUMBER,
//     speedMaximum: INVALID_NUMBER,
//     speedMinimum: INVALID_NUMBER
// };
//
// export const HOLD_AT_PRESENT_LOCATION_MOCK = {
//     isHold: true,
//     turnDirection: 'left',
//     legLength: '3min',
//     name: 'GPS',
//     positionModel: STATIC_POSITION_MODEL_MOCK,
//     altitudeMaximum: INVALID_NUMBER,
//     altitudeMinimum: INVALID_NUMBER,
//     speedMaximum: INVALID_NUMBER,
//     speedMinimum: INVALID_NUMBER
// };
