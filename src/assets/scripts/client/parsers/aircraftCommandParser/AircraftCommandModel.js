import { AIRCRAFT_COMMAND_DEFINITION } from './aircraftCommandDefinitions';

/**
 * A definition of a specific command and it's arguments.
 *
 * Conatins a command name, which maps 1:1 with a name defined in `commandMap.js` and `commandDefinitions.js`.
 * Commands may have an alias or many, we care only about the root command. The command map will map any
 * alias to a root command and this `AircraftCommandModel` is only concerned about those root commands. It has
 * no way of knowing what the original alias was, if one was used.
 *
 * Each `AircraftCommandModel` will be expected to have, at a minimum, a `name` and a matching
 * `AIRCRAFT_COMMAND_DEFINITION`.
 *
 * @class AircraftCommandModel
 */
export default class AircraftCommandModel {
    /**
     * @constructor
     * @for AircraftCommandModel
     */
    constructor(name = '') {
        /**
         * command name, should match a command in the COMMANDS constant
         *
         * @property name
         * @type {string}
         */
        this.name = name;

        /**
         * A reference to the AIRCRAFT_COMMAND_DEFINITION for this particular command.
         * this gives us access to both the `validate` and `parse` methods
         * that belong to this command.
         *
         * Storing this as an instance property allows us to do the lookup once
         * and then make it available to the rest of the class so it can
         * be referenced when needed.
         *
         * @property _commandDefinition
         * @type {object}
         * @private
         */
        this._commandDefinition = AIRCRAFT_COMMAND_DEFINITION[name];

        /**
         * list of command arguments
         *
         * - assumed to be the text command names
         * - may be empty, depending on the command
         * - should only ever be strings on initial set immediately after instantiation
         * - will later be parsed via the `_commandDefinition.parse()` method to the
         *   correct data types and shape
         *
         * @property args
         * @type {array}
         * @default []
         */
        this.args = [];

        // TODO: may need to throw here if `_commandDefinition` is undefined
    }

    /**
     * Return an array of [name, ...args]
     *
     * We use this shape solely to match the existing api.
     *
     * @property nameAndArgs
     * @return {array}
     */
    get nameAndArgs() {
        return [
            this.name,
            ...this.args
        ];
    }

    /**
     * Send the initial args off to the validator
     *
     * @for AircraftCommandModel
     * @method validateArgs
     * @return {string|undefined}
     */
    validateArgs() {
        if (typeof this._commandDefinition === 'undefined') {
            return;
        }

        return this._commandDefinition.validate(this.args);
    }

    /**
     * Send the initial args, set from the `AircraftCommandParser` right after instantiation, off to
     * the parser for formatting.
     *
     * @for AircraftCommandModel
     * @method parseArgs
     */
    parseArgs() {
        // this completely overwrites current args. this is intended because all args are received as
        // strings but consumed as strings, numbers or booleans. and when the args are initially set
        // they may not all be available yet
        this.args = this._commandDefinition.parse(this.args);
    }
}
