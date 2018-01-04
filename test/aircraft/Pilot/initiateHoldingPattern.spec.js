import ava from 'ava';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import NavigationLibrary from '../../../src/assets/scripts/client/navigationLibrary/NavigationLibrary';
import { AIRPORT_JSON_KLAS_MOCK } from '../../airport/_mocks/airportJsonMock';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

let navigationLibraryFixture;
const holdParametersMock = {
    inboundHeading: -1.62476729292438,
    legLength: '1min',
    turnDirection: 'right'
};

ava.beforeEach(() => {
    navigationLibraryFixture = new NavigationLibrary(AIRPORT_JSON_KLAS_MOCK);
});

ava.afterEach(() => {
    navigationLibraryFixture.reset();
});

ava.only('.initiateHoldingPattern() returns error response when specified fix is not in the route', (t) => {
    const expectedResult = [false, 'unable to hold at COWBY; it is not on our route!'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);
    const result = pilot.initiateHoldingPattern('COWBY', holdParametersMock);

    t.deepEqual(result, expectedResult);
});

ava.only('.initiateHoldingPattern() returns correct readback when hold implemented successfully', (t) => {
    const expectedResult = [true, 'hold east of KEPEC, right turns, 1min legs'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture, navigationLibraryFixture);
    const result = pilot.initiateHoldingPattern('KEPEC', holdParametersMock);

    t.deepEqual(result, expectedResult);
});
