import CommandModel from '../CommandModel';
import { SYSTEM_COMMAND_MAP } from './systemCommandMap';

/**
 * A definition of an system command and it's arguments e.g., tutorial or timewarp 10
 *
 * @class SystemCommandModel
 */
export default class SystemCommandModel extends CommandModel {
    /**
     * @constructor
     * @for SystemCommandModel
     */
    constructor(name = '') {
        super(name, SYSTEM_COMMAND_MAP[name]);
    }
}
