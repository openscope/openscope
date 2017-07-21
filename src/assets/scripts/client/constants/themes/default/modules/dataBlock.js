import { COLOR } from '../colors';

// TODO: Instead of individual colors, can we somehow specify an alpha value
// for 'IN_RANGE', 'OUT_OF_RANGE' and 'SELECTED', to be applied to the entire
// data block? Possibly `cc.globalAlpha`, to be only effective while drawing
// the data block, then `cc.restore()` to return to normal opacity?
export const DATA_BLOCK_THEME = {
    /**
     * Color of the bar on the left side of the data block
     * Opacity used for when the aircraft is within the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property ARRIVAL_BAR_IN_RANGE
     */
    ARRIVAL_BAR_IN_RANGE: COLOR.RED_05,

    /**
     * Color of the bar on the left side of the data block
     * Opacity used for when the aircraft is outside the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property ARRIVAL_BAR_OUT_OF_RANGE
     */
    ARRIVAL_BAR_OUT_OF_RANGE: COLOR.RED_02,

    /**
     * Color of the bar on the left side of the data block
     * Opacity used for when the aircraft is selected
     *
     * @memberof DATA_BLOCK_THEME
     * @property ARRIVAL_BAR_SELECTED
     */
    ARRIVAL_BAR_SELECTED: COLOR.RED_09,

    /**
     * Color of the data block fill (if it is enabled)
     * Opacity used for when the aircraft is within the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property BACKGROUND_IN_RANGE
     */
    BACKGROUND_IN_RANGE: COLOR.GREEN_05,

    /**
     * Color of the data block fill (if it is enabled)
     * Opacity used for when the aircraft is outside the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property BACKGROUND_OUT_OF_RANGE
     */
    BACKGROUND_OUT_OF_RANGE: COLOR.GREEN_02,

    /**
     * Color of the data block fill (if it is enabled)
     * Opacity used for when the aircraft is selected
     *
     * @memberof DATA_BLOCK_THEME
     * @property BACKGROUND_SELECTED
     */
    BACKGROUND_SELECTED: COLOR.GREEN_09,

    /**
     * Color of the bar on the left side of the data block
     * Opacity used for when the aircraft is within the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property DEPARTURE_BAR_IN_RANGE
     */
    DEPARTURE_BAR_IN_RANGE: COLOR.BLUE_05,

    /**
     * Color of the bar on the left side of the data block
     * Opacity used for when the aircraft is outside the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property DEPARTURE_BAR_OUT_OF_RANGE
     */
    DEPARTURE_BAR_OUT_OF_RANGE: COLOR.BLUE_02,

    /**
     * Color of the bar on the left side of the data block
     * Opacity used for when the aircraft is selected
     *
     * @memberof DATA_BLOCK_THEME
     * @property DEPARTURE_BAR_SELECTED
     */
    DEPARTURE_BAR_SELECTED: COLOR.BLUE_09,

    /**
     * Whether or not to fill the data block with a background color
     *
     * @memberof DATA_BLOCK_THEME
     * @property HAS_FILL
     */
    HAS_FILL: true,

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
    TEXT_IN_RANGE: COLOR.WHITE_05,

    /**
     * Color of text used in the data block
     * Opacity used for when the aircraft is outside the airspace
     *
     * @memberof DATA_BLOCK_THEME
     * @property TEXT_OUT_OF_RANGE
     */
    TEXT_OUT_OF_RANGE: COLOR.WHITE_02,

    /**
     * Color of text used in the data block
     * Opacity used for when the aircraft is selected
     *
     * @memberof DATA_BLOCK_THEME
     * @property TEXT_SELECTED
     */
    TEXT_SELECTED: COLOR.WHITE_09
};
