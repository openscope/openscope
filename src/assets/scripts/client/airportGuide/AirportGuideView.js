import { SELECTORS } from '../constants/selectors';

/**
 * Display information about the active airport
 *
 * Part of the build includes copying and converting source
 * documents to html. This is retrieved via ajax request and
 * stored in memory until needed
 *
 * _Original documentation can be found in `documentation/airport-guides`_
 *
 * @class AirportGuideView
 */
export default class AirportGuideView {
    /**
     * @constructor
     * @param {JQuery|HTMLElement} $element
     * @param {string} data  html string generated from airport-guide markdown
     */
    constructor($element, data) {
        /**
         * Local instance of the airport guide data
         *
         * @property _airportGuideMarkup
         * @type {string}
         * @private
         */
        this._airportGuideMarkup = data;

        /**
         * The HTML containing the data itself
         *
         * @property _$airportGuideView
         * @type {JQuery|HTMLElement}
         * @private
         */
        this._$airportGuideView = null;

        /**
         * The HTML view container of the data (formatted)
         *
         * @property _$element
         * @type {JQuery|HTMLElement}
         * @default null
         * @private
         */
        this._$element = null;

        return this.init($element);
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Initialize the instance
     *
     * @for AirportGuideView
     * @method init
     * @chainable
     */
    init($element) {
        this._createChildren($element);
        this.update(this._airportGuideMarkup);

        return this;
    }

    /**
     * Reset the instance
     *
     * @for AirportGuideView
     * @method reset
     * @chainable
     */
    reset() {
        this._airportGuideMarkup = null;
        this._$airportGuideView = null;
        this._$element = null;

        return this;
    }

    /**
     * Create child elements
     *
     * Should be run only once on instantiation
     *
     * @for AirportGuideView
     * @method _createChildren
     * @param {JQuery|HTMLElement} $element
     * @private
     * @chainable
     */
    _createChildren($element) {
        this._$element = $element.find(SELECTORS.DOM_SELECTORS.AIRPORT_GUIDE_CONTAINER);
        this._$airportGuideView = this._$element.find(SELECTORS.DOM_SELECTORS.AIRPORT_GUIDE_VIEW);

        return this;
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Updates the text in the view.
     * Should be run by the controller on airport change.
     *
     * @for AirportGuideView
     * @method update
     * @param {string} nextAirportMarkup
     */
    update(nextAirportMarkup) {
        this._airportGuideMarkup = nextAirportMarkup;

        this._$airportGuideView.html(this._airportGuideMarkup);
    }

    /**
     * Toggles visibility of the airport guide modal
     *
     * This method should only be called by the `AirportGuideController`
     *
     * @for AirportGuideView
     * @method toggleView
     */
    toggleView() {
        this._$element.toggleClass(SELECTORS.CLASSNAMES.OPEN);
    }
}
