import ava from 'ava';

import {
    createAirportControllerFixture
} from '../fixtures/airportFixtures';
import {
    createNavigationLibraryFixture
} from '../fixtures/navigationLibraryFixtures';
import AircraftModel from '../../src/assets/scripts/client/aircraft/AircraftModel';
import MeasureTool from '../../src/assets/scripts/client/measurement/MeasureTool';
import FixCollection from '../../src/assets/scripts/client/navigationLibrary/FixCollection';
import MeasureLegModel from '../../src/assets/scripts/client/measurement/MeasureLegModel';
import { MEASURE_TOOL_STYLE } from '../../src/assets/scripts/client/constants/inputConstants';
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

ava.serial('.removePreviousPoint() throws when #isMeasuring is not set', (t) => {
    t.throws(() => MeasureTool.removePreviousPoint());
});

ava.serial('.updateLastPoint() throws when #isMeasuring is not set', (t) => {
    t.throws(() => MeasureTool.updateLastPoint(CURSOR_POSITION));
});

ava.serial('.addPoint() throws when point value is invalid', (t) => {
    MeasureTool.startNewPath();

    t.throws(() => MeasureTool.addPoint({}));
    t.throws(() => MeasureTool.addPoint(null));
    t.notThrows(() => MeasureTool.addPoint(FixCollection.findFixByName('BAKRR')));
    t.notThrows(() => MeasureTool.updateLastPoint(createAircaft()));
    t.notThrows(() => MeasureTool.addPoint(CURSOR_POSITION));
});

ava.serial('.startNewPath() throws when the current path hasn\'t been ended.', (t) => {
    t.notThrows(() => MeasureTool.startNewPath());
    t.throws(() => MeasureTool.startNewPath());
});

ava.serial('.updateLastPoint() throws when point value is invalid', (t) => {
    MeasureTool.startNewPath();

    t.throws(() => MeasureTool.updateLastPoint({}));
    t.throws(() => MeasureTool.updateLastPoint(null));
    t.notThrows(() => MeasureTool.updateLastPoint(FixCollection.findFixByName('BAKRR')));
    t.notThrows(() => MeasureTool.updateLastPoint(createAircaft()));
    t.notThrows(() => MeasureTool.updateLastPoint(CURSOR_POSITION));
});

ava.serial('hasPaths returns correct value', (t) => {
    t.false(MeasureTool.hasPaths);

    MeasureTool.startNewPath();

    t.true(MeasureTool.hasPaths);
});

ava.serial('.addPoint() sets the correct flags', (t) => {
    MeasureTool.startNewPath();

    t.true(MeasureTool.isMeasuring);
    t.false(MeasureTool.hasStarted);

    MeasureTool.addPoint(FixCollection.findFixByName('DBIGE'));

    t.true(MeasureTool.isMeasuring);
    t.true(MeasureTool.hasStarted);

    MeasureTool.endPath();

    t.false(MeasureTool.isMeasuring);
    t.false(MeasureTool.hasStarted);
});

ava.serial('.buildPathInfo() returns an empty array when there are no saved points', (t) => {
    const bakrr = FixCollection.findFixByName('BAKRR');

    MeasureTool.startNewPath();
    MeasureTool.addPoint(bakrr);
    MeasureTool.endPath();

    const pathInfo = MeasureTool.buildPathInfo();

    t.deepEqual(pathInfo, []);
});

ava.serial('.buildPathInfo() returns an empty array when there is only one saved point', (t) => {
    const bakrr = FixCollection.findFixByName('BAKRR');

    MeasureTool.startNewPath();
    MeasureTool.addPoint(bakrr);
    MeasureTool.addPoint(CURSOR_POSITION);
    MeasureTool.endPath();

    const pathInfo = MeasureTool.buildPathInfo();

    t.deepEqual(pathInfo, []);
});

ava.serial('.buildPathInfo() builds a correct MeasureLegModel from FixModel points', (t) => {
    const bakrr = FixCollection.findFixByName('BAKRR');
    const dbige = FixCollection.findFixByName('DBIGE');

    MeasureTool.startNewPath();
    MeasureTool.addPoint(bakrr);
    MeasureTool.addPoint(dbige);
    MeasureTool.addPoint(CURSOR_POSITION);
    MeasureTool.endPath();

    const [pathInfo] = MeasureTool.buildPathInfo();
    const { initialTurn, firstLeg } = pathInfo;

    t.is(initialTurn, null);
    t.true(firstLeg instanceof MeasureLegModel);
    t.not(firstLeg.previous, null);
    t.not(firstLeg.startPoint, null);
    t.is(firstLeg.next, null);

    t.deepEqual(firstLeg.startPoint, bakrr.relativePosition);
    t.deepEqual(firstLeg.endPoint, dbige.relativePosition);
    t.not(firstLeg.midPoint, null);
    t.not(firstLeg.bearing, 0);
    t.not(firstLeg.distance, 0);
    t.is(firstLeg.labels.length, 1);
    t.is(firstLeg.radius, 0);
});

