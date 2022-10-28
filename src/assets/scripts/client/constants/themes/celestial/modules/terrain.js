/**
 * Colors and options for terrain contours
 *
 * @enum TERRAIN_THEME
 * @type {object}
 */
export const TERRAIN_THEME = {
    /**
     * Opacity of the lines on outer edges of terrain-elevated areas
     *
     * @memberof TERRAIN_THEME
     * @property BORDER_OPACITY
     */
    BORDER_OPACITY: 1,

    /**
     * Opacity of the fill color within terrain-elevated areas
     *
     * @memberof TERRAIN_THEME
     * @property FILL_OPACITY
     */
    FILL_OPACITY: 0.0,

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
        0: '0, 0%, 54.9%',
        1000: '0, 0%, 54.9%',
        2000: '0, 0%, 54.9%',
        3000: '0, 0%, 54.9%',
        4000: '0, 0%, 54.9%',
        5000: '0, 0%, 54.9%',
        6000: '0, 0%, 54.9%',
        7000: '0, 0%, 54.9%',
        8000: '0, 0%, 54.9%',
        9000: '0, 0%, 54.9%',
        10000: '0, 0%, 54.9%',
        11000: '0, 0%, 54.9%',
        12000: '0, 0%, 54.9%',
        13000: '0, 0%, 54.9%',
        14000: '0, 0%, 54.9%',
        15000: '0, 0%, 54.9%',
        16000: '0, 0%, 54.9%',
        17000: '0, 0%, 54.9%',
        18000: '0, 0%, 54.9%',
        19000: '0, 0%, 54.9%',
        20000: '0, 0%, 54.9%',
        21000: '0, 0%, 54.9%',
        22000: '0, 0%, 54.9%',
        23000: '0, 0%, 54.9%',
        24000: '0, 0%, 54.9%',
        25000: '0, 0%, 54.9%'
    }
};
