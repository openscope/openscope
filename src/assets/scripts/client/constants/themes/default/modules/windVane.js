import { COLOR } from '../colors';

export const WIND_VANE_THEME = {

    /**
     * Color of the line indicating the wind direction in gusty winds
     *
     * @memberof WIND_VANE_THEME
     * @property DIRECTION_LINE_GUSTY
     */
    DIRECTION_LINE_GUSTY: COLOR.WHITE,

    /**
     * Color of the line indivating the wind direction
     *
     * @memberof WIND_VANE_THEME
     * @property DIRECTION_LINE
     */
    DIRECTION_LINE: COLOR.WHITE,

    /**
     * Color of the ring around the wind speed
     *
     * @memberof WIND_VANE_THEME
     * @property INNER_RING_STROKE
     */
    INNER_RING_STROKE: COLOR.WHITE,

    /**
     * Color to fill the whole wind vane
     *
     * @memberof WIND_VANE_THEME
     * @property OUTER_RING_FILL
     */
    OUTER_RING_FILL: COLOR.GRAY_VERY_VERY_DARK,

    /**
     * Color of the wind speed text
     *
     * @memberof WIND_VANE_THEME
     * @property WIND_SPEED_TEXT
     */
    WIND_SPEED_TEXT: COLOR.WHITE
};
