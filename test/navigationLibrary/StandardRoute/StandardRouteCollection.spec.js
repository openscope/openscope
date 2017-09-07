import ava from 'ava';
import sinon from 'sinon';
import _isEmpty from 'lodash/isEmpty';
import StandardRouteCollection from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/StandardRouteCollection';
import StandardRouteModel from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/StandardRouteModel';
import FixCollection from '../../../src/assets/scripts/client/navigationLibrary/Fix/FixCollection';
import { PROCEDURE_TYPE } from '../../../src/assets/scripts/client/constants/aircraftConstants';
import { airportPositionFixtureKSFO } from '../../fixtures/airportFixtures';
import { FIX_LIST_MOCK } from '../Fix/_mocks/fixMocks';
import {
    STAR_LIST_MOCK,
    SID_LIST_MOCK,
    SID_WITHOUT_EXIT_MOCK
} from './_mocks/standardRouteMocks';

const SID_ICAO_MOCK = 'SHEAD9';
const STAR_ICAO_MOCK = 'GRNPA1';
const STAR_SUFFIX_ICAO_MOCK = 'GRNPA11A';
const SID_SUFFIX_ICAO_MOCK = 'COWBY61A';
const ENTRY_FIXNAME_MOCK = 'MLF';
const RUNWAY_NAME_MOCK = '19R';

ava.before(() => FixCollection.addItems(FIX_LIST_MOCK, airportPositionFixtureKSFO));
ava.after(() => FixCollection.removeItems());

ava('does not throw when no parameters are passed', t => t.notThrows(() => new StandardRouteCollection()));

ava('exits early when no paramaters are passed', (t) => {
    const collection = new StandardRouteCollection();

    t.true(typeof collection._sids === 'undefined');
});

ava('adds a list of StandardRoutes to the collection and updates the .length property', (t) => {
    const collection = new StandardRouteCollection(SID_LIST_MOCK, PROCEDURE_TYPE.SID);

    t.true(collection._items.length === collection.length);
});

// This test is inconsistent and may need to be refactored. It passes sometimes and fails other.
ava.skip('.findRandomExitPointForSIDIcao() returns the name of a random exitPoint from within a SID route', (t) => {
    const ICAO = 'COWBY6';
    const possibleResults = ['DRK', 'GUP', 'INW'];
    const collection = new StandardRouteCollection(SID_LIST_MOCK, PROCEDURE_TYPE.SID);
    const result = collection.findRandomExitPointForSIDIcao(ICAO);

    t.true(possibleResults.indexOf(result) !== -1);
});

ava('.findRandomExitPointForSIDIcao() returns the name of this StandardRoute if no exitPoints exist', (t) => {
    const ICAO = 'TRALR6';
    const collection = new StandardRouteCollection(SID_WITHOUT_EXIT_MOCK, PROCEDURE_TYPE.SID);
    const result = collection.findRandomExitPointForSIDIcao(ICAO);

    t.true(result === ICAO);
});

ava('.findRouteWaypointsForRouteByEntryAndExit() calls _findRouteOrAddToCache()', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    const _findRouteOrAddToCacheSpy = sinon.spy(collection, '_findRouteOrAddToCache');

    collection.findRouteWaypointsForRouteByEntryAndExit(STAR_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(_findRouteOrAddToCacheSpy.calledOnce);
});

ava('.findRouteWaypointsForRouteByEntryAndExit() returns a list of `StandardRouteWaypointModel`s for a given STAR', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    const result = collection.findRouteWaypointsForRouteByEntryAndExit(STAR_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(result.length === 8);
});

ava('.findRouteWaypointsForRouteByEntryAndExit() returns early if not provided an `icao`', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    const result = collection.findRouteWaypointsForRouteByEntryAndExit(null, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(typeof result === 'undefined');
});

ava('.findRouteByIcao() returns undefined when an icao cannot be found', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    const result = collection.findRouteByIcao();

    t.true(typeof result === 'undefined');
});

