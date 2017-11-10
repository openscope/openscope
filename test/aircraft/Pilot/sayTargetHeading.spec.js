import ava from 'ava';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import NavigationLibrary from '../../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../../airport/_mocks/airportJsonMock';
import ModeController from '../../../src/assets/scripts/client/aircraft/ModeControl/ModeController';
import { fmsArrivalFixture } from '../../fixtures/aircraftFixtures';

let pilot;
let navigationLibraryFixture;

ava.beforeEach(() => {
    const modeController = new ModeController();
    navigationLibraryFixture = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
    pilot = new Pilot(fmsArrivalFixture, modeController, navigationLibraryFixture);
});

ava.afterEach(() => {
    navigationLibraryFixture.reset();
    pilot = null;
});

ava('.sayTargetHeading() returns a message when #headingMode is HOLD', (t) => {
    const expectedResult = [
        true,
        {
            log: 'we\'re assigned heading 180',
            say: 'we\'re assigned heading one eight zero'
        }
    ];
    pilot._mcp.headingMode = 'HOLD';
    pilot._mcp.heading = 3.141592653589793;

    const result = pilot.sayTargetHeading();

    t.deepEqual(result, expectedResult);
});

ava('.sayTargetHeading() returns a message when #headingMode is VOR/LOC', (t) => {
    const expectedResult = [
        true,
        {
            log: 'we\'re joining a course of 180',
            say: 'we\'re joining a course of one eight zero'
        }
    ];
    pilot._mcp.headingMode = 'VOR_LOC';
    pilot._mcp.course = 180;

    const result = pilot.sayTargetHeading();

    t.deepEqual(result, expectedResult);
});

ava.todo('.sayTargetHeading() returns a message when #headingMode is LNAV');

ava('.sayTargetHeading() returns a message when #headingMode is OFF', (t) => {
    const expectedResult = [
        true,
        {
            log: 'we haven\'t been assigned a heading',
            say: 'we haven\'t been assigned a heading'
        }
    ];
    const result = pilot.sayTargetHeading();

    t.deepEqual(result, expectedResult);
});
