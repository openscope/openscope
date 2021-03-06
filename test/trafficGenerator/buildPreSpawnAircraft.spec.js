import ava from 'ava';
import sinon from 'sinon';
import _floor from 'lodash/floor';
import RouteModel from '../../src/assets/scripts/client/aircraft/FlightManagementSystem/RouteModel';
import {
    _calculateOffsetsToEachWaypointInRoute,
    _calculateAltitudeOffsets,
    _calculateAltitudeAtOffset,
    _calculateIdealSpawnAltitudeAtOffset,
    buildPreSpawnAircraft
} from '../../src/assets/scripts/client/trafficGenerator/buildPreSpawnAircraft';
import { airportModelFixture } from '../fixtures/airportFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../fixtures/navigationLibraryFixtures';
import { ARRIVAL_PATTERN_MOCK } from './_mocks/spawnPatternMocks';

let sandbox;

ava.beforeEach(() => {
    sandbox = sinon.createSandbox();
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    sandbox.restore();
    resetNavigationLibraryFixture();
});

ava('_calculateOffsetsToEachWaypointInRoute() returns array of distances between waypoints, ignoring vector waypoints', (t) => {
    const routeModel = new RouteModel('PGS..MLF..OAL..KEPEC..BOACH..CHIPZ..#340');
    const waypointModelList = routeModel.waypoints;
    const expectedResult = [
        0,
        166.20954056162077,
        391.7193092657528,
        553.2190261558699,
        575.1449276267966,
        613.1666698503408
    ];
    const result = _calculateOffsetsToEachWaypointInRoute(waypointModelList);

    t.deepEqual(result, expectedResult);
});

ava('_calculateAltitudeOffsets returns an array of the altitudes required and their ATDs', (t) => {
    const routeModel = new RouteModel('PGS.TYSSN4.KLAS01L');
    const waypointModelList = routeModel.waypoints;
    const waypointOffsetMap = _calculateOffsetsToEachWaypointInRoute(waypointModelList);
    const expectedResult = [
        [18.958610430426404, 19000],
        [41.52033243401482, 12000],
        [60.46996764011041, 10000],
        [70.68723901280046, 8000]
    ];
    const result = _calculateAltitudeOffsets(waypointModelList, waypointOffsetMap);

    t.deepEqual(result, expectedResult);
});

ava('_calculateAltitudeAtOffset throws when there are no altitude restrictions ahead nor behind', (t) => {
    const altitudesAtOffsets = [];
    const offsetDistanceMock = 25;

    t.throws(() => _calculateAltitudeAtOffset(altitudesAtOffsets, offsetDistanceMock));
});

ava('_calculateAltitudeAtOffset returns altitude of previous restriction when there are restrictions behind but none ahead', (t) => {
    const altitudesAtOffsets = [
        [18.958610430426404, 19000],
        [41.52033243401482, 12000],
        [60.46996764011041, 10000],
        [70.68723901280046, 8000]
    ];
    const offsetDistanceMock = 75;
    const expectedResult = 8000;
    const result = _calculateAltitudeAtOffset(altitudesAtOffsets, offsetDistanceMock);

    t.true(result === expectedResult);
});

ava('_calculateAltitudeAtOffset returns altitude of next restriction when there are restrictions ahead but none behind', (t) => {
    const altitudesAtOffsets = [
        [18.958610430426404, 19000],
        [41.52033243401482, 12000],
        [60.46996764011041, 10000],
        [70.68723901280046, 8000]
    ];
    const offsetDistanceMock = 15;
    const expectedResult = 19000;
    const result = _calculateAltitudeAtOffset(altitudesAtOffsets, offsetDistanceMock);

    t.true(result === expectedResult);
});

ava('_calculateAltitudeAtOffset returns the interpolated altitude along the optimal descent path', (t) => {
    const altitudesAtOffsets = [
        [18.958610430426404, 19000],
        [41.52033243401482, 12000]
    ];
    const offsetDistanceMock = (18.958610430426404 + 41.52033243401482) / 2;
    const expectedResult = _floor((19000 + 12000) / 2, -3);
    const result = _calculateAltitudeAtOffset(altitudesAtOffsets, offsetDistanceMock);

    t.true(result === expectedResult);
});

ava('_calculateIdealSpawnAltitudeAtOffset() returns an interpolated altitude based on available descent distance to boundary when no restrictions exist', (t) => {
    const altitudesAtOffsets = [];
    const spawnAltitudeMock = 23000;
    const airspaceCeilingMock = 11000;
    const spawnSpeedMock = 360; // 6 miles per minute
    const totalDistanceMock = 60; // 10 minutes to airspace boundary (at 6mpm)
    const offsetDistanceMock = 18; // 7 minute to airspace boundary (at 6mpm)
    const expectedResult = airspaceCeilingMock + 7000; // 1000fpm descent rate for 1 minute
    const result = _calculateIdealSpawnAltitudeAtOffset(altitudesAtOffsets, offsetDistanceMock, spawnSpeedMock, spawnAltitudeMock, totalDistanceMock, airspaceCeilingMock);

    t.true(expectedResult === result);
});

