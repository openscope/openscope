/* eslint-disable no-underscore-dangle */
import $ from 'jquery';
import TimeKeeper from './engine/TimeKeeper';
import { INVALID_NUMBER } from './constants/globalConstants';
import { SELECTORS } from './constants/selectors';

/**
 * @property MIN_DISPLAY_SECONDS
 * @type {number}
 * @final
 */
const MIN_DISPLAY_SECONDS = 2;

/**
 * Provides an encapsulated class that displays a truncated filename for a file currently being loaded.
 *
 * Only used once the entire view has loaded.
 * ex: a user changes airports after initalizing the simulator.
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
         * @property $element
         * @type {jquery|null}
         */
        this.$element = null;

        /**
         * @property $loadingIndicator
         * @type {jquery|null}
         */
        this.$loadingIndicator = null;

        /**
         * @property $loadingMessage
         * @type {jquery|null}
         */
        this.$loadingMessage = null;

        /**
         * @property loadingState
         * @type {Object}
         * @final
         */
        this.loadingState = {
            /**
             *
             * @property callback
             * @method callback
             * @return {Function}
             */
            callback: () => {},

            /**
             * @property loadingState
             * @type {Boolean}
             */
            loading: false,

            /**
             * @property startTime
             * @type {number}
             */
            startTime: INVALID_NUMBER
        };

        this._setupChildren();
    }

    /**
     * @for LoadingView
     * @method _setupChildren
     * @chainable
     * @private
     */
    _setupChildren() {
        this.$element = $(SELECTORS.DOM_SELECTORS.LOADING_VIEW);
        this.$loadingIndicator = $(SELECTORS.DOM_SELECTORS.LOADING_INDICATOR);
        this.$loadingMessage = this.$element.find(SELECTORS.DOM_SELECTORS.MESSAGE);

        return this;
    }

    /**
     * @for LoadingView
     * @method _disable
     * @chainable
     * @private
     */
    _disable() {
        this.loadingState.callback = () => {};
        this.loadingState.loading = false;
        this.loadingState.startTime = INVALID_NUMBER;

        return this;
    }

    /**
     * @for LoadingView
     * @method _resetCallback
     * @chainable
     * @private
     */
    _resetCallback() {
        if (this.callback === null) {
            return this;
        }

        clearTimeout(this.callback);

        this.callback = null;

        return this;
    }

    /**
     * @for LoadingView
     * @method _didExceedMinimumWaitTime
     * @return {boolean}
     * @chainable
     * @private
     */
    _didExceedMinimumWaitTime() {
        const timeNow = TimeKeeper.gameTimeInSeconds;

        return timeNow - this.loadingState.startTime > MIN_DISPLAY_SECONDS;
    }

    /**
     * @for LoadingView
     * @method _formatLoadingMessage
     * @param message {string}  a string to be formatted
     * @return {string}
     * @private
     */
    _formatLoadingMessage(message) {
        const minimumTruncationLength = 15;

        if (message.length <= minimumTruncationLength) {
            return message;
        }

        return `...${message.substr(-12)}`;
    }

    /**
     * @for LoadingView
     * @method startLoad
     * @param url {string}  the url for a file being loaded
     */
    startLoad(url) {
        if (!this.loading) {
            this.$loadingIndicator.show();
            this.loadingState.startTime = TimeKeeper.gameTimeInSeconds;
        }

        const msg = this._formatLoadingMessage(url);
        this.$loadingMessage.text(msg);

        this._resetCallback();
    }

    /**
     * @for LoadingView
     * @method stopLoad
     */
    stopLoad() {
        const timeNow = TimeKeeper.gameTimeInSeconds;

        if (this._didExceedMinimumWaitTime()) {
            this.$loadingIndicator.hide();

            this._disable();
        } else {
            if (this.callback !== null) {
                return;
            }

            const delayTime = (MIN_DISPLAY_SECONDS - (timeNow - this.start)) * 1000;
            this.callback = setTimeout(() => {
                this.$loadingIndicator.hide();

                this._disable();
            }, delayTime);
        }
    }

    /**
     * @for LoadingView
     * @method complete
     */
    complete() {
        this.$loadingIndicator.hide();

        global.setTimeout(() => {
            this.$element.fadeOut(1000);
            this.$element.css('pointerEvents', 'none');
        }, 1500);
    }
}
