import EventBus from '../lib/EventBus';
import { EVENT } from '../constants/eventNames';
import { round } from '../math/core';
import {
    DEFAULT_CANVAS_SIZE,
    PAN,
    SCALE
} from '../constants/canvasConstants';
// import { EVENT } from '../constants/eventNames';
import { STORAGE_KEY } from '../constants/storageKeys';

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
         * @default -1
         * @private
         */
        this.height = -1;

        /**
         *
         *
         * @property width
         * @type {number}
         * @default -1
         * @private
         */
        this.width = -1;

        /**
         *
         *
         * @property _panX
         * @type {number}
         * @default -1
         * @private
         */
        this._panX = -1;

        /**
         *
         *
         * @property _panY
         * @type {number}
         * @default -1
         * @private
         */
        this._panY = -1;

        /**
         * pixels per km
         *
         * @property _defaultScale
         * @type {number}
         * @default -1
         * @private
         */
        this._defaultScale = -1;

        /**
         * max _scale
         *
         * @property _scaleMax
         * @type {number}
         * @default -1
         * @private
         */
        this._scaleMax = -1;

        /**
         * min _scale
         *
         * @property _scaleMin
         * @type {number}
         * @default -1
         * @private
         */
        this._scaleMin = -1;

        /**
         *
         *
         * @property _scale
         * @type {number}
         * @default -1
         * @private
         */
        this._scale = -1;

        return this._init();
    }

    /**
     *
     *
     */
    _init() {
        this.height = DEFAULT_CANVAS_SIZE.HEIGHT;
        this.width = DEFAULT_CANVAS_SIZE.WIDTH;
        this._panX = PAN.X;
        this._panY = PAN.Y;
        this._defaultScale = SCALE.DEFAULT;
        this._scaleMin = SCALE.MIN;
        this._scaleMax = SCALE.MAX;
        this._scale = SCALE.DEFAULT;
    }

    /**
     *
     *
     */
    reset() {
        this.height = -1;
        this.width = -1;
        this._panX = -1;
        this._panY = -1;
        this._defaultScale = -1;
        this._scaleMax = -1;
        this._scaleMin = -1;
        this._scale = -1;
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

    /**
     *
     *
     */
    zoomOut() {
        const previousX = round(this.translatePixelsToKilometers(this._panX));
        const previousY = round(this.translatePixelsToKilometers(this._panY));

        this._scale *= SCALE.CHANGE_FACTOR;

        if (this._scale < this._scaleMin) {
            this._scale = this._scaleMin;
        }

        this._panX = round(this.translateKilometersToPixels(previousX));
        this._panY = round(this.translateKilometersToPixels(previousY));

        this._storeZoomLevel();
        this._eventBus.trigger(EVENT.ZOOM_VIEWPORT);
    }

    /**
     *
     *
     */
    zoomIn() {
        const previousX = round(this.translatePixelsToKilometers(this._panX));
        const previousY = round(this.translatePixelsToKilometers(this._panY));

        this._scale /= SCALE.CHANGE_FACTOR;

        if (this._scale > this._scaleMax) {
            this._scale = this._scaleMax;
        }

        this._panX = round(this.translateKilometersToPixels(previousX));
        this._panY = round(this.translateKilometersToPixels(previousY));

        this._storeZoomLevel();
        this._eventBus.trigger(EVENT.ZOOM_VIEWPORT);
    }

    // _zoom(isZoomIn) {
    //     const previousX = round(this.translatePixelsToKilometers(this._panX));
    //     const previousY = round(this.translatePixelsToKilometers(this._panY));

    //     this._updateScale(isZoomIn);

    //     this._panX = round(this.translateKilometersToPixels(previousX));
    //     this._panY = round(this.translateKilometersToPixels(previousY));

    //     this._storeZoomLevel();
    //     this._eventBus.trigger(EVENT.ZOOM_VIEWPORT);
    // }

    // _updateScale(isZoomIn) {
    //     if (isZoomIn) {
    //         this._scale = Math.min(this._scale / SCALE.CHANGE_FACTOR, this._scaleMax);

    //         return;
    //     }

    //     this._scale = Math.min(this._scale * SCALE.CHANGE_FACTOR, this._scaleMin);
    // }

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
    _storeZoomLevel() {
        localStorage.setItem(STORAGE_KEY.ZOOM_LEVEL, this._scale);
    }

    // /**
    //  * @for UiController
    //  * @method ui_set_scale_from_storage
    //  */
    // ui_set_scale_from_storage() {
    //     if (!_has(localStorage, STORAGE_KEY.ZOOM_LEVEL)) {
    //         return;
    //     }

    //     this._scale = localStorage[STORAGE_KEY.ZOOM_LEVEL];
    // }
}

export default new CanvasStageModel();
