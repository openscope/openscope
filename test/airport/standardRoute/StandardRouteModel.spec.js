/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import _isEqual from 'lodash/isEqual';

import StandardRouteModel from '../../../src/assets/scripts/airport/StandardRoute/StandardRouteModel';
import RouteSegmentCollection from '../../../src/assets/scripts/airport/StandardRoute/RouteSegmentCollection';
import RouteSegmentModel from '../../../src/assets/scripts/airport/StandardRoute/RouteSegmentModel';
import StandardRouteWaypointModel from '../../../src/assets/scripts/airport/StandardRoute/StandardRouteWaypointModel';

import FixCollection from '../../../src/assets/scripts/airport/Fix/FixCollection';
import { airportPositionFixture } from '../../fixtures/airportFixtures';
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

ava.before(() => FixCollection.init(FIX_LIST_MOCK, airportPositionFixture));
ava.after(() => FixCollection.destroy());

ava('throws when instantiated with invaild parameters', t => {
    t.throws(() => new StandardRouteModel());
    t.throws(() => new StandardRouteModel([]));
    t.throws(() => new StandardRouteModel(''));
    t.throws(() => new StandardRouteModel(42));
    t.throws(() => new StandardRouteModel(false));
});

ava('does not throw when instantiated with vaild parameters', t => {
    const result = new StandardRouteModel(SID_MOCK);

    t.notThrows(() => new StandardRouteModel(STAR_MOCK));
    t.notThrows(() => new StandardRouteModel(SID_MOCK));
    t.notThrows(() => new StandardRouteModel(SID_WITHOUT_BODY_MOCK));
    t.notThrows(() => new StandardRouteModel(STAR_WITHOUT_RWY));
    t.true(result.name === SID_MOCK.name);
    t.true(result.icao === SID_MOCK.icao);
    t.true(result._runwayCollection instanceof RouteSegmentCollection);
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

ava('.findFixesAndRestrictionsForRunwayAndExit() returns rwy and body segment fixes when no exitFixName is passed', t => {
    const expectedResult = [
        ['PIRMD', null],
        ['ROPPR', 'A70'],
        ['MDDOG', 'A90'],
        ['TARRK', 'A110'],
        ['SHEAD', 'A140+']
    ];
    const expectedArguments = [RUNWAY_NAME_MOCK, ''];
    const model = new StandardRouteModel(SID_MOCK);
    const spy = sinon.spy(model, '_findFixListForSidByRunwayAndExit');

    const result = model.findFixesAndRestrictionsForRunwayAndExit(RUNWAY_NAME_MOCK);
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

ava('.findFixesAndRestrictionsForEntryAndRunway() returns entry and body fixes when no runwayName is passed', t => {
    const expectedResult = [
        ['DRK', null],
        ['IGM', 'A240'],
        ['ZATES', 'A190'],
        ['KADDY', 'A120|S250'],
        ['TYSSN', null],
        ['SUZSI', 'A100|S210'],
        ['PRINO', 'A80']
    ];
    const expectedArguments = [ENTRY_FIXNAME_MOCK, ''];
    const model = new StandardRouteModel(STAR_MOCK);
    const spy = sinon.spy(model, '_findFixListForStarByEntryAndRunway');

    const result = model.findFixesAndRestrictionsForEntryAndRunway(ENTRY_FIXNAME_MOCK);
    const actualArguments = spy.getCall(0).args;

    t.true(_isEqual(result, expectedResult));
    t.true(_isEqual(actualArguments, expectedArguments));
});

ava('.findStandardWaypointModelsForEntryAndExit() returns a list of `StandardRouteWaypointModel`s for a given STAR', t => {
    const expectedArguments = [ 'MLF', '19R' ]
    const model = new StandardRouteModel(STAR_LIST_MOCK.GRNPA1);
    const spy = sinon.spy(model, '_findStandardWaypointModelsForRoute');

    const result = model.findStandardWaypointModelsForEntryAndExit('MLF', '19R');
    const actualArguments = spy.getCall(0).args;

    t.true(_isEqual(actualArguments, expectedArguments));
    t.true(result.length === 8);
    t.true(result[0] instanceof StandardRouteWaypointModel);
    t.true(result[0].position !== null);
});

ava('.calculateDistanceBetweenWaypoints() calculates the distance between two `StandardRouteWaypointModel` positions', t => {
    const expectedResult = 118.63498218153836;
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

ava('.gatherExitPointNames() retuns an empty array if not exitPoints exist or the collection is undefined', t => {
    const model = new StandardRouteModel(SID_WITHOUT_EXIT_MOCK);
    const result = model.gatherExitPointNames();

    t.true(_isArray(result));
    t.true(result.length === 0);
});

ava('.hasExitPoints() returns a boolean', t => {
    let model;

    model = new StandardRouteModel(SID_MOCK);
    t.true(model.hasExitPoints());

    model = new StandardRouteModel(SID_WITHOUT_EXIT_MOCK);
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

ava('._findBodyFixList() returns an empty array when ._bodySegmentModel is undefined', t => {
    const model = new StandardRouteModel(SID_WITHOUT_BODY_MOCK);

    t.notThrows(() => model._findBodyFixList());

    const result = model._findBodyFixList();

    t.true(_isArray(result));
    t.true(result.length === 0);
});

ava('._findFixListForRunwayName() returns an empty array when ._runwayCollection() is undefined', t => {
    const model = new StandardRouteModel(STAR_WITHOUT_RWY);

    t.notThrows(() => model._findFixListForRunwayName('25R'));

    const result = model._findFixListForRunwayName('25R');

    t.true(_isArray(result));
    t.true(result.length === 0);
});

ava('._findFixListForExitFixName() returns an empty array when ._exitCollection is undefined', t => {
    const model = new StandardRouteModel(SID_WITHOUT_EXIT_MOCK);

    t.notThrows(() => model._findFixListForExitFixName('DRK'));

    const result = model._findFixListForExitFixName('DRK');

    t.true(_isArray(result));
    t.true(result.length === 0);
});

ava('._findFixListForEntryFixName() returns an empty array when entryFixName is an empty string', t => {
    const model = new StandardRouteModel(SID_WITHOUT_EXIT_MOCK);

    t.notThrows(() => model._findFixListForEntryFixName(''));

    const result = model._findFixListForEntryFixName('');

    t.true(_isArray(result));
    t.true(result.length === 0);
});
