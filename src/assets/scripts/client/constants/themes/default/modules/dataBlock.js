import { COLOR } from '../colors';

// TODO: Instead of individual colors, can we somehow specify an alpha value
// for 'IN_RANGE', 'OUT_OF_RANGE' and 'SELECTED', to be applied to the entire
// data block? Possibly `cc.globalAlpha`, to be only effective while drawing
// the data block, then `cc.restore()` to return to normal opacity?
export const DATA_BLOCK_THEME = {
    ARRIVAL_BAR_IN_RANGE: COLOR.RED_05,
    ARRIVAL_BAR_OUT_OF_RANGE: COLOR.RED_02,
    ARRIVAL_BAR_SELECTED: COLOR.RED_09,
    BACKGROUND_IN_RANGE: COLOR.GREEN_05,
    BACKGROUND_OUT_OF_RANGE: COLOR.GREEN_02,
    BACKGROUND_SELECTED: COLOR.GREEN_09,
    DEPARTURE_BAR_IN_RANGE: COLOR.BLUE_05,
    DEPARTURE_BAR_OUT_OF_RANGE: COLOR.BLUE_02,
    DEPARTURE_BAR_SELECTED: COLOR.BLUE_09,
    FDB_LEADER_DIRECTION: 360,
    // FIXME: This not yet in use!
    FDB_LEADER_LENGTH: 1,
    FDB_TEXT_FONT: '10px monoOne, monospace',
    HAS_FDB_BOX_OUTLINE: true,
    TEXT_IN_RANGE: COLOR.WHITE_05,
    TEXT_OUT_OF_RANGE: COLOR.WHITE_02,
    TEXT_SELECTED: COLOR.WHITE_09
};
