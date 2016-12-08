import _compact from 'lodash/compact';
import _forEach from 'lodash/forEach';
import _has from 'lodash/has';
import _isString from 'lodash/isString';
import _map from 'lodash/map';
import _tail from 'lodash/tail';
import CommandModel from './CommandModel';
import { unicodeToString } from '../utilities/generalUtilities';
import {
    SYSTEM_COMMANDS,
    COMMAND_MAP
} from './commandMap';
import { REGEX } from '../constants/globalConstants';

/**
 *
 *
 *
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
        if (this.command !== SYSTEM_COMMANDS.transmit) {
            return this.commandList[0].args[0];
        }

        return _map(this.commandList, (command) => command.nameAndArgs);
    }

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
            _has(SYSTEM_COMMANDS, callsignOrTopLevelCommandName) &&
            callsignOrTopLevelCommandName !== SYSTEM_COMMANDS.transmit
        ) {
            this._buildTopLevelCommandModel(commandArgSegmentsWithCallsign);

            return;
        }

        this.command = SYSTEM_COMMANDS.transmit;
        this.callsign = callsignOrTopLevelCommandName;
        this.commandList = this._buildCommandList(commandArgSegments);

        this._validateAndParseCommandArguments();
    }

    /**
     *
     * @private
     */
    _buildTopLevelCommandModel(commandArgSegments) {
        const commandIndex = 0;
        const argIndex = 1;
        const commandName = SYSTEM_COMMANDS[commandArgSegments[commandIndex]];
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
        let commandModel;

        // TODO: this still feels icky and could be simplified some more
        const commandList = _map(commandArgSegments, (commandOrArg) => {
            if (commandOrArg === '') {
                return;
            } else if (REGEX.UNICODE.test(commandOrArg)) {
                const commandString = unicodeToString(commandOrArg);
                commandModel = new CommandModel(COMMAND_MAP[commandString]);

                return commandModel;
            } else if (_has(COMMAND_MAP, commandOrArg)) {
                commandModel = new CommandModel(COMMAND_MAP[commandOrArg]);

                return commandModel;
            }

            commandModel.args.push(commandOrArg);
        });

        return _compact(commandList);
    }

    /**
     *
     *
     * @method _validateAndParseCommandArguments
     * @private
     */
    _validateAndParseCommandArguments() {
        const validationErrors = this._validateCommandArguments();

        if (validationErrors.length > 0) {
            _forEach(validationErrors, (error) => {
                throw error;
            });
        }
    }

    /**
     *
     *
     * @method _validateCommandArguments
     * @private
     */
    _validateCommandArguments() {
        return _compact(_map(this.commandList, (command) => {
            const hasError = command.validateArgs();

            if (hasError) {
                return hasError;
            }

            command.parseArgs();
        }));
    }
}
