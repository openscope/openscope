/**
 * @enum BASE_CANVAS_FONT
 * @type {string}
 * @final
 */
export const BASE_CANVAS_FONT = '10px monoOne, monospace';

/**
 * @enum DEFAULT_CANVAS_SIZE
 * @type {Object}
 * @final
 */
export const DEFAULT_CANVAS_SIZE = {
    HEIGHT: 480,
    WIDTH: 640
};

/**
 * Various options for drawing aircraft on canvas
 *
 * @enum AIRCRAFT_DRAW_OPTIONS
 * @type {Object}
 * @final
 */
export const AIRCRAFT_DRAW_OPTIONS = {
    /**
     * Length of Projected Track Lines (PTLs), in minutes. Standard is 1.
     *
     * @memberof AIRCRAFT_DRAW_OPTIONS
     * @property PTL_LENGTH
     * @final
     */
    PTL_LENGTH: 1
};
