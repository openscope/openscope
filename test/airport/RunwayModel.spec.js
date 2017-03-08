import ava from 'ava';

import RunwayModel from '../../src/assets/scripts/client/airport/RunwayModel';
import { airportModelFixture, airportPositionFixtureKLAS } from '../fixtures/airportFixtures';
import { AIRPORT_JSON_KLAS_MOCK } from './_mocks/airportJsonMock';

// taken from KLAS
// "runways":[
//   {
//     "name": ["07L", "25R"],
//     "end": [["N36d4m34.82", "W115d10m16.98", "2179ft"], ["N36d4m35.05", "W115d7m15.93", "2033ft"]],
//     "delay": [5, 5],
//     "ils": [false, true]
//   }
//   // ...
// ]

// const airportMock = {
//     elevation: 2181
// }

const runway07L25R = AIRPORT_JSON_KLAS_MOCK.runways[0];
// runway07L25R.reference_position = airportPositionFixtureKLAS.position;
// runway07L25R.magnetic_north = airportPositionFixtureKLAS.magneticNorthInRadians;

ava('does not throw when instantiated with vaild parameters', (t) => {
    t.notThrows(() => new RunwayModel(runway07L25R, 0, airportModelFixture));
});
