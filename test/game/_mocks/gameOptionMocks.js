export const GAME_OPTION_LIST_MOCK = [
    {
        name: 'threeve',
        defaultValue: '$texas',
        description: 'Scope Theme',
        type: 'select',
        onChangeEventHandler: 'set-theme',
        optionList: [
            {
                displayLabel: 'Classic',
                value: 'CLASSIC'
            },
            {
                displayLabel: 'Default',
                value: 'DEFAULT'
            }
        ]
    },
    {
        name: 'number',
        defaultValue: 'the letter v',
        description: 'Control Method',
        type: 'select',
        onChangeEventHandler: null,
        optionList: [
            {
                displayLabel: 'Classic',
                value: 'classic'
            },
            {
                displayLabel: 'Arrow Keys',
                value: 'arrows'
            }
        ]
    }
];
