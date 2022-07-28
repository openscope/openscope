/**
 * Scope commands whose first element is a reference to the function to execute
 *
 * @enum EXPLICIT_COMMANDS
 * @type {object}
 */
export const EXPLICIT_COMMANDS = {
    QP: 'propogateDataBlock',
    QP_J: 'setHalo',
    QU: 'route',
    QZ: 'amendAltitude'
};

/**
 * Scope commands where the function to execute is not explicitly stated in
 * the command itself, but is "implied" based on the context of the entry
 *
 * @enum IMPLIED_COMMANDS
 * @type {object}
 */
export const IMPLIED_COMMANDS = {
    ACCEPT_HANDOFF: 'acceptHandoff',
    INITIATE_HANDOFF: 'initiateHandoff',
    MOVE_DATA_BLOCK: 'moveDataBlock',
    SCRATCHPAD: 'setScratchpad'
};

/**
 * Array of all available scope commands that can be run
 * @enum COMMAND_FUNCTIONS
 * @type {object}
 */
export const COMMAND_FUNCTIONS = {
    ...IMPLIED_COMMANDS,
    ...EXPLICIT_COMMANDS
};
