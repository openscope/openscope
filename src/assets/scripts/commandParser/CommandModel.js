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
        // if (this.args.length < 2) {
        //     return [
        //         this.name,
        //         this.args[0]
        //     ];
        // }

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
        const commandDefinition = COMMAND_DEFINITION[this.name];

        return commandDefinition.validate(this.args);
    }

    /**
     *
     *
     */
    parseArgs() {
        const commandDefinition = COMMAND_DEFINITION[this.name];

        return commandDefinition.parse(this.args);
    }
}
