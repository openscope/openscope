/**
 * Enumeration of canvas names
 *
 * @enum CANVAS_NAME
 * @final
 */
export const CANVAS_NAME = {
    /**
     * Name of the `static` canvas.
     *
     * This canvas should hold all of the items that do not update every frame;
     * things like terrain, fixes, video map, etc
     *
     * @memberOf CANVAS_NAME
     * @property STATIC
     */
    STATIC: 'static',

    /**
     * Name of the `dynamic` canvas.
     *
     * This canvas should hold all of the items that do update every frame;
     * things like aircraft, aircraft data blocks, etc
     *
     * @memberOf CANVAS_NAME
     * @property STATIC
     */
    DYNAMIC: 'dynamic'
};

/**
 * @enum BASE_CANVAS_FONT
 * @final
 */
export const BASE_CANVAS_FONT = '10px monoOne, monospace';

/**
 * @enum DEFAULT_CANVAS_SIZE
 * @final
 */
export const DEFAULT_CANVAS_SIZE = {
    HEIGHT: 480,
    WIDTH: 640,
    FOTTER_HEIGHT_OFFSET: 36
};

/**
 * @enum SCALE
 * @final
 */
export const SCALE = {
    // TODO: not a fan of this name
    CHANGE_FACTOR: 0.9,
    DEFAULT: 8,
    MIN: 1,
    MAX: 80
};

/**
 * @enum PAN
 * @final
 */
export const PAN = {
    X: 0,
    Y: 0
};
