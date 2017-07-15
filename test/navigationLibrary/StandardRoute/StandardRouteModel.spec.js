import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';
import _keys from 'lodash/keys';
import _map from 'lodash/map';
import _uniq from 'lodash/uniq';

import StandardRouteModel from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/StandardRouteModel';
import RouteSegmentCollection from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/RouteSegmentCollection';
import RouteSegmentModel from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/RouteSegmentModel';
import StandardRouteWaypointModel from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/StandardRouteWaypointModel';

import FixCollection from '../../../src/assets/scripts/client/navigationLibrary/Fix/FixCollection';
import { airportPositionFixtureKSFO } from '../../fixtures/airportFixtures';
import { FIX_LIST_MOCK } from '../Fix/_mocks/fixMocks';

import {
    STAR_LIST_MOCK,
    STAR_WITH_ONLY_VECTORS,
    STAR_WITHOUT_RWY,
    SID_LIST_MOCK,
    SID_WITHOUT_BODY_MOCK,
    SID_WITHOUT_EXIT_MOCK
} from './_mocks/standardRouteMocks';

const SID_MOCK = SID_LIST_MOCK.SHEAD9;
const STAR_MOCK = STAR_LIST_MOCK.TYSSN4;
const SID_WITH_SUFFIX = SID_LIST_MOCK.COWBY6;
const STAR_WITH_SUFFIX = STAR_LIST_MOCK.GRNPA1;
const SUFFIX_MOCK = '01L';
const RUNWAY_NAME_MOCK = '25L';
const ENTRY_FIXNAME_MOCK = 'DRK';

ava.before(() => FixCollection.addItems(FIX_LIST_MOCK, airportPositionFixtureKSFO));
ava.after(() => FixCollection.removeItems());

ava('throws when instantiated with invaild parameters', t => {
    t.throws(() => new StandardRouteModel());
    t.throws(() => new StandardRouteModel([]));
});

ava('does not throw when instantiated with vaild parameters', t => {
    t.notThrows(() => new StandardRouteModel(STAR_MOCK));
    t.notThrows(() => new StandardRouteModel(SID_MOCK));
    t.notThrows(() => new StandardRouteModel(SID_WITHOUT_BODY_MOCK));
    t.notThrows(() => new StandardRouteModel(STAR_WITHOUT_RWY));
});

ava('sets collections correctly', (t) => {
    const result = new StandardRouteModel(SID_MOCK);

    t.true(result._entryCollection instanceof RouteSegmentCollection);
    t.true(result._bodySegmentModel instanceof RouteSegmentModel);
    t.true(result._exitCollection instanceof RouteSegmentCollection);
});

ava('does not set #_suffixKey when instantiated without a suffixKey argument', (t) => {
    const model = new StandardRouteModel(SID_WITH_SUFFIX);

    t.true(model._suffixKey === '');
});

ava('sets #_suffixKey when instantiated with a suffixKey argument', (t) => {
    const model = new StandardRouteModel(SID_WITH_SUFFIX, SUFFIX_MOCK);

    t.true(model._suffixKey === SUFFIX_MOCK);
});

ava('trims the #rwy object to a single rwy key when instantiated with a suffixKey argument', (t) => {
    let model = new StandardRouteModel(SID_WITH_SUFFIX, SUFFIX_MOCK);
    let rwyKeys = Object.keys(model.rwy);

    t.true(rwyKeys.length === 1);
    t.true(rwyKeys[0] === SUFFIX_MOCK);

    model = new StandardRouteModel(STAR_WITH_SUFFIX, SUFFIX_MOCK);
    rwyKeys = Object.keys(model.rwy);

    t.true(rwyKeys.length === 1);
    t.true(rwyKeys[0] === SUFFIX_MOCK);
});

ava.todo('sets the appropriate collection with the correct number of keys when instantiated with a suffix route');

ava('.findStandardRouteWaypointModelsForEntryAndExit() returns a list of `StandardRouteWaypointModel`s for a given STAR', t => {
    const expectedArguments = ['MLF', '19R'];
    const model = new StandardRouteModel(STAR_LIST_MOCK.GRNPA1);
    const spy = sinon.spy(model, '_findStandardWaypointModelsForRoute');

    const result = model.findStandardRouteWaypointModelsForEntryAndExit('MLF', '19R');
    const actualArguments = spy.getCall(0).args;

    t.true(_isEqual(actualArguments, expectedArguments));
    t.true(result.length === 8);
    t.true(result[0] instanceof StandardRouteWaypointModel);
    t.true(result[0].position !== null);
});

