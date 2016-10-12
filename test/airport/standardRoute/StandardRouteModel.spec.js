/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import sinon from 'sinon';
import _isEqual from 'lodash/isEqual';

import StandardRouteModel from '../../../src/assets/scripts/airport/StandardRoute/StandardRouteModel';
import RouteSegmentCollection from '../../../src/assets/scripts/airport/StandardRoute/RouteSegmentCollection';
import RouteSegmentModel from '../../../src/assets/scripts/airport/StandardRoute/RouteSegmentModel';
import { SID_LIST_MOCK, SID_WITHOUT_BODY_MOCK } from './_mocks/sidMocks';

const SID_MOCK = SID_LIST_MOCK.SHEAD9;
const RUNWAY_NAME_MOCK = '25L';
const EXIT_FIXNAME_MOCK = 'KENNO';

ava('throws when instantiated with invaild parameters', t => {
    t.throws(() => new StandardRouteModel());
    t.throws(() => new StandardRouteModel([]));
    t.throws(() => new StandardRouteModel(''));
    t.throws(() => new StandardRouteModel(42));
    t.throws(() => new StandardRouteModel(false));
});

ava('does not throw when instantiated with vaild parameters', t => {
    const result = new StandardRouteModel(SID_MOCK);

    t.notThrows(() => new StandardRouteModel(SID_MOCK));
    t.true(result.name === SID_MOCK.name);
    t.true(result.icao === SID_MOCK.icao);
    t.true(result._runwayCollection instanceof RouteSegmentCollection);
    t.true(result._bodySegmentModel instanceof RouteSegmentModel);
    t.true(result._exitCollection instanceof RouteSegmentCollection);
});

ava('.findFixesAndRestrictionsForRunwayWithExit() returns an array of fixes for a given route', t => {
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
    const spy = sinon.spy(model, '_findFixListForSegmentByName');

    const result = model.findFixesAndRestrictionsForRunwayWithExit(RUNWAY_NAME_MOCK, EXIT_FIXNAME_MOCK);
    const actualArguments = spy.getCall(0).args;

    t.true(_isEqual(result, expectedResult));
    t.true(_isEqual(actualArguments, expectedArguments));
});

ava('.findFixesAndRestrictionsForRunwayWithExit() returns body segment fixes when no runwayName or exitFixName is passed', t => {
    const expectedResult = [['SHEAD', 'A140+']];
    const expectedArguments = ['', ''];
    const model = new StandardRouteModel(SID_MOCK);
    const spy = sinon.spy(model, '_findFixListForSegmentByName');

    const result = model.findFixesAndRestrictionsForRunwayWithExit('', '');
    const actualArguments = spy.getCall(0).args;

    t.true(_isEqual(result, expectedResult));
    t.true(_isEqual(actualArguments, expectedArguments));
});

ava('.findFixesAndRestrictionsForRunwayWithExit() returns body and exitPoint segment fixes when no runwayName is passed', t => {
    const expectedResult = [
        ['SHEAD', 'A140+'],
        ['DBIGE', 'A210+'],
        ['BIKKR', 'A210+'],
        ['KENNO', null]
    ];
    const expectedArguments = ['', EXIT_FIXNAME_MOCK];
    const model = new StandardRouteModel(SID_MOCK);
    const spy = sinon.spy(model, '_findFixListForSegmentByName');

    const result = model.findFixesAndRestrictionsForRunwayWithExit('', EXIT_FIXNAME_MOCK);
    const actualArguments = spy.getCall(0).args;

    t.true(_isEqual(result, expectedResult));
    t.true(_isEqual(actualArguments, expectedArguments));
});

ava('.findFixesAndRestrictionsForRunwayWithExit() returns rwy and body segment fixes when no exitFixName is passed', t => {
    const expectedResult = [
        ['PIRMD', null],
        ['ROPPR', 'A70'],
        ['MDDOG', 'A90'],
        ['TARRK', 'A110'],
        ['SHEAD', 'A140+']
    ];
    const expectedArguments = [RUNWAY_NAME_MOCK, ''];
    const model = new StandardRouteModel(SID_MOCK);
    const spy = sinon.spy(model, '_findFixListForSegmentByName');

    const result = model.findFixesAndRestrictionsForRunwayWithExit(RUNWAY_NAME_MOCK, '');
    const actualArguments = spy.getCall(0).args;

    t.true(_isEqual(result, expectedResult));
    t.true(_isEqual(actualArguments, expectedArguments));
});

ava('.findFixesAndRestrictionsForRunwayWithExit() returns rrwy and exitPoints fixes when no body fixes exist', t => {
    const expectedResult = [
        ['PIRMD', null],
        ['ROPPR', 'A70'],
        ['CEASR', 'A80+'],
        ['FORGE', null],
        ['WILLW', 'A140+'],
        ['MLF', null]
    ];
    const model = new StandardRouteModel(SID_WITHOUT_BODY_MOCK);
    const result = model.findFixesAndRestrictionsForRunwayWithExit(RUNWAY_NAME_MOCK, 'MLF');

    t.true(_isEqual(result, expectedResult));
});
