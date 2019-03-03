import _has from 'lodash/has';
import EventBus from '../lib/EventBus';
import { round } from '../math/core';
import { EVENT } from '../constants/eventNames';
import {
    DEFAULT_CANVAS_SIZE,
    PAN,
    SCALE
} from '../constants/canvasConstants';
import { STORAGE_KEY } from '../constants/storageKeys';
import { INVALID_NUMBER } from '../constants/globalConstants';

/**
 * Singleton responsible for mantining canvas dimensions, pan and zoom
 *
 * Also provides methods for translating `[x, y]` positions to
 * and from kilometers or pixels
 *
 * @class CanvasStageModel
 */
class CanvasStageModel {
    /**
     * @constructor
     */
    constructor() {
        /**
         * @property _eventBus
         * @type {EventBus}
         * @private
         */
        this._eventBus = EventBus;

        /**
         * Pixel height of the canvas(es)
         *
         * @property height
         * @type {number}
         * @default INVALID_NUMBER
         * @private
         */
        this._height = INVALID_NUMBER;

        /**
         * Pixel width of the canvas(es)
         *
         * @property width
         * @type {number}
         * @default INVALID_NUMBER
         * @private
         */
        this._width = INVALID_NUMBER;

        /**
         * Midpoint of view along the `x` coordinate
         *
         * @property _panX
         * @type {number}
         * @default INVALID_NUMBER
         * @private
         */
        this._panX = INVALID_NUMBER;

        /**
         * Midpoint of view along the `y` coordinate
         *
         * @property _panY
         * @type {number}
         * @default INVALID_NUMBER
         * @private
         */
        this._panY = INVALID_NUMBER;

        /**
         * pixels per km
         *
         * @property _defaultScale
         * @type {number}
         * @default INVALID_NUMBER
         * @private
         */
        this._defaultScale = INVALID_NUMBER;

        /**
         * maximum scale value
         *
         * @property _scaleMax
         * @type {number}
         * @default INVALID_NUMBER
         * @private
         */
        this._scaleMax = INVALID_NUMBER;

        /**
         * minimum scale value
         *
         * @property _scaleMin
         * @type {number}
         * @default INVALID_NUMBER
         * @private
         */
        this._scaleMin = INVALID_NUMBER;

        /**
         * Current scale value
         *
         * scale is essentially the zoom value, the larger the
         * scale the closer the current zoom.
         *
         * @property _scale
         * @type {number}
         * @default INVALID_NUMBER
         * @private
         */
        this._scale = INVALID_NUMBER;

        return this._init();
    }

    /**
     * @property height
     * @type {number}
     */
    get height() {
        return this._height;
    }

    /**
     * @property halfHeight
     * @type {number}
     */
    get halfHeight() {
        return round(this._height / 2);
    }

    /**
     * @property scale
     * @type {number}
     */
    get scale() {
        return this._scale;
    }

    /**
     * @property width
     * @type {number}
     */
    get width() {
        return this._width;
    }

    /**
     * @property halfWidth
     * @type {number}
     */
    get halfWidth() {
        return round(this._width / 2);
    }

    /**
     * @for CanvasStageModel
     * @method _init
     * @private
     */
    _init() {
        this._height = DEFAULT_CANVAS_SIZE.HEIGHT;
        this._width = DEFAULT_CANVAS_SIZE.WIDTH;
        this._panX = PAN.X;
        this._panY = PAN.Y;
        this._defaultScale = SCALE.DEFAULT;
        this._scaleMin = SCALE.MIN;
        this._scaleMax = SCALE.MAX;
        this._scale = this._retrieveZoomLevelFromStorageOrDefault();
    }

    /**
     * @for CanvasStageModel
     * @method reset
     */
    reset() {
        this._height = INVALID_NUMBER;
        this._width = INVALID_NUMBER;
        this._panX = INVALID_NUMBER;
        this._panY = INVALID_NUMBER;
        this._defaultScale = INVALID_NUMBER;
        this._scaleMax = INVALID_NUMBER;
        this._scaleMin = INVALID_NUMBER;
        this._scale = INVALID_NUMBER;
    }

    /**
     * Translate a kilometer value to pixels based on the current `#_scale` value
     *
     * @for CanvasStageModel
     * @method translateKilometersToPixels
     * @param kilometerValue {number}   value in kilometers
     * @return {number}                 value in pixels
     */
    translateKilometersToPixels(kilometerValue) {
        return kilometerValue * this._scale;
    }

    /**
     * Translate a mouse position, in pixels, as it relates to the
     * browser window to canvas position
     *
     * @for CanvasStageModel
     * @method translateMousePositionToCanvasPosition
     * @param x {number}
     * @param y {number}
     * @return {object<string, number>}
     */
    translateMousePositionToCanvasPosition(x, y) {
        const canvasPositionX = x - this.halfWidth;
        const canvasPositionY = -y + this.halfHeight;

        return {
            x: canvasPositionX,
            y: canvasPositionY
        };
    }

    /**
     * Translate a pixel value to kilometers based on the current `#_scale` value
     *
     * @for CanvasStageModel
     * @method translatePixelsToKilometers
     * @param pixelValue {number}  value in pixels
     * @return {number}            value in kilometers
     */
    translatePixelsToKilometers(pixelValue) {
        return pixelValue / this._scale;
    }

