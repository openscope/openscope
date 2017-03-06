import ava from 'ava';
import _isEqual from 'lodash/isEqual';
import StaticPositionModel from '../../src/assets/scripts/client/base/StaticPositionModel';
import { airportPositionFixtureKLAS } from '../fixtures/airportFixtures';
import { DEFAULT_SCREEN_POSITION } from '../../src/assets/scripts/client/constants/positionConstants';

const LAT_LONG_MOCK = ['N36d38m01.199', 'W114d36m17.219'];
const LAT_LONG_MOCK_DECIMAL = [36.63366638888889, -114.60478305555554];
const MAGNETIC_NORTH_MOCK = 0.2076941809873252;
const expectedScreenPosition = [35.448246791634254, 70.38079821863909];

ava('throws when called to instantiate without parameters', t => {
    t.throws(() => new StaticPositionModel());
});

ava('sets internal properties when provided valid parameters', t => {
    const result = new StaticPositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);

    t.true(result.latitude === LAT_LONG_MOCK_DECIMAL[0]);
    t.true(result.longitude === LAT_LONG_MOCK_DECIMAL[1]);
    t.true(result.elevation === 0);
    t.true(result.x === expectedScreenPosition[0]);
    t.true(result.y === expectedScreenPosition[1]);
    t.true(_isEqual(result.position, expectedScreenPosition));
    t.true(_isEqual(result.reference_position, airportPositionFixtureKLAS));
    t.true(result.magnetic_north === 0.2076941809873252);
    t.true(_isEqual(result.gps, LAT_LONG_MOCK_DECIMAL));
    t.true(result.gpsXY[0] === LAT_LONG_MOCK_DECIMAL[1]);
    t.true(result.gpsXY[1] === LAT_LONG_MOCK_DECIMAL[0]);
});

ava('get screenPosition() returns [0, 0] if no reference position is provided', t => {
    const result = new StaticPositionModel(LAT_LONG_MOCK, null, MAGNETIC_NORTH_MOCK).position;
    const expectedResult = DEFAULT_SCREEN_POSITION;

    t.true(_isEqual(result, expectedResult));
});
