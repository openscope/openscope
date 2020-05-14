import ava from 'ava';

import MapCollection from '../../src/assets/scripts/client/airport/MapCollection';
import StaticPositionModel from '../../src/assets/scripts/client/base/StaticPositionModel';
import {
    MAP_NAMES_MOCK,
    MAP_NAMES_MOCK_EMPTY,
    MAP_MOCK,
    MAP_MOCK_LEGACY,
    MAP_MOCK_EMPTY,
    DEFAULT_MAPS_MOCK,
    DEFAULT_MAPS_MOCK_EMPTY
} from './_mocks/mapCollectionlMocks';

const currentPosition = ['N44.879722', 'W063.510278', '2181ft'];
const magneticNorth = -18;
const airportPositionFixtureKCYHZ = new StaticPositionModel(currentPosition, null, magneticNorth);

ava('throws if called with invalid parameters', t => {
    t.throws(() => new MapCollection());
    t.throws(() => new MapCollection(MAP_MOCK));
    t.throws(() => new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK));
    t.throws(() => new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ));
    t.throws(() => new MapCollection(null, DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, magneticNorth));
    t.throws(() => new MapCollection(MAP_MOCK, null, airportPositionFixtureKCYHZ, magneticNorth));
    t.throws(() => new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK, null, magneticNorth));
});

ava('throws if called with a legacy map', t => {
    t.throws(() => new MapCollection(MAP_MOCK_LEGACY, DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, magneticNorth));
});

ava('throws if called with an empty map array', t => {
    t.throws(() => new MapCollection(MAP_MOCK_EMPTY, DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, magneticNorth));
});

ava('throws if called with an empty defaultMaps array', t => {
    t.throws(() => new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK_EMPTY, airportPositionFixtureKCYHZ, magneticNorth));
});

ava('does not throw when instantiated with a 0 magneticNorth', t => {
    t.notThrows(() => new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, 0));
});

ava('accepts a map array that is used to set the instance properties', t => {
    const model = new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, magneticNorth);

    t.not(typeof model._id, 'undefined');
    t.is(model.length, MAP_MOCK.length);
    t.is(model.getMapNames().length, MAP_MOCK.length);
    t.true(model.hasVisibleMaps);
    t.is(model.getVisibleMapLines().length, MAP_MOCK[0].lines.length);

    const first = model.maps[0];

    t.is(first.name, MAP_MOCK[0].name);
    t.is(first.lines.length, MAP_MOCK[0].lines.length);
});

ava('accepts a string array that is used to set the visible maps', t => {
    const model = new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, magneticNorth);

    t.notThrows(() => model.setVisibleMaps(MAP_NAMES_MOCK));
    t.is(model.getVisibleMapNames().length, MAP_NAMES_MOCK.length);

    t.notThrows(() => model.setVisibleMaps(MAP_NAMES_MOCK_EMPTY));
    t.is(model.getVisibleMapLines().length, MAP_NAMES_MOCK_EMPTY.length);
});
