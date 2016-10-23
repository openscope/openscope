/* eslint-disable arrow-parens, import/no-extraneous-dependencies*/
import ava from 'ava';

import StandardRouteCollection from '../../../src/assets/scripts/airport/StandardRoute/StandardRouteCollection';
import FixCollection from '../../../src/assets/scripts/airport/Fix/FixCollection';

import { airportPositionFixture } from '../../fixtures/airportFixtures';
import { FIX_LIST_MOCK } from '../Fix/_mocks/fixMocks';

import {
    STAR_LIST_MOCK,
    SID_LIST_MOCK,
    SID_WITHOUT_EXIT_MOCK
} from './_mocks/standardRouteMocks';

const SID_ICAO_MOCK = 'SHEAD9';
const STAR_ICAO_MOCK = 'GRNPA1';
const ENTRY_FIXNAME_MOCK = 'MLF';
const EXIT_FIXNAME_MOCK = 'KENNO';
const RUNWAY_NAME_MOCK = '19R';

ava.before(() => FixCollection.init(FIX_LIST_MOCK, airportPositionFixture));
ava.after(() => FixCollection.destroy());

ava('does not throw when no parameters are passed', t => t.notThrows(() => new StandardRouteCollection()));

ava('exits early when no paramaters are passed', t => {
    const collection = new StandardRouteCollection();

    t.true(typeof collection._sids === 'undefined');
});

ava('adds a list of StandardRoutes to the collection and updates the .length property', t => {
    const collection = new StandardRouteCollection(SID_LIST_MOCK);

    t.true(collection._items.length === collection.length);
});

ava('.findFixesForSidByRunwayAndExit() returns a list of fixes that make up a StandardRoutes when given an id, exit and runway paramater', t => {
    const collection = new StandardRouteCollection(SID_LIST_MOCK);
    const result = collection.findFixesForSidByRunwayAndExit(SID_ICAO_MOCK, EXIT_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(result.length === 8);
});

ava('.findFixesForSidByRunwayAndExit() returns early when not provided an icao parameter', t => {
    const collection = new StandardRouteCollection(SID_LIST_MOCK);
    const result = collection.findFixesForSidByRunwayAndExit(null, EXIT_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(typeof result === 'undefined');
});

ava('.findFixesForStarByEntryAndRunway() returns a list of fixes that make up a StandardRoutes when given an icao, entry and runway paramater', t => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK);
    const result = collection.findFixesForStarByEntryAndRunway(STAR_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(result.length === 8);
});

ava('.findFixesForStarByEntryAndRunway() returns early when not provided an icao parameter', t => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK);
    const result = collection.findFixesForStarByEntryAndRunway(null, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(typeof result === 'undefined');
});

// This test is inconsistent and may need to be refactored. It passes sometimes and fails other.
ava('.findRandomExitPointForSIDIcao() returns the name of a random exitPoint from within a SID route', t => {
    const ICAO = 'COWBY6';
    const possibleResults = ['DRK', 'GUP', 'INW'];
    const collection = new StandardRouteCollection(SID_LIST_MOCK);
    const result = collection.findRandomExitPointForSIDIcao(ICAO);

    t.true(possibleResults.indexOf(result) !== -1);
});

ava('.findRandomExitPointForSIDIcao() returns the name of this StandardRoute if no exitPoints exist', t => {
    const ICAO = 'TRALR6';
    const collection = new StandardRouteCollection(SID_WITHOUT_EXIT_MOCK);
    const result = collection.findRandomExitPointForSIDIcao(ICAO);

    t.true(result === ICAO);
});

ava('.findFixModelsForRouteByEntryAndExit() returns a list of `StandardRouteWaypointModel`s for a given STAR', t => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK);
    const result = collection.findFixModelsForRouteByEntryAndExit(STAR_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    // console.log('findFixModelsForRouteByEntryAndExit ::: ', result);

    t.true(result.length === 8);
});

ava('._addSidToCollection() throws if it doesnt receive a SidModel', t => {
    const collection = new StandardRouteCollection(SID_WITHOUT_EXIT_MOCK);

    t.throws(() => collection._addSidToCollection({}));
});
