import _first from 'lodash/first';
import _has from 'lodash/has';
import _last from 'lodash/last';
import _values from 'lodash/values';
import {
    IMPLIED_COMMANDS,
    EXPLICIT_COMMANDS,
    COMMAND_FUNCTIONS
} from './scopeCommandMap';

const SECTOR_HANDOFF_CODES = ['18', '19', '10', '12'];

export default class ScopeCommand {
    constructor(command) {
        this.aircraftReference = '';
        this.commandArguments = [];
        this.commandFunction = '';

        this._init(command);
    }

    _init(command) {
        const pieces = command.toUpperCase().split(' ');

        this.aircraftReference = _last(pieces);
        this.commandFunction = this._extractCommandFunction(pieces);
        this.commandArguments = this._extractCommandArguments(pieces);
    }

    _extractCommandArguments(command) {
        if (_values(IMPLIED_COMMANDS).indexOf(this.commandFunction) !== -1) {
            return [_first(command)];
        }

        return command.splice(1, command.length - 2);
    }

    _extractCommandFunction(command) {
        const firstElement = _first(command);
        if (_has(EXPLICIT_COMMANDS, firstElement)) {
            return EXPLICIT_COMMANDS[firstElement];
        }

        if (SECTOR_HANDOFF_CODES.indexOf(firstElement) !== -1) {
            return COMMAND_FUNCTIONS.HANDOFF;
        }

        if (firstElement.indexOf('/') !== -1 || firstElement.length < 2) {
            return COMMAND_FUNCTIONS.MOVE_DATA_BLOCK;
        }

        if (command.length === 1) {
            return COMMAND_FUNCTIONS.ACCEPT_HANDOFF;
        }

        return COMMAND_FUNCTIONS.SCRATCHPAD;
    }
}
