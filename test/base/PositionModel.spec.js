import ava from 'ava';
import _isEqual from 'lodash/isEqual';

import PositionModel from '../../src/assets/scripts/client/base/PositionModel';
import { airportPositionFixtureKLAS } from '../fixtures/airportFixtures';
import { DEFAULT_SCREEN_POSITION } from '../../src/assets/scripts/client/constants/positionConstants';

const LAT_LONG_MOCK = ['N36d38m01.199', 'W114d36m17.219'];
const LAT_LONG_MOCK_DECIMAL = [36.63366638888889, -114.60478305555554];
const LAT_LONG_MOCK_2 = ['N35d51.34m0', 'W114d54.60m0'];
const MAGNETIC_NORTH_MOCK = 0.2076941809873252;
const expectedScreenPosition = [35.448246791634254, 70.38079821863909];

ava('throws when called to instantiate without parameters', t => {
    t.throws(() => new PositionModel());
});

ava('sets internal properties when provided valid parameters', t => {
    const result = new PositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);

    t.true(result.latitude === LAT_LONG_MOCK_DECIMAL[0]);
    t.true(result.longitude === LAT_LONG_MOCK_DECIMAL[1]);
    t.true(result.elevation === 0);
    t.true(_isEqual(result.position, expectedScreenPosition));
    t.true(_isEqual(result.reference_position, airportPositionFixtureKLAS));
    t.true(result.magnetic_north === 0.2076941809873252);
    t.true(_isEqual(result.gps, LAT_LONG_MOCK_DECIMAL));
    t.true(result.gpsXY[0] === LAT_LONG_MOCK_DECIMAL[1]);
    t.true(result.gpsXY[1] === LAT_LONG_MOCK_DECIMAL[0]);
});

ava('get screenPosition() returns [0, 0] if no reference position is provided', t => {
    const result = new PositionModel(LAT_LONG_MOCK, null, MAGNETIC_NORTH_MOCK);
    const expectedResult = DEFAULT_SCREEN_POSITION;

    t.true(_isEqual(result.position, expectedResult));
});

ava('.calculatePosition() static method throws when it receives the wrong arguments', t => {
    t.throws(() => PositionModel.calculatePosition());
});

ava('.bearingFrom() returns the correct bearing between two PositionModel instances', t => {
    const position1 = new PositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const position2 = new PositionModel(LAT_LONG_MOCK_2, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const expectedResult = 0.1003153998041304;
    const result = position1.bearingFrom(position2);

    t.true(result === expectedResult);
});

ava('.bearingTo() returns the correct bearing between two PositionModel instances', t => {
    const position1 = new PositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const position2 = new PositionModel(LAT_LONG_MOCK_2, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const expectedResult = -3.0412772537856627;
    const result = position1.bearingTo(position2);

    t.true(result === expectedResult);
});

ava('.distanceTo() returns the correct distance between two PositionModel instances', t => {
    const position1 = new PositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const position2 = new PositionModel(LAT_LONG_MOCK_2, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const expectedResult = 90.73632265929942;
    const result = position1.distanceTo(position2);

    t.true(result === expectedResult);
});

// user bug test cases
ava('.calculatePosition() does not throw when it receives 0 for magnetic_north', t => {
    t.notThrows(() => new PositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, 0));
    t.notThrows(() => PositionModel.calculatePosition(LAT_LONG_MOCK, airportPositionFixtureKLAS, 0));
});
