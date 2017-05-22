import ava from 'ava';
import sinon from 'sinon';
import _isEmpty from 'lodash/isEmpty';

import StandardRouteCollection from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/StandardRouteCollection';
import FixCollection from '../../../src/assets/scripts/client/navigationLibrary/Fix/FixCollection';

import { airportPositionFixtureKSFO } from '../../fixtures/airportFixtures';
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

ava.before(() => FixCollection.addItems(FIX_LIST_MOCK, airportPositionFixtureKSFO));
ava.after(() => FixCollection.removeItems());

ava('does not throw when no parameters are passed', t => t.notThrows(() => new StandardRouteCollection()));

ava('exits early when no paramaters are passed', (t) => {
    const collection = new StandardRouteCollection();

    t.true(typeof collection._sids === 'undefined');
});

ava('adds a list of StandardRoutes to the collection and updates the .length property', (t) => {
    const collection = new StandardRouteCollection(SID_LIST_MOCK);

    t.true(collection._items.length === collection.length);
});

// This test is inconsistent and may need to be refactored. It passes sometimes and fails other.
ava('.findRandomExitPointForSIDIcao() returns the name of a random exitPoint from within a SID route', (t) => {
    const ICAO = 'COWBY6';
    const possibleResults = ['DRK', 'GUP', 'INW'];
    const collection = new StandardRouteCollection(SID_LIST_MOCK);
    const result = collection.findRandomExitPointForSIDIcao(ICAO);

    t.true(possibleResults.indexOf(result) !== -1);
});

ava('.findRandomExitPointForSIDIcao() returns the name of this StandardRoute if no exitPoints exist', (t) => {
    const ICAO = 'TRALR6';
    const collection = new StandardRouteCollection(SID_WITHOUT_EXIT_MOCK);
    const result = collection.findRandomExitPointForSIDIcao(ICAO);

    t.true(result === ICAO);
});

ava('.findRouteWaypointsForRouteByEntryAndExit() calls _findOrAddRouteToCache()', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK);
    const _findOrAddRouteToCacheSpy = sinon.spy(collection, '_findOrAddRouteToCache');

    collection.findRouteWaypointsForRouteByEntryAndExit(STAR_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(_findOrAddRouteToCacheSpy.calledOnce);
});

ava('.findRouteWaypointsForRouteByEntryAndExit() returns a list of `StandardRouteWaypointModel`s for a given STAR', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK);
    const result = collection.findRouteWaypointsForRouteByEntryAndExit(STAR_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(result.length === 8);
});

ava('.findRouteWaypointsForRouteByEntryAndExit() returns early if not provided an `icao`', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK);
    const result = collection.findRouteWaypointsForRouteByEntryAndExit(null, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(typeof result === 'undefined');
});

ava('.hasRoute() returns a boolean if a route exists within the collection', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK);

    t.true(collection.hasRoute(STAR_ICAO_MOCK));
    t.false(collection.hasRoute(SID_ICAO_MOCK));
    t.false(collection.hasRoute(''));
});

ava('._addRouteModelToCollection() throws if it doesnt receive a SidModel', (t) => {
    const collection = new StandardRouteCollection(SID_WITHOUT_EXIT_MOCK);

    t.throws(() => collection._addRouteModelToCollection({}));
});

ava('._findOrAddRouteToCache() adds a newly fetched route to #_cache', (t) => {
    const routeStringKey = `${STAR_ICAO_MOCK}.${ENTRY_FIXNAME_MOCK}.${RUNWAY_NAME_MOCK}`;
    const collection = new StandardRouteCollection(STAR_LIST_MOCK);

    t.true(_isEmpty(collection._cache));

    collection._findOrAddRouteToCache(STAR_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(typeof collection._cache[routeStringKey] !== 'undefined');
    t.true(collection._cache[routeStringKey].length === 8);
});


ava('._findOrAddRouteToCache() does not call .findStandardRouteWaypointModelsForEntryAndExit() if routes exists in cache', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK);
    const findStandardRouteWaypointModelsForEntryAndExitSpy = sinon.spy(collection._items[0], 'findStandardRouteWaypointModelsForEntryAndExit');

    collection._findOrAddRouteToCache(STAR_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);
    collection._findOrAddRouteToCache(STAR_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(findStandardRouteWaypointModelsForEntryAndExitSpy.calledOnce);
});
