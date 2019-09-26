import { AIRCRAFT_DEFINITION_MOCK } from './aircraftMocks';
import { POSITION_MODEL_MOCK } from '../../base/_mocks/positionMocks';

export const AIRCRAFT_MOCK_BASE = {
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

// Directly north
export const AIRCRAFT_MOCK_WITH_NORTH_HEADING = Object.assign({}, AIRCRAFT_MOCK_BASE, {
    heading: 0
});

// North easterly (45)
export const AIRCRAFT_MOCK_WITH_NE_HEADING = Object.assign({}, AIRCRAFT_MOCK_BASE, {
    heading: 0.7854
});

// South westerly (225)
export const AIRCRAFT_MOCK_WITH_POSITIVE_SW_HEADING = Object.assign({}, AIRCRAFT_MOCK_BASE, {
    heading: 3.9270
});

// South westerly (-135)
export const AIRCRAFT_MOCK_WITH_NEGATIVE_SW_HEADING = Object.assign({}, AIRCRAFT_MOCK_BASE, {
    heading: -2.3562
});

export const RUN_SAY_HEADING_RESULT_NORTH = [
    true,
    {
        log: 'heading 360',
        say: 'heading three six zero'
    }
];

export const RUN_SAY_HEADING_RESULT_NE = [
    true,
    {
        log: 'heading 045',
        say: 'heading zero four five'
    }
];
export const RUN_SAY_HEADING_RESULT_SW = [
    true,
    {
        log: 'heading 225',
        say: 'heading two two five'
    }
];
