 /* eslint-disable import/no-extraneous-dependencies, arrow-parens, max-len */
import ava from 'ava';
import _isEqual from 'lodash/isEqual';
import Waypoint from '../../../src/assets/scripts/aircraft/FlightManagementSystem/Waypoint';
import { airportModelFixtureForWaypoint } from '../../fixtures/airportFixtures';
import {
    MINIMAL_WAYPOINT_MOCK,
    BASIC_WAYPOINT_MOCK,
    ENROUTE_TO_HOLD_WAYPOINT_MOCK,
    EXPANDED_WAYPOINT_MOCK
} from '../_mocks/waypointMocks';

ava('should not throw if instantiated with a string as an arguemnt', t => {
    t.notThrows(() => new Waypoint(BASIC_WAYPOINT_MOCK, airportModelFixtureForWaypoint));

    const result = new Waypoint(MINIMAL_WAYPOINT_MOCK, airportModelFixtureForWaypoint);

    t.true(result instanceof Waypoint);
});

ava('accepts and object as a parameter and sets its internal properties', t => {
    const result = new Waypoint(BASIC_WAYPOINT_MOCK, airportModelFixtureForWaypoint);

    t.true(result.fix === BASIC_WAYPOINT_MOCK.fix);
    t.true(result.fixRestrictions.alt === BASIC_WAYPOINT_MOCK.fixRestrictions.alt);
    t.true(result.fixRestrictions.spd === BASIC_WAYPOINT_MOCK.fixRestrictions.spd);
});

ava('accepts and object as a parameter and sets its internal properties', t => {
    const result = new Waypoint(EXPANDED_WAYPOINT_MOCK, airportModelFixtureForWaypoint);

    t.true(result.fix === EXPANDED_WAYPOINT_MOCK.fix);
    t.true(result.navmode === EXPANDED_WAYPOINT_MOCK.navmode);
    t.true(result.speed === EXPANDED_WAYPOINT_MOCK.speed);
    t.true(result.altitude === EXPANDED_WAYPOINT_MOCK.altitude);
    t.true(result.fix === EXPANDED_WAYPOINT_MOCK.fix);
    t.true(_isEqual(result.fix, EXPANDED_WAYPOINT_MOCK.fix));
});

ava('.extractFixRestrictions() does not set fixRestrictions if none are provided', t => {
    const model = new Waypoint(MINIMAL_WAYPOINT_MOCK, airportModelFixtureForWaypoint);

    t.true(model.fixRestrictions.alt === null);
    t.true(model.fixRestrictions.spd === null);
});

ava('.extractFixRestrictions() sets fixRestrictions if any are provided', t => {
    const model = new Waypoint(MINIMAL_WAYPOINT_MOCK, airportModelFixtureForWaypoint);
    model.extractFixRestrictions(BASIC_WAYPOINT_MOCK);

    t.true(model.fixRestrictions.alt === BASIC_WAYPOINT_MOCK.fixRestrictions.alt);
    t.true(model.fixRestrictions.spd === BASIC_WAYPOINT_MOCK.fixRestrictions.spd);
});

ava('.setInitialNavMode() sets navmode to heading if a fix name is not provided', t => {
    const result = new Waypoint(MINIMAL_WAYPOINT_MOCK, airportModelFixtureForWaypoint);

    t.true(result.navmode === 'heading');
});

ava('.setInitialNavMode() sets navmode to fix if a fix name is provided', t => {
    const result = new Waypoint(BASIC_WAYPOINT_MOCK, airportModelFixtureForWaypoint);

    t.true(result.navmode === 'fix');
});

ava('.setAltitude() sets the altitude if no restrictions exist and no centerCeiling is supplied', t => {
    const model = new Waypoint(MINIMAL_WAYPOINT_MOCK, airportModelFixtureForWaypoint);
    model.setAltitude(null, 23000);

    t.true(model.altitude === 23000);
});

ava('.setAltitude() if fix restrictions do not exist, sets the altitude by the min of centerCeiling and cruiseAltitude', t => {
    const model = new Waypoint(MINIMAL_WAYPOINT_MOCK, airportModelFixtureForWaypoint);
    model.setAltitude(10000, 23000);

    t.true(model.altitude === 10000);
});

ava('.setAltitude() sets the altitude from existing fixRestrictions and cruiseAltitude when restriction is at or above', t => {
    const centerCeilingMock = 10000;
    const cruiseAltitudeMock = 23000;
    const expectedResult = 27000;
    const model = new Waypoint(BASIC_WAYPOINT_MOCK, airportModelFixtureForWaypoint);
    model.setAltitude(centerCeilingMock, cruiseAltitudeMock);

    t.true(model.altitude === expectedResult);
});

ava('.setAltitude() sets the altitude from existing fixRestrictions and cruiseAltitude  when restriction is at or below', t => {
    const centerCeilingMock = 10000;
    const cruiseAltitudeMock = 23000;
    const expectedResult = 23000;
    const model = new Waypoint(BASIC_WAYPOINT_MOCK, airportModelFixtureForWaypoint);
    model.fixRestrictions.alt = '270-';
    model.setAltitude(centerCeilingMock, cruiseAltitudeMock);

    t.true(model.altitude === expectedResult);
});

ava('.setAltitude() sets the altitude from existing fixRestrictions and cruiseAltitude', t => {
    const centerCeilingMock = 10000;
    const cruiseAltitudeMock = 23000;
    const expectedResult = 21000;
    const model = new Waypoint(BASIC_WAYPOINT_MOCK, airportModelFixtureForWaypoint);
    model.fixRestrictions.alt = '210';
    model.setAltitude(centerCeilingMock, cruiseAltitudeMock);

    t.true(model.altitude === expectedResult);
});

ava('.setSpeed() sets the speed from existing fixRestrictions and cruiseSpeed when restriction is at or above', t => {
    const cruiseSpeedMock = 300;
    const expectedResult = 300;
    const model = new Waypoint(BASIC_WAYPOINT_MOCK, airportModelFixtureForWaypoint);
    model.fixRestrictions.spd = '200+';
    model.setSpeed(cruiseSpeedMock);

    t.true(model.speed === expectedResult);
});

ava('.setSpeed() sets the speed from existing fixRestrictions and cruiseSpeed  when restriction is at or below', t => {
    const cruiseSpeedMock = 300;
    const expectedResult = 270;
    const model = new Waypoint(BASIC_WAYPOINT_MOCK, airportModelFixtureForWaypoint);
    model.fixRestrictions.spd = '270-';
    model.setSpeed(cruiseSpeedMock);

    t.true(model.speed === expectedResult);
});

ava('.setSpeed() sets the speed from existing fixRestrictions and cruiseSpeed', t => {
    const cruiseSpeedMock = 300;
    const expectedResult = 270;
    const model = new Waypoint(BASIC_WAYPOINT_MOCK, airportModelFixtureForWaypoint);
    model.setSpeed(cruiseSpeedMock);

    t.true(model.speed === expectedResult);
});
