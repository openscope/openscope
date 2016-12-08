import _isNaN from 'lodash/isNaN';
import _map from 'lodash/map';
import { COMMAND_DEFINITION } from './commandDefinitions';

/**
 * @class CommandModel
 */
export default class CommandModel {
    /**
     * @constructor
     * @for CommandModel
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
         *
         *
         * @property _commandDefinition
         * @type {object}
         * @private
         */
        this._commandDefinition = COMMAND_DEFINITION[name];

        /**
         * command arguments
         * assumed to be text between found command names
         *
         * @property args
         * @type {array}
         * @default []
         */
        this.args = [];
    }

    /**
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
     *
     *
     */
    validateArgs() {
        // const commandDefinition = COMMAND_DEFINITION[this.name];

        return this._commandDefinition.validate(this.args);
    }

    /**
     *
     *
     */
    parseArgs() {
        // const commandDefinition = COMMAND_DEFINITION[this.name];

        // this completely overwrites current args. this is intended because all args are received as
        // strings but consumed as strings, numbers or booleans. and when the args are initially set
        // they may not all be available yet
        this.args = this._commandDefinition.parse(this.args);
    }
}
