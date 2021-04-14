import ava from 'ava';
import FixModel from '../../../src/assets/scripts/client/navigationLibrary/FixModel';
import DynamicPositionModel from '../../../src/assets/scripts/client/base/DynamicPositionModel';
import {
    FIXNAME_MOCK,
    FIXSPOKEN_MOCK,
    FIX_COORDINATE_MOCK,
    REAL_FIXNAME_MOCK
} from './_mocks/fixMocks';
import { airportPositionFixtureKSFO } from '../../fixtures/airportFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('does not throw when instantiated with invalid parameters', t => {
    t.notThrows(() => new FixModel());
    t.notThrows(() => new FixModel([]));
    t.notThrows(() => new FixModel(''));
    t.notThrows(() => new FixModel(42));
    t.notThrows(() => new FixModel(false));
});

ava('returns early when instantiated with incorrect parameters', t => {
    let model;

    model = new FixModel(FIXNAME_MOCK);
    t.true(model.name === '');
    t.true(model.spoken === '');
    t.true(!model._positionModel);

    model = new FixModel(FIXNAME_MOCK, FIXSPOKEN_MOCK);
    t.true(model.name === '');
    t.true(model.spoken === '');
    t.true(!model._positionModel);

    model = new FixModel(FIXNAME_MOCK, FIXSPOKEN_MOCK, FIX_COORDINATE_MOCK);
    t.true(model.name === '');
    t.true(model.spoken === '');
    t.true(!model._positionModel);

    model = new FixModel(null, FIXSPOKEN_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);
    t.true(model.name === '');
    t.true(model.spoken === '');
    t.true(!model._positionModel);

    // Not testing fixSpoken = NULL because that should be allowed

    model = new FixModel(FIXNAME_MOCK, FIXSPOKEN_MOCK, null, airportPositionFixtureKSFO);
    t.true(model.name === '');
    t.true(model.spoken === '');
    t.true(!model._positionModel);

    model = new FixModel(null, null, null, airportPositionFixtureKSFO);
    t.true(model.name === '');
    t.true(model.spoken === '');
    t.true(!model._positionModel);
});

ava('accepts a `fixName`, a `fixSpoken`, an array `fixCoordinate` and an `airportPosition` as its parameters', t => {
    const model = new FixModel(FIXNAME_MOCK, FIXSPOKEN_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);

    t.true(model.name === FIXNAME_MOCK);
    t.true(model.spoken === FIXSPOKEN_MOCK);
    t.true(model._positionModel instanceof DynamicPositionModel);
});

ava('accepts undefined `fixSpoken` as a parameter', t => {
    const model = new FixModel(FIXNAME_MOCK, null, FIX_COORDINATE_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);

    t.true(model.name === FIXNAME_MOCK);
    t.true(model.spoken === FIXNAME_MOCK.toLowerCase());
    t.true(model._positionModel instanceof DynamicPositionModel);
});

ava('.init() sets name in upperCase', t => {
    let model = new FixModel('uppercase', FIXSPOKEN_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);
    t.true(model.name === 'UPPERCASE');

    model = new FixModel('u443rcas3', FIXSPOKEN_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);
    t.true(model.name === 'U443RCAS3');
});

ava('.init() sets spoken in lowerCase', t => {
    let model = new FixModel(FIXNAME_MOCK, 'LOWERCASE', FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);
    t.true(model.spoken === 'lowercase');

    model = new FixModel(FIXNAME_MOCK, 'L0W3RC4S3', FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);
    t.true(model.spoken === 'l0w3rc4s3');
});

ava('.isRealFix returns correct value', (t) => {
    let model = new FixModel(FIXNAME_MOCK, FIXSPOKEN_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);
    t.false(model.isRealFix);

    model = new FixModel(REAL_FIXNAME_MOCK, FIXSPOKEN_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);
    t.true(model.isRealFix);
});

ava('.clonePosition() returns a DynamicPositionModel with the position information of the FixModel', t => {
    const model = new FixModel(FIXNAME_MOCK, FIXSPOKEN_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);
    const result = model.clonePosition();

    t.true(result instanceof DynamicPositionModel);
    t.true(result.latitude === result.latitude);
    t.true(result.longitude === result.longitude);
});
