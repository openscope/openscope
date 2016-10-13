/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';

import StandardRouteModel from '../../../src/assets/scripts/airport/StandardRoute/StandardRouteModel';
import RouteSegmentCollection from '../../../src/assets/scripts/airport/StandardRoute/RouteSegmentCollection';
import RouteSegmentModel from '../../../src/assets/scripts/airport/StandardRoute/RouteSegmentModel';
import { STAR_LIST_MOCK, SID_LIST_MOCK, SID_WITHOUT_BODY_MOCK } from './_mocks/standardRouteMocks';

const SID_MOCK = SID_LIST_MOCK.SHEAD9;
const STAR_MOCK = STAR_LIST_MOCK.TYSSN4;
const RUNWAY_NAME_MOCK = '25L';
const EXIT_FIXNAME_MOCK = 'KENNO';
const ENTRY_FIXNAME_MOCK = 'DRK';

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

ava('._buildSegmentCollection() returns null if segment is undefined', t => {
    const model = new StandardRouteModel(STAR_MOCK);
    const result = model._buildSegmentCollection();

    t.true(result === null);
});

ava('._generateFixList() accepts 3 functions and spreads their result over a compacted array', t => {
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
    const model = new StandardRouteModel(SID_MOCK);
    const result = model._findFixListForSidByRunwayAndExit(RUNWAY_NAME_MOCK, EXIT_FIXNAME_MOCK);

});
