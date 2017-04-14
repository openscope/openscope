import ava from 'ava';

import RunwayCollection from '../../src/assets/scripts/client/airport/RunwayCollection';
import { airportModelFixture } from '../fixtures/airportFixtures';
import { AIRPORT_JSON_KLAS_MOCK } from './_mocks/airportJsonMock';

const RUNWAY_LIST_MOCK = AIRPORT_JSON_KLAS_MOCK.runways;

ava('throws when called with invalid parameters', (t) => {
    t.throws(() => new RunwayCollection());
    t.throws(() => new RunwayCollection({}));
    t.throws(() => new RunwayCollection(42));
    t.throws(() => new RunwayCollection('threeve'));
    t.throws(() => new RunwayCollection(false));
    t.throws(() => new RunwayCollection(null));
});

ava('does not throw when called with valid parameters', (t) => {
    t.notThrows(() => new RunwayCollection(RUNWAY_LIST_MOCK, airportModelFixture));
});

ava('sets #_items when instantiated', (t) => {
    const collection = new RunwayCollection(RUNWAY_LIST_MOCK, airportModelFixture);

    t.true(collection.length === 8);
});

ava.skip('.findRunwayModelByName() returns a RunwayModel when passed a runway name', (t) => {
    const collection = new RunwayCollection(RUNWAY_LIST_MOCK, airportModelFixture);
    const result = collection.findRunwayModelByName('07l');

    console.log(result);
});

ava('_buildRunwayMetaData() builds an object with a key for each runway name', (t) => {
    const expectedResult = ['07L', '25R', '07R', '25L', '01R', '19L', '01L', '19R'];
    const collection = new RunwayCollection(RUNWAY_LIST_MOCK, airportModelFixture);
    collection._runwayRelationships = {};

    collection._buildRunwayMetaData();

    const result = Object.keys(collection._runwayRelationships);

    t.deepEqual(result, expectedResult);
});