    /**
     * Translate an `[x, y]` tuple (in km) to a canvas position (in px)
     *
     * The return values will be high precision numbers that can be used
     * to plot an exact pixel position.
     *
     * This method should not be used for things like pan and aircraft future tracks
     *
     * @for CanvasStageModel
     * @method translatePostionModelToPreciseCanvasPosition
     * @param x {number}
     * @param y {number}
     * @return {object<string, number>}
     */
    translatePostionModelToPreciseCanvasPosition([x, y]) {
        const canvasX = this.translateKilometersToPixels(x) + this._panX;
        const canvasY = (this.translateKilometersToPixels(y) * -1) + this._panY;

        return {
            x: canvasX,
            y: canvasY
        };
    }

    /**
     * Translate an `[x, y]` tuple (in km) to a canvas position (in px)
     *
     * The return values will be rounded and are thus not considered precise
     *
     * Calls to this method should be used to calculate approximate canvas position,
     * useful for things like pan and cursor screen position.
     *
     * This method should not be used to translate an aircraft position
     *
     * @for CanvasStageModel
     * @method translatePostionModelToRoundedCanvasPosition
     * @param position {array<number, number>}  `[x, y]` position coordinates (in km)
     * @return {object<string, number>}
     */
    translatePostionModelToRoundedCanvasPosition(position) {
        const { x, y } = this.translatePostionModelToPreciseCanvasPosition(position);

        return {
            x: round(x),
            y: round(y)
        };
    }

    /**
     * Update the current canvas dimensions
     *
     * Calls to this method will happen as a result of a browser window resize
     *
     * @for CanvasStageModel
     * @method updateHeightAndWidth
     * @param nextHeight {number}   next height value in pixels
     * @param nextWidth {number}    next width value in pixels
     */
    updateHeightAndWidth(nextHeight, nextWidth) {
        this._height = nextHeight - DEFAULT_CANVAS_SIZE.FOTTER_HEIGHT_OFFSET;
        this._width = nextWidth;
    }

    /**
     * Update the current pan values.
     *
     * @for CanvasStageModel
     * @method updatePan
     * @param x {number}
     * @param y {number}
     */
    updatePan(x, y) {
        this._panX = x;
        this._panY = y;

        this._eventBus.trigger(EVENT.PAN_VIEWPORT);
    }

    /**
     * @for CanvasStageModel
     * @method zoomIn
     */
    zoomIn() {
        const isZoomOut = true;

        this._updateZoom(isZoomOut);
    }

    /**
     * @for CanvasStageModel
     * @method zoomOut
     */
    zoomOut() {
        const isZoomOut = false;

        this._updateZoom(isZoomOut);
    }

    /**
     * Reset the current `#_scale` value to the `#_defaultScale`
     *
     * @for CanvasStageModel
     * @method zoomReset
     */
    zoomReset() {
        this._scale = this._defaultScale;

        this._storeZoomLevel();
        this._eventBus.trigger(EVENT.ZOOM_VIEWPORT);
    }

    /**
     * Look for a stored `#_scale` value in localStorage
     *
     * When a stored value cannot be found, use the `SCALE.DEFAULT` value
     *
     * @for CanvasStageModel
     * @method _retrieveZoomLevelFromStorage
     * @return {number}
     * @private
     */
    _retrieveZoomLevelFromStorageOrDefault() {
        if (!_has(localStorage, STORAGE_KEY.ZOOM_LEVEL)) {
            return SCALE.DEFAULT;
        }

        const storedScale = localStorage.getItem(STORAGE_KEY.ZOOM_LEVEL);

        return storedScale;
    }

    /**
     * Store the current `#_scale` value in localStorage
     *
     * @for CanvasStageModel
     * @method _storeZoomLevel
     * @private
     */
    _storeZoomLevel() {
        localStorage.setItem(STORAGE_KEY.ZOOM_LEVEL, this._scale);
    }

    /**
     * Update the current `#_scale` value
     *
     * @for CanvasStageModel
     * @method _updateScale
     * @param isZoomIn {boolean}
     * @private
     */
    _updateScale(isZoomIn) {
        if (isZoomIn) {
            this._scale = Math.min(this._scale / SCALE.CHANGE_FACTOR, this._scaleMax);

            return;
        }

        this._scale = Math.max(this._scale * SCALE.CHANGE_FACTOR, this._scaleMin);
    }

    /**
     * Update the current `#_panX`, `#_panY`, and `#_scale` values
     *
     * When a user changes the zoom level, we must also adjust pan
     * values to account for a change in `#_scale`. Pixel dimensions of
     * the canvas don't change on zoom, but the `#_scale` does. So we
     * must re-calculate current pan values with the updated `#_scale`
     *
     * Calling this method will trigger an `EventBus` event that the
     * `CanvasController` is listening for that will trigger a deepRender
     *
     * @for CanvasStageModel
     * @method _updateZoom
     * @param isZoomIn {boolean}  flag for when use is zooming in
     * @private
     */
    _updateZoom(isZoomIn) {
        // store current pan in km, so it can be re-calculated with an updated `_#scale`
        const previousX = round(this.translatePixelsToKilometers(this._panX));
        const previousY = round(this.translatePixelsToKilometers(this._panY));

        this._updateScale(isZoomIn);

        // take previous pan values (in km) and calculate their current position
        // based on the new `#_scale` value
        const nextPanX = round(this.translateKilometersToPixels(previousX));
        const nextPanY = round(this.translateKilometersToPixels(previousY));

        this.updatePan(nextPanX, nextPanY);
        this._storeZoomLevel();
        this._eventBus.trigger(EVENT.ZOOM_VIEWPORT);
    }
}

export default new CanvasStageModel();
