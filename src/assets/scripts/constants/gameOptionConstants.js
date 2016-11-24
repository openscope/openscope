/* eslint-disable max-len, import/prefer-default-export */
/**
 * Name enumeration of available game options
 *
 * @property GAME_OPTION_NAMES
 * @type {Object}
 * @final
 */
export const GAME_OPTION_NAMES = {
    CONTROL_METHOD: 'controlMethod',
    DRAW_PROJECTED_PATHS: 'drawProjectedPaths',
    SIMPLIFY_SPEEDS: 'simplifySpeeds',
    SOFT_CEILING: 'softCeiling'
};

/**
 * User options
 *
 * These options are presented in a modal and are stored in localStorage
 *
 * @property GAME_OPTION_VALUES
 * @type {array<object>}
 * @final
 */
export const GAME_OPTION_VALUES = [
    {
        name: GAME_OPTION_NAMES.CONTROL_METHOD,
        defaultValue: 'classic',
        description: 'Control Method',
        type: 'select',
        data: [
            ['Classic', 'classic'],
            ['Arrow Keys', 'arrows']
        ]
    },
    {
        name: GAME_OPTION_NAMES.DRAW_PROJECTED_PATHS,
        defaultValue: 'selected',
        description: 'Draw aircraft projected path',
        type: 'select',
        data: [
            ['Always', 'always'],
            ['Selected', 'selected'],
            ['Never', 'never']
        ]
    },
    {
        name: GAME_OPTION_NAMES.SIMPLIFY_SPEEDS,
        defaultValue: 'yes',
        description: 'Use simplified airspeeds',
        help: 'Controls use of a simplified calculation which results in aircraft always moving across the ground at the speed assigned.  In reality aircraft will move faster as they increase altitude.',
        type: 'select',
        data: [
            ['Yes', 'yes'],
            ['No', 'no']
        ]
    },
    {
        name: GAME_OPTION_NAMES.SOFT_CEILING,
        defaultValue: 'no',
        description: 'Allow departures via climb',
        help: 'Normally aircraft departs the airspace by flying beyond the horizontal bounds.  If set to yes, aircraft may also depart the airspace by climbing above it.',
        type: 'select',
        data: [
            ['Yes', 'yes'],
            ['No', 'no']
        ]
    }
];
