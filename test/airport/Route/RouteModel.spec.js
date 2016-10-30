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
    t.true(typeof model._id === 'undefined');
    t.true(typeof model.origin === 'undefined');
    t.true(typeof model.base === 'undefined');
    t.true(typeof model.destination === 'undefined');
});

ava('RouteModel throws when instantiated with incorrect parameters', t => {
    t.throws(() => new RouteModel('A'));
    t.throws(() => new RouteModel('A.B'));
    t.throws(() => new RouteModel('A.B.C.D'));
});

ava('RouteModel accepts a string `routeString` as its only parameter and sets its properties', t => {
    t.notThrows(() => new RouteModel(ROUTE_MOCK));

    const model = new RouteModel(ROUTE_MOCK);

    t.false(typeof model._id === 'undefined');
    t.true(model.origin === 'BETHL');
    t.true(model.base === 'GRNPA1');
    t.true(model.destination === 'KLAS');
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
        origin: 'BETHL',
        base: 'GRNPA1',
        destination: 'KLAS'
    };
    const model = new RouteModel(ROUTE_MOCK);
    const result = model._extractSegmentNamesFromRouteString(ROUTE_MOCK);

    t.true(_isEqual(result, expectedResult));
});
