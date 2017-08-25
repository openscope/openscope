import { COLOR } from '../color';

/**
 * Colors and options for scope
 *
 * @enum SCOPE_THEME
 * @type {object}
 */
export const SCOPE_THEME = {

    /**
     * Color to fill the airspace area
     *
     * @memberof SCOPE_THEME
     * @property AIRSPACE_FILL
     */
    AIRSPACE_FILL: COLOR.BLUE_MEDIUM_DARK_01,

    /**
     * Color to draw the solid line along the airspace perimeter
     *
     * @memberof SCOPE_THEME
     * @property AIRSPACE_PERIMETER
     */
    AIRSPACE_PERIMETER: COLOR.BLUE_DARK,

    /**
     * Color of the overall background of the scope
     *
     * @memberof SCOPE_THEME
     * @property BACKGROUND
     */
    BACKGROUND: COLOR.BLUE_VERY_DARK,

    /**
     * Color of the minor and major hash marks of the relative compass headings
     * displayed when an aircraft is selected
     *
     * @memberof SCOPE_THEME
     * @property COMPASS_HASH
     */
    COMPASS_HASH: COLOR.BLUE_MEDIUM_DARK,

    /**
     * Color of the heading text by the major hash marks of the relative compass
     * headings displayed when an aircraft is selected
     *
     * @memberof SCOPE_THEME
     * @property COMPASS_TEXT
     */
    COMPASS_TEXT: COLOR.BLUE_MEDIUM_DARK,

    /**
     * Color of the crosshair symbol drawn by `CanvasController.canvas_draw_crosshairs()`
     * This is mostly a debug function used to help developers get some context on the
     * state of the canvas when examining and improving the current drawing system
     *
     * @memberof SCOPE_THEME
     * @property CROSSHAIR_STROKE
     */
    CROSSHAIR_STROKE: COLOR.RED,

    /**
     * Color to fill the fix triangles with
     *
     * @memberof SCOPE_THEME
     * @property FIX_FILL
     */
    FIX_FILL: COLOR.BLUE_MEDIUM,

    /**
     * Color to use for the labels on each of the fixes
     *
     * @memberof SCOPE_THEME
     * @property FIX_TEXT
     */
    FIX_TEXT: COLOR.BLUE_MEDIUM,

    /**
     * Color of the range rings shown on the scope around the airport
     *
     * @memberof SCOPE_THEME
     * @property RANGE_RING_COLOR
     */
    RANGE_RING_COLOR: COLOR.BLUE_DARK,

    /**
     * Color used to depict the restricted airspace areas
     *
     * @memberof SCOPE_THEME
     * @property RESTRICTED_AIRSPACE
     */
    RESTRICTED_AIRSPACE: COLOR.BLUE_MEDIUM_LIGHT,

    /**
     * Color of the lines extending out from the runway thresholds
     *
     * @memberof SCOPE_THEME
     * @property RUNWAY_EXTENDED_CENTERLINE
     */
    RUNWAY_EXTENDED_CENTERLINE: COLOR.BLUE_MEDIUM_DARK,

    /**
     * Color of the runway label text
     *
     * @memberof SCOPE_THEME
     * @property RUNWAY_LABELS
     */
    RUNWAY_LABELS: COLOR.BLUE_LIGHT,

    /**
     * Color of the runways themselves
     *
     * @memberof SCOPE_THEME
     * @property RUNWAY
     */
    RUNWAY: COLOR.WHITE,

    /**
     * Color of the lines drawn between fixes on SIDs
     *
     * @memberof SCOPE_THEME
     * @property SID
     */
    SID: COLOR.BLUE_VERY_LIGHT,

    /**
     * Color of the lines drawn between fixes on STARs
     *
     * @memberof SCOPE_THEME
     * @property TOP_ROW_TEXT
     */
    TOP_ROW_TEXT: COLOR.WHITE,

    /**
     * Color of the video map lines (defined in the `maps`
     * section of the airport file)
     *
     * @memberof SCOPE_THEME
     * @property VIDEO_MAP
     */
    VIDEO_MAP: COLOR.BLUE_MEDIUM
};
