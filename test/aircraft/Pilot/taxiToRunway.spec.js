import ava from 'ava';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';
import { FLIGHT_MODES } from '../../../src/assets/scripts/client/constants/aircraftConstants';

const runwayMock = '19L';

ava('.taxiToRunway() returns an error when flightPhase is equal to FLIGHT_MODES.TAXI', (t) => {
    const expectedResult = [false, 'already taxiing'];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.taxiToRunway(runwayMock, true, FLIGHT_MODES.TAXI);

    t.deepEqual(result, expectedResult);
});

ava('.taxiToRunway() returns an error when flightPhase is equal to FLIGHT_MODES.WAITING', (t) => {
    const expectedResult = [false, 'already taxiied and waiting in runway queue'];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.taxiToRunway(runwayMock, true, FLIGHT_MODES.WAITING);

    t.deepEqual(result, expectedResult);
});

ava('.taxiToRunway() returns an error when isDeparture is false', (t) => {
    const expectedResult = [false, 'unable to taxi'];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.taxiToRunway(runwayMock, false, FLIGHT_MODES.APRON);

    t.deepEqual(result, expectedResult);
});

ava('.taxiToRunway() returns an error when flightPhase is not equal to FLIGHT_MODES.APRON', (t) => {
    const expectedResult = [false, 'unable to taxi'];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.taxiToRunway(runwayMock, true, FLIGHT_MODES.ARRIVAL);

    t.deepEqual(result, expectedResult);
});

ava('.taxiToRunway() returns a success message when finished', (t) => {
    const expectedResult = [
        true,
        {
            log: 'taxi to runway 19L',
            say: 'taxi to runway one niner left'
        }
    ];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.taxiToRunway(runwayMock, true, FLIGHT_MODES.APRON);

    t.deepEqual(result, expectedResult);
});
