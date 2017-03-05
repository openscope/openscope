import ava from 'ava';
import _isEqual from 'lodash/isEqual';

import PositionModel from '../../src/assets/scripts/client/base/PositionModel';
import { airportPositionFixtureKLAS } from '../fixtures/airportFixtures';

const LAT_LONG_MOCK = ['N36d38m01.199', 'W114d36m17.219'];
const LAT_LONG_MOCK_2 = ['N35d51.34m0', 'W114d54.60m0'];
const MAGNETIC_NORTH_MOCK = 0.2076941809873252;

ava('throws when called to instantiate without parameters', t => {
    t.throws(() => new PositionModel());
});

ava('sets internal properties when provided valid parameters', t => {
    const result = new PositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);

    t.true(result.latitude === 36.63366638888889);
    t.true(result.longitude === -114.60478305555554);
    t.true(result.elevation === 0);
    t.true(result.position[0] === 35.448246791634254);
    t.true(result.position[1] === 70.38079821863909);
    t.true(result.magnetic_north === 0.2076941809873252);
    t.true(result.x === 35.448246791634254);
    t.true(result.y === 70.38079821863909);
    t.true(result.gpsXY[0] === -114.60478305555554);
    t.true(result.gpsXY[1] === 36.63366638888889);
    t.true(result.gps[0] === 36.63366638888889);
    t.true(result.gps[1] === -114.60478305555554);
});

ava('.calculatePosition() throws when it receives the wrong arguments', t => {
    t.throws(() => PositionModel.calculatePosition());
});

ava('.getPostiion() returns an array with a calculated x, y value that is the same as an instance x,y', t => {
    const expectedResult = new PositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const result = PositionModel.calculatePosition(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);

    t.true(_isEqual(result, expectedResult.position));
});

ava('.bearingTo() returns the correct bearing between two PositionModel instances', t => {
    const position1 = new PositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const position2 = new PositionModel(LAT_LONG_MOCK_2, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const expectedResult = -3.0412772537856627;
    const result = position1.bearingTo(position2);

    t.true(result === expectedResult);
});

ava('.bearingFrom() returns the correct bearing between two PositionModel instances', t => {
    const position1 = new PositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const position2 = new PositionModel(LAT_LONG_MOCK_2, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const expectedResult = 0.1003153998041304;
    const result = position1.bearingFrom(position2);

    t.true(result === expectedResult);
});

// user bug test cases
ava('.calculatePosition() does not throw when it receives 0 for magnetic_north', t => {
    t.notThrows(() => new PositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, 0));
    t.notThrows(() => PositionModel.calculatePosition(LAT_LONG_MOCK, airportPositionFixtureKLAS, 0));
});
