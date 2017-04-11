/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import _isEqual from 'lodash/isEqual';
import _keys from 'lodash/keys';
import _map from 'lodash/map';

import StandardRouteModel from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/StandardRouteModel';
import RouteSegmentCollection from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/RouteSegmentCollection';
import RouteSegmentModel from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/RouteSegmentModel';
import StandardRouteWaypointModel from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/StandardRouteWaypointModel';

import FixCollection from '../../../src/assets/scripts/client/navigationLibrary/Fix/FixCollection';
import { airportPositionFixtureKSFO } from '../../fixtures/airportFixtures';
import { FIX_LIST_MOCK } from '../Fix/_mocks/fixMocks';

import {
    STAR_LIST_MOCK,
    SID_LIST_MOCK,
    SID_WITHOUT_BODY_MOCK,
    SID_WITHOUT_EXIT_MOCK,
    STAR_WITHOUT_RWY
} from './_mocks/standardRouteMocks';

const SID_MOCK = SID_LIST_MOCK.SHEAD9;
const STAR_MOCK = STAR_LIST_MOCK.TYSSN4;
const RUNWAY_NAME_MOCK = '25L';
const EXIT_FIXNAME_MOCK = 'KENNO';
const ENTRY_FIXNAME_MOCK = 'DRK';

ava.before(() => FixCollection.addItems(FIX_LIST_MOCK, airportPositionFixtureKSFO));
ava.after(() => FixCollection.removeItems());

ava('throws when instantiated with invaild parameters', t => {
    t.throws(() => new StandardRouteModel());
    t.throws(() => new StandardRouteModel([]));
});

ava('does not throw when instantiated with vaild parameters', t => {
    const result = new StandardRouteModel(SID_MOCK);

    t.notThrows(() => new StandardRouteModel(STAR_MOCK));
    t.notThrows(() => new StandardRouteModel(SID_MOCK));
    t.notThrows(() => new StandardRouteModel(SID_WITHOUT_BODY_MOCK));
    t.notThrows(() => new StandardRouteModel(STAR_WITHOUT_RWY));
    t.true(result.name === SID_MOCK.name);
    t.true(result.icao === SID_MOCK.icao);
    t.true(result._entryCollection instanceof RouteSegmentCollection);
    t.true(result._bodySegmentModel instanceof RouteSegmentModel);
    t.true(result._exitCollection instanceof RouteSegmentCollection);
});

ava('.findFixesAndRestrictionsForRunwayAndExit() returns an array of fixes for a given route', t => {
    const expectedResult = [
        ['PIRMD', null],
        ['ROPPR', 'A70'],
        ['MDDOG', 'A90'],
        ['TARRK', 'A110'],
        ['SHEAD', 'A140+'],
        ['DBIGE', 'A210+'],
        ['BIKKR', 'A210+'],
        ['KENNO', null]
    ];
    const expectedArguments = [RUNWAY_NAME_MOCK, EXIT_FIXNAME_MOCK];
    const model = new StandardRouteModel(SID_MOCK);
    const spy = sinon.spy(model, '_findFixListForSidByRunwayAndExit');

    const result = model.findFixesAndRestrictionsForRunwayAndExit(RUNWAY_NAME_MOCK, EXIT_FIXNAME_MOCK);
    const actualArguments = spy.getCall(0).args;

    t.true(_isEqual(result, expectedResult));
    t.true(_isEqual(actualArguments, expectedArguments));
});

ava('.findFixesAndRestrictionsForRunwayAndExit() returns body segment fixes when no runwayName or exitFixName is passed', t => {
    const expectedResult = [['SHEAD', 'A140+']];
    const expectedArguments = ['', ''];
    const model = new StandardRouteModel(SID_MOCK);
    const spy = sinon.spy(model, '_findFixListForSidByRunwayAndExit');

    const result = model.findFixesAndRestrictionsForRunwayAndExit('', '');
    const actualArguments = spy.getCall(0).args;

    t.true(_isEqual(result, expectedResult));
    t.true(_isEqual(actualArguments, expectedArguments));
});

