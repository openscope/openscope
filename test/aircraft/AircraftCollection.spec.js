import ava from 'ava';
import sinon from 'sinon';
import _forEach from 'lodash/forEach';

import AircraftCollection from '../../src/assets/scripts/client/aircraft/AircraftCollection';
import AircraftDefinitionModel from '../../src/assets/scripts/client/aircraft/AircraftDefinitionModel';
import { airlineCollectionFixture } from '../fixtures/airlineFixtures';
import { fixCollectionFixture } from '../fixtures/navigationLibraryFixtures';
import {
    spawnPatternModelArrivalFixture,
    spawnPatternModelDepartureFixture
} from '../fixtures/trafficGeneratorFixtures';

import {
    AIRCRAFT_DEFINITION_LIST_MOCK,
    AIRCRAFT_DEFINITION_MOCK
} from './_mocks/aircraftMocks';

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

    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, fixCollectionFixture));
    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, 42, fixCollectionFixture));
    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, 'threeve', fixCollectionFixture));
    t.throws(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, false, fixCollectionFixture));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, fixCollectionFixture));
});

ava('.findAircraftDefinitionModelByIcao() returns an AircraftDefinitionModel when provided a valid aircraft icao', (t) => {
    const expectedResult = 'b737';
    const collection = new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, fixCollectionFixture);
    const result = collection.findAircraftDefinitionModelByIcao('b737');

    t.true(result instanceof AircraftDefinitionModel);
    t.true(result.icao === expectedResult);
});

ava('._buildAircraftDefinitionList() returns a list of AircraftDefinitionModel objects', (t) => {
    const collection = new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, fixCollectionFixture);
    const results = collection._buildAircraftDefinitionList(AIRCRAFT_DEFINITION_LIST_MOCK);

    _forEach(results, (result, i) => {
        t.true(result instanceof AircraftDefinitionModel);
        t.true(result.icao === AIRCRAFT_DEFINITION_LIST_MOCK[i].icao.toLowerCase());
    });
});

ava('._buildAircraftProps() calls ._buildAircraftPropsForDeparture() is spawnModel.category === departure', (t) => {
    const collection = new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, fixCollectionFixture);
    const _buildAircraftPropsForDepartureSpy = sinon.spy(collection, '_buildAircraftPropsForDeparture');

    collection._buildAircraftProps(spawnPatternModelDepartureFixture);

    t.true(_buildAircraftPropsForDepartureSpy.calledWithExactly(spawnPatternModelDepartureFixture));
});

ava('._buildAircraftProps() calls ._buildAircraftPropsForArrival() is spawnModel.category === arrival', (t) => {
    const collection = new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, fixCollectionFixture);
    const _buildAircraftPropsForArrivalSpy = sinon.spy(collection, '_buildAircraftPropsForArrival');

    collection._buildAircraftProps(spawnPatternModelArrivalFixture);

    t.true(_buildAircraftPropsForArrivalSpy.calledWithExactly(spawnPatternModelArrivalFixture));
});

ava.skip('._getAircraftDefinitionForAirlineId()', (t) => {});
