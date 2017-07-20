import { EVENT } from './eventNames';

/* eslint-disable max-len, import/prefer-default-export */
/**
 * Name enumeration of available game options
 *
 * @property GAME_OPTION_NAMES
 * @type {Object}
 * @final
 */
export const GAME_OPTION_NAMES = {
    THEME: 'theme',
    CONTROL_METHOD: 'controlMethod',
    PTL_LENGTH: 'ptlLength',
    DRAW_PROJECTED_PATHS: 'drawProjectedPaths',
    SOFT_CEILING: 'softCeiling',
    INCLUDE_WIP_AIRPORTS: 'includeWipAirports',
    DRAW_ILS_DISTANCE_SEPARATOR: 'drawIlsDistanceSeparator'
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
        name: GAME_OPTION_NAMES.THEME,
        defaultValue: 'default',
        description: 'Scope Theme',
        type: 'select',
        onChangeEvent: EVENT.SET_THEME,
        optionList: [
            {
                displayLabel: 'Default',
                value: 'DEFAULT'
            }
        ]
    },
    {
        name: GAME_OPTION_NAMES.CONTROL_METHOD,
        defaultValue: 'classic',
        description: 'Control Method',
        type: 'select',
        onChangeEvent: null,
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
    },
    {
        name: GAME_OPTION_NAMES.PTL_LENGTH,
        defaultValue: 'from-theme',
        description: 'Projected Track Line (PTL)',
        type: 'select',
        onChangeEvent: null,
        optionList: [
            {
                displayLabel: 'From Theme',
                value: 'from-theme'
            },
            {
                displayLabel: 'Off',
                value: 0
            },
            {
                displayLabel: '30sec',
                value: 0.5
            },
            {
                displayLabel: '1min',
                value: 1
            },
            {
                displayLabel: '2min',
                value: 2
            }
        ]
    },
    {
        name: GAME_OPTION_NAMES.DRAW_PROJECTED_PATHS,
        defaultValue: 'selected',
        description: 'Draw aircraft projected path',
        type: 'select',
        onChangeEvent: null,
        optionList: [
            {
                displayLabel: 'Always',
                value: 'always'
            },
            {
                displayLabel: 'Selected',
                value: 'selected'
            },
            {
                displayLabel: 'Never',
                value: 'never'
            }
        ]
    },
    {
        name: GAME_OPTION_NAMES.SOFT_CEILING,
        defaultValue: 'yes',
        description: 'Allow departures via climb',
        help: 'Normally aircraft departs the airspace by flying beyond the horizontal bounds.  If set to yes, aircraft may also depart the airspace by climbing above it.',
        type: 'select',
        onChangeEvent: null,
        optionList: [
            {
                displayLabel: 'Yes',
                value: 'yes'
            },
            {
                displayLabel: 'No',
                value: 'no'
            }
        ]
    },
    {
        name: GAME_OPTION_NAMES.INCLUDE_WIP_AIRPORTS,
        defaultValue: 'no',
        description: 'Include WIP Airports',
        help: 'Will include all available airports including those marked as Work In Progress.',
        type: 'select',
        onChangeEvent: null,
        optionList: [
            {
                displayLabel: 'Yes',
                value: 'yes'
            },
            {
                displayLabel: 'No',
                value: 'no'
            }
        ]
    },
    {
        name: GAME_OPTION_NAMES.DRAW_ILS_DISTANCE_SEPARATOR,
        defaultValue: 'yes',
        description: 'Draw distance separator on ILS',
        help: 'Draw a trailing indicator 2.5 NM (4.6km) behind landing aircraft to help with traffic spacing',
        type: 'select',
        optionList: [
            {
                displayLabel: 'Yes',
                value: 'yes'
            },
            {
                displayLabel: 'No',
                value: 'no'
            }
        ]
    }
];