ava('.findStandardRouteWaypointModelsForEntryAndExit() does call ._updateWaypointsWithPreviousWaypointData() if isPreSpawn is true', t => {
    const model = new StandardRouteModel(STAR_LIST_MOCK.GRNPA1);
    const spy = sinon.spy(model, '_updateWaypointsWithPreviousWaypointData');
    const isPreSpawn = true;

    model.findStandardRouteWaypointModelsForEntryAndExit('MLF', '19R', isPreSpawn);

    t.true(spy.callCount === 1);
});

ava('.findStandardRouteWaypointModelsForEntryAndExit() does not call ._updateWaypointsWithPreviousWaypointData() if isPreSpawn is false', t => {
    const model = new StandardRouteModel(STAR_LIST_MOCK.GRNPA1);
    const spy = sinon.spy(model, '_updateWaypointsWithPreviousWaypointData');
    const isPreSpawn = false;

    model.findStandardRouteWaypointModelsForEntryAndExit('MLF', '19R', isPreSpawn);

    t.true(spy.callCount === 0);
});

ava('.calculateDistanceBetweenWaypoints() calculates the distance between two `StandardRouteWaypointModel` positions', t => {
    const expectedResult = 118.63498218153818;
    const model = new StandardRouteModel(STAR_LIST_MOCK.GRNPA1);
    const waypointList = model.findStandardRouteWaypointModelsForEntryAndExit('MLF', '19R');
    const result = model.calculateDistanceBetweenWaypoints(waypointList[0].relativePosition, waypointList[1].relativePosition);

    t.true(result === expectedResult);
});

ava('.gatherExitPointNames() retuns a list of the exitPoint fix names', t => {
    const expectedResult = ['KENNO', 'OAL'];
    const model = new StandardRouteModel(SID_MOCK);
    const result = model.gatherExitPointNames();

    t.true(_isEqual(result, expectedResult));
});

ava('.getAllFixNames() returns an array of fix names used by any portion of the procedure', (t) => {
    const standardRouteModel = new StandardRouteModel(STAR_LIST_MOCK.GRNPA1);
    const result = _uniq(standardRouteModel.getAllFixNames().sort());
    const expectedResult = ['BCE', 'BETHL', 'DUBLX', 'DVC', 'FRAWG', 'GRNPA', 'HOLDM', 'KSINO', 'LEMNZ', 'LUXOR', 'MLF', 'THREEVE', 'TRROP'];

    t.true(_isEqual(result, expectedResult));
});

ava('.getSuffixSegmentName() returns the name of the segment a suffix is applied to', (t) => {
    let model = new StandardRouteModel(STAR_WITH_SUFFIX, SUFFIX_MOCK);
    let result = model.getSuffixSegmentName('STAR');

    t.true(result === '01L');

    model = new StandardRouteModel(SID_WITH_SUFFIX, SUFFIX_MOCK);
    result = model.getSuffixSegmentName('SID');

    t.true(result === '01L');
});

ava('.hasExitPoints() returns a boolean', t => {
    let model;

    model = new StandardRouteModel(SID_MOCK);
    t.true(model.hasExitPoints());

    model = new StandardRouteModel(SID_WITHOUT_EXIT_MOCK.TRALR6);
    t.false(model.hasExitPoints());
});

ava('.hasSuffix() returns true only when it represents a suffix StandardRouteModel', (t) => {
    let model = new StandardRouteModel(STAR_MOCK);
    t.false(model.hasSuffix());

    model = new StandardRouteModel(STAR_WITH_SUFFIX, SUFFIX_MOCK);
    t.true(model.hasSuffix());
});

ava('._buildSegmentCollection() returns null if segment is undefined', t => {
    const model = new StandardRouteModel(STAR_MOCK);
    const result = model._buildSegmentCollection();

    t.true(result === null);
});

