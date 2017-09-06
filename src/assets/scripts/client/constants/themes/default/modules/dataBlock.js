import { COLOR } from '../color';

// TODO: Instead of individual colors, can we somehow specify an alpha value
// for 'IN_RANGE', 'OUT_OF_RANGE' and 'SELECTED', to be applied to the entire
// data block? Possibly `cc.globalAlpha`, to be only effective while drawing
// the data block, then `cc.restore()` to return to normal opacity?
/**
 * Colors and options for data blocks
 *
 * @enum DATA_BLOCK_THEME
 * @type {object}
 */
export const DATA_BLOCK_THEME = {
    /**
     * Color of the bar on the left side of the data block
     * Opacity used for when the aircraft is within the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property ARRIVAL_BAR_IN_RANGE
     */
    ARRIVAL_BAR_IN_RANGE: COLOR.BLUE_VERY_LIGHT,

    /**
     * Color of the bar on the left side of the data block
     * Opacity used for when the aircraft is outside the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property ARRIVAL_BAR_OUT_OF_RANGE
     */
    ARRIVAL_BAR_OUT_OF_RANGE: COLOR.BLUE_VERY_LIGHT,

    /**
     * Color of the bar on the left side of the data block
     * Opacity used for when the aircraft is selected
     *
     * @memberof DATA_BLOCK_THEME
     * @property ARRIVAL_BAR_SELECTED
     */
    ARRIVAL_BAR_SELECTED: COLOR.BLUE_VERY_LIGHT,

    /**
     * Color of the data block fill (if it is enabled)
     * Opacity used for when the aircraft is within the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property BACKGROUND_IN_RANGE
     */
    BACKGROUND_IN_RANGE: COLOR.BLUE_VERY_LIGHT,

    /**
     * Color of the data block fill (if it is enabled)
     * Opacity used for when the aircraft is outside the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property BACKGROUND_OUT_OF_RANGE
     */
    BACKGROUND_OUT_OF_RANGE: COLOR.BLUE_VERY_LIGHT,

    /**
     * Color of the data block fill (if it is enabled)
     * Opacity used for when the aircraft is selected
     *
     * @memberof DATA_BLOCK_THEME
     * @property BACKGROUND_SELECTED
     */
    BACKGROUND_SELECTED: COLOR.BLUE_VERY_LIGHT,

    /**
     * Color of the bar on the left side of the data block
     * Opacity used for when the aircraft is within the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property DEPARTURE_BAR_IN_RANGE
     */
    DEPARTURE_BAR_IN_RANGE: COLOR.BLUE_VERY_LIGHT,

    /**
     * Color of the bar on the left side of the data block
     * Opacity used for when the aircraft is outside the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property DEPARTURE_BAR_OUT_OF_RANGE
     */
    DEPARTURE_BAR_OUT_OF_RANGE: COLOR.BLUE_VERY_LIGHT,

    /**
     * Color of the bar on the left side of the data block
     * Opacity used for when the aircraft is selected
     *
     * @memberof DATA_BLOCK_THEME
     * @property DEPARTURE_BAR_SELECTED
     */
    DEPARTURE_BAR_SELECTED: COLOR.BLUE_VERY_LIGHT,

    /**
     * Whether or not to fill the data block with a background color
     * This z
     *
     * @memberof DATA_BLOCK_THEME
     * @property HAS_FILL
     */
    HAS_FILL: false,

    /**
     * Direction to extend the data block away from the target
     * Currently, only 360, 45, 90, 135, 180, 225, 270, and 315 are available.
     *
     * @memberof DATA_BLOCK_THEME
     * @property LEADER_DIRECTION
     */
    LEADER_DIRECTION: 360,

    /**
     * Number of additional pixels away from the target to position the data block
     * Used to adjust spacing between data block and target at lowest leader length
     *
     * @memberof DATA_BLOCK_THEME
     * @property LEADER_LENGTH_ADJUSTMENT_PIXELS
     */
    LEADER_LENGTH_ADJUSTMENT_PIXELS: -10,

    /**
     * Number of pixels longer the leader line becomes with each increase of
     * the 'leader length' value
     *
     * @memberof DATA_BLOCK_THEME
     * @property LEADER_LENGTH_INCREMENT_PIXELS
     */
    LEADER_LENGTH_INCREMENT_PIXELS: 25,

    /**
     * Default length of the leader lines (no meaningful units)
     * The 'leader line' is the line that connects the target (position dot) to
     * the data block so you know which callsign applies to which aircraft
     *
     * @memberof DATA_BLOCK_THEME
     * @property LEADER_LENGTH
     */
    LEADER_LENGTH: 1,

    /**
     * Distance from data block after which the leader line is drawn
     * Higher values mean a shorter leader line
     *
     * @memberof DATA_BLOCK_THEME
     * @type {number}
     */
    LEADER_PADDING_FROM_BLOCK_PX: -2,

    /**
     * Distance from radar target after which the leader line is drawn
     * Higher values mean a shorter leader line
     *
     * @memberof DATA_BLOCK_THEME
     * @type {number}
     */
    LEADER_PADDING_FROM_TARGET_PX: 0,

    /**
     * Font and size of text used in the data block
     *
     * @memberof DATA_BLOCK_THEME
     * @property TEXT_FONT
     */
    TEXT_FONT: '10px monoOne, monospace',

    /**
     * Color of text used in the data block
     * Opacity used for when the aircraft is within the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property TEXT_IN_RANGE
     */
    TEXT_IN_RANGE: COLOR.WHITE,

    /**
     * Color of text used in the data block
     * Opacity used for when the aircraft is outside the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property TEXT_OUT_OF_RANGE
     */
    TEXT_OUT_OF_RANGE: COLOR.WHITE,

    /**
     * Color of text used in the data block
     * Opacity used for when the aircraft is selected
     *
     * @memberof DATA_BLOCK_THEME
     * @property TEXT_SELECTED
     */
    TEXT_SELECTED: COLOR.WHITE
};
