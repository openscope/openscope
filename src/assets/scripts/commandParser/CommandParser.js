import _compact from 'lodash/compact';
import _has from 'lodash/has';
import _isString from 'lodash/isString';
import _map from 'lodash/map';
import CommandModel from './CommandModel';
import { COMMANDS } from './commandDefinitions';

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
            throw new TypeError(`Invalid parameter. CommandParser expects a string but received ${typeof commandValueString}`);
        }

        this.commandList = [];

        this._extractCommandsAndArgs(commandValueString);
    }

    get legacyCommands() {
        const args = [];

        return {
            args,
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
        const commandList = commandValueString.split(' ') || [];
        const foundCommandIndicies = this._findCommandIndicies(commandList);

        this.commandList = _map(foundCommandIndicies, (commandIndex, i) => {
            const commandModel = new CommandModel();
            commandModel.location = commandIndex;
            commandModel.name = commandList[commandIndex];
            commandModel.args = commandList.slice(commandIndex + 1, foundCommandIndicies[i + 1]);

            return commandModel;
        });
    }

    // find the index of a command in the command list
    _findCommandIndicies(commandList) {
        return _compact(_map(commandList, (command, i) => {
            if (_has(COMMANDS, command)) {
                return i;
            }
        }));
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