ava('._buildSegmentCollection() returns null if segment is an empty object', t => {
    const model = new StandardRouteModel(STAR_MOCK);
    const result = model._buildSegmentCollection({});

    t.true(result === null);
});

ava('._buildEntryAndExitCollections() maps rwy fixes to _exitCollection when entryPoints is present', t => {
    const model = new StandardRouteModel(STAR_MOCK);
    model._buildEntryAndExitCollections(STAR_MOCK);

    const segmentModelNames = _map(model._exitCollection._items, (segmentModel) => segmentModel.name);

    t.true(_isEqual(segmentModelNames, _keys(STAR_MOCK.rwy)));
});

ava('._buildEntryAndExitCollections() maps rwy fixes to _entryCollection when exitPoints is present', t => {
    const model = new StandardRouteModel(SID_MOCK);
    model._buildEntryAndExitCollections(SID_MOCK);

    const segmentModelNames = _map(model._entryCollection._items, (segmentModel) => segmentModel.name);

    t.true(_isEqual(segmentModelNames, _keys(SID_MOCK.rwy)));
});

ava('._buildEntryAndExitCollections() maps rwy fixes to _entryCollection when exitPoints is not present and rwy is present', t => {
    const model = new StandardRouteModel(SID_WITHOUT_EXIT_MOCK.TRALR6);
    model._buildEntryAndExitCollections(SID_WITHOUT_EXIT_MOCK.TRALR6);

    const segmentModelNames = _map(model._entryCollection._items, (segmentModel) => segmentModel.name);

    t.true(_isEqual(segmentModelNames, _keys(SID_WITHOUT_EXIT_MOCK.TRALR6.rwy)));
});

ava.skip('._findStandardWaypointModelsForRoute() throws if entry does not exist within the collection', t => {
    const model = new StandardRouteModel(STAR_MOCK);

    t.throws(() => model._findStandardWaypointModelsForRoute('threeve', '25R'));
});

ava.skip('._findStandardWaypointModelsForRoute() throws if exit does not exist within the collection', t => {
    const model = new StandardRouteModel(STAR_MOCK);

    t.throws(() => model._findStandardWaypointModelsForRoute('DRK', 'threeve'));
});

ava('._findStandardWaypointModelsForRoute() returns a list of StandardRouteWaypointModels when _entryCollection and _exitCollection exist', t => {
    const model = new StandardRouteModel(STAR_MOCK);
    const result = model._findStandardWaypointModelsForRoute(ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);

    t.true(result.length === 7);
});

ava('._findStandardWaypointModelsForRoute() returns a list of StandardRouteWaypointModels when _bodySegmentModel does not exist', t => {
    const model = new StandardRouteModel(SID_WITHOUT_BODY_MOCK);
    const result = model._findStandardWaypointModelsForRoute(RUNWAY_NAME_MOCK, 'MLF');

    t.true(result.length === 6);
});

ava('._findStandardWaypointModelsForRoute() returns a list of StandardRouteWaypointModels when _exitCollection does not exist', t => {
    const model = new StandardRouteModel(STAR_WITHOUT_RWY);
    const result = model._findStandardWaypointModelsForRoute('BETHL', '');

    t.true(result.length === 9);
});

ava('._updateWaypointsWithPreviousWaypointData() calls calculateDistanceBetweenWaypoints() if none are vector waypoints', (t) => {
    const model = new StandardRouteModel(STAR_LIST_MOCK.GRNPA1);
    const spy = sinon.spy(model, 'calculateDistanceBetweenWaypoints');
    const isPreSpawn = true;

    model.findStandardRouteWaypointModelsForEntryAndExit('MLF', '19R', isPreSpawn);

    t.true(spy.called);
});

ava('._updateWaypointsWithPreviousWaypointData() does not call calculateDistanceBetweenWaypoints() if any are vector waypoints', (t) => {
    const modelWithVectors = new StandardRouteModel(STAR_WITH_ONLY_VECTORS);
    const spyForModelWithVectors = sinon.spy(modelWithVectors, 'calculateDistanceBetweenWaypoints');
    const isPreSpawn = true;

    modelWithVectors.findStandardRouteWaypointModelsForEntryAndExit('MLF', '19R', isPreSpawn);

    t.true(spyForModelWithVectors.notCalled);
});
