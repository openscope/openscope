import ava from 'ava';

import AreaModel from '../../src/assets/scripts/base/AreaModel';
import PositionModel from '../../src/assets/scripts/base/PositionModel';
import { AIRSPACE_MOCK, AIRSPACE_MOCK_WITH_CLOSING_ENTRY } from './_mocks/areaModelMocks';

const currentPosition = ['N36.080056', 'W115.15225', '2181ft'];
const magneticNorth = 11.9;
const airportPositionFixture = new PositionModel(currentPosition, null, magneticNorth);

ava('AreaModel throws if called with invalid parameters', t => {
    t.throws(() => new AreaModel());
    t.throws(() => new AreaModel(AIRSPACE_MOCK));
    t.throws(() => new AreaModel(null, airportPositionFixture, magneticNorth));
    t.throws(() => new AreaModel(AIRSPACE_MOCK, null, magneticNorth));
    t.throws(() => new AreaModel(AIRSPACE_MOCK, airportPositionFixture));
    t.throws(() => new AreaModel(AIRSPACE_MOCK, airportPositionFixture));
});

ava('AreaModel accepts an airspace object that is used to set the class properties', t => {
    const model = new AreaModel(AIRSPACE_MOCK, airportPositionFixture, magneticNorth);

    t.false(typeof model._id === 'undefined');
    t.true(model.floor === (AIRSPACE_MOCK.floor * 100));
    t.true(model.ceiling === (AIRSPACE_MOCK.ceiling * 100));
    t.true(model.airspace_class === AIRSPACE_MOCK.airspace_class);
    t.true(model.poly.length === AIRSPACE_MOCK.poly.length);
});

ava('AreaModel removes last element in poly array if it is the same as the first element', t => {
    const model = new AreaModel(AIRSPACE_MOCK_WITH_CLOSING_ENTRY, airportPositionFixture, magneticNorth);

    t.false(model.poly.length === AIRSPACE_MOCK_WITH_CLOSING_ENTRY.poly.length);
    t.true(model.poly.length === AIRSPACE_MOCK_WITH_CLOSING_ENTRY.poly.length - 1);
});
