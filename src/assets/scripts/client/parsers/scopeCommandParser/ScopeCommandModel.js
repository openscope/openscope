import _first from 'lodash/first';
import _has from 'lodash/has';
import _last from 'lodash/last';
import _without from 'lodash/without';
import _values from 'lodash/values';
import {
    IMPLIED_COMMANDS,
    EXPLICIT_COMMANDS,
    COMMAND_FUNCTIONS
} from './scopeCommandMap';
import { DATA_BLOCK_DIRECTION_LENGTH_SEPARATOR } from '../../constants/scopeConstants';

// TODO: Replace dummy sector codes with a proper `SectorCollection`
const SECTOR_HANDOFF_CODES = ['18', '19', '10', '12'];

/**
 * A command to be interpreted by the scope itself
 * Used for manipulation of the display and other ATC tasks
 *
 * @class ScopeCommandModel
 */
export default class ScopeCommandModel {
    /**
     * @for ScopeCommandModel
     * @constructor
     * @param command {string}
     */
    constructor(command) {
        /**
         * Information usable to find the applicable aircraft
         * This could be the CID, assigned squawk code, or full callsign
         *
         * @for ScopeCommandModel
         * @property aircraftReference
         * @type {string}
         */
        this.aircraftReference = '';

        /**
         * Array of arguments to be passed to the specified command function
         *
         * @for ScopeCommandModel
         * @property commandArguments
         * @type {array<string>}
         */
        this.commandArguments = [];

        /**
         * Name of the `ScopeModel` method to call to execute this command
         *
         * @for ScopeCommandModel
         * @property commandFunction
         * @type {string}
         */
        this.commandFunction = '';

        this._init(command);
    }

    /**
     * Perform initialization tasks
     *
     * @for ScopeCommandModel
     * @method _init
     * @param command {string}
     */
    _init(command) {
        const pieces = _without(command.toUpperCase().split(' '), '');

        this.aircraftReference = _last(pieces);
        this.commandFunction = this._extractCommandFunction(pieces);
        this.commandArguments = this._extractCommandArguments(pieces);
    }

    /**
     * Accept the full command and return only the arguments
     *
     * @for ScopeCommandModel
     * @method _extractCommandArguments
     * @param command {string}
     * @return {string}
     */
    _extractCommandArguments(command) {
        if (_values(IMPLIED_COMMANDS).indexOf(this.commandFunction) !== -1) {
            return _without(command, this.aircraftReference);
        }

        return command.splice(1, command.length - 2);
    }

    /**
     * Accept the full command and return only the function name
     *
     * @for ScopeCommandModel
     * @method _extractCommandFunction
     * @param command {string}
     * @return {string}
     */
    _extractCommandFunction(command) {
        const firstElement = _first(command);

        if (_has(EXPLICIT_COMMANDS, firstElement)) {
            return EXPLICIT_COMMANDS[firstElement];
        }

        if (SECTOR_HANDOFF_CODES.indexOf(firstElement) !== -1) {
            return COMMAND_FUNCTIONS.INITIATE_HANDOFF;
        }

        if (firstElement.indexOf(DATA_BLOCK_DIRECTION_LENGTH_SEPARATOR) !== -1 || firstElement.length < 2) {
            return COMMAND_FUNCTIONS.MOVE_DATA_BLOCK;
        }

        if (command.length === 1) {
            return COMMAND_FUNCTIONS.ACCEPT_HANDOFF;
        }

        return COMMAND_FUNCTIONS.SCRATCHPAD;
    }
}
