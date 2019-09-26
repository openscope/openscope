import ava from 'ava';
import AircraftCommander from '../../src/assets/scripts/client/aircraft/AircraftCommander';
import AircraftModel from '../../src/assets/scripts/client/aircraft/AircraftModel';
import {
    AIRCRAFT_MOCK_WITH_NE_HEADING,
    AIRCRAFT_MOCK_WITH_NORTH_HEADING,
    AIRCRAFT_MOCK_WITH_POSITIVE_SW_HEADING,
    AIRCRAFT_MOCK_WITH_NEGATIVE_SW_HEADING,
    RUN_SAY_HEADING_RESULT_NE,
    RUN_SAY_HEADING_RESULT_NORTH,
    RUN_SAY_HEADING_RESULT_SW
} from './_mocks/aircraftCommanderMocks';

ava('.runSayHeading() returns correct when heading north', (t) => {
    const commander = new AircraftCommander();
    const aircraft = new AircraftModel(AIRCRAFT_MOCK_WITH_NORTH_HEADING);
    const result = commander.runSayHeading(aircraft);

    t.deepEqual(result, RUN_SAY_HEADING_RESULT_NORTH);
});

ava('.runSayHeading() returns correct when heading has two digits', (t) => {
    const commander = new AircraftCommander();
    const aircraft = new AircraftModel(AIRCRAFT_MOCK_WITH_NE_HEADING);
    const result = commander.runSayHeading(aircraft);

    t.deepEqual(result, RUN_SAY_HEADING_RESULT_NE);
});

ava('.runSayHeading() returns correct when heading is positive', (t) => {
    const commander = new AircraftCommander();
    const aircraft = new AircraftModel(AIRCRAFT_MOCK_WITH_POSITIVE_SW_HEADING);
    const result = commander.runSayHeading(aircraft);

    t.deepEqual(result, RUN_SAY_HEADING_RESULT_SW);
});

ava('.runSayHeading() returns correct when heading is negative', (t) => {
    const commander = new AircraftCommander();
    const aircraft = new AircraftModel(AIRCRAFT_MOCK_WITH_NEGATIVE_SW_HEADING);
    const result = commander.runSayHeading(aircraft);

    t.deepEqual(result, RUN_SAY_HEADING_RESULT_SW);
});
