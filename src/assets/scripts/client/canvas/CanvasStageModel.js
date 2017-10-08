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
 *
 *
 */
class CanvasStageModel {
    /**
     *
     *
     */
    constructor() {
        /**
         * @property _eventBus
         * @type {EventBus}
         * @private
         */
        this._eventBus = EventBus;

        /**
         *
         *
         * @property height
         * @type {number}
         * @default INVALID_NUMBER
         * @private
         */
        this._height = INVALID_NUMBER;

        /**
         *
         *
         * @property width
         * @type {number}
         * @default INVALID_NUMBER
         * @private
         */
        this._width = INVALID_NUMBER;

        /**
         *
         *
         * @property _panX
         * @type {number}
         * @default INVALID_NUMBER
         * @private
         */
        this._panX = INVALID_NUMBER;

        /**
         *
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
         * max _scale
         *
         * @property _scaleMax
         * @type {number}
         * @default INVALID_NUMBER
         * @private
         */
        this._scaleMax = INVALID_NUMBER;

        /**
         * min _scale
         *
         * @property _scaleMin
         * @type {number}
         * @default INVALID_NUMBER
         * @private
         */
        this._scaleMin = INVALID_NUMBER;

        /**
         *
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
     *
     *
     */
    get height() {
        return this._height;
    }

    /**
     *
     *
     */
    get halfHeight() {
        return round(this._height / 2);
    }

    /**
     *
     *
     */
    get width() {
        return this._width;
    }

    /**
     *
     *
     */
    get halfWidth() {
        return round(this._width / 2);
    }

    /**
     *
     *
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
     *
     *
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
     *
     *
     */
    translatePixelsToKilometers(pixelValue) {
        return pixelValue / this._scale;
    }

    /**
     *
     *
     */
    translateKilometersToPixels(kilometerValue) {
        return kilometerValue * this._scale;
    }

    translatePostionModelToPreciseCanvasPosition([x, y]) {
        const canvasX = this.translateKilometersToPixels(x) + this._panX;
        const canvasY = (this.translateKilometersToPixels(y) + this._panY) * -1;

        return {
            x: canvasX,
            y: canvasY
        };
    }

    /**
     *
     *
     */
    translatePostionModelToRoundedCanvasPosition([x, y]) {
        const canvasX = round(this.translateKilometersToPixels(x)) + this._panX;
        const canvasY = -round(this.translateKilometersToPixels(y)) + this._panY;

        return {
            x: canvasX,
            y: canvasY
        };
    }

    /**
     *
     *
     */
    updateHeightAndWidth(nextHeight, nextWidth) {
        this._height = nextHeight - DEFAULT_CANVAS_SIZE.FOTTER_HEIGHT_OFFSET;
        this._width = nextWidth;
    }

    /**
     *
     *
     */
    updatePan(x, y) {
        this._panX = x;
        this._panY = y;

        this._eventBus.trigger(EVENT.PAN_VIEWPORT);
    }

    /**
     *
     *
     */
    zoomOut() {
        const isZoomOut = false;

        this._updateZoom(isZoomOut);
    }

    /**
     *
     *
     */
    zoomIn() {
        const isZoomOut = true;

        this._updateZoom(isZoomOut);
    }

    /**
     * @for CanvasStageModel
     * @method zoomReset
     */
    zoomReset() {
        this._scale = this._defaultScale;

        this._storeZoomLevel();
        this._eventBus.trigger(EVENT.ZOOM_VIEWPORT);
    }

    /**
     *
     *
     */
    _updateZoom(isZoomIn) {
        const previousX = round(this.translatePixelsToKilometers(this._panX));
        const previousY = round(this.translatePixelsToKilometers(this._panY));

        this._updateScale(isZoomIn);

        this._panX = round(this.translateKilometersToPixels(previousX));
        this._panY = round(this.translateKilometersToPixels(previousY));

        this._storeZoomLevel();
        this._eventBus.trigger(EVENT.ZOOM_VIEWPORT);
    }

    /**
     *
     *
     */
    _updateScale(isZoomIn) {
        if (isZoomIn) {
            this._scale = Math.min(this._scale / SCALE.CHANGE_FACTOR, this._scaleMax);

            return;
        }

        this._scale = Math.max(this._scale * SCALE.CHANGE_FACTOR, this._scaleMin);
    }

    /**
     *
     *
     */
    _storeZoomLevel() {
        localStorage.setItem(STORAGE_KEY.ZOOM_LEVEL, this._scale);
    }

    /**
     *
     *
     * @method _retrieveZoomLevelFromStorage
     */
    _retrieveZoomLevelFromStorageOrDefault() {
        if (!_has(localStorage, STORAGE_KEY.ZOOM_LEVEL)) {
            return SCALE.DEFAULT;
        }

        const storedScale = localStorage.getItem(STORAGE_KEY.ZOOM_LEVEL);

        return storedScale;
    }
}

export default new CanvasStageModel();
