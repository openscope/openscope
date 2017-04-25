import ava from 'ava';

import RunwayModel from '../../../src/assets/scripts/client/airport/runway/RunwayModel';
import { airportModelFixture } from '../../fixtures/airportFixtures';
import { AIRPORT_JSON_KLAS_MOCK } from '../_mocks/airportJsonMock';

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

ava.todo('Eso no es suficiente... Future Erik: add more tests here, por favor. Will be addressed as part of feature/93');

ava('does not throw when instantiated with vaild parameters', (t) => {
    t.notThrows(() => new RunwayModel(runway07L25R, 0, airportModelFixture));
});

ava('#gps returns the gps coordinates for a runway', (t) => {
    const expectedResult = [36.07633888888889, -115.17138333333334];
    const model = new RunwayModel(runway07L25R, 0, airportModelFixture);

    t.deepEqual(model.gps, expectedResult);
});

ava('#elevation returns theelevation of the runway when present in the #_positionModel', (t) => {
    const expectedResult = 2179;
    const model = new RunwayModel(runway07L25R, 0, airportModelFixture);

    t.true(model.elevation === expectedResult);
});
