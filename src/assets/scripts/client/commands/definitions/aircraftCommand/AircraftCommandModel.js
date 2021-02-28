import CommandModel from '../CommandModel';
import { AIRCRAFT_COMMAND_MAP } from './aircraftCommandMap';

/**
 * A definition of an aircraft command and it's arguments e.g., descend 40
 *
 * @class AircraftCommandModel
 */
export default class AircraftCommandModel extends CommandModel {
    /**
     * @constructor
     * @for AircraftCommandModel
     */
    constructor(name = '') {
        super(name, AIRCRAFT_COMMAND_MAP[name]);
    }
}
