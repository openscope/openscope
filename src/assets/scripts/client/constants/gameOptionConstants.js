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
    PROJECTED_TRACK_LINE_LENGTH: 'ptlLength',
    DRAW_PROJECTED_PATHS: 'drawProjectedPaths',
    SOFT_CEILING: 'softCeiling',
    DRAW_ILS_DISTANCE_SEPARATOR: 'drawIlsDistanceSeparator',
    MOUSE_CLICK_DRAG: 'mouseClickDrag',
    RANGE_RINGS: 'rangeRings',
    RADAR_UPDATE_DELAY: 'radarUpdateDelay'
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
        defaultValue: 'DEFAULT',
        description: 'Scope Theme',
        type: 'select',
        onChangeEventHandler: EVENT.SET_THEME,
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
        name: GAME_OPTION_NAMES.CONTROL_METHOD,
        defaultValue: 'classic',
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
    },
    {
        name: GAME_OPTION_NAMES.DRAW_ILS_DISTANCE_SEPARATOR,
        defaultValue: 'from-theme',
        description: 'Show trailing separation indicator on ILS',
        help: 'Draw a trailing indicator 2.5 NM (4.6km) behind landing aircraft to help with traffic spacing',
        type: 'select',
        onChangeEventHandler: null,
        optionList: [
            {
                displayLabel: 'From Theme',
                value: 'from-theme'
            },
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
        name: GAME_OPTION_NAMES.PROJECTED_TRACK_LINE_LENGTH,
        defaultValue: 'from-theme',
        description: 'Projected Track Line (PTL)',
        type: 'select',
        onChangeEventHandler: null,
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
        onChangeEventHandler: null,
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
        onChangeEventHandler: null,
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
        name: GAME_OPTION_NAMES.RANGE_RINGS,
        defaultValue: 'default',
        description: 'Range rings',
        help: 'Radius of range rings, in nautical miles',
        type: 'select',
        onChangeEventHandler: EVENT.RANGE_RINGS_CHANGE,
        optionList: [
            {
                displayLabel: 'Default',
                value: 'default'
            },
            {
                displayLabel: 'Off',
                value: 'off'
            },
            {
                displayLabel: '1 nm',
                value: 1
            },
            {
                displayLabel: '2 nm',
                value: 2
            },
            {
                displayLabel: '5 nm',
                value: 5
            },
            {
                displayLabel: '10 nm',
                value: 10
            },
            {
                displayLabel: '15 nm',
                value: 15
            },
            {
                displayLabel: '20 nm',
                value: 20
            }
        ]
    },
    {
        name: GAME_OPTION_NAMES.RADAR_UPDATE_DELAY,
        defaultValue: 4.5,
        description: 'Delay Radar Screen Updates',
        help: 'Sets how long the radar screen should wait to refresh.',
        type: 'select',
        onChangeEventHandler: null,
        optionList: [
            {
                displayLabel: '1sec',
                value: 1
            },
            {
                displayLabel: '2sec',
                value: 2
            },
            {
                displayLabel: '3sec',
                value: 3
            },
            {
                displayLabel: '4.5sec',
                value: 4.5
            },
            {
                displayLabel: '5sec',
                value: 5
            }
        ]
    }
];
