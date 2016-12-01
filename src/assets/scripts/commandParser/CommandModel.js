/**
 * @class CommandModel
 */
export default class CommandModel {
    /**
     * @constructor
     * @for CommandModel
     */
    constructor() {
        // where in the commandValueString does this command live
        this.location = -1;
        // command name, should match available commands in the COMMANDS constant
        this.name = '';
        // command arguments
        // assumed to be text between found command names
        this.args = [];
    }
}
