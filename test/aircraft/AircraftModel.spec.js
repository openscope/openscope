import ava from 'ava';
import AircraftModel from '../../src/assets/scripts/client/aircraft/AircraftModel';
import {
    airportControllerFixture,
    resetAirportControllerFixture
} from '../fixtures/airportFixtures';
import { navigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';
import {
    ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK,
    ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK,
    DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK
} from './_mocks/aircraftMocks';

ava.beforeEach(() => {
    airportControllerFixture();
});

ava.afterEach(() => {
    resetAirportControllerFixture();
});

ava('does not throw with valid parameters', (t) => {
    t.notThrows(() => new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture));
});

ava('.matchCallsign() returns true when passed `*`', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

    t.true(model.matchCallsign('*'));
});

ava('.matchCallsign() returns false when passed a flightnumber that is not included in #callsign', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

    t.false(model.matchCallsign('42'));
});

ava('.matchCallsign() returns true when passed a flightnumber that is included in #callsign', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

    t.true(model.matchCallsign('1567'));
});

ava('.matchCallsign() returns true when passed a lowercase callsign that matches #callsign', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

    t.true(model.matchCallsign('ual1567'));
});

ava('.matchCallsign() returns true when passed a mixed case callsign that matches #callsign', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

    t.true(model.matchCallsign('uAl1567'));
});

ava('.getViewModel() includes an altitude that has not been rounded to the nearest foot', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);
    model.mcp.altitude = 7777.1234567;

    const { assignedAltitude: result } = model.getViewModel();

    t.true(result === 77.77123456700001);
});

ava('.updateTarget() causes arrivals to descend when the STAR includes only AT or ABOVE altitude restrictions', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_WITH_SOFT_ALTITUDE_RESTRICTIONS_MOCK, navigationLibraryFixture);
    model.positionModel = navigationLibraryFixture.findFixByName('LEMNZ').positionModel;

    model.groundSpeed = 320;
    model.updateTarget();

    t.true(model.target.altitude === 17000);
});

ava('.updateTarget() causes arrivals to descend when the STAR includes AT altitude restrictions', (t) => {
    const model = new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);
    model.positionModel = navigationLibraryFixture.findFixByName('MISEN').positionModel

    model.groundSpeed = 320;
    model.updateTarget();

    t.true(model.target.altitude === 24000);
});
