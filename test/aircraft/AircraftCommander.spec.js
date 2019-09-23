import ava from 'ava';
import AircraftCommander from '../../src/assets/scripts/client/aircraft/AircraftCommander';
import AircraftModel from '../../src/assets/scripts/client/aircraft/AircraftModel';
import {
    AIRCRAFT_MOCK_WITH_POSITIVE_HEADING,
    AIRCRAFT_MOCK_WITH_NEGATIVE_HEADING,
    RUN_SAY_HEADING_RESULT
} from './_mocks/aircraftCommanderMocks';

ava('.runSayHeading() returns correct when heading is positive', (t) => {
    const commander = new AircraftCommander();
    const aircraft = new AircraftModel(AIRCRAFT_MOCK_WITH_POSITIVE_HEADING);
    const result = commander.runSayHeading(aircraft);

    t.deepEqual(result, RUN_SAY_HEADING_RESULT);
});

ava('.runSayHeading() returns correct when heading is negative', (t) => {
    const commander = new AircraftCommander();
    const aircraft = new AircraftModel(AIRCRAFT_MOCK_WITH_NEGATIVE_HEADING);
    const result = commander.runSayHeading(aircraft);

    t.deepEqual(result, RUN_SAY_HEADING_RESULT);
});
