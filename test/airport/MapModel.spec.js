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

ava('throws if called with missing parameters', t => {
    const expectedMessage = /Invalid parameter\(s\) passed to MapModel constructor\. Expected map, airportPosition and magneticNorth to be defined, but received .*/;

    t.throws(() => new MapModel(), {
        instanceOf: TypeError,
        message: expectedMessage
    });

    t.throws(() => new MapModel(MAP_MOCK), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel(airportPositionFixtureKCYHZ), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel(magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });

    t.throws(() => new MapModel(airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel(MAP_MOCK, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel(MAP_MOCK, airportPositionFixtureKCYHZ), {
        instanceOf: TypeError,
        message: expectedMessage
    });

    t.throws(() => new MapModel(null, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel(MAP_MOCK, null, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel(MAP_MOCK, airportPositionFixtureKCYHZ, null), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('throws if called with invalid map', t => {
    const expectedMessage = /Invalid map passed to MapModel constructor\. Expected a non-empty object, but received .*/;

    t.throws(() => new MapModel({}, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel([], airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel(42, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel('threeve', airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel(false, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('throws if called with a map with no name', t => {
    const expectedMessage = /Invalid map passed to MapModel constructor\. Expected map.name to be a string, but received .*/;

    t.throws(() => new MapModel(MAP_MOCK_NO_NAME, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('throws if called with a map with invalid lines', t => {
    const expectedMessage = /Invalid map passed to MapModel constructor\. Expected map.lines to be a non-empty array, but received .*/;

    t.throws(() => new MapModel(MAP_MOCK_NO_LINES, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel(MAP_MOCK_EMPTY_LINES, airportPositionFixtureKCYHZ, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('throws if called with invalid airportPosition', t => {
    const expectedMessage = /Invalid airportPosition passed to MapModel constructor\. Expected instance of StaticPositionModel, but received .*/;

    t.throws(() => new MapModel(MAP_MOCK, {}, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel(MAP_MOCK, [], magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel(MAP_MOCK, 42, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel(MAP_MOCK, 'threeve', magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => new MapModel(MAP_MOCK, false, magneticNorth), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('does not throw when called with valid data', t => {
    t.notThrows(() => new MapModel(MAP_MOCK, airportPositionFixtureKCYHZ, magneticNorth));
});

ava('accepts a map object that is used to set the instance properties', t => {
    const model = new MapModel(MAP_MOCK, airportPositionFixtureKCYHZ, magneticNorth);

    t.not(typeof model._id, 'undefined');
    t.is(model.name, MAP_MOCK.name);
    t.is(model.lines.length, MAP_MOCK.lines.length);
});
