// import _has from 'lodash';
import {
    DEFAULT_CANVAS_SIZE,
    PAN,
    SCALE
} from '../constants/canvasConstants';
// import { EVENT } from '../constants/eventNames';
// import { STORAGE_KEY } from '../constants/storageKeys';

class CanvasStageModel {
    constructor() {
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

    // // TODO: this function should live in a helper file somewhere
    // /**
    //  * @for UiController
    //  * @method px_to_km
    //  * @param pixels {number}
    //  * @return {number}
    //  */
    // px_to_km(pixels) {
    //     return pixels / this._scale;
    // }

    // // TODO: this function should live in a helper file somewhere
    // /**
    //  * @for UiController
    //  * @method km_to_px
    //  * @param kilometers {number}
    //  * @return {number}
    //  */
    // km_to_px(kilometers) {
    //     return kilometers * this._scale;
    // }

    // /**
    //  * @for UiController
    //  * @method storeZoomLevel
    //  */
    // storeZoomLevel() {
    //     localStorage[STORAGE_KEY.ZOOM_LEVEL] = this._scale;
    // }

    // /**
    //  * @for UiController
    //  * @method ui_zoom_out
    //  */
    // ui_zoom_out() {
    //     const lastpos = [
    //         round(this.px_to_km(prop.canvas.panX)),
    //         round(this.px_to_km(prop.canvas.panY))
    //     ];

    //     this._scale *= ZOOM_INCREMENT;

    //     if (this._scale < this._scaleMin) {
    //         this._scale = this._scaleMin;
    //     }

    //     const nextPanPosition = [
    //         round(this.km_to_px(lastpos[0])),
    //         round(this.km_to_px(lastpos[1]))
    //     ];

    //     this.storeZoomLevel();
    //     this._eventBus.trigger(EVENT.ZOOM_VIEWPORT, nextPanPosition);
    // }

    // /**
    //  * @for UiController
    //  * @method ui_zoom_in
    //  */
    // ui_zoom_in() {
    //     const lastpos = [
    //         round(this.px_to_km(prop.canvas.panX)),
    //         round(this.px_to_km(prop.canvas.panY))
    //     ];
    //     this._scale /= ZOOM_INCREMENT;

    //     if (this._scale > this._scaleMax) {
    //         this._scale = this._scaleMax;
    //     }

    //     const nextPanPosition = [
    //         round(this.km_to_px(lastpos[0])),
    //         round(this.km_to_px(lastpos[1]))
    //     ];

    //     this.storeZoomLevel();
    //     this._eventBus.trigger(EVENT.ZOOM_VIEWPORT, nextPanPosition);
    // }

    // /**
    //  * @for UiController
    //  * @method ui_zoom_reset
    //  */
    // ui_zoom_reset() {
    //     this._scale = this._defaultScale;

    //     this.storeZoomLevel();
    //     this._eventBus.trigger(EVENT.ZOOM_VIEWPORT);
    // }

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
