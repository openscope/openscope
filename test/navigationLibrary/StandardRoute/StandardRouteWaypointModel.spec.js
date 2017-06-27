import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';
import StandardRouteWaypointModel from '../../../src/assets/scripts/client/navigationLibrary/StandardRoute/StandardRouteWaypointModel';
import FixCollection from '../../../src/assets/scripts/client/navigationLibrary/Fix/FixCollection';
import WaypointModel from '../../../src/assets/scripts/client/aircraft/FlightManagementSystem/WaypointModel';
import { FIX_LIST_MOCK } from '../Fix/_mocks/fixMocks';
import { airportPositionFixtureKSFO } from '../../fixtures/airportFixtures';
import { INVALID_NUMBER } from '../../../src/assets/scripts/client/constants/globalConstants';

const NAME_MOCK = 'BIKKR';
const RESTRICTIONS_MOCK = 'A80+|S250';
const ROUTE_WAYPOINT_MOCK = [NAME_MOCK, RESTRICTIONS_MOCK];
const NAME_FLY_OVER_MOCK = '^BIKKR';

ava.before(() => FixCollection.addItems(FIX_LIST_MOCK, airportPositionFixtureKSFO));
ava.after(() => FixCollection.removeItems());

ava('StandardRouteWaypointModel exits early when instantiated without parameters', t => {
    t.notThrows(() => new StandardRouteWaypointModel());

    const model = new StandardRouteWaypointModel();

    t.true(typeof model.name === 'undefined');
});

ava('sets only `name` when provided a string', t => {
    const model = new StandardRouteWaypointModel(NAME_MOCK);

    t.true(typeof model._id === 'string');
    t.true(model.name === NAME_MOCK);
    t.true(model.altitudeMaximum === INVALID_NUMBER);
    t.true(model.altitudeMinimum === INVALID_NUMBER);
    t.true(model.speedMaximum === INVALID_NUMBER);
    t.true(model.speedMinimum === INVALID_NUMBER);
});

ava('.clonePositionFromFix() does not throw when no fix exists', t => {
    const model = new StandardRouteWaypointModel('ABCD');

    t.notThrows(() => model.clonePositionFromFix());
});

ava('does not call ._applyRestrictions() when provided a string', t => {
    const model = new StandardRouteWaypointModel(NAME_MOCK);
    const spy = sinon.spy(model, '_applyRestrictions');

    model._init(NAME_MOCK);

    t.true(spy.callCount === 0);
});

ava('calls ._applyRestrictions() when provided and array', t => {
    const model = new StandardRouteWaypointModel(ROUTE_WAYPOINT_MOCK);
    const spy = sinon.spy(model, '_applyRestrictions');

    model._init(ROUTE_WAYPOINT_MOCK);

    t.true(spy.callCount === 1);
});

ava('.toWaypointModel() returns a new instance of a WaypointModel', t => {
    const model = new StandardRouteWaypointModel(ROUTE_WAYPOINT_MOCK);
    const result = model.toWaypointModel();

    t.true(result instanceof WaypointModel);
    t.true(result.name === model.name.toLowerCase());
    t.true(_isArray(result.relativePosition));
    t.true(result.altitudeMaximum === INVALID_NUMBER);
    t.true(result.altitudeMinimum === 8000);
    t.true(result.speedMaximum === 250);
    t.true(result.speedMinimum === 250);
});

ava('._applyRestrictions() applies ranged altitude restrictions correctly', (t) => {
    const modelWithAltitude = new StandardRouteWaypointModel(['BAKRR', 'A100+|A140-']);

    t.true(modelWithAltitude.altitudeMinimum === 10000);
    t.true(modelWithAltitude.altitudeMaximum === 14000);
});

ava('._applyRestrictions() applies ranged speed restrictions correctly', (t) => {
    const modelWithSpeed = new StandardRouteWaypointModel(['BAKRR', 'S210+|S250-']);

    t.true(modelWithSpeed.speedMinimum === 210);
    t.true(modelWithSpeed.speedMaximum === 250);
});