ava('.findRouteByIcao() returns a RouteModel when passed an icao within the collection', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    let result = collection.findRouteByIcao(STAR_ICAO_MOCK);
    t.true(result instanceof StandardRouteModel);

    result = collection.findRouteByIcao(STAR_SUFFIX_ICAO_MOCK);
    t.true(result instanceof StandardRouteModel);
});

ava.skip('.findRouteByIcaoWithSuffix() returns null when a route cannot be found', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    const result = collection.findRouteByIcaoWithSuffix();

    t.true(result === null);
});

ava('.findRouteByIcaoWithSuffix() returns a route model when a route and suffix is found', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    const result = collection.findRouteByIcao(STAR_SUFFIX_ICAO_MOCK);

    t.true(result.icao === 'GRNPA11A');
});

ava('.getAllFixNamesInUse() returns an array of fix names used by any portion of any procedure in the collection', (t) => {
    const standardRouteCollection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    const fixNameList = standardRouteCollection.getAllFixNamesInUse();

    t.true(fixNameList.length === 45);
});

ava('.hasRoute() returns a boolean if a route exists within the collection', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);

    t.false(collection.hasRoute(SID_ICAO_MOCK));
    t.false(collection.hasRoute(''));

    t.true(collection.hasRoute(STAR_ICAO_MOCK));
    t.true(collection.hasRoute(STAR_SUFFIX_ICAO_MOCK));
});

ava('._addRouteModelToCollection() throws if it doesnt receive a SidModel', (t) => {
    const collection = new StandardRouteCollection(SID_WITHOUT_EXIT_MOCK, PROCEDURE_TYPE.SID);

    t.throws(() => collection._addRouteModelToCollection({}));
});

ava('._generateSuffixRouteModels() creates additional RouteModels for each suffix', (t) => {
    const expectedResult = ['GRNPA1', 'GRNPA11A', 'GRNPA11B', 'GRNPA12A', 'GRNPA12B', 'GRNPA13A', 'GRNPA13B', 'GRNPA14A', 'GRNPA14B', 'KEPEC3', 'SUNST3', 'TYSSN4'];
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    const result = collection._items.map(x => x.icao);

    t.deepEqual(result, expectedResult);
});

ava('._generateSuffixRouteModels() creates a RouteModel with the correct properties', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    const routeModel = collection._items[1];

    t.deepEqual(routeModel.rwy, { '01L': ['THREEVE'] });
});

ava('._findRouteOrAddToCache() does not call .findStandardRouteWaypointModelsForEntryAndExit() if routes exists in cache', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    const findStandardRouteWaypointModelsForEntryAndExitSpy = sinon.spy(collection._items[0], 'findStandardRouteWaypointModelsForEntryAndExit');

    collection._findRouteOrAddToCache(STAR_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);
    collection._findRouteOrAddToCache(STAR_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(findStandardRouteWaypointModelsForEntryAndExitSpy.calledOnce);
});

