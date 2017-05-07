import ava from 'ava';
import _isEqual from 'lodash/isEqual';

import RouteModel from '../../../src/assets/scripts/client/navigationLibrary/Route/RouteModel';

const ROUTE_MOCK = 'BETHL.GRNPA1.KLAS';
const DIRECT_ROUTE_MOCK = 'BETHL..GRNPA..25R';
const HOLD_ROUTE_MOCK = '@COWBY';
const VECTOR_ROUTE_MOCK = '#260';

ava('returns early when instantiated with invalid parameters', t => {
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

ava('throws when instantiated with incorrect parameters', t => {
    t.throws(() => new RouteModel('A'));
    t.throws(() => new RouteModel('A.B'));
    t.throws(() => new RouteModel('A.B.C.D'));
});

ava('accepts a string routeString as its only parameter and sets its properties', t => {
    t.notThrows(() => new RouteModel(ROUTE_MOCK));

    const model = new RouteModel(ROUTE_MOCK);

    t.true(model.entry === 'BETHL');
    t.true(model.procedure === 'GRNPA1');
    t.true(model.exit === 'KLAS');
});

ava('_isValidRouteCode() accepts a routeString and returns false when it is not the correct length', t => {
    const model = new RouteModel(ROUTE_MOCK);

    t.false(model._isValidRouteCode(''));
    t.false(model._isValidRouteCode('A.B'));
});

ava('_isValidRouteCode() accepts a routeString and returns true when it is the correct length', t => {
    const model = new RouteModel(ROUTE_MOCK);

    t.true(model._isValidRouteCode('A.B.C'));
});

ava('_extractSegmentNamesFromRouteCode() accepts a routeString and returns an object', t => {
    const expectedResult = {
        entry: 'BETHL',
        base: 'GRNPA1',
        exit: 'KLAS'
    };
    const model = new RouteModel(ROUTE_MOCK);
    const result = model._extractSegmentNamesFromRouteCode(ROUTE_MOCK);

    t.true(_isEqual(result, expectedResult));
});

ava('isProcedureRouteString accepts a routeString with direct sections and returns false', (t) => {
    t.false(RouteModel.isProcedureRouteString(DIRECT_ROUTE_MOCK));
});

ava('isHoldRouteString returns true when passed a routeString containing a holdSegment', (t) => {
    t.true(RouteModel.isHoldRouteString(HOLD_ROUTE_MOCK));
});

ava('isHoldRouteString returns false when passed a routeString without any holdSegments', (t) => {
    t.false(RouteModel.isHoldRouteString(DIRECT_ROUTE_MOCK));
});

ava('isVectorRouteString returns true when passed a routeString containing a vectorSegment', (t) => {
    t.true(RouteModel.isVectorRouteString(VECTOR_ROUTE_MOCK));
});

ava('isVectorRouteString returns false when passed a routeString without any vectorSegments', (t) => {
    t.false(RouteModel.isVectorRouteString(DIRECT_ROUTE_MOCK));
});