ava('._applyRestrictions() applies ranged altitude and ranged speed restrictions correctly for a single fix', (t) => {
    const modelWithAltitudeAndSpeed = new StandardRouteWaypointModel(['BAKRR', 'A100+|A140-|S210+|S250-']);

    t.true(modelWithAltitudeAndSpeed.altitudeMinimum === 10000);
    t.true(modelWithAltitudeAndSpeed.altitudeMaximum === 14000);
    t.true(modelWithAltitudeAndSpeed.speedMinimum === 210);
    t.true(modelWithAltitudeAndSpeed.speedMaximum === 250);
});

ava('._applyRestrictions() applies non-ranged "AT" altitude restrictions correctly', (t) => {
    const modelWithAltitudeRange = new StandardRouteWaypointModel(['BAKRR', 'A100']);

    t.true(modelWithAltitudeRange.altitudeMinimum === 10000);
    t.true(modelWithAltitudeRange.altitudeMaximum === 10000);
});

ava('._applyRestrictions() applies non-ranged "AT" speed restrictions correctly', (t) => {
    const modelWithSpeedRange = new StandardRouteWaypointModel(['BAKRR', 'S210']);

    t.true(modelWithSpeedRange.speedMinimum === 210);
    t.true(modelWithSpeedRange.speedMaximum === 210);
});

ava('._applyRestrictions() applies non-ranged "AT" altitude and non-ranged "AT" speed restrictions correctly for a single fix', (t) => {
    const modelWithAltitudeRangeAndSpeedRange = new StandardRouteWaypointModel(['BAKRR', 'A100|S210']);

    t.true(modelWithAltitudeRangeAndSpeedRange.altitudeMinimum === 10000);
    t.true(modelWithAltitudeRangeAndSpeedRange.altitudeMaximum === 10000);
    t.true(modelWithAltitudeRangeAndSpeedRange.speedMinimum === 210);
    t.true(modelWithAltitudeRangeAndSpeedRange.speedMaximum === 210);
});

ava('._applyRestrictions() applies non-ranged "AT/ABOVE" or "AT/BELOW" altitude restrictions correctly', (t) => {
    const modelWithAltitude = new StandardRouteWaypointModel(['BAKRR', 'A100+']);

    t.true(modelWithAltitude.altitudeMinimum === 10000);
    t.true(modelWithAltitude.altitudeMaximum === INVALID_NUMBER);
});

ava('._applyRestrictions() applies non-ranged "AT/ABOVE" or "AT/BELOW" speed restrictions correctly', (t) => {
    const modelWithSpeed = new StandardRouteWaypointModel(['BAKRR', 'S210-']);

    t.true(modelWithSpeed.speedMinimum === INVALID_NUMBER);
    t.true(modelWithSpeed.speedMaximum === 210);
});

ava('._applyRestrictions() applies non-ranged "AT/ABOVE" or "AT/BELOW" altitude and non-ranged "AT/ABOVE" or "AT/BELOW" restrictions correctly for a single fix', (t) => {
    const modelWithAltitudeAndSpeed = new StandardRouteWaypointModel(['BAKRR', 'A100-|S210+']);

    t.true(modelWithAltitudeAndSpeed.altitudeMinimum === INVALID_NUMBER);
    t.true(modelWithAltitudeAndSpeed.altitudeMaximum === 10000);
    t.true(modelWithAltitudeAndSpeed.speedMinimum === 210);
    t.true(modelWithAltitudeAndSpeed.speedMaximum === INVALID_NUMBER);
});

ava('._applyRestrictions() returns early if no paramater is received', t => {
    const model = new StandardRouteWaypointModel(['BAKRR']);

    model._applyRestrictions();

    t.true(model.altitudeMaximum === INVALID_NUMBER);
    t.true(model.speedMaximum === INVALID_NUMBER);
    t.true(model.speedMinimum === INVALID_NUMBER);
});

ava('#_isFlyOverWaypoint is true for fix prepended by fly-over character', (t) => {
    const model = new StandardRouteWaypointModel(NAME_FLY_OVER_MOCK);

    t.true(model._isFlyOverWaypoint);
});
