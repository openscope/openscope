import ava from 'ava';

import MapCollection from '../../src/assets/scripts/client/airport/MapCollection';
import StaticPositionModel from '../../src/assets/scripts/client/base/StaticPositionModel';
import { MAP_MOCK, MAP_MOCK_LEGACY } from './_mocks/mapCollectionlMocks';

const currentPosition = ['N44.879722', 'W063.510278', '2181ft'];
const magneticNorth = -18;
const airportPositionFixtureKCYHZ = new StaticPositionModel(currentPosition, null, magneticNorth);

ava('throws if called with invalid parameters', t => {
  t.throws(() => new MapCollection());
  t.throws(() => new MapCollection(MAP_MOCK));
  t.throws(() => new MapCollection(null, airportPositionFixtureKCYHZ, magneticNorth));
  t.throws(() => new MapCollection(MAP_MOCK, null, magneticNorth));
  t.throws(() => new MapCollection(MAP_MOCK, airportPositionFixtureKCYHZ));
});

ava('does not throw when instantiated with a 0 magneticNorth', t => {
  t.notThrows(() => new MapCollection(MAP_MOCK, airportPositionFixtureKCYHZ, 0));
});

ava('accepts a map array that is used to set the instance properties', t => {
  const model = new MapCollection(MAP_MOCK, airportPositionFixtureKCYHZ, magneticNorth);

  t.not(typeof model._id, 'undefined');
  t.is(model.length, MAP_MOCK.length);
  t.is(model.getMapNames().length, model.length);
  t.true(model.hasMaps);
  t.true(model.hasVisibleMaps);

  const first = model.maps[0];

  t.is(first.name, MAP_MOCK[0].name);
  t.is(first.lines.length, MAP_MOCK[0].lines.length);
  t.true(first.hasLines);
});

ava('accepts a legacy map object that is used to set the instance properties', t => {
  const model = new MapCollection(MAP_MOCK_LEGACY, airportPositionFixtureKCYHZ, magneticNorth);

  t.not(typeof model._id, 'undefined');
  t.is(model.length, Object.keys(MAP_MOCK_LEGACY).length);
  t.is(model.getMapNames().length, model.length);
  t.true(model.hasMaps);
  t.true(model.hasVisibleMaps);

  const first = model.maps[0];

  t.is(first.name, `Legacy-${Object.keys(MAP_MOCK_LEGACY)[0]}`);
  t.is(first.lines.length, MAP_MOCK_LEGACY.base.length);
  t.true(first.hasLines);
});
