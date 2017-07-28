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
     * Colors for each elevation level (in feet), in HSL
     * From these HSL values, we later generate HSLA for use in the canvas
     *
     * Note that values must use the following units:
     * (H) Hue:         degrees
     * (S) Saturation:  percentage
     * (L) Lightness:   percentage
     *
     * @memberof TERRAIN_THEME
     * @property COLOR
     */
    COLOR: {
        1000: '190, 38%, 20%',
        2000: '190, 38%, 20%',
        3000: '190, 38%, 20%',
        4000: '190, 38%, 20%',
        5000: '190, 38%, 20%',
        6000: '72, 38%, 15%',
        7000: '72, 38%, 15%',
        8000: '72, 38%, 15%',
        9000: '72, 38%, 15%',
        10000: '72, 38%, 15%',
        11000: '312, 38%, 20%',
        12000: '312, 38%, 20%',
        13000: '312, 38%, 20%',
        14000: '312, 38%, 20%',
        15000: '312, 38%, 20%',
        16000: '132, 38%, 20%',
        17000: '132, 38%, 20%',
        18000: '132, 38%, 20%',
        19000: '132, 38%, 20%',
        20000: '132, 38%, 20%',
        21000: '12, 38%, 30%',
        22000: '12, 38%, 30%',
        23000: '12, 38%, 30%',
        24000: '12, 38%, 30%',
        25000: '12, 38%, 30%'
    }
};
