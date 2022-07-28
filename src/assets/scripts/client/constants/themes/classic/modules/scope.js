import { COLOR } from '../color';

export const SCOPE_THEME = {
    AIRSPACE_FILL: COLOR.GREEN_LIGHT_PALE_002,
    AIRSPACE_PERIMETER: COLOR.GREEN_LIGHT_PALE_025,
    BACKGROUND: COLOR.GREEN_DARK,
    COMPASS_HASH: COLOR.GRAY_LIGHT,
    COMPASS_TEXT: COLOR.WHITE,
    CROSSHAIR_STROKE: COLOR.GRAY,
    FIX_FILL: COLOR.WHITE_05,
    FIX_TEXT: COLOR.WHITE_05,
    HALO_DEFAULT_RADIUS_NM: 3,
    HALO_MAX_RADIUS_NM: 20,

    /**
     * Color to use for the background on the `MeasureTool` labels
     *
     * @memberof SCOPE_THEME
     * @property MEASURE_BACKGROUND
     */
    MEASURE_BACKGROUND: COLOR.GREEN_MEDIUM,

    /**
     * Color to use for the text on the `MeasureTool` line
     *
     * @memberof SCOPE_THEME
     * @property MEASURE_LINE
     */
    MEASURE_LINE: COLOR.GREEN_LIGHT,

    /**
     * Color to use for the text on the `MeasureTool` labels
     *
     * @memberof SCOPE_THEME
     * @property MEASURE_TEXT
     */
    MEASURE_TEXT: COLOR.WHITE,

    RANGE_RING_COLOR: COLOR.GREEN_LIGHT_PALE_01,
    RESTRICTED_AIRSPACE: COLOR.BLUE_LIGHT_SOFT_03,
    RUNWAY_EXTENDED_CENTERLINE: COLOR.GREEN_MEDIUM,
    RUNWAY_LABELS: COLOR.WHITE_08,
    RUNWAY: COLOR.WHITE_04,
    SID: COLOR.BLUE_06,
    STAR: COLOR.RED,
    TOP_ROW_TEXT: COLOR.WHITE_08,
    VIDEO_MAP: COLOR.GREEN_LIGHT
};