ava('._findRouteOrAddToCache() calls ._findRouteWaypointModels() if the route is not in the cache', (t) => {
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    const _findRouteWaypointModelsSpy = sinon.spy(collection, '_findRouteWaypointModels');

    collection._findRouteOrAddToCache(STAR_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(_findRouteWaypointModelsSpy.calledOnce);
});

ava('._findRouteOrAddToCache() adds a newly fetched route to #_cache', (t) => {
    const routeStringKey = `${STAR_ICAO_MOCK}.${ENTRY_FIXNAME_MOCK}.${RUNWAY_NAME_MOCK}`;
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);

    t.true(_isEmpty(collection._cache));

    collection._findRouteOrAddToCache(STAR_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(typeof collection._cache[routeStringKey] !== 'undefined');
    t.true(collection._cache[routeStringKey].length === 8);
});

ava('._findRouteWaypointModels() calls ._findAndCacheRouteWithSuffix()', (t) => {
    const routeStringKey = `${STAR_SUFFIX_ICAO_MOCK}.${ENTRY_FIXNAME_MOCK}.${RUNWAY_NAME_MOCK}`;
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    const _findAndCacheRouteWithSuffixSpy = sinon.spy(collection, '_findAndCacheRouteWithSuffix');

    collection._findRouteWaypointModels(STAR_SUFFIX_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK, false, routeStringKey);

    t.true(_findAndCacheRouteWithSuffixSpy.calledOnce);
});

ava('._findRouteWaypointModels() returns the correct RouteModel when passed an icao with a suffix for a STAR', (t) => {
    const expectedResult = ['MLF', 'KSINO', 'LUXOR', 'GRNPA', 'DUBLX', 'FRAWG', 'TRROP', 'LEMNZ', 'THREEVE'];
    const routeStringKey = `${STAR_SUFFIX_ICAO_MOCK}.${ENTRY_FIXNAME_MOCK}.${RUNWAY_NAME_MOCK}`;
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    const result = collection._findRouteWaypointModels(STAR_SUFFIX_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK, false, routeStringKey);
    const resultWaypointNameList = result.map(x => x.name);

    t.true(resultWaypointNameList.length === 9);
    t.deepEqual(resultWaypointNameList, expectedResult);
});

ava('._findRouteWaypointModels() returns the correct RouteModel when passed a mixed case icao with a suffix for a STAR', (t) => {
    const starSuffixIcaoMock = 'GrnPa11a';
    const routeStringKey = `${starSuffixIcaoMock}.${ENTRY_FIXNAME_MOCK}.${RUNWAY_NAME_MOCK}`;
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    const result = collection._findRouteWaypointModels(starSuffixIcaoMock, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK, false, routeStringKey);
    const resultWaypointNameList = result.map(x => x.name);

    t.true(resultWaypointNameList.length === 9);
    t.true(resultWaypointNameList[0] === ENTRY_FIXNAME_MOCK);
    t.true(resultWaypointNameList[8] === 'THREEVE');
});

ava('._findRouteWaypointModels() returns the correct RouteModel when passed an icao with a suffix for a SID', (t) => {
    const exitFixnameMock = 'DRK';
    const routeStringKey = `${SID_SUFFIX_ICAO_MOCK}.${ENTRY_FIXNAME_MOCK}.${RUNWAY_NAME_MOCK}`;
    const collection = new StandardRouteCollection(SID_LIST_MOCK, PROCEDURE_TYPE.SID);
    const result = collection._findRouteWaypointModels(SID_SUFFIX_ICAO_MOCK, '25L', exitFixnameMock, false, routeStringKey);
    const resultWaypointNameList = result.map(x => x.name);

    t.true(resultWaypointNameList.length === 7);
    t.true(resultWaypointNameList[0] === '_NAPSE068');
    t.true(resultWaypointNameList[6] === exitFixnameMock);
});

ava('._findRouteWaypointModels() returns the correct RouteModel when passed a mixed case icao with a suffix for a SID', (t) => {
    const exitFixnameMock = 'DRK';
    const sidSuffixIcaoMock = 'cOWbY61a';
    const routeStringKey = `${sidSuffixIcaoMock}.${ENTRY_FIXNAME_MOCK}.${RUNWAY_NAME_MOCK}`;
    const collection = new StandardRouteCollection(SID_LIST_MOCK, PROCEDURE_TYPE.SID);
    const result = collection._findRouteWaypointModels(sidSuffixIcaoMock, '25L', exitFixnameMock, false, routeStringKey);
    const resultWaypointNameList = result.map(x => x.name);

    t.true(resultWaypointNameList.length === 7);
    t.true(resultWaypointNameList[0] === '_NAPSE068');
    t.true(resultWaypointNameList[6] === exitFixnameMock);
});

ava('._findRouteWaypointModels() adds the found route to the cache with the correct cacheKey', (t) => {
    const routeStringKey = `${STAR_SUFFIX_ICAO_MOCK}.${ENTRY_FIXNAME_MOCK}.${RUNWAY_NAME_MOCK}`;
    const collection = new StandardRouteCollection(STAR_LIST_MOCK, PROCEDURE_TYPE.STAR);
    collection._findRouteWaypointModels(STAR_SUFFIX_ICAO_MOCK, ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK, false, routeStringKey);

    const cacheKeys = Object.keys(collection._cache);

    t.true(cacheKeys.indexOf('GRNPA11A.MLF.01L') !== -1);
});
