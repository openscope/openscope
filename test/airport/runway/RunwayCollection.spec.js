import ava from 'ava';

import RunwayCollection from '../../../src/assets/scripts/client/airport/runway/RunwayCollection';
import RunwayModel from '../../../src/assets/scripts/client/airport/runway/RunwayModel';
import RunwayRelationshipModel from '../../../src/assets/scripts/client/airport/runway/RunwayRelationshipModel';
import {
    airportModelFixture,
    airportPositionFixtureKLAS
} from '../../fixtures/airportFixtures';
import { AIRPORT_JSON_KLAS_MOCK } from '../_mocks/airportJsonMock';

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
    t.notThrows(() => new RunwayCollection(RUNWAY_LIST_MOCK, airportPositionFixtureKLAS));
});

ava('sets #_items when instantiated', (t) => {
    const collection = new RunwayCollection(RUNWAY_LIST_MOCK, airportPositionFixtureKLAS);

    t.true(collection.length === 8);
});

ava('provides #runways getter that returns the contents of #_items', (t) => {
    const collection = new RunwayCollection(RUNWAY_LIST_MOCK, airportPositionFixtureKLAS);

    t.true(collection.runways.length === 8);
    t.true(collection.runways[0] instanceof RunwayModel);
});

ava('.findRunwayModelByName() returns null when passed an invalid runway name', (t) => {
    const collection = new RunwayCollection(RUNWAY_LIST_MOCK, airportPositionFixtureKLAS);
    const result = collection.findRunwayModelByName();

    t.true(!result);
});

ava('.findRunwayModelByName() returns a RunwayModel when passed a valid runway name', (t) => {
    const runwayNameMock = '07L';
    const collection = new RunwayCollection(RUNWAY_LIST_MOCK, airportPositionFixtureKLAS);
    const result = collection.findRunwayModelByName(runwayNameMock);

    t.true(result instanceof RunwayModel);
    t.true(result.name === runwayNameMock);
});

ava('.getRunwayRelationshipForRunwayNames() returns a RunwayRelationshipModel given two runwayName strings', (t) => {
    const collection = new RunwayCollection(RUNWAY_LIST_MOCK, airportPositionFixtureKLAS);
    const result = collection.getRunwayRelationshipForRunwayNames('07l', '07r');

    t.true(result instanceof RunwayRelationshipModel);
});

ava('.areRunwaysParallel() returns true given two runwayName strings for parallel runways', (t) => {
    const collection = new RunwayCollection(RUNWAY_LIST_MOCK, airportPositionFixtureKLAS);

    t.true(collection.areRunwaysParallel('07l', '07r'));
});

ava('.areRunwaysParallel() returns false given two runwayName strings for non-parallel runways', (t) => {
    const collection = new RunwayCollection(RUNWAY_LIST_MOCK, airportPositionFixtureKLAS);

    t.false(collection.areRunwaysParallel('07l', '19l'));
});

ava.skip('.findBestRunwayForWind()', (t) => {
    const getWindMock = () => ({
        speed: 6,
        angle: 3.839724354387525
    });
    const collection = new RunwayCollection(RUNWAY_LIST_MOCK, airportPositionFixtureKLAS);
    const result = collection.findBestRunwayForWind(getWindMock);

    // TODO: this result varies and should be investigated as to why
    t.true(result === '25L');
});

ava.todo('.removeAircraftFromAllRunwayQueues()');

ava('_buildRunwayRelationships() builds an object with a key for each runway name', (t) => {
    const expectedResult = ['07L', '25R', '07R', '25L', '01R', '19L', '01L', '19R'];
    const collection = new RunwayCollection(RUNWAY_LIST_MOCK, airportPositionFixtureKLAS);
    collection._runwayRelationships = {};

    collection._buildRunwayRelationships();

    const result = Object.keys(collection._runwayRelationships);

    t.deepEqual(result, expectedResult);
});
