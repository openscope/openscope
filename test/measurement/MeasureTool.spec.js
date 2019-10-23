import ava from 'ava';

import {
    createAirportControllerFixture
} from '../fixtures/airportFixtures';
import {
    createNavigationLibraryFixture
} from '../fixtures/navigationLibraryFixtures';
import AircraftModel from '../../src/assets/scripts/client/aircraft/AircraftModel';
import MeasureTool, { MEASURE_TOOL_STYLE } from '../../src/assets/scripts/client/measurement/MeasureTool';
import FixCollection from '../../src/assets/scripts/client/navigationLibrary/FixCollection';
import MeasureLegModel from '../../src/assets/scripts/client/measurement/MeasureLegModel';
import { ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK } from '../aircraft/_mocks/aircraftMocks';

const CURSOR_POSITION = [500, 20];

function createAircaft() {
    return new AircraftModel(ARRIVAL_AIRCRAFT_INIT_PROPS_MOCK);
}

ava.before(() => {
    createNavigationLibraryFixture();
    createAirportControllerFixture();
});

ava.beforeEach(() => {
    MeasureTool.reset();
});

ava.serial('.addPoint() throws when #isMeasuring is not set', (t) => {
    t.throws(() => MeasureTool.addPoint(CURSOR_POSITION));
});

ava.serial('.removeLastPoint() throws when #isMeasuring is not set', (t) => {
    t.throws(() => MeasureTool.removeLastPoint());
});

ava.serial('.updateLastPoint() throws when #isMeasuring is not set', (t) => {
    t.throws(() => MeasureTool.updateLastPoint(CURSOR_POSITION));
});

ava.serial('.addPoint() throws when point value is invalid', (t) => {
    MeasureTool.isMeasuring = true;

    t.throws(() => MeasureTool.addPoint({}));
    t.throws(() => MeasureTool.addPoint(null));
    t.notThrows(() => MeasureTool.addPoint(FixCollection.findFixByName('BAKRR')));
    t.notThrows(() => MeasureTool.updateLastPoint(createAircaft()));
    t.notThrows(() => MeasureTool.addPoint(CURSOR_POSITION));
});

ava.serial('.updateLastPoint() throws when point value is invalid', (t) => {
    MeasureTool.isMeasuring = true;

    t.throws(() => MeasureTool.updateLastPoint({}));
    t.throws(() => MeasureTool.updateLastPoint(null));
    t.notThrows(() => MeasureTool.updateLastPoint(FixCollection.findFixByName('BAKRR')));
    t.notThrows(() => MeasureTool.updateLastPoint(createAircaft()));
    t.notThrows(() => MeasureTool.updateLastPoint(CURSOR_POSITION));
});

ava.serial('.addPoint() sets the correct flags', (t) => {
    MeasureTool.isMeasuring = true;
    MeasureTool.addPoint(FixCollection.findFixByName('DBIGE'));

    t.is(MeasureTool.hasStarted, true);
    t.is(MeasureTool.hasLegs, false);
    t.is(MeasureTool.isMeasuring, true);
});

ava.serial('.reset() clears the flags to their initial state', (t) => {
    MeasureTool.isMeasuring = true;
    MeasureTool.addPoint(FixCollection.findFixByName('BAKRR'));
    MeasureTool.addPoint(FixCollection.findFixByName('DBIGE'));
    MeasureTool.reset();

    t.is(MeasureTool.hasStarted, false);
    t.is(MeasureTool.hasLegs, false);
    t.is(MeasureTool.isMeasuring, false);
});

ava.serial('buildPathInfo returns null when there are no valid legs', (t) => {
    const bakrr = FixCollection.findFixByName('BAKRR');

    MeasureTool.isMeasuring = true;
    MeasureTool.addPoint(bakrr);
    const pathInfo = MeasureTool.buildPathInfo();

    t.is(pathInfo, null);
});

ava.serial('.buildPathInfo builds a correct MeasureLegModel from FixModel points', (t) => {
    const bakrr = FixCollection.findFixByName('BAKRR');
    const dbige = FixCollection.findFixByName('DBIGE');

    MeasureTool.isMeasuring = true;
    MeasureTool.addPoint(bakrr);
    MeasureTool.addPoint(dbige);

    const { initialTurn, firstLeg } = MeasureTool.buildPathInfo();
    const leg1 = firstLeg.next;

    t.is(initialTurn, null);
    t.true(firstLeg instanceof MeasureLegModel);
    t.is(firstLeg.previous, null);
    t.is(firstLeg.startPoint, null);
    t.is(leg1.next, null);

    t.deepEqual(leg1.startPoint, bakrr.relativePosition);
    t.deepEqual(leg1.endPoint, dbige.relativePosition);
    t.not(leg1.midPoint, null);
    t.not(leg1.bearing, 0);
    t.not(leg1.distance, 0);
    t.is(leg1.labels.length, 1);
    t.is(leg1.radius, 0);
});

ava.serial('.buildPathInfo builds a correct MeasureLegModel from mixed points', (t) => {
    const bakrr = FixCollection.findFixByName('BAKRR');
    const aircraft = createAircaft();
    aircraft.groundSpeed = 180;

    MeasureTool.isMeasuring = true;
    /* eslint-disable no-bitwise */
    MeasureTool.style = MEASURE_TOOL_STYLE.INITIAL_TURN | MEASURE_TOOL_STYLE.ARCED;
    MeasureTool.addPoint(aircraft);
    MeasureTool.addPoint(bakrr);
    MeasureTool.addPoint(CURSOR_POSITION);

    const { initialTurn, firstLeg } = MeasureTool.buildPathInfo();
    const leg1 = firstLeg.next;
    const leg2 = leg1.next;

    t.not(initialTurn, null);
    t.true(firstLeg instanceof MeasureLegModel);
    t.is(firstLeg.previous, null);
    t.is(leg2.next, null);

    t.not(initialTurn.turnRadius, 0);
    t.not(leg1.radius, 0);
    t.is(leg2.radius, 0);
});

ava.serial('.removeLastPoint() removes a point as expected', (t) => {
    MeasureTool.isMeasuring = true;
    MeasureTool.addPoint(FixCollection.findFixByName('BAKRR'));
    MeasureTool.addPoint(FixCollection.findFixByName('DBIGE'));
    MeasureTool.addPoint(CURSOR_POSITION);

    t.is(MeasureTool._points.length, 3);

    MeasureTool.removeLastPoint();
    t.is(MeasureTool._points.length, 2);

    MeasureTool.removeLastPoint();
    t.is(MeasureTool._points.length, 2);
});
