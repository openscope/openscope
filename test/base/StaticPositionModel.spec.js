import ava from 'ava';
import _isEqual from 'lodash/isEqual';
import StaticPositionModel from '../../src/assets/scripts/client/base/StaticPositionModel';
import { airportPositionFixtureKLAS } from '../fixtures/airportFixtures';
import {
    DEFAULT_SCREEN_POSITION,
    RELATIVE_POSITION_OFFSET_INDEX
} from '../../src/assets/scripts/client/constants/positionConstants';

const INVALID_COORDINATES_MOCK = ['NN36d38m01.199', -114.5];
const LAT_LONG_MOCK = ['N36d38m01.199', 'W114d36m17.219'];
const LAT_LONG_DECIMAL_MOCK = [36.63366638888889, -114.60478305555554];
const LAT_LONG_DECIMAL_MOCK_2 = [35.855666666666664, -114.91];
const MAGNETIC_NORTH_MOCK = 0.2076941809873252;
const expectedRelativePosition = [35.448246791634254, 70.38079821863909];

ava('throws when called to instantiate without parameters', t => {
    t.throws(() => new StaticPositionModel());
});

ava('sets internal properties when provided valid parameters', t => {
    const result = new StaticPositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);

    t.true(result.latitude === LAT_LONG_DECIMAL_MOCK[0]);
    t.true(result.longitude === LAT_LONG_DECIMAL_MOCK[1]);
    t.true(result.elevation === 0);
    t.true(_isEqual(result.relativePosition, expectedRelativePosition));
    t.true(result.x === expectedRelativePosition[RELATIVE_POSITION_OFFSET_INDEX.LONGITUDINAL]);
    t.true(result.y === expectedRelativePosition[RELATIVE_POSITION_OFFSET_INDEX.LATITUDINAL]);
    t.true(_isEqual(result._referencePosition, airportPositionFixtureKLAS));
    t.true(result._magneticNorth === 0.2076941809873252);
    t.true(_isEqual(result.gps, LAT_LONG_DECIMAL_MOCK));
    t.true(result.gpsXY[0] === LAT_LONG_DECIMAL_MOCK[1]);
    t.true(result.gpsXY[1] === LAT_LONG_DECIMAL_MOCK[0]);
});

ava('get relativePosition() returns [0, 0] if no reference position is provided', t => {
    const positionModel = new StaticPositionModel(LAT_LONG_MOCK, null, MAGNETIC_NORTH_MOCK);
    const result = positionModel.relativePosition;
    const expectedResult = DEFAULT_SCREEN_POSITION;

    t.true(_isEqual(result, expectedResult));
});

ava('.setCoordinates() makes no changes if invalid coordinates are passed', (t) => {
    const position1 = new StaticPositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const originalCoordinates = position1.gps;

    position1.setCoordinates(INVALID_COORDINATES_MOCK);

    const endingCoordinates = position1.gps;

    t.true(_isEqual(originalCoordinates, endingCoordinates));
});

ava('.setCoordinates() makes no changes if valid coordinates are passed', (t) => {
    const position1 = new StaticPositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const originalCoordinates = position1.gps;

    position1.setCoordinates(LAT_LONG_DECIMAL_MOCK_2);

    const endingCoordinates = position1.gps;

    t.true(_isEqual(originalCoordinates, endingCoordinates));
});
