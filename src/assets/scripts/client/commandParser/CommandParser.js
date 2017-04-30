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
 * Symbol used to split the command string as it enters the class.
 *
 * @property COMMAND_ARGS_SEPARATOR
 * @type {string}
 * @final
 */
const COMMAND_ARGS_SEPARATOR = ' ';

/**
 * This class is responsible for taking the content of the `$commandInput` and parsing it
 * out into commands and arguments.
 *
 * Everything this class needs comes in as a single string provided by `InputController.input_run()`.
 * ex:
 * - `timewarp 50`
 * - `AA777 fh 0270 d 050 sp 200`
 * - `AA777 hold dumba left 2min`
 *
 * **Differentiation of commands and arguments is determinied by splitting the string on an empty space. This
 * is very important, so legacy commands did not have spaces between the command and argument. With this
 * implementation _every_ command shall have a space between itself and it's arguments.**
 *
 * Commands are broken out into two categories: `System` and `Transmit`.
 * - System commands are zero or single argument commands that are used for interacting with the app
 *   itslef. Things like `timewarp` or `tutorial` are examples of system commands.
 *
 * - Transmit commands are instructions meant for a specific aircraft within the controlled airspace.
 *   These commands can have zero to many arguments, depending on the command. Some examples of transmit
 *   commands are `to`, `taxi`, `hold`.
 *
 * Commands go through a lifecycle as they move from raw to parsed:
 * - user types command and presses enter
 * - command string is captured via input value, then passed as an argument to this class
 * - determine if command string is a `System Command` or `Transmit`
 * - creation of `CommandModel` objects for each command/argment group found
 * - validate command arguments (number of arguments and data type)
 * - parse command arguments
 *
 * All available commands are defined in the `commandMap`. Two terms of note are alias and root command.
 * We would call the `takeoff` command a root command and `to` and `cto` alises. The root command is the
 * one that shares the same key as the command definition which gives us the correct validator and parser.
 * The root command is also what the `AircraftInstanceModel` is expecting when it receives commands
 * from the `InputController`.
 *
 * @class CommandParser
 */
export default class CommandParser {
    /**
     * @constructor
     * @for CommandParser
     * @param rawCommandWithArgs {string}  string present in the `$commandInput` when the user pressed `enter`
     */
    constructor(rawCommandWithArgs = '') {
        if (!_isString(rawCommandWithArgs)) {
            // istanbul ignore next
            // eslint-disable-next-line max-len
            throw new TypeError(`Invalid parameter. CommandParser expects a string but received ${typeof rawCommandWithArgs}`);
        }

        /**
         * Command name
         *
         * Could be either Transmit or a System command
         *
         * This is consumed by the `InputController` after parsing here and is used to
         * determine what to do with the parsed command(s)
         *
         * @type {string}
         * @default ''
         */
        this.command = '';

        /**
         * Aircraft callsign
         *
         * this is optional and not included with system commands
         *
         * @type {string}
         * @default ''
         */
        this.callsign = '';

        /**
         * List of `CommandModel` objects.
         *
         * Each command is contained within a `CommandModel`, even System commands. This provides
         * a consistent interface for obtaining commands and arguments (via getter) and also
         * aloows for easy implementation of the legacy API structure.
         *
         * @type {array<CommandModel>}
         */
        this.commandList = [];

        this._extractCommandsAndArgs(rawCommandWithArgs.toLowerCase());
    }

    /**
     * Return an array of [commandName, ...args]
     *
     * We use this shape solely to match the existing api.
     *
     * When command is a System command:
     * - commandList is assumed to have a length on 1
     * - commandList[0].args[0] is assumed to have a single string value
     *
     * @property args
     * @return {string|array<string>}
     */
    get args() {
        if (this.command !== SYSTEM_COMMANDS.transmit) {
            return this.commandList[0].args;
        }

        return _map(this.commandList, (command) => command.nameAndArgs);
    }

    /**
     * Accept the entire string provided to the constructor and attempt to break it up into:
     * - System command and its arguments
     * - Transmit commands and thier arguments
     *
     * @for CommandParser
     * @method _extractCommandsAndArgs
     * @param rawCommandWithArgs {string}
     * @private
     */
    _extractCommandsAndArgs(rawCommandWithArgs) {
        const commandOrCallsignIndex = 0;
        const commandArgSegmentsWithCallsign = rawCommandWithArgs.split(COMMAND_ARGS_SEPARATOR);
        const callsignOrSystemCommandName = commandArgSegmentsWithCallsign[commandOrCallsignIndex];
        // effectively a slice of the array that returns everything but the first item
        const commandArgSegments = _tail(commandArgSegmentsWithCallsign);

        if (this._isSystemCommand(callsignOrSystemCommandName)) {
            this._buildSystemCommandModel(commandArgSegmentsWithCallsign);

            return;
        }

        this._buildTransmitCommandModels(callsignOrSystemCommandName, commandArgSegments);
    }

