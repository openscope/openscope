import _map from 'lodash/map';
import { PARSED_COMMAND_NAME } from '../constants/inputConstants';

/**
 * This class is returned from `CommandParser` on successful parsing.
 *
 * Differentiation of commands and arguments is determined by splitting the string on an empty space. This
 * is very important, so legacy commands did not have spaces between the command and argument. With this
 * implementation _every_ command shall have a space between itself and it's arguments.**
 *
 * Commands are broken out into two categories: `System` and `Transmit`.
 * - System commands are zero or single argument commands that are used for interacting with the app
 *   itself. Things like `timewarp` or `tutorial` are examples of system commands.
 *
 * - Transmit commands are instructions meant for a specific aircraft within the controlled airspace.
 *   These commands can have zero to many arguments, depending on the command. Some examples of transmit
 *   commands are `to`, `taxi`, `hold`.
 *
 *
 * All available commands are defined in the `commandMap`. Two terms of note are alias and root command.
 * We would call the `takeoff` command a root command and `to` and `cto` aliases. The root command is the
 * one that shares the same key as the command definition which gives us the correct validator and parser.
 * The root command is also what the `AircraftModel` is expecting when it receives commands
 * from the `InputController`.
 *
 * @class ParsedCommand
 */
export default class ParsedCommand {
    /**
     * @constructor
     * @for ParsedCommand
     * @param {{}} command
     * @param {array<AircraftCommandModel>} commandList
     * @param {string} callsign
     */
    constructor(command = '', commandList = [], callsign = '') {
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
        this.command = command;

        /**
         * List of `AircraftCommandModel` objects.
         *
         * Each command is contained within a `AircraftCommandModel`, even System commands. This provides
         * a consistent interface for obtaining commands and arguments (via getter) and also
         * aloows for easy implementation of the legacy API structure.
         *
         * @type {array<AircraftCommandModel>}
         */
        this.commandList = commandList;

        /**
         * Aircraft callsign
         *
         * this is optional and not included with system commands
         *
         * @type {string}
         * @default ''
         */
        this.callsign = callsign;
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
        if (this.command !== PARSED_COMMAND_NAME.TRANSMIT) {
            return this.commandList[0].args;
        }

        return _map(this.commandList, (command) => command.nameAndArgs);
    }
}
