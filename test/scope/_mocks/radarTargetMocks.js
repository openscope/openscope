import RadarTargetModel from '../../../src/assets/scripts/client/scope/RadarTargetModel';
import { ARRIVAL_AIRCRAFT_MODEL_MOCK } from '../../aircraft/_mocks/aircraftMocks';
import { THEME } from '../../../src/assets/scripts/client/constants/themes';

export const RADAR_TARGET_MOCK = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
