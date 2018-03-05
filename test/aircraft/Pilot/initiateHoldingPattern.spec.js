import ava from 'ava';
import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../../fixtures/navigationLibraryFixtures';

const holdParametersMock = {
    inboundHeading: -1.62476729292438,
    legLength: '1min',
    turnDirection: 'right'
};

ava.beforeEach(() => {
    createNavigationLibraryFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
});

ava('.initiateHoldingPattern() returns error response when specified fix is not in the route', (t) => {
    const expectedResult = [false, 'unable to hold at COWBY; it is not on our route!'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const result = pilot.initiateHoldingPattern('COWBY', holdParametersMock);

    t.deepEqual(result, expectedResult);
});

ava('.initiateHoldingPattern() returns correct readback when hold implemented successfully', (t) => {
    const expectedResult = [true, 'hold east of KEPEC, right turns, 1min legs'];
    const pilot = new Pilot(fmsArrivalFixture, modeControllerFixture);
    const result = pilot.initiateHoldingPattern('KEPEC', holdParametersMock);

    t.deepEqual(result, expectedResult);
});
