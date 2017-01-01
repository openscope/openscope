import AirlineController from '../../src/assets/scripts/client/airline/AirlineController';
import AirlineCollection from '../../src/assets/scripts/client/airline/AirlineCollection';
import { AIRLINE_DEFINITION_LIST_FOR_FIXTURE } from '../airline/_mocks/airlineMocks';

export const airlineControllerFixture = new AirlineController(AIRLINE_DEFINITION_LIST_FOR_FIXTURE);
export const airlineCollectionFixture = new AirlineCollection(AIRLINE_DEFINITION_LIST_FOR_FIXTURE);
