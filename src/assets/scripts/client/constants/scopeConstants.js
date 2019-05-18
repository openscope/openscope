/**
 * Character used to separate the data block direction and length when specified
 * in a scope command. Example: '3/2' --> direction '3' and length '2'
 *
 * @enum DATA_BLOCK_DIRECTION_LENGTH_SEPARATOR
 * @type {string}
 */
export const DATA_BLOCK_DIRECTION_LENGTH_SEPARATOR = '/';

/**
 * Map of which number position correlates to what heading away from the
 * aircraft to draw the leader line and data block
 *
 * @enum DATA_BLOCK_POSITION_MAP
 * @type {object}
 */
export const DATA_BLOCK_POSITION_MAP = {
    8: 360,
    9: 45,
    6: 90,
    3: 135,
    2: 180,
    1: 225,
    4: 270,
    7: 315,
    5: 'ctr'
};
