export const EXPLICIT_COMMANDS = {
    QP: 'propogateDataBlock',
    QP_J: 'toggleHalo',
    QU: 'route',
    QZ: 'amendAltitude'
};

export const IMPLIED_COMMANDS = {
    ACCEPT_HANDOFF: 'acceptHandoff',
    HANDOFF: 'handoff',
    MOVE_DATA_BLOCK: 'moveDataBlock',
    SCRATCHPAD: 'setScratchpad'
};

export const COMMAND_FUNCTIONS = {
    ...IMPLIED_COMMANDS,
    ...EXPLICIT_COMMANDS
};
