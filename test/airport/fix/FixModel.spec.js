import ava from 'ava';

import FixModel from '../../../src/assets/scripts/airport/Fix/FixModel';
import PositionModel from '../../../src/assets/scripts/base/PositionModel';

import { airportPositionFixture } from '../../fixtures/airportFixtures';
import {
    FIXNAME_MOCK,
    REAL_FIXNAME_MOCK,
    FIX_COORDINATE_MOCK
} from './_mocks/fixMocks';

ava('FixModel does not throw when instantiated with invalid parameters', t => {
    t.notThrows(() => new FixModel());
    t.notThrows(() => new FixModel([]));
    t.notThrows(() => new FixModel(''));
    t.notThrows(() => new FixModel(42));
    t.notThrows(() => new FixModel(false));
});

ava('FixModel returns early when instantiated with incorrect parameters', t => {
    let model;

    model = new FixModel(FIXNAME_MOCK);
    t.true(typeof model.name === 'undefined');
    t.true(typeof model._fixPosition === 'undefined');

    model = new FixModel(FIXNAME_MOCK, FIX_COORDINATE_MOCK);
    t.true(typeof model.name === 'undefined');
    t.true(typeof model._fixPosition === 'undefined');

    model = new FixModel(null, FIX_COORDINATE_MOCK, airportPositionFixture);
    t.true(typeof model.name === 'undefined');
    t.true(typeof model._fixPosition === 'undefined');

    model = new FixModel(FIXNAME_MOCK, null, airportPositionFixture);
    t.true(typeof model.name === 'undefined');
    t.true(typeof model._fixPosition === 'undefined');

    model = new FixModel(null, null, airportPositionFixture);
    t.true(typeof model.name === 'undefined');
    t.true(typeof model._fixPosition === 'undefined');
});

ava('FixModel accepts a `fixName`, an array `fixCoordinate` and an `airportPosition` as its parameters', t => {
    const model = new FixModel(FIXNAME_MOCK, FIX_COORDINATE_MOCK, airportPositionFixture);

    t.false(model.name === '');
    t.false(model._fixPosition === null);
    t.true(model.name === FIXNAME_MOCK);
    t.true(model._fixPosition instanceof PositionModel);
});

ava('FixModel._init() sets name in upperCase', t => {
    let model = new FixModel('uppercase', FIX_COORDINATE_MOCK, airportPositionFixture);
    t.true(model.name === 'UPPERCASE');

    model = new FixModel('u443rcas3', FIX_COORDINATE_MOCK, airportPositionFixture);
    t.true(model.name === 'U443RCAS3');
});

ava('.clonePosition() returns a PositionModel with the position information of the FixModel', t => {
    const model = new FixModel(FIXNAME_MOCK, FIX_COORDINATE_MOCK, airportPositionFixture);
    const result = model.clonePosition();

    t.true(result instanceof PositionModel);
    t.true(result.latitude === result.latitude);
    t.true(result.longitude === result.longitude);
});
