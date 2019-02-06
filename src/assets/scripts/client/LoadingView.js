import $ from 'jquery';
import { SELECTORS } from './constants/selectors';

/**
 * Provides access to the full page takeover presented on app load
 *
 * @class LoadingView
 */
export default class LoadingView {
    /**
     * @for LoadingView
     * @constructor
     */
    constructor() {
        /**
         * Root DOM element
         *
         * @property $element
         * @type {jquery|null}
         */
        this.$element = null;

        return this._setupChildren();
    }

    /**
     * @for LoadingView
     * @method _setupChildren
     * @chainable
     * @private
     */
    _setupChildren() {
        this.$element = $(SELECTORS.DOM_SELECTORS.LOADING_VIEW);

        return this;
    }

    /**
     * @for LoadingView
     * @method destroy
     * @chainable
     */
    destroy() {
        this.$element = null;

        return this;
    }

    /**
     * Initiates a timer that will fadeout the `#loadingView`
     *
     * Called from `AppController` once everything is loaded
     * and the app is ready to start.
     *
     * @for LoadingView
     * @method complete
     */
    complete() {
        global.setTimeout(() => {
            this.$element.fadeOut(1000);
            this.$element.css('pointerEvents', 'none');
        }, 1500);
    }
}
