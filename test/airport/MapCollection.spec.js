import ava from 'ava';

import MapCollection from '../../src/assets/scripts/client/airport/MapCollection';
import StaticPositionModel from '../../src/assets/scripts/client/base/StaticPositionModel';
import {
    MAP_NAMES_MOCK,
    MAP_NAMES_MOCK_EMPTY,
    MAP_MOCK,
    MAP_MOCK_LEGACY,
    DEFAULT_MAPS_MOCK
} from './_mocks/mapCollectionMocks';

const currentPosition = ['N44.879722', 'W063.510278', '2181ft'];
const magneticNorth = -18;
const airportPositionFixtureKCYHZ = new StaticPositionModel(currentPosition, null, magneticNorth);

ava('throws if called with missing parameters', t => {
    const expectedMessage = /Invalid parameter\(s\) passed to MapCollection constructor\. Expected mapJson, defaultMaps, airportPositionModel and magneticNorth to be defined, but received .*/;

    t.throws(() => new MapCollection(), {
        instanceOf: TypeError,
        message: expectedMessage
    });

    t.throws(() => new MapCollection(MAP_MOCK), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(DEFAULT_MAPS_MOCK), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(airportPositionFixtureKCYHZ), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });

    t.throws(() => new MapCollection(DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(MAP_MOCK, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ), {
        instanceOf: TypeError,
        message: expectedMessage
    });

    t.throws(() => new MapCollection(null, DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(MAP_MOCK, null, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK, null, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, null), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('throws if called with invalid mapJson', t => {
    const expectedMessage = /Invalid mapJson passed to MapCollection constructor\. Expected a non-empty array, but received .*/;

    t.throws(() => new MapCollection({}, DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection([], DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(42, DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection('threeve', DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(false, DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('throws if called with invalid defaultMaps', t => {
    const expectedMessage = /Invalid defaultMaps passed to MapCollection constructor\. Expected a non-empty array, but received .*/;

    t.throws(() => new MapCollection(MAP_MOCK, {}, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(MAP_MOCK, [], airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(MAP_MOCK, 42, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(MAP_MOCK, 'threeve', airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(MAP_MOCK, false, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('throws if called with invalid airportPositionModel', t => {
    const expectedMessage = /Invalid airportPositionModel passed to MapCollection constructor\. Expected instance of StaticPositionModel, but received .*/;

    t.throws(() => new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK, {}, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK, [], magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK, 42, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK, 'threeve', magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapCollection(MAP_MOCK, DEFAULT_MAPS_MOCK, false, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('throws if called with a legacy map', t => {
    t.throws(() => new MapCollection(MAP_MOCK_LEGACY, DEFAULT_MAPS_MOCK, airportPositionFixtureKCYHZ, magneticNorth));
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
