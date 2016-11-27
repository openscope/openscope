import ava from 'ava';

import PositionModel from '../../src/assets/scripts/base/PositionModel';

// klas airport reference
const AIRPORT_POSITION_FIXTURE = new PositionModel(["N36.080056", "W115.15225", "2181ft"], null, 11);
const LAT_LONG_MOCK = ['N36d38m01.199', 'W114d36m17.219'];
const MAGNETIC_NORTH_MOCK = 0.2076941809873252;

ava('does not throw when called to instantiate without parameters', t => {
    t.notThrows(() => new PositionModel(AIRPORT_POSITION_FIXTURE));
});

ava('sets internal properties when provided valid parameters', t => {
    const result = new PositionModel(LAT_LONG_MOCK, AIRPORT_POSITION_FIXTURE, MAGNETIC_NORTH_MOCK);

    t.true(result.latitude === 36.63366638888889);
    t.true(result.longitude === -114.60478305555554);
    t.true(result.elevation === 0);
    t.true(result.position[0] === 35.448246791634254);
    t.true(result.position[1] === 70.38079821863909);
    t.true(result.magnetic_north === 0.2076941809873252);
    t.true(result.x === 35.448246791634254);
    t.true(result.y === 70.38079821863909);
    t.true(result.gps[0] === -114.60478305555554);
    t.true(result.gps[1] === 36.63366638888889);
});
