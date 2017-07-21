import { COLOR } from '../colors';

export const SCOPE_THEME = {

    /**
     * Color to fill the airspace area
     *
     * @memberof SCOPE_THEME
     * @property AIRSPACE_FILL
     */
    AIRSPACE_FILL: COLOR.GREEN_LIGHT_PALE_002,

    /**
     * Color to draw the solid line along the airspace perimeter
     *
     * @memberof SCOPE_THEME
     * @property AIRSPACE_PERIMETER
     */
    AIRSPACE_PERIMETER: COLOR.GREEN_LIGHT_PALE_025,

    /**
     * Color of the overall background of the scope
     *
     * @memberof SCOPE_THEME
     * @property BACKGROUND
     */
    BACKGROUND: COLOR.GREEN_DARK,

    /**
     * Color of the minor and major hash marks of the relative compass headings
     * displayed when an aircraft is selected
     *
     * @memberof SCOPE_THEME
     * @property COMPASS_HASH
     */
    COMPASS_HASH: COLOR.GRAY_LIGHT,

    /**
     * Color of the heading text by the major hash marks of the relative compass
     * headings displayed when an aircraft is selected
     *
     * @memberof SCOPE_THEME
     * @property COMPASS_TEXT
     */
    COMPASS_TEXT: COLOR.WHITE,

    /**
     * Color of the crosshair symbol drawn by `CanvasController.canvas_draw_crosshairs()`
     * This is mostly a debug function used to help developers get some context on the
     * state of the canvas when examining and improving the current drawing system
     *
     * @memberof SCOPE_THEME
     * @property CROSSHAIR_STROKE
     */
    CROSSHAIR_STROKE: COLOR.GRAY,

    /**
     * Color to fill the fix triangles with
     *
     * @memberof SCOPE_THEME
     * @property FIX_FILL
     */
    FIX_FILL: COLOR.WHITE_05,

    /**
     * Color to use for the labels on each of the fixes
     *
     * @memberof SCOPE_THEME
     * @property FIX_TEXT
     */
    FIX_TEXT: COLOR.WHITE_05,

    /**
     * Color of the range rings shown on the scope around the airport
     *
     * @memberof SCOPE_THEME
     * @property RANGE_RING_COLOR
     */
    RANGE_RING_COLOR: COLOR.GREEN_LIGHT_PALE_01,

    /**
     * Color used to depict the restricted airspace areas
     *
     * @memberof SCOPE_THEME
     * @property RESTRICTED_AIRSPACE
     */
    RESTRICTED_AIRSPACE: COLOR.BLUE_LIGHT_SOFT_03,

    /**
     * Color of the lines extending out from the runway thresholds
     *
     * @memberof SCOPE_THEME
     * @property RUNWAY_EXTENDED_CENTERLINE
     */
    RUNWAY_EXTENDED_CENTERLINE: COLOR.GREEN_MEDIUM,

    /**
     * Color of the runway label text
     *
     * @memberof SCOPE_THEME
     * @property RUNWAY_LABELS
     */
    RUNWAY_LABELS: COLOR.WHITE_08,

    /**
     * Color of the runways themselves
     *
     * @memberof SCOPE_THEME
     * @property RUNWAY
     */
    RUNWAY: COLOR.WHITE_04,

    /**
     * Color of the lines showing where SIDs go
     *
     * @memberof SCOPE_THEME
     * @property SID
     */
    SID: COLOR.BLUE_06,

    /**
     * Color of the lines showing where STARs go
     *
     * @memberof SCOPE_THEME
     * @property TOP_ROW_TEXT
     */
    TOP_ROW_TEXT: COLOR.WHITE_08,

    /**
     * Color of the video map lines (defined in the `maps`
     * section of the airport file)
     *
     * @memberof SCOPE_THEME
     * @property VIDEO_MAP
     */
    VIDEO_MAP: COLOR.GREEN_LIGHT
};
