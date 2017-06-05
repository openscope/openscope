import ava from 'ava';

import AircraftInstanceModel from '../../src/assets/scripts/client/aircraft/AircraftInstanceModel';
import { airportControllerFixture } from '../fixtures/airportFixtures';
import { navigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';
import { DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK } from './_mocks/aircraftMocks';

window.airportController = airportControllerFixture;

ava('does not throw with valid parameters', (t) => {
    t.notThrows(() => new AircraftInstanceModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture));
});

ava('.matchCallsign() returns true when passed `*`', (t) => {
    const model = new AircraftInstanceModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

    t.true(model.matchCallsign('*'));
});

ava('.matchCallsign() returns true when passed a flightnumber that is included in #callsign', (t) => {
    const model = new AircraftInstanceModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

    t.true(model.matchCallsign('432'));
});

ava('.matchCallsign() returns true when passed a lowercase callsign that matches #callsign', (t) => {
    const model = new AircraftInstanceModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

    t.true(model.matchCallsign('aal432'));
});

ava('.matchCallsign() returns true when passed a mixed case callsign that matches #callsign', (t) => {
    const model = new AircraftInstanceModel(DEPARTURE_AIRCRAFT_INIT_PROPS_MOCK, navigationLibraryFixture);

    t.true(model.matchCallsign('aAl432'));
});
