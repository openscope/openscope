/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import _forEach from 'lodash/forEach';

import AircraftTypeDefinitionCollection from '../../src/assets/scripts/client/aircraft/AircraftTypeDefinitionCollection';
import AircraftTypeDefinitionModel from '../../src/assets/scripts/client/aircraft/AircraftTypeDefinitionModel';
import { AIRCRAFT_DEFINITION_LIST_MOCK } from './_mocks/aircraftMocks';

ava('should throw when passed invalid parameters', (t) => {
    t.throws(() => new AircraftTypeDefinitionCollection());
    t.throws(() => new AircraftTypeDefinitionCollection({}));
    t.throws(() => new AircraftTypeDefinitionCollection([]));
    t.throws(() => new AircraftTypeDefinitionCollection(42));
    t.throws(() => new AircraftTypeDefinitionCollection('threeve'));
    t.throws(() => new AircraftTypeDefinitionCollection(false));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new AircraftTypeDefinitionCollection(AIRCRAFT_DEFINITION_LIST_MOCK));
});

ava('.findAircraftTypeDefinitionModelByIcao() returns an AircraftTypeDefinitionModel when provided a valid aircraft icao', (t) => {
    const expectedResult = 'b737';
    const collection = new AircraftTypeDefinitionCollection(AIRCRAFT_DEFINITION_LIST_MOCK);
    const result = collection.findAircraftTypeDefinitionModelByIcao('b737');

    t.true(result instanceof AircraftTypeDefinitionModel);
    t.true(result.icao === expectedResult);
});

ava('._buildAircraftTypeDefinitionModelList() returns a list of AircraftTypeDefinitionModel objects', (t) => {
    const collection = new AircraftTypeDefinitionCollection(AIRCRAFT_DEFINITION_LIST_MOCK);
    const results = collection._buildAircraftTypeDefinitionModelList(AIRCRAFT_DEFINITION_LIST_MOCK);

    _forEach(results, (result, i) => {
        t.true(result instanceof AircraftTypeDefinitionModel);
        t.true(result.icao === AIRCRAFT_DEFINITION_LIST_MOCK[i].icao.toLowerCase());
    });
});

ava.skip('.getAircraftDefinitionForAirlineId()', (t) => {
    t.true(true);
});
