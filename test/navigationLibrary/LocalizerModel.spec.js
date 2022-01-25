import ava from 'ava';
import RunwayModel from '../../src/assets/scripts/client/airport/runway/RunwayModel';
import LocalizerModel from '../../src/assets/scripts/client/navigationLibrary/LocalizerModel';
import { airportPositionFixtureKLAS } from '../fixtures/airportFixtures';
import { AIRPORT_JSON_KLAS_MOCK } from '../airport/_mocks/airportJsonMock';

const runway01L19R = AIRPORT_JSON_KLAS_MOCK.runways[3];
const { localizers } = AIRPORT_JSON_KLAS_MOCK;
const mockRunway = new RunwayModel(runway01L19R, 0, airportPositionFixtureKLAS);

ava('does not throw when instantiated with vaild parameters', (t) => {
    t.notThrows(() => new LocalizerModel('TEST', localizers['I-LAS'], airportPositionFixtureKLAS));
});

ava('.getGlideslopeAltitude() from defaultLocalizer returns glideslope altitude at the specified distance', (t) => {
    const model = mockRunway.defaultLocalizer;
    const distanceNm = 10;
    const expectedResult = 1719.4153308084387 + model.positionModel.elevation;
    const result = model.getGlideslopeAltitude(distanceNm);

    t.true(result === expectedResult);
});

ava('.getGlideslopeAltitude() returns glideslope altitude at the specified distance', (t) => {
    const model = new LocalizerModel('I-LAS', localizers['I-LAS'], airportPositionFixtureKLAS);
    const distanceNm = 10;
    const expectedResult = 1719.4153308084387 + model.positionModel.elevation;
    const result = model.getGlideslopeAltitude(distanceNm);

    t.true(result === expectedResult);
});

ava('.getGlideslopeAltitudeAtFinalApproachFix() from defaultLocalizer returns glideslope altitude at the final approach fix', (t) => {
    const model = mockRunway.defaultLocalizer;
    const expectedResult = 3773.178596328614;
    const result = model.getGlideslopeAltitudeAtFinalApproachFix();

    t.true(result === expectedResult);
});

ava('.getGlideslopeAltitudeAtFinalApproachFix() returns glideslope altitude at the final approach fix', (t) => {
    const model = new LocalizerModel('I-LAS', localizers['I-LAS'], airportPositionFixtureKLAS);
    const expectedResult = 3625.178596328614;
    const result = model.getGlideslopeAltitudeAtFinalApproachFix();

    t.true(result === expectedResult);
});

ava('.getMinimumGlideslopeInterceptAltitude() returns glideslope altitude at the final approach fix', (t) => {
    const model = new LocalizerModel('I-LAS', localizers['I-LAS'], airportPositionFixtureKLAS);
    const expectedResult = 3700;
    const result = model.getMinimumGlideslopeInterceptAltitude();

    t.true(result === expectedResult);
});
