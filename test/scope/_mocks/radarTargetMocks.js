import RadarTargetCollection from '../../../src/assets/scripts/client/scope/RadarTargetCollection';
import RadarTargetModel from '../../../src/assets/scripts/client/scope/RadarTargetModel';
import {
    arrivalAircraftFixture,
    departureAircraftFixture
} from '../../aircraft/_mocks/aircraftMocks';
import { THEME } from '../../../src/assets/scripts/client/constants/themes';

export const RADAR_TARGET_ARRIVAL_MOCK = new RadarTargetModel(THEME.DEFAULT, arrivalAircraftFixture);
export const RADAR_TARGET_DEPARTURE_MOCK = new RadarTargetModel(THEME.DEFAULT, departureAircraftFixture);

export const createRadarTargetArrivalMock = () => new RadarTargetModel(THEME.DEFAULT, arrivalAircraftFixture);
export const createRadarTargetDepartureMock = () => new RadarTargetModel(THEME.DEFAULT, departureAircraftFixture);
export const createRadarCollectionMock = () => {
    const radarTargetCollection = new RadarTargetCollection(THEME.DEFAULT);

    radarTargetCollection.addRadarTargetModel(createRadarTargetArrivalMock());
    radarTargetCollection.addRadarTargetModel(createRadarTargetDepartureMock());

    return radarTargetCollection;
};