ava('.findFixesAndRestrictionsForRunwayAndExit() returns body and exitPoint segment fixes when no runwayName is passed', t => {
    const expectedResult = [
        ['SHEAD', 'A140+'],
        ['DBIGE', 'A210+'],
        ['BIKKR', 'A210+'],
        ['KENNO', null]
    ];
    const expectedArguments = ['', EXIT_FIXNAME_MOCK];
    const model = new StandardRouteModel(SID_MOCK);
    const spy = sinon.spy(model, '_findFixListForSidByRunwayAndExit');

    const result = model.findFixesAndRestrictionsForRunwayAndExit('', EXIT_FIXNAME_MOCK);
    const actualArguments = spy.getCall(0).args;

    t.true(_isEqual(result, expectedResult));
    t.true(_isEqual(actualArguments, expectedArguments));
});

ava('.findFixesAndRestrictionsForRunwayAndExit() returns rwy and exitPoint fixes when no body fixes exist', t => {
    const expectedResult = [
        ['PIRMD', null],
        ['ROPPR', 'A70'],
        ['CEASR', 'A80+'],
        ['FORGE', null],
        ['WILLW', 'A140+'],
        ['MLF', null]
    ];
    const model = new StandardRouteModel(SID_WITHOUT_BODY_MOCK);
    const result = model.findFixesAndRestrictionsForRunwayAndExit(RUNWAY_NAME_MOCK, 'MLF');

    t.true(_isEqual(result, expectedResult));
});

ava('.findFixesAndRestrictionsForEntryAndRunway() returns fixes for a given arrival route', t => {
    const expectedResult = [
        ['DRK', null],
        ['IGM', 'A240'],
        ['ZATES', 'A190'],
        ['KADDY', 'A120|S250'],
        ['TYSSN', null],
        ['SUZSI', 'A100|S210'],
        ['PRINO', 'A80']
    ];
    const expectedArguments = [ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK];
    const model = new StandardRouteModel(STAR_MOCK);
    const spy = sinon.spy(model, '_findFixListForStarByEntryAndRunway');

    const result = model.findFixesAndRestrictionsForEntryAndRunway(ENTRY_FIXNAME_MOCK, RUNWAY_NAME_MOCK);
    const actualArguments = spy.getCall(0).args;

    t.true(_isEqual(result, expectedResult));
    t.true(_isEqual(actualArguments, expectedArguments));
});

ava('.findStandardWaypointModelsForEntryAndExit() returns a list of `StandardRouteWaypointModel`s for a given STAR', t => {
    const expectedArguments = ['MLF', '19R'];
    const model = new StandardRouteModel(STAR_LIST_MOCK.GRNPA1);
    const spy = sinon.spy(model, '_findStandardWaypointModelsForRoute');

    const result = model.findStandardWaypointModelsForEntryAndExit('MLF', '19R');
    const actualArguments = spy.getCall(0).args;

    t.true(_isEqual(actualArguments, expectedArguments));
    t.true(result.length === 8);
    t.true(result[0] instanceof StandardRouteWaypointModel);
    t.true(result[0].position !== null);
});

ava('.findStandardWaypointModelsForEntryAndExit() does call ._updateWaypointsWithPreviousWaypointData() if isPreSpawn is true', t => {
    const model = new StandardRouteModel(STAR_LIST_MOCK.GRNPA1);
    const spy = sinon.spy(model, '_updateWaypointsWithPreviousWaypointData');
    const isPreSpawn = true;

    model.findStandardWaypointModelsForEntryAndExit('MLF', '19R', isPreSpawn);

    t.true(spy.callCount === 1);
});

