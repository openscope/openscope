/**
 * @class CommandModel
 */
export default class CommandModel {
    /**
     * @constructor
     * @for CommandModel
     */
    constructor(name = '') {
        // where in the commandValueString does this command live
        // this.index = -1;
        // command name, should match available commands in the COMMANDS constant
        this.name = name;
        // command arguments
        // assumed to be text between found command names
        this.args = [];
    }
}
