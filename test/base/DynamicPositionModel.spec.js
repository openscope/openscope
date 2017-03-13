import ava from 'ava';
import _isEqual from 'lodash/isEqual';

import DynamicPositionModel from '../../src/assets/scripts/client/base/DynamicPositionModel';
import { airportPositionFixtureKLAS } from '../fixtures/airportFixtures';
import { DEFAULT_SCREEN_POSITION } from '../../src/assets/scripts/client/constants/positionConstants';

const BEARING_RADIANS_MOCK = 0.610865;
const DISTANCE_NM_MOCK = 50;
const INVALID_COORDINATES_MOCK = ['NN36d38m01.199', -114.5];
const LAT_LONG_MOCK = ['N36d38m01.199', 'W114d36m17.219'];
const LAT_LONG_DECIMAL_MOCK = [36.63366638888889, -114.60478305555554];
const LAT_LONG_MOCK_2 = ['N35d51.34m0', 'W114d54.60m0'];
const LAT_LONG_DECIMAL_MOCK_2 = [35.855666666666664, -114.91];
const MAGNETIC_NORTH_MOCK = 0.2076941809873252;
const expectedrelativePosition = [35.448246791634254, 70.38079821863909];

ava('throws when called to instantiate without parameters', t => {
    t.throws(() => new DynamicPositionModel());
});

ava('sets internal properties when provided valid parameters', t => {
    const result = new DynamicPositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);

    t.true(result.latitude === LAT_LONG_DECIMAL_MOCK[0]);
    t.true(result.longitude === LAT_LONG_DECIMAL_MOCK[1]);
    t.true(result.elevation === 0);
    t.true(_isEqual(result.relativePosition, expectedrelativePosition));
    t.true(_isEqual(result._referencePosition, airportPositionFixtureKLAS));
    t.true(result._magneticNorth === 0.2076941809873252);
    t.true(_isEqual(result.gps, LAT_LONG_DECIMAL_MOCK));
    t.true(result.gpsXY[0] === LAT_LONG_DECIMAL_MOCK[1]);
    t.true(result.gpsXY[1] === LAT_LONG_DECIMAL_MOCK[0]);
});

ava('get relativePosition() returns [0, 0] if no reference position is provided', t => {
    const result = new DynamicPositionModel(LAT_LONG_MOCK, null, MAGNETIC_NORTH_MOCK);
    const expectedResult = DEFAULT_SCREEN_POSITION;

    t.true(_isEqual(result.relativePosition, expectedResult));
});

ava('get magneticNorth() returns the value of #_magneticNorth', (t) => {
    const positionModel = new DynamicPositionModel(LAT_LONG_MOCK, null, MAGNETIC_NORTH_MOCK);
    const result = positionModel.magneticNorth;
    const expectedResult = MAGNETIC_NORTH_MOCK;

    t.true(_isEqual(result, expectedResult));
});

ava('.calculatePosition() static method throws when it receives the wrong arguments', t => {
    t.throws(() => DynamicPositionModel.calculateRelativePosition());
});

ava('.bearingFromPosition() returns the correct bearing between two DynamicPositionModel instances', t => {
    const position1 = new DynamicPositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const position2 = new DynamicPositionModel(LAT_LONG_MOCK_2, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const expectedResult = 0.09716579176803017;
    const result = position1.bearingFromPosition(position2);

    t.true(result === expectedResult);
});

ava('.bearingToPosition() returns the correct bearing between two DynamicPositionModel instances', t => {
    const position1 = new DynamicPositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const position2 = new DynamicPositionModel(LAT_LONG_MOCK_2, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const expectedResult = 3.2419080533939235;
    const result = position1.bearingToPosition(position2);

    t.true(result === expectedResult);
});

ava('.distanceToPosition() returns the correct distance between two DynamicPositionModel instances', t => {
    const position1 = new DynamicPositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const position2 = new DynamicPositionModel(LAT_LONG_MOCK_2, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const expectedResult = 48.99277192716842;
    const result = position1.distanceToPosition(position2);

    t.true(result === expectedResult);
});

ava('.generateDynamicPositionFromBearingAndDistance() returns an accurate new DynamicPositionModel instance', (t) => {
    const position1 = new DynamicPositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const position2 = position1.generateDynamicPositionFromBearingAndDistance(BEARING_RADIANS_MOCK, DISTANCE_NM_MOCK);
    const result = position2.gps;
    const expectedResult = [37.200260478622035, -113.84138604883545];

    t.true(position2 instanceof DynamicPositionModel);
    t.true(_isEqual(result, expectedResult));
});

ava('.setCoordinates() returns early with error and makes no changes if invalid coordinates are passed', (t) => {
    const position1 = new DynamicPositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);
    const originalCoordinates = position1.gps;
    const retval = position1.setCoordinates(INVALID_COORDINATES_MOCK);
    const endingCoordinates = position1.gps;

    t.true(retval instanceof TypeError);
    t.true(_isEqual(originalCoordinates, endingCoordinates));
});

ava('.setCoordinates() sets the latitude and longitude when provided valid data', (t) => {
    const position1 = new DynamicPositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, MAGNETIC_NORTH_MOCK);

    position1.setCoordinates(LAT_LONG_DECIMAL_MOCK_2);

    const result = position1.gps;
    const expectedResult = LAT_LONG_DECIMAL_MOCK_2;

    t.true(_isEqual(result, expectedResult));
});

// user bug test cases
ava('.calculatePosition() does not throw when it receives 0 for magnetic_north', t => {
    t.notThrows(() => new DynamicPositionModel(LAT_LONG_MOCK, airportPositionFixtureKLAS, 0));
    t.notThrows(() => DynamicPositionModel.calculateRelativePosition(LAT_LONG_MOCK, airportPositionFixtureKLAS, 0));
});
