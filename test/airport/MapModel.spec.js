import ava from 'ava';
import MapModel from '../../src/assets/scripts/client/airport/MapModel';
import StaticPositionModel from '../../src/assets/scripts/client/base/StaticPositionModel';
import {
    MAP_MOCK,
    MAP_MOCK_NO_LINES,
    MAP_MOCK_EMPTY_LINES,
    MAP_MOCK_NO_NAME
} from './_mocks/mapModelMocks';

const currentPosition = ['N44.879722', 'W063.510278', '2181ft'];
const magneticNorth = -18;
const airportPositionFixtureKCYHZ = new StaticPositionModel(currentPosition, null, magneticNorth);

ava('throws if called with invalid parameters', t => {
    t.throws(() => new MapModel());
    t.throws(() => new MapModel(MAP_MOCK));
    t.throws(() => new MapModel(null, airportPositionFixtureKCYHZ, magneticNorth));
    t.throws(() => new MapModel(MAP_MOCK, null, magneticNorth));
    t.throws(() => new MapModel(MAP_MOCK, airportPositionFixtureKCYHZ));
});

ava('throws if called with a no name', t => {
    t.throws(() => new MapModel(MAP_MOCK_NO_NAME, airportPositionFixtureKCYHZ, magneticNorth));
});

ava('throws if called with a no lines', t => {
    t.throws(() => new MapModel(MAP_MOCK_NO_LINES, airportPositionFixtureKCYHZ, magneticNorth));
});

ava('throws if called with a empty lines array', t => {
    t.throws(() => new MapModel(MAP_MOCK_EMPTY_LINES, airportPositionFixtureKCYHZ, magneticNorth));
});

ava('accepts a map object that is used to set the instance properties', t => {
    const model = new MapModel(MAP_MOCK, airportPositionFixtureKCYHZ, magneticNorth);

    t.not(typeof model._id, 'undefined');
    t.is(model.name, MAP_MOCK.name);
    t.is(model.lines.length, MAP_MOCK.lines.length);
});
