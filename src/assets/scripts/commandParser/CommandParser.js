import _compact from 'lodash/compact';
import _has from 'lodash/has';
import _isString from 'lodash/isString';
import _map from 'lodash/map';
import _tail from 'lodash/tail';
import CommandModel from './CommandModel';
import { COMMANDS } from './commandDefinitions';

// TODO: add to global constants
const REGEX = {
    UNICODE: /[^\u0000-\u00ff]/
};

const unicodeToString = (char) => `\\u${char.charCodeAt(0).toString(16).toUpperCase()}`;

/**
 * @class CommandParser
 */
export default class CommandParser {
    /**
     * @constructor
     * @for CommandParser
     * @param commandValueString {string}
     */
    constructor(commandValueString) {
        if (!_isString(commandValueString)) {
            // eslint-disable-next-line max-len
            throw new TypeError(`Invalid parameter. CommandParser expects a string but received ${typeof commandValueString}`);
        }

        this.callsign = '';
        this.commandList = [];

        this._extractCommandsAndArgs(commandValueString.toLowerCase());
    }

    get legacyCommands() {
        return {
            args: this.commandList,
            callsign: this.callsign,
            command: 'transmit'
        };
    }

    /**
     * @for CommandParser
     * @method _extractCommandsAndArgs
     * @param commandValueString {string}
     * @private
     */
    _extractCommandsAndArgs(commandValueString) {
        const commandArgSegmentsWithCallsign = commandValueString.split(' ') || [];
        const commandArgSegments = _tail(commandArgSegmentsWithCallsign);

        this.callsign = commandArgSegmentsWithCallsign[0];
        this.commandList = this._buildCommandList(commandArgSegments);
    }

    /**
     * @for CommandParser
     * @method _buildCommandList
     * @param commandArgSegments {array<string>}
     * @return {array<CommandModel>}
     * @private
     */
    _buildCommandList(commandArgSegments) {
        let commandModel;
        const commandList = _map(commandArgSegments, (commandOrArg) => {
            if (commandOrArg === '') {
                return;
            } else if (REGEX.UNICODE.test(commandOrArg)) {
                const commandString = unicodeToString(commandOrArg);
                commandModel = new CommandModel(COMMANDS[commandString]);

                return commandModel;
            } else if (_has(COMMANDS, commandOrArg)) {
                commandModel = new CommandModel(COMMANDS[commandOrArg]);

                return commandModel;
            }

            commandModel.args.push(commandOrArg);
        });

        return _compact(commandList);
    }
}


// function commandA(arg1, arg2) {
//
// }
//
// commandA.validate = (args) => {
//     if (args.length !== 2) return 'Command A needs two arguments';
//     return false;
// }
//
// const commands = {
//     commandA
// };
//
// const test = 'commandA one two';
//
// const testSplit = test.split(' ');
//
// const resultingCommands = [];
//
// let currentCommand = null;
//
// testSplit.forEach(value => {
//     if (commands[value]) {
//         currentCommand = {
//             command: commands[value],
//             args: []
//         };
//         resultingCommands.push(currentCommand);
//     } else {
//         currentCommand.args.push(value);
//     }
// });
//
// resultingCommands.forEach(commandObj => {
//     const error = commandObj.command.validate(commandObj.args);
//
//     if (error) throw error;
// });
//
// resultingCommands.forEach(commandObj => commandObj.command(...commandObj.args));
