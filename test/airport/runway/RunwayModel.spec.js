import ava from 'ava';

import RunwayModel from '../../../src/assets/scripts/client/airport/runway/RunwayModel';
import { airportPositionFixtureKLAS } from '../../fixtures/airportFixtures';
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

ava('does not throw when instantiated with vaild parameters', (t) => {
    t.notThrows(() => new RunwayModel(runway07L25R, 0, airportPositionFixtureKLAS));
});

ava('#gps returns the gps coordinates for a runway', (t) => {
    const expectedResult = [36.07633888888889, -115.17138333333334];
    const model = new RunwayModel(runway07L25R, 0, airportPositionFixtureKLAS);

    t.deepEqual(model.gps, expectedResult);
});

ava('#elevation returns #_positionModel.elevation if it exists', (t) => {
    const model = new RunwayModel(runway07L25R, 0, airportPositionFixtureKLAS);

    t.true(model.elevation === model._positionModel.elevation);
});

ava('#elevation returns #airportPositionModel.elevation if #_positionModel.elevation does not exist', (t) => {
    const model = new RunwayModel(runway07L25R, 0, airportPositionFixtureKLAS);
    model._positionModel.elevation = null;

    t.true(model.elevation === model.airportPositionModel.elevation);
});

ava('#oppositeAngle returns opposite of runway heading', (t) => {
    const runwayModel = new RunwayModel(runway07L25R, 0, airportPositionFixtureKLAS);
    const result = runwayModel.oppositeAngle;
    const expectedResult = 3.9758603503842274;

    t.true(result === expectedResult);
});

ava('.addAircraftToQueue() adds an aircraft#id to the queue', (t) => {
    const aircraftIdMock = 'aircraft-221';
    const model = new RunwayModel(runway07L25R, 0, airportPositionFixtureKLAS);

    model.addAircraftToQueue(aircraftIdMock);

    t.true(model.queue.length === 1);
    t.true(model.queue[0] === aircraftIdMock);
});

ava('.removeAircraftFromQueue() removes an aircraft#id from the queue', (t) => {
    const aircraftIdMock = 'aircraft-221';
    const model = new RunwayModel(runway07L25R, 0, airportPositionFixtureKLAS);
    model.queue = ['1', '2', aircraftIdMock, '4'];

    model.removeAircraftFromQueue(aircraftIdMock);

    t.true(model.queue.length === 3);
    t.true(model.queue.indexOf(aircraftIdMock) === -1);
});

ava('.isAircraftInQueue() returns true when an aircraftId is in the queue', (t) => {
    const aircraftIdMock = 'aircraft-221';
    const model = new RunwayModel(runway07L25R, 0, airportPositionFixtureKLAS);
    model.queue = [aircraftIdMock];

    t.true(model.isAircraftInQueue(aircraftIdMock));
    t.false(model.isAircraftInQueue('threeve'));
});

ava('.isAircraftNextInQueue() returns true only when an aircraftId is at index 0', (t) => {
    const aircraftIdMock = 'aircraft-221';
    const model = new RunwayModel(runway07L25R, 0, airportPositionFixtureKLAS);
    model.queue = [aircraftIdMock, 'threeve'];

    t.true(model.isAircraftNextInQueue(aircraftIdMock));
    t.false(model.isAircraftNextInQueue('threeve'));
});

// these two need an aircraftModel to be able to test
ava.todo('.isOnApproachCourse()');
ava.todo('.isOnCorrectApproachHeading()');

ava('.calculateCrosswindAngleForRunway() returns the crosswind angle for a given runway based on a given windAngle', (t) => {
    const windAngleMock = 3.839724354387525;
    const model = new RunwayModel(runway07L25R, 0, airportPositionFixtureKLAS);
    const result = model.calculateCrosswindAngleForRunway(windAngleMock);

    t.true(result === 3.005456657593091);
});