ava('.findStandardWaypointModelsForEntryAndExit() does not call ._updateWaypointsWithPreviousWaypointData() if isPreSpawn is false', t => {
    const model = new StandardRouteModel(STAR_LIST_MOCK.GRNPA1);
    const spy = sinon.spy(model, '_updateWaypointsWithPreviousWaypointData');
    const isPreSpawn = false;

    model.findStandardWaypointModelsForEntryAndExit('MLF', '19R', isPreSpawn);

    t.true(spy.callCount === 0);
});

ava('.calculateDistanceBetweenWaypoints() calculates the distance between two `StandardRouteWaypointModel` positions', t => {
    const expectedResult = 118.63498218153832;
    const model = new StandardRouteModel(STAR_LIST_MOCK.GRNPA1);
    const waypointList = model.findStandardWaypointModelsForEntryAndExit('MLF', '19R');
    const result = model.calculateDistanceBetweenWaypoints(waypointList[0].position, waypointList[1].position);

    t.true(result === expectedResult);
});

ava('.gatherExitPointNames() retuns a list of the exitPoint fix names', t => {
    const expectedResult = ['KENNO', 'OAL'];
    const model = new StandardRouteModel(SID_MOCK);
    const result = model.gatherExitPointNames();

    t.true(_isEqual(result, expectedResult));
});

ava('.gatherExitPointNames() retuns an empty array if no exitPoints exist or the collection is undefined', t => {
    const model = new StandardRouteModel(SID_WITHOUT_EXIT_MOCK.TRALR6);
    const result = model.gatherExitPointNames();

    t.true(_isArray(result));
    t.true(result.length === 0);
});

ava('.hasExitPoints() returns a boolean', t => {
    let model;

    model = new StandardRouteModel(SID_MOCK);
    t.true(model.hasExitPoints());

    model = new StandardRouteModel(SID_WITHOUT_EXIT_MOCK.TRALR6);
    t.false(model.hasExitPoints());
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

ava('._findBodyFixList() returns an empty array when ._bodySegmentModel is undefined', t => {
    const model = new StandardRouteModel(SID_WITHOUT_BODY_MOCK);

    t.notThrows(() => model._findBodyFixList());

    const result = model._findBodyFixList();

    t.true(_isArray(result));
    t.true(result.length === 0);
});

ava('._findStandardWaypointModelsForRoute() throws if entry does not exist within the collection', t => {
    const model = new StandardRouteModel(STAR_MOCK);

    t.throws(() => model._findStandardWaypointModelsForRoute('threeve', '25R'));
});

ava('._findStandardWaypointModelsForRoute() throws if exit does not exist within the collection', t => {
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

ava('._findFixListByCollectionAndSegmentName() returns an array of normalized fixes from the _entryCollection', t => {
    const expectedResult = [
        ['DRK', null],
        ['IGM', 'A240'],
        ['ZATES', 'A190']
    ];
    const model = new StandardRouteModel(STAR_MOCK);

    t.notThrows(() => model._findFixListByCollectionAndSegmentName('entryPoints', '_entryCollection', ENTRY_FIXNAME_MOCK));

    const result = model._findFixListByCollectionAndSegmentName('entryPoints', '_entryCollection', ENTRY_FIXNAME_MOCK);

    t.true(_isEqual(result, expectedResult));
});

ava('._findFixListByCollectionAndSegmentName() returns an array of normalized fixes from the _exitCollection', t => {
    const expectedResult = [
        ['DBIGE', 'A210+'],
        ['BIKKR', 'A210+'],
        ['KENNO', null]
    ];
    const model = new StandardRouteModel(SID_MOCK);

    t.notThrows(() => model._findFixListByCollectionAndSegmentName('rwy', '_exitCollection', EXIT_FIXNAME_MOCK));

    const result = model._findFixListByCollectionAndSegmentName('rwy', '_exitCollection', EXIT_FIXNAME_MOCK);

    t.true(_isEqual(result, expectedResult));
});