ava('_calculateIdealSpawnAltitudeAtOffset() returns an interpolated altitude based on available descent distance to first altitude restriction', (t) => {
    const altitudesAtOffsets = [
        [18.958610430426404, 19000],
        [41.52033243401482, 12000],
        [60.46996764011041, 10000],
        [70.68723901280046, 8000]
    ];
    const spawnAltitudeMock = 23000;
    const airspaceCeilingMock = 11000;
    const spawnSpeedMock = 360;
    const totalDistanceMock = 85;
    const offsetDistanceMock = 6.5;
    const expectedResult = 21000;
    const result = _calculateIdealSpawnAltitudeAtOffset(altitudesAtOffsets, offsetDistanceMock, spawnSpeedMock, spawnAltitudeMock, totalDistanceMock, airspaceCeilingMock);

    t.true(expectedResult === result);
});

ava('_calculateIdealSpawnAltitudeAtOffset() returns an interpolated altitude based on a flat glidepath between restrictions when spawn point is beyond the first altitude restriction', (t) => {
    const altitudesAtOffsets = [
        [18.958610430426404, 19000],
        [41.52033243401482, 12000],
        [60.46996764011041, 10000],
        [70.68723901280046, 8000]
    ];
    const spawnAltitudeMock = 23000;
    const airspaceCeilingMock = 11000;
    const spawnSpeedMock = 360;
    const totalDistanceMock = 85;
    const offsetDistanceMock = 25;
    const expectedResult = 17000;
    const result = _calculateIdealSpawnAltitudeAtOffset(altitudesAtOffsets, offsetDistanceMock, spawnSpeedMock, spawnAltitudeMock, totalDistanceMock, airspaceCeilingMock);

    t.true(expectedResult === result);
});

ava('_calculateIdealSpawnAltitudeAtOffset() returns an appropriate altitude when a range of spawn altitudes is specified instead of a specific one', (t) => {
    const altitudesAtOffsets = [
        [18.958610430426404, 19000],
        [41.52033243401482, 12000],
        [60.46996764011041, 10000],
        [70.68723901280046, 8000]
    ];
    const spawnAltitudeMock = [23000, 23456];
    const airspaceCeilingMock = 11000;
    const spawnSpeedMock = 250;
    const totalDistanceMock = 85;
    const offsetDistanceMock = 0;
    const expectedResult = 23000;
    const result = _calculateIdealSpawnAltitudeAtOffset(altitudesAtOffsets, offsetDistanceMock, spawnSpeedMock, spawnAltitudeMock, totalDistanceMock, airspaceCeilingMock);

    t.true(expectedResult === result);
});

ava('buildPreSpawnAircraft() throws when called with missing parameters', (t) => {
    const expectedMessage = /Invalid parameter\(s\) passed to buildPreSpawnAircraft\. Expected spawnPatternJson and currentAirport to be defined, but received .*/;

    t.throws(() => buildPreSpawnAircraft(), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => buildPreSpawnAircraft(airportModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => buildPreSpawnAircraft(null, airportModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, null), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('buildPreSpawnAircraft() throws when passed invalid spawnPatternJson', (t) => {
    const expectedMessage = /Invalid spawnPatternJson passed to buildPreSpawnAircraft\. Expected a non-empty object, but received .*/;

    t.throws(() => buildPreSpawnAircraft({}, airportModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => buildPreSpawnAircraft([], airportModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => buildPreSpawnAircraft(42, airportModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => buildPreSpawnAircraft('threeve', airportModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => buildPreSpawnAircraft(false, airportModelFixture), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('buildPreSpawnAircraft() throws when passed invalid currentAirport', (t) => {
    const expectedMessage = /Invalid currentAirport passed to buildPreSpawnAircraft\. Expected instance of AirportModel, but received .*/;

    t.throws(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, {}), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, []), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, 42), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, 'threeve'), {
        instanceOf: TypeError,
        message: expectedMessage
    });
    t.throws(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, false), {
        instanceOf: TypeError,
        message: expectedMessage
    });
});

ava('buildPreSpawnAircraft() does not throw when passed valid parameters', (t) => {
    t.notThrows(() => buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, airportModelFixture));
});

// ava('buildPreSpawnAircraft() returns an array of objects with correct keys', (t) => {
//     const results = buildPreSpawnAircraft(ARRIVAL_PATTERN_MOCK, airportModelFixture);
//
//     t.true(_isArray(results));
//
//     _map(results, (result) => {
//         t.true(typeof result.heading === 'number');
//         t.true(typeof result.nextFix === 'string');
//         t.true(_isArray(result.positionModel.relativePosition));
//     });
// });
