/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies */
import ava from 'ava';

import AircraftController from '../../src/assets/scripts/client/aircraft/AircraftController';
import { AIRCRAFT_DEFINITION_LIST_MOCK } from './_mocks/aircraftMocks';
import { airlineControllerFixture } from '../fixtures/airlineFixtures';
import { navigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';
import {
    spawnPatternModelArrivalFixture,
    spawnPatternModelDepartureFixture
} from '../fixtures/trafficGeneratorFixtures';

global.prop = {};

ava('throws when called with invalid parameters', (t) => {
    t.throws(() => new AircraftController());
    t.throws(() => new AircraftController({}));
    t.throws(() => new AircraftController([]));
    t.throws(() => new AircraftController(42));
    t.throws(() => new AircraftController('threeve'));
    t.throws(() => new AircraftController(false));

    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, {}));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, []));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, 42));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, 'threeve'));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, false));

    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, 42));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, 'threeve'));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, false));

    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, navigationLibraryFixture));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, 42, navigationLibraryFixture));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, 'threeve', navigationLibraryFixture));
    t.throws(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, false, navigationLibraryFixture));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, navigationLibraryFixture));
});

ava('._setDestinationFromRouteOrProcedure() returns the SID name as a destination for a departing aircraft', (t) => {
    const expectedResult = 'COWBY6';
    const controller = new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, navigationLibraryFixture);
    const result = controller._setDestinationFromRouteOrProcedure(spawnPatternModelDepartureFixture);

    t.true(result === expectedResult);
});

ava('._setDestinationFromRouteOrProcedure() returns the destination name an arriving aircraft', (t) => {
    const expectedResult = 'KLAS';
    const controller = new AircraftController(AIRCRAFT_DEFINITION_LIST_MOCK, airlineControllerFixture, navigationLibraryFixture);
    const result = controller._setDestinationFromRouteOrProcedure(spawnPatternModelArrivalFixture);

    t.true(result === expectedResult);
});
