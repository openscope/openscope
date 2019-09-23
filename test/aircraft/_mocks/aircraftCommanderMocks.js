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

export const AIRCRAFT_MOCK_WITH_POSITIVE_HEADING = Object.assign({}, AIRCRAFT_MOCK_BASE, {
    heading: 5.7596
});

export const AIRCRAFT_MOCK_WITH_NEGATIVE_HEADING = Object.assign({}, AIRCRAFT_MOCK_BASE, {
    heading: -0.5236
});

export const RUN_SAY_HEADING_RESULT = [
    true,
    {
        log: 'heading 330',
        say: 'heading three three zero'
    }
];
