import ava from 'ava';
import FixModel from '../../../src/assets/scripts/client/navigationLibrary/FixModel';
import DynamicPositionModel from '../../../src/assets/scripts/client/base/DynamicPositionModel';
import {
    FIXNAME_MOCK,
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

ava('throws when instantiated with invalid parameters', t => {
    t.throws(() => new FixModel());
    t.throws(() => new FixModel([]));
    t.throws(() => new FixModel(''));
    t.throws(() => new FixModel(42));
    t.throws(() => new FixModel(false));
    t.throws(() => new FixModel(FIXNAME_MOCK, undefined, airportPositionFixtureKSFO));
    t.throws(() => new FixModel(FIXNAME_MOCK, FIX_COORDINATE_MOCK, undefined));
    t.throws(() => new FixModel(FIXNAME_MOCK, undefined, undefined));
    t.throws(() => new FixModel(undefined, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO));
    t.throws(() => new FixModel(undefined, undefined, airportPositionFixtureKSFO));
    t.throws(() => new FixModel(undefined, FIX_COORDINATE_MOCK, undefined));
});

ava('.init() sets name in upperCase', t => {
    let model = new FixModel('uppercase', FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);
    t.true(model.name === 'UPPERCASE');

    model = new FixModel('u443rcas3', FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);
    t.true(model.name === 'U443RCAS3');
});

ava('.init() sets spoken to specified value (lower-cased) when "spoken" parameter is given', t => {
    let model = new FixModel(FIXNAME_MOCK, [...FIX_COORDINATE_MOCK, 'Spoken Werds'], airportPositionFixtureKSFO);
    t.true(model.spoken === 'spoken werds');

    model = new FixModel(FIXNAME_MOCK, [...FIX_COORDINATE_MOCK, 'L0W3RC4S3'], airportPositionFixtureKSFO);
    t.true(model.spoken === 'l0w3rc4s3');
});

ava('.init() sets spoken to fix name (lower-cased) when "spoken" parameter is not given', t => {
    let model = new FixModel('FIXXA', [...FIX_COORDINATE_MOCK], airportPositionFixtureKSFO);
    t.true(model.spoken === 'fixxa');

    model = new FixModel('F1XX4', [...FIX_COORDINATE_MOCK], airportPositionFixtureKSFO);
    t.true(model.spoken === 'f1xx4');
});

ava('.isRealFix returns correct value', (t) => {
    let model = new FixModel(FIXNAME_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);
    t.false(model.isRealFix);

    model = new FixModel(REAL_FIXNAME_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);
    t.true(model.isRealFix);
});

ava('.clonePosition() returns a DynamicPositionModel with the position information of the FixModel', t => {
    const model = new FixModel(FIXNAME_MOCK, FIX_COORDINATE_MOCK, airportPositionFixtureKSFO);
    const result = model.clonePosition();

    t.true(result instanceof DynamicPositionModel);
    t.true(result.latitude === model.positionModel.latitude);
    t.true(result.longitude === model.positionModel.longitude);
});
