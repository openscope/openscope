export const TERRAIN_THEME = {
    /**
     * Opacity of the lines on outer edges of terrain-elevated areas
     *
     * @memberof TERRAIN_THEME
     * @property BORDER_OPACITY
     */
    BORDER_OPACITY: 1,

    /**
     * Opaxity of the fill color within terrain-elevated areas
     *
     * @memberof TERRAIN_THEME
     * @property FILL_OPACITY
     */
    FILL_OPACITY: 0.1,

    /**
     * Colors for each elevation level (in feet), in RGB
     *
     * @memberof TERRAIN_THEME
     * @property COLOR
     */
    COLOR: {
        1000: '26, 150, 65',
        2000: '119, 194, 92',
        3000: '255, 255, 192',
        4000: '253, 201, 128',
        5000: '240, 124, 74',
        6000: '156, 81, 31'
    }
};
