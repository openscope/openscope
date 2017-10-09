import RadarTargetCollection from '../../../src/assets/scripts/client/scope/RadarTargetCollection';
import RadarTargetModel from '../../../src/assets/scripts/client/scope/RadarTargetModel';
import {
    ARRIVAL_AIRCRAFT_MODEL_MOCK,
    DEPARTURE_AIRCRAFT_MODEL_MOCK
} from '../../aircraft/_mocks/aircraftMocks';
import { THEME } from '../../../src/assets/scripts/client/constants/themes';

export const RADAR_TARGET_ARRIVAL_MOCK = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
export const RADAR_TARGET_DEPARTURE_MOCK = new RadarTargetModel(THEME.DEFAULT, DEPARTURE_AIRCRAFT_MODEL_MOCK);

export const createRadarTargetArrivalMock = () => new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
export const createRadarTargetDepartureMock = () => new RadarTargetModel(THEME.DEFAULT, DEPARTURE_AIRCRAFT_MODEL_MOCK);
export const createRadarCollectionMock = () => {
    const radarTargetCollection = new RadarTargetCollection(THEME.DEFAULT);

    radarTargetCollection.addRadarTargetModel(createRadarTargetArrivalMock());
    radarTargetCollection.addRadarTargetModel(createRadarTargetDepartureMock());

    return radarTargetCollection;
};
