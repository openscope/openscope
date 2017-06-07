import ava from 'ava';

import AircraftModel from '../../src/assets/scripts/client/aircraft/AircraftModel';
import { airportControllerFixture } from '../fixtures/airportFixtures';
import { navigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';
import { DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK } from './_mocks/aircraftMocks';

window.airportController = airportControllerFixture;

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

    t.true(model.matchCallsign('432'));
});

ava('.matchCallsign() returns true when passed a lowercase callsign that matches #callsign', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

    t.true(model.matchCallsign('aal432'));
});

ava('.matchCallsign() returns true when passed a mixed case callsign that matches #callsign', (t) => {
    const model = new AircraftModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

    t.true(model.matchCallsign('aAl432'));
});
