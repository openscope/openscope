import _compact from 'lodash/compact';
import _has from 'lodash/has';
import _isString from 'lodash/isString';
import _map from 'lodash/map';
import _tail from 'lodash/tail';
import CommandModel from './CommandModel';
import {
    TOP_LEVEL_COMMANDS,
    COMMANDS
} from './commandDefinitions';

// TODO: add to global constants
const REGEX = {
    UNICODE: /[^\u0000-\u00ff]/
};

/**
 * Helper method to translate a unicode character into a readable string value
 *
 * @method unicodeToString
 * @param char {characterCode}
 * @return {string}
 */
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

        /**
         *
         * @type {string}
         */
        this.command = '';

        /**
         *
         *
         * @type {string}
         */
        this.callsign = '';

        /**
         *
         *
         * @type {array<CommandModel>}
         */
        this.commandList = [];

        this._extractCommandsAndArgs(commandValueString.toLowerCase());
    }

    /**
     * When command is not transmit:
     * - commandList is assumed to have a length on 1
     * - commandList[0].args is assumed to have a single string value
     *
     *
     * @property args
     * @return {string}
     */
    get args() {
        if (this.command !== TOP_LEVEL_COMMANDS.transmit) {
            return this.commandList[0].args[0];
        }

        return _map(this.commandList, (command) => {
            return [
                command.name,
                ...command.parsedArgs
            ];
        });
    }

    // /**
    //  *
    //  * @property legacyCommands
    //  * @return
    //  */
    // get legacyCommands() {
    //     if (this.command !== TOP_LEVEL_COMMANDS.transmit) {
    //         return {
    //             args: this.commandList[0].args[0],
    //             command: this.command
    //         };
    //     }
    //
    //     return {
    //         args: this.commandList,
    //         callsign: this.callsign,
    //         command: 'transmit'
    //     };
    // }

    /**
     * @for CommandParser
     * @method _extractCommandsAndArgs
     * @param commandValueString {string}
     * @private
     */
    _extractCommandsAndArgs(commandValueString) {
        const commandArgSegmentsWithCallsign = commandValueString.split(' ') || [];
        const callsignOrTopLevelCommandName = commandArgSegmentsWithCallsign[0];
        const commandArgSegments = _tail(commandArgSegmentsWithCallsign);

        if (
            _has(TOP_LEVEL_COMMANDS, callsignOrTopLevelCommandName) &&
            callsignOrTopLevelCommandName !== TOP_LEVEL_COMMANDS.transmit
        ) {
            this._buildTopLevelCommandModel(commandArgSegmentsWithCallsign);

            return;
        }

        this.command = TOP_LEVEL_COMMANDS.transmit;
        this.callsign = callsignOrTopLevelCommandName;
        this.commandList = this._buildCommandList(commandArgSegments);
    }

    /**
     *
     *
     */
    _buildTopLevelCommandModel(commandArgSegments) {
        const commandIndex = 0;
        const argIndex = 1;
        const commandName = TOP_LEVEL_COMMANDS[commandArgSegments[commandIndex]];
        const commandModel = new CommandModel(commandName);
        commandModel.args.push(commandArgSegments[argIndex]);

        this.command = commandName;
        this.commandList.push(commandModel);
    }

    /**
     * @for CommandParser
     * @method _buildCommandList
     * @param commandArgSegments {array<string>}
     * @return {array<CommandModel>}
     * @private
     */
    _buildCommandList(commandArgSegments) {
        // console.log('_buildCommandList', this.callsign, commandArgSegments);
        let commandModel;

        // TODO: this still feels icky and could be simplified some more
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
