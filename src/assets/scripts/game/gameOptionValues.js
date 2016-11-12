/* eslint-disable max-len, import/prefer-default-export */
export const GAME_OPTION_VALUES = [
    {
        name: 'controlMethod',
        defaultValue: 'classic',
        description: 'Control Method',
        type: 'select',
        data: [
            ['Classic', 'classic'],
            ['Arrow Keys', 'arrows']
        ]
    },
    {
        name: 'drawProjectedPaths',
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
        name: 'simplifySpeeds',
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
        name: 'softCeiling',
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
