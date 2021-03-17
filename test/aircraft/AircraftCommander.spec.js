import ava from 'ava';
import sinon from 'sinon';
import AircraftCommander from '../../src/assets/scripts/client/aircraft/AircraftCommander';
import AircraftModel from '../../src/assets/scripts/client/aircraft/AircraftModel';
import {
    AIRCRAFT_MOCK_BASE,
    AIRCRAFT_MOCK_WITH_NE_HEADING,
    AIRCRAFT_MOCK_WITH_NORTH_HEADING,
    AIRCRAFT_MOCK_WITH_POSITIVE_SW_HEADING,
    AIRCRAFT_MOCK_WITH_NEGATIVE_SW_HEADING,
    RUN_SAY_HEADING_RESULT_NE,
    RUN_SAY_HEADING_RESULT_NORTH,
    RUN_SAY_HEADING_RESULT_SW,
    SQUAWK_RESPONSE_SUCCESS,
    SQUAWK_RESPONSE_FAILURE
} from './_mocks/aircraftCommanderMocks';

const sandbox = sinon.createSandbox();
let aircraftControllerFixture;
let onChangeTransponderCodeFixture;

ava.beforeEach(() => {
    aircraftControllerFixture = null;
    onChangeTransponderCodeFixture = () => true;
});

ava.afterEach(() => {
    sandbox.restore();
});

ava('.runSayHeading() returns correct when heading north', (t) => {
    const commander = new AircraftCommander(aircraftControllerFixture, onChangeTransponderCodeFixture);
    const aircraft = new AircraftModel(AIRCRAFT_MOCK_WITH_NORTH_HEADING);
    const result = commander.runSayHeading(aircraft);

    t.deepEqual(result, RUN_SAY_HEADING_RESULT_NORTH);
});

ava('.runSayHeading() returns correct when heading has two digits', (t) => {
    const commander = new AircraftCommander(aircraftControllerFixture, onChangeTransponderCodeFixture);
    const aircraft = new AircraftModel(AIRCRAFT_MOCK_WITH_NE_HEADING);
    const result = commander.runSayHeading(aircraft);

    t.deepEqual(result, RUN_SAY_HEADING_RESULT_NE);
});

ava('.runSayHeading() returns correct when heading is positive', (t) => {
    const commander = new AircraftCommander(aircraftControllerFixture, onChangeTransponderCodeFixture);
    const aircraft = new AircraftModel(AIRCRAFT_MOCK_WITH_POSITIVE_SW_HEADING);
    const result = commander.runSayHeading(aircraft);

    t.deepEqual(result, RUN_SAY_HEADING_RESULT_SW);
});

ava('.runSayHeading() returns correct when heading is negative', (t) => {
    const commander = new AircraftCommander(aircraftControllerFixture, onChangeTransponderCodeFixture);
    const aircraft = new AircraftModel(AIRCRAFT_MOCK_WITH_NEGATIVE_SW_HEADING);
    const result = commander.runSayHeading(aircraft);

    t.deepEqual(result, RUN_SAY_HEADING_RESULT_SW);
});

ava('.runSquawk() returns a success response when _onChangeTransponderCode() succeeds', (t) => {
    const commander = new AircraftCommander(aircraftControllerFixture, onChangeTransponderCodeFixture);
    const aircraft = new AircraftModel(AIRCRAFT_MOCK_BASE);
    const result = commander.runSquawk(aircraft, ['3377']);

    t.deepEqual(result, SQUAWK_RESPONSE_SUCCESS);
});

ava('.runSquawk() returns a failure response when _onChangeTransponderCode() fails', (t) => {
    const commander = new AircraftCommander(aircraftControllerFixture, onChangeTransponderCodeFixture);
    const aircraft = new AircraftModel(AIRCRAFT_MOCK_BASE);

    sandbox.stub(commander, '_onChangeTransponderCode').returns(false);

    const result = commander.runSquawk(aircraft, ['3377']);

    t.deepEqual(result, SQUAWK_RESPONSE_FAILURE);
});
