import $ from 'jquery';
import EventBus from '../lib/EventBus';
import SimClockController from './SimClockController';
import AirportInfoController from './AirportInfoController';
import { EVENT } from '../constants/eventNames';
import { AIRPORT_INFO_TEMPLATE } from './airportInfoTemplate';

/**
 * @property STRIP_VIEW_SELECTORS
 * @type {object<string, string}
 * @final
 */
const INFO_VIEW_SELECTORS = {
    CLOCK_LABEL: '.js-airportInfo-clock-label',
    CLOCK_VALUE: '.js-airportInfo-clock-value',
    WIND_LABEL: '.js-airportInfo-wind-label',
    WIND_VALUE: '.js-airportInfo-wind-value',
    ALTIMETER_LABEL: '.js-airportInfo-altimeter-label',
    ALTIMETER_VALUE: '.js-airportInfo-altimeter-value',
    ELEVATION_LABEL: '.js-airportInfo-elevation-label',
    ELEVATION_VALUE: '.js-airportInfo-elevation-value'
};

/**
 * Displays an information corner that displays the current time, wind speed,
 * wind angle, altimeter, and airport elevation.
 *
 * @class AirportInfoView
 */
export default class AirportInfoView {
    /**
     * @for AirportInfoView
     * @constructor
     * @param {jQuery|HTML element}
     */
    constructor($element) {
        /**
         * Root DOM element
         *
         * @for AirportInfoView
         * @property $element
         * @type {jQuery|HTML element}
         */
        this.$element = $element;

        /**
         * Information div
         *
         * @for AirportInfoView
         * @property $template
         * @type {jQuery|HTML element}
         */
        this.$template = null;

        /**
         * @for AirportInfoView
         * @property simClockController
         */
        this.simClockController = null;

        /**
         * @for AirportInfoView
         * @property simAirportInfoController
         * @type {AirportInfoController}
         */
        this.airportInfoController = null;

        /**
         * Local instance of the event bus
         *
         * @for AirportInfoView
         * @property _eventBus
         * @type {EventBus}
         */
        this._eventBus = EventBus;

        return this.init()
                ._createChildren()
                ._setupHandlers()
                ._enable();
    }

    /**
     * @for AirportInfoView
     * @method init
     * @chainable
     */
    init() {
        this.$template = $(AIRPORT_INFO_TEMPLATE);
        this.simClockController = new SimClockController();
        this.airportInfoController = new AirportInfoController();

        return this;
    }

    /**
     * @for AirportInfoView
     * @method _setupHandlers
     * @chainable
     * @private
     */
    _setupHandlers() {
        this.onAirportChangeHandler = this.updateInfo.bind(this);

        return this;
    }

    /**
     * Set initial element references
     *
     * Should be run once only on instantiation
     *
     * @for StripViewModel
     * @method _createChildren
     * @chainable
     * @private
     */
    _createChildren() {
        this.$element.append(this.$template);

        return this;
    }

    /**
     * Enable all event handlers
     *
     * @for AirportInfoView
     * @method _enable
     * @chainable
     * @private
     */
    _enable() {
        this._eventBus.on(EVENT.AIRPORT_CHANGE, this.onAirportChangeHandler);

        return this;
    }

    /**
     * Disable all event handlers and destroy the instance
     *
     * @for AirportInfoView
     * @method _disable
     * @chainable
     * @private
     */
    _disable() {
        this.$element = null;
        this.$template = null;
        this.simClockController = null;
        this.airportInfoController = null;

        this._eventBus.off(EVENT.AIRPORT_CHANGE, this.updateInfo);

        return this;
    }

    /**
     * Updates the information taken from the AirportModel: the wind, the altimeter,
     * and the elevation. Triggered on airport change.
     *
     * @for AirportInfoView
     * @method updateInfo
     * @param {AirportModel} airport
     */
    updateInfo(airport) {
        this.airportInfoController.update(airport);
        this._render();
    }

    /**
     * Sets the values from the updated airport info.
     *
     * @for AirportInfoView
     * @method _render
     * @private
     */
    _render() {
        const wind = this.airportInfoController.wind;
        const altimeter = this.airportInfoController.altimeter;
        const elevation = this.airportInfoController.elevation;
        const icao = this.airportInfoController.icao;

        $(INFO_VIEW_SELECTORS.WIND_VALUE).text(`${icao} ${wind}`);
        $(INFO_VIEW_SELECTORS.ALTIMETER_VALUE).text(`${icao} ${altimeter}`);
        $(INFO_VIEW_SELECTORS.ELEVATION_VALUE).text(`${icao} ${elevation}`);
    }

    /**
     * Updates the clock, called from `AppController#update_pre`
     *
     * @for AirportInfoView
     * @method updateClock
     */
    updateClock() {
        this.simClockController.update();

        const time = this.simClockController.render();

        $(INFO_VIEW_SELECTORS.CLOCK_VALUE).text(time);
    }

    /**
     * Gets the data from the initial airport model, and displays those. Called
     * from `AppController#complete`.
     *
     * @for AirportInfoView
     * @method complete
     * @param {AirportModel} airport
     */
    complete(airport) {
        this.airportInfoController.calculateInitialAirportData(airport);
        this._render();
    }
}
