import _isNaN from 'lodash/isNaN';
import _map from 'lodash/map';

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

    // TODO: this validation/translation logic should live in another function
    /**
     *
     *
     * @property parsedArgs
     * @return {array}
     */
    get parsedArgs() {
        return _map(this.args, (arg) => {
            let parsedArg = parseInt(arg, 10);

            if (_isNaN(parsedArg) || arg[0] === '0') {
                parsedArg = arg;
            }

            return parsedArg;
        });
    }
}
