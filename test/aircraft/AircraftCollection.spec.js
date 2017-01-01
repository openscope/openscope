/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import _forEach from 'lodash/forEach';

import AircraftCollection from '../../src/assets/scripts/client/aircraft/AircraftCollection';
import AircraftDefinitionModel from '../../src/assets/scripts/client/aircraft/AircraftDefinitionModel';
import { airlineCollectionFixture } from '../fixtures/airlineFixtures';
import { navigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';
import { AIRCRAFT_DEFINITION_LIST_MOCK } from './_mocks/aircraftMocks';

ava('should throw when passed invalid parameters', (t) => {
    t.throws(() => new AircraftCollection());
    t.throws(() => new AircraftCollection({}));
    t.throws(() => new AircraftCollection([]));
    t.throws(() => new AircraftCollection(42));
    t.throws(() => new AircraftCollection('threeve'));
    t.throws(() => new AircraftCollection(false));

    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK));
    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, {}));
    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, []));
    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, 42));
    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, 'threeve'));
    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, false));

    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture));
    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, 42));
    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, 'threeve'));
    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, false));

    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, navigationLibraryFixture));
    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, 42, navigationLibraryFixture));
    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, 'threeve', navigationLibraryFixture));
    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, false, navigationLibraryFixture));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, navigationLibraryFixture));
});

ava('.findAircraftDefinitionModelByIcao() returns an AircraftDefinitionModel when provided a valid aircraft icao', (t) => {
    const expectedResult = 'b737';
    const collection = new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, navigationLibraryFixture);
    const result = collection.findAircraftDefinitionModelByIcao('b737');

    t.true(result instanceof AircraftDefinitionModel);
    t.true(result.icao === expectedResult);
});

ava('._buildAircraftDefinitionList() returns a list of AircraftDefinitionModel objects', (t) => {
    const collection = new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, navigationLibraryFixture);
    const results = collection._buildAircraftDefinitionList(AIRCRAFT_DEFINITION_LIST_MOCK);

    _forEach(results, (result, i) => {
        t.true(result instanceof AircraftDefinitionModel);
        t.true(result.icao === AIRCRAFT_DEFINITION_LIST_MOCK[i].icao.toLowerCase());
    });
});

ava.skip('.getAircraftDefinitionForAirlineId()', (t) => {});
