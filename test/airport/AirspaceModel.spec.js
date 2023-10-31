import ava from 'ava';

import AirspaceModel from '../../src/assets/scripts/client/airport/AirspaceModel';
import DynamicPositionModel from '../../src/assets/scripts/client/base/DynamicPositionModel';
import StaticPositionModel from '../../src/assets/scripts/client/base/StaticPositionModel';
import { AIRSPACE_MOCK, AIRSPACE_MOCK_WITH_CLOSING_ENTRY } from './_mocks/airspaceModelMocks';

const currentPosition = ['N36.080056', 'W115.15225', '2181 ft'];
const magneticNorth = 11.9;
const airportPositionFixtureKSFO = new StaticPositionModel(currentPosition, null, magneticNorth);

ava('throws if called with invalid parameters', t => {
    t.throws(() => new AirspaceModel());
    t.throws(() => new AirspaceModel(AIRSPACE_MOCK));
    t.throws(() => new AirspaceModel(null, airportPositionFixtureKSFO, magneticNorth));
    t.throws(() => new AirspaceModel(AIRSPACE_MOCK, null, magneticNorth));
    t.throws(() => new AirspaceModel(AIRSPACE_MOCK, airportPositionFixtureKSFO));
    t.throws(() => new AirspaceModel(AIRSPACE_MOCK, airportPositionFixtureKSFO));
});

ava('does not throw when instantiated with a 0 magneticNorth', t => {
    t.notThrows(() => new AirspaceModel(AIRSPACE_MOCK, airportPositionFixtureKSFO, 0));
})

ava('accepts an airspace object that is used to set the instance properties', t => {
    const model = new AirspaceModel(AIRSPACE_MOCK, airportPositionFixtureKSFO, magneticNorth);

    t.false(typeof model._id === 'undefined');
    t.true(model.floor === (AIRSPACE_MOCK.floor * 100));
    t.true(model.ceiling === (AIRSPACE_MOCK.ceiling * 100));
    t.true(model.airspace_class === AIRSPACE_MOCK.airspace_class);
    t.true(model.poly.length === AIRSPACE_MOCK.poly.length);
});

ava('removes last element in poly array if it is the same as the first element', t => {
    const model = new AirspaceModel(AIRSPACE_MOCK_WITH_CLOSING_ENTRY, airportPositionFixtureKSFO, magneticNorth);

    t.false(model.poly.length === AIRSPACE_MOCK_WITH_CLOSING_ENTRY.poly.length);
    t.true(model.poly.length === AIRSPACE_MOCK_WITH_CLOSING_ENTRY.poly.length - 1);
});

ava('.isPointInside() returns true if the specified point is inside the lateral and vertical boundaries', t => {
    const model = new AirspaceModel(AIRSPACE_MOCK_WITH_CLOSING_ENTRY, airportPositionFixtureKSFO, magneticNorth);
    const airportPosition = airportPositionFixtureKSFO;
    const airportMagNorth = airportPositionFixtureKSFO.magneticNorth;
    const coordinatesMock = [36, -114.5];
    const positionMock = DynamicPositionModel.calculateRelativePosition(coordinatesMock, airportPosition, airportMagNorth);
    const altitudeMock = 19000;
    const result = model.isPointInside(positionMock, altitudeMock);

    t.true(result);
});

ava('.isPointInside() returns false if the specified point is within the lateral boundaries but not within the vertical boundaries', t => {
    const model = new AirspaceModel(AIRSPACE_MOCK_WITH_CLOSING_ENTRY, airportPositionFixtureKSFO, magneticNorth);
    const airportPosition = airportPositionFixtureKSFO;
    const airportMagNorth = airportPositionFixtureKSFO.magneticNorth;
    const coordinatesMock = [36, -114.5];
    const positionMock = DynamicPositionModel.calculateRelativePosition(coordinatesMock, airportPosition, airportMagNorth);
    const altitudeMock = 19001;
    const result = model.isPointInside(positionMock, altitudeMock);

    t.false(result);
});

ava('.isPointInside() returns false if the specified point is within vertical boundaries but not within the lateral boundaries', t => {
    const model = new AirspaceModel(AIRSPACE_MOCK_WITH_CLOSING_ENTRY, airportPositionFixtureKSFO, magneticNorth);
    const airportPosition = airportPositionFixtureKSFO;
    const airportMagNorth = airportPositionFixtureKSFO.magneticNorth;
    const coordinatesMock = [36, -114];
    const positionMock = DynamicPositionModel.calculateRelativePosition(coordinatesMock, airportPosition, airportMagNorth);
    const altitudeMock = 19000;
    const result = model.isPointInside(positionMock, altitudeMock);

    t.false(result);
});
