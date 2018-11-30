import $ from 'jquery';
import { leftPad } from '../utilities/generalUtilities';
import { radiansToDegrees } from '../utilities/unitConverters';
import AirportController from '../airport/AirportController';
import SimClockController from './SimClockController';
import EventBus from '../lib/EventBus';
import { INVALID_NUMBER } from '../constants/globalConstants';
import { EVENT } from '../constants/eventNames';
import { AIRPORT_INFO_TEMPLATE } from './airportInfoTemplate';
import { PERFORMANCE } from '../constants/aircraftConstants';

/**
 * @property INFO_VIEW_SELECTORS
 * @type {object<string, string>}
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
 * Gets information about the current airport, specifically
 * the airport's elevation, wind speed and direction, and altimeter.
 *
 * @class AirportInfoController
 */
export default class AirportInfoController {
    /**
     * @for AirportInfoController
     * @constructor
     * @param {jQuery|HTML element}
     */
    constructor($element) {
        /**
         * Root DOM element
         *
         * @for AirportInfoController
         * @property $element
         * @type {jQuery|HTML element}
         */
        this.$element = $element;

        /**
         * Information div
         *
         * @for AirportInfoController
         * @property $template
         * @type {jQuery|HTML element}
         */
        this.$template = null;

        /**
         * Information div
         *
         * @for AirportInfoController
         * @property $altimeterView
         * @type {jQuery|HTML element}
         */
        this.$altimeterView = null;

        /**
         * Information div
         *
         * @for AirportInfoController
         * @property $clockView
         * @type {jQuery|HTML element}
         */
        this.$clockView = null;

        /**
         * Information div
         *
         * @for AirportInfoController
         * @property $elevationView
         * @type {jQuery|HTML element}
         */
        this.$elevationView = null;

        /**
         * Information div
         *
         * @for AirportInfoController
         * @property $windView
         * @type {jQuery|HTML element}
         */
        this.$windView = null;

        /**
         * @for AirportInfoController
         * @property altimeter
         * @type {Number}
         */
        this.altimeter = INVALID_NUMBER;

        /**
         * @for AirportInfoController
         * @property elevation
         * @type {String}
         */
        this.elevation = '';

        /**
         * @for AirportInfoController
         * @property icao
         * @type {String}
         */
        this.icao = '';

        /**
         * @for AirportInfoController
         * @property simClockController
         */
        this.simClockController = null;

        /**
         * @for AirportInfoController
         * @property wind
         * @type {String}
         */
        this.wind = '';

        /**
         * Local reference of the event bus
         *
         * @for AirportInfoController
         * @property _eventBus
         * @type {EventBus}
         */
        this._eventBus = EventBus;

        return this.init()
            ._createChildren()
            ._setupHandlers()
            .enable()
            .onAirportChange();
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * @for AirportInfoController
     * @method init
     * @chainable
     */
    init() {
        this.$template = $(AIRPORT_INFO_TEMPLATE);
        this.$altimeterView = this.$template.find(INFO_VIEW_SELECTORS.ALTIMETER_VALUE);
        this.$clockView = this.$template.find(INFO_VIEW_SELECTORS.CLOCK_VALUE);
        this.$elevationView = this.$template.find(INFO_VIEW_SELECTORS.ELEVATION_VALUE);
        this.$windView = this.$template.find(INFO_VIEW_SELECTORS.WIND_VALUE);
        this.altimeter = INVALID_NUMBER;
        this.elevation = '';
        this.icao = '';
        this.simClockController = new SimClockController();
        this.wind = '';
        this._eventBus = EventBus;

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
     * @for AirportInfoController
     * @method _setupHandlers
     * @chainable
     * @private
     */
    _setupHandlers() {
        this._onAirportChangeHandler = this.onAirportChange.bind(this);

        return this;
    }

    /**
     * Enable all event handlers
     *
     * @for AirportInfoController
     * @method _enable
     * @chainable
     */
    enable() {
        this._eventBus.on(EVENT.AIRPORT_CHANGE, this._onAirportChangeHandler);

        return this;
    }

    /**
     * Disable all event handlers
     *
     * @for AirportInfoController
     * @method _disable
     * @chainable
     */
    disable() {
        this._eventBus.off(EVENT.AIRPORT_CHANGE, this._onAirportChangeHandler);

        return this;
    }

    /**
     * @for AirportInfoController
     * @method reset
     * @chainable
     */
    reset() {
        this.$element = null;
        this.$template = null;
        this.altimeter = null;
        this.elevation = null;
        this.icao = null;
        this.simClockController = null;
        this.wind = null;
        this._eventBus = null;

        return this;
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Updates the information taken from the AirportModel: the wind, the altimeter,
     * and the elevation. Triggered on airport change.
     *
     * @for AirportInfoController
     * @method onAirportChange
     */
    onAirportChange() {
        const airport = AirportController.airport_get();
        const windAngle = Math.round(radiansToDegrees(airport.wind.angle));

        this.wind = this._buildWindAndGustReadout({ speed: airport.wind.speed, angle: windAngle });
        this.altimeter = this._generateHighAltimeterReading(airport.wind.speed);
        this.elevation = `${airport.elevation}`;
        this.icao = airport.icao.toUpperCase();

        this._render();
    }

    /**
     * Updates the clock, called from `AppController#update_pre`
     *
     * @for AirportInfoController
     * @method updateClock
     */
    updateClock() {
        const readout = this.simClockController.buildClockReadout();

        this.$clockView.text(readout);
    }

    // ------------------------------ PRIVATE ------------------------------

    /**
     * Formats the wind angle and speed from object into a string,
     * in the format `${newAngle} ${newSpeed}G${gustSpeed}`.
     *
     * Example output: 270 10G18
     *
     * @for AirportGameInfoView
     * @method _buildWindAndGustReadout
     * @param {Object} wind
     * @returns {String} formatted string
     * @private
     */
    _buildWindAndGustReadout(wind) {
        const minGustStrength = 5;
        const { speed } = wind;
        const { angle } = wind;
        const newAngle = leftPad((angle || 360), 3);
        const newSpeed = leftPad(speed, 2);
        // Creates a fake "gusting" speed
        const gustStrength = speed * Math.random();
        const gustSpeed = leftPad(Math.round(speed + gustStrength), 2);

        if (gustStrength < minGustStrength) {
            return `${newAngle} ${newSpeed}`;
        }

        return `${newAngle} ${newSpeed} G${gustSpeed}`;
    }

    /**
     * Creates an 'altimeter' reading for the info view
     *
     * @for AirportInfoController
     * @method _generateHighAltimeterReading
     * @param {Number} windSpeed
     * @returns {Number} the altimeter value (29.92 or above)
     * @private
     */
    _generateHighAltimeterReading(windSpeed) {
        const pressure = PERFORMANCE.DEFAULT_ALTIMETER_IN_INHG + (windSpeed * Math.random() / 100);

        return pressure.toFixed(2);
    }

    /**
     * Sets the values from the updated airport info.
     *
     * @for AirportInfoController
     * @method _render
     * @private
     */
    _render() {
        this.$windView.text(`${this.icao} ${this.wind}`);
        this.$altimeterView.text(`${this.icao} ${this.altimeter}`);
        this.$elevationView.text(`${this.icao} ${this.elevation}`);
    }
}