    /**
     * Build a `CommandModel` for a System command then add that model to the `commandList`
     *
     * @for CommandParser
     * @method _buildSystemCommandModel
     * @private
     */
    _buildSystemCommandModel(commandArgSegments) {
        const commandIndex = 0;
        const argIndex = 1;
        const commandName = commandArgSegments[commandIndex];
        const commandArgs = commandArgSegments[argIndex];
        const commandModel = new CommandModel(commandName);

        // undefined will happen with zeroArgument system commands, so we check for that here
        // and add only when args are defined
        if (typeof commandArgs !== 'undefined') {
            commandModel.args.push(commandArgs);
        }

        this.command = commandName;
        this.commandList.push(commandModel);

        this._validateAndParseCommandArguments();
    }

    /**
     * Build `CommandModel` objects for each transmit commands then add them to the `commandList`
     *
     * @private
     */
    _buildTransmitCommandModels(callsignOrSystemCommandName, commandArgSegments) {
        this.command = SYSTEM_COMMANDS.transmit;
        this.callsign = callsignOrSystemCommandName;
        this.commandList = this._buildCommandList(commandArgSegments);

        this._validateAndParseCommandArguments();
    }

    /**
     * Loop through the commandArgSegments array and either create a new `CommandModel` or add
     * arguments to a `CommandModel`.
     *
     * commandArgSegments will contain both commands and arguments (very contrived example):
     * - `[cmd, arg, arg, cmd, cmd, arg, arg, arg]`
     *
     * this method is expecting that
     * the first item it receives, that is not a space, is a command. we then push each successive
     * array item to the args array until we find another command. then we repeat the process.
     *
     * this allows us to create several `CommandModel` with arguments and only loop over them once.
     *
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
            } else if (_has(COMMAND_MAP, commandOrArg) && !this._isAliasCommandAnArg(commandModel, commandOrArg)) {
                commandModel = new CommandModel(COMMAND_MAP[commandOrArg]);

                return commandModel;
            } else if (typeof commandModel === 'undefined') {
                // if we've made it here and commandModel is still undefined, a command was not found
                return;
            }

            commandModel.args.push(commandOrArg);
        });


        return _compact(commandList);
    }

    /**
     * This method is used for addressing a very specific situation
     *
     * When the current command is `heading` and one of the arguments is `l`, the parser interprets
     * the `l` as another command. `l` is an alias for the `land` command.
     *
     * This method expects that a commandString will look like:
     * `AA321 t l 042`
     *
     * We look for the `heading` command and no existing arguments, as the `l` would become the
     * first argument in this situation.
     *
     * @for CommandParser
     * @method _isAliasCommandAnArg
     * @param commandModel {CommandModel}
     * @param commandOrArg {string}
     * @return {boolean}
     */
    _isAliasCommandAnArg(commandModel, commandOrArg) {
        if (!commandModel) {
            return false;
        }

        return commandModel.name === 'heading' && commandModel.args.length === 0 && commandOrArg === 'l';
    }

    /**
     * Fire off the `_validateCommandArguments` method and throws any errors returned
     *
     * @for CommandParser
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
     * For each `CommandModel` in the `commandList`, first validate it's arguments
     * then parse those arguments into a consumable array.
     *
     * @for CommandParser
     * @method _validateCommandArguments
     * @private
     */
    _validateCommandArguments() {
        return _compact(_map(this.commandList, (command) => {
            const hasError = command.validateArgs();

            if (hasError) {
                // we only return here so all the errors can be thrown at once
                // from within the calling method
                return hasError;
            }

            command.parseArgs();
        }));
    }

    /**
     * Encapsulation of boolean logic used to determine if the `callsignOrSystemCommandName`
     * is in fact a system command.
     *
     *
     * @for CommandParser
     * @method _isSystemCommand
     * @param callsignOrSystemCommandName {string}
     * @return {boolean}
     */
    _isSystemCommand(callsignOrSystemCommandName) {
        return _has(SYSTEM_COMMANDS, callsignOrSystemCommandName) &&
            callsignOrSystemCommandName !== SYSTEM_COMMANDS.transmit;
    }
}
