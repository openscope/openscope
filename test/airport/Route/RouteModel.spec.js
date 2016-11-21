/* eslint-disable import/no-extraneous-dependencies, arrow-parens */
import ava from 'ava';
import _isEqual from 'lodash/isEqual';

import RouteModel from '../../../src/assets/scripts/airport/Route/RouteModel';

const ROUTE_MOCK = 'BETHL.GRNPA1.KLAS';

ava('RouteModel returns early when instantiated with invalid parameters', t => {
    t.notThrows(() => new RouteModel());
    t.notThrows(() => new RouteModel({}));
    t.notThrows(() => new RouteModel([]));
    t.notThrows(() => new RouteModel(42));
    t.notThrows(() => new RouteModel(false));

    const model = new RouteModel();
    t.true(typeof model.entry === 'undefined');
    t.true(typeof model.procedure === 'undefined');
    t.true(typeof model.exit === 'undefined');
});

ava('RouteModel throws when instantiated with incorrect parameters', t => {
    t.throws(() => new RouteModel('A'));
    t.throws(() => new RouteModel('A.B'));
    t.throws(() => new RouteModel('A.B.C.D'));
});

ava('RouteModel accepts a string `routeString` as its only parameter and sets its properties', t => {
    t.notThrows(() => new RouteModel(ROUTE_MOCK));

    const model = new RouteModel(ROUTE_MOCK);

    t.true(model.entry === 'BETHL');
    t.true(model.procedure === 'GRNPA1');
    t.true(model.exit === 'KLAS');
});

ava('_isValidRouteString() accepts a `routeString` and returns false when it is not the correct length', t => {
    const model = new RouteModel(ROUTE_MOCK);

    t.false(model._isValidRouteString(''));
    t.false(model._isValidRouteString('A.B'));
});

ava('_isValidRouteString() accepts a `routeString` and returns true when it is the correct length', t => {
    const model = new RouteModel(ROUTE_MOCK);

    t.true(model._isValidRouteString('A.B.C'));
});

ava('_extractSegmentNamesFromRouteString() accepts a `routeString` and returns an object', t => {
    const expectedResult = {
        entry: 'BETHL',
        base: 'GRNPA1',
        exit: 'KLAS'
    };
    const model = new RouteModel(ROUTE_MOCK);
    const result = model._extractSegmentNamesFromRouteString(ROUTE_MOCK);

    t.true(_isEqual(result, expectedResult));
});