ava.serial('.buildPathInfo() builds a correct MeasureLegModel from mixed points', (t) => {
    const bakrr = FixCollection.findFixByName('BAKRR');
    const aircraft = createAircaft();
    aircraft.groundSpeed = 180;

    MeasureTool.startNewPath();
    MeasureTool.setStyle(MEASURE_TOOL_STYLE.ALL_ARCED);
    MeasureTool.addPoint(aircraft);
    MeasureTool.addPoint(bakrr);
    MeasureTool.addPoint(CURSOR_POSITION); // will be kept
    MeasureTool.addPoint(CURSOR_POSITION); // will be removed
    MeasureTool.endPath();

    const [pathInfo] = MeasureTool.buildPathInfo();
    const { initialTurn, firstLeg } = pathInfo;
    const leg1 = firstLeg.next;

    t.not(initialTurn, null);
    t.true(firstLeg instanceof MeasureLegModel);
    t.is(leg1.next, null);

    t.not(initialTurn.turnRadius, 0);
    t.not(firstLeg.radius, 0);
    t.is(leg1.radius, 0);
});

ava.serial('.removePreviousPoint() removes the second-to-last point in the current path', (t) => {
    const bakrr = FixCollection.findFixByName('BAKRR');
    const dbige = FixCollection.findFixByName('DBIGE');

    MeasureTool.startNewPath();
    MeasureTool.addPoint(bakrr);
    MeasureTool.addPoint(dbige);
    MeasureTool.addPoint(CURSOR_POSITION);

    t.is(MeasureTool._currentPath._points.length, 3);

    MeasureTool.removePreviousPoint();

    t.is(MeasureTool._currentPath._points.length, 2);
    t.deepEqual(MeasureTool._currentPath._points, [bakrr, CURSOR_POSITION]);
});

ava.serial('.reset() clears the flags to their initial state', (t) => {
    MeasureTool.startNewPath();
    MeasureTool.addPoint(FixCollection.findFixByName('BAKRR'));
    MeasureTool.addPoint(FixCollection.findFixByName('DBIGE'));
    MeasureTool.endPath();
    MeasureTool.reset();

    t.is(MeasureTool.hasStarted, false);
    t.is(MeasureTool.isMeasuring, false);
});

ava.serial('.setStyle() correctly sets the _style property', (t) => {
    MeasureTool.setStyle(MEASURE_TOOL_STYLE.STRAIGHT);
    t.is(MeasureTool._style, MEASURE_TOOL_STYLE.STRAIGHT);

    MeasureTool.setStyle(MEASURE_TOOL_STYLE.ARC_TO_NEXT);
    t.is(MeasureTool._style, MEASURE_TOOL_STYLE.ARC_TO_NEXT);

    MeasureTool.setStyle(MEASURE_TOOL_STYLE.ALL_ARCED);
    t.is(MeasureTool._style, MEASURE_TOOL_STYLE.ALL_ARCED);

    MeasureTool.setStyle('a random value');
    t.is(MeasureTool._style, MEASURE_TOOL_STYLE.STRAIGHT);
});

ava.serial('.updateLastPoint() adds a new point if there is no point to update', (t) => {
    MeasureTool.startNewPath();
    MeasureTool.addPoint(FixCollection.findFixByName('BAKRR'));
    MeasureTool.updateLastPoint(CURSOR_POSITION);

    t.is(MeasureTool._currentPath._points.length, 2);
});

ava.serial('.updateLastPoint() updates the last point', (t) => {
    MeasureTool.startNewPath();
    MeasureTool.addPoint(FixCollection.findFixByName('BAKRR'));
    MeasureTool.addPoint(FixCollection.findFixByName('DBIGE'));
    MeasureTool.updateLastPoint(CURSOR_POSITION);

    t.is(MeasureTool._currentPath._points.length, 2);
});
