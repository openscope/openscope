/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import sinon from 'sinon';
import _cloneDeep from 'lodash/cloneDeep';
import _forEach from 'lodash/forEach';
import _isEqual from 'lodash/isEqual';

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
    AIRCRAFT_DEFINITION_MOCK,
    AIRCRAFT_INITIALIZATION_PROPS_MOCK
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

ava.skip('._getAircraftDefinitionForAirlineId()', (t) => {});

ava('._findDestinationFromRouteCode() returns the SID name as a destination for a departing aircraft', (t) => {
    const expectedResult = 'COWBY6';
    const collection = new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, fixCollectionFixture);
    const result = collection._findDestinationFromRouteCode(spawnPatternModelDepartureFixture);

    t.true(result === expectedResult);
});

ava('._findDestinationFromRouteCode() returns the destination name an arriving aircraft', (t) => {
    const expectedResult = 'KLAS';
    const collection = new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, fixCollectionFixture);
    const result = collection._findDestinationFromRouteCode(spawnPatternModelArrivalFixture);

    t.true(result === expectedResult);
});

ava('._calculatePostiionAndHeadingForArrival() calculates aircraft heading and position when provided list a of fixes', (t) => {
    const expedtedHeadingResult = 0.5812231343277809;
    const expectedPositionResult = [-99.76521626690608, -148.0266530993096];
    const collection = new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, fixCollectionFixture);
    // using cloneDeep here so we can set fixes for the fixture without affecting the actual fixture
    const spawnModelFixture = _cloneDeep(spawnPatternModelArrivalFixture);
    spawnModelFixture.fixes = ['DAG', 'MISEN', 'CLARR'];

    const result = collection._calculatePostiionAndHeadingForArrival(spawnModelFixture, AIRCRAFT_INITIALIZATION_PROPS_MOCK);

    t.true(result.heading === expedtedHeadingResult);
    t.true(_isEqual(result.position, expectedPositionResult));
});

ava.skip('._calculatePostiionAndHeadingForArrival() calculates aircraft heading and position when provided a route', (t) => {
    const expedtedHeadingResult = 0.5812231343277809;
    const expectedPositionResult = [-99.76521626690608, -148.0266530993096];
    const collection = new AircraftCollection(AIRCRAFT_DEFINITION_LIST_MOCK, airlineCollectionFixture, fixCollectionFixture);

    const result = collection._calculatePostiionAndHeadingForArrival(spawnPatternModelArrivalFixture, AIRCRAFT_INITIALIZATION_PROPS_MOCK);

    // console.log(result);

    // t.true(result.heading === expedtedHeadingResult);
    // t.true(_isEqual(result.position, expectedPositionResult))
});
