import $ from 'jquery';
import EventBus from '../lib/EventBus';
import SimClockController from './SimClockController';
import AirportInfoController from './AirportInfoController';
import { EVENT } from '../constants/eventNames';
import { SIM_AIRPORT_INFO_TEMPLATE } from './simAirportInfoTemplate';

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
         */
        this.simAirportInfoController = null;

        /**
         * Local instance of the event bus
         *
         * @for AirportInfoView
         * @property _eventBus
         * @type {EventBus}
         */
        this._eventBus = EventBus;

        return this.init();
    }

    /**
     * @for AirportInfoView
     * @method init
     * @chainable
     */
    init() {
        this.$template = $(SIM_AIRPORT_INFO_TEMPLATE);
        this.simClockController = new SimClockController();
        this.simAirportInfoController = new AirportInfoController();

        this._setupHandlers();
        this._eventBus.on(EVENT.AIRPORT_CHANGE, this.onAirportChangeHandler);
        this.$element.append(this.$template);

        return this;
    }

    /**
     * @for AirportInfoView
     * @method _setupHandlers
     * @private
     */
    _setupHandlers() {
        this.onAirportChangeHandler = this.update_info.bind(this);
    }

    /**
     * @for AirportInfoView
     * @method reset
     * @chainable
     */
    reset() {
        this.$element = null;
        this.$template = null;
        this.simClockController = null;
        this.simAirportInfoController = null;

        this._eventBus.off(EVENT.AIRPORT_CHANGE, this.update_info);

        return this;
    }

    /**
     * Updates the information taken from the AirportModel: the wind, the altimeter,
     * and the elevation. Triggered on airport change.
     *
     * @for AirportInfoView
     * @method update_info
     * @param {AirportModel} airport
     */
    update_info(airport) {
        this.simAirportInfoController.update(airport);

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
        const wind = this.simAirportInfoController.wind;
        const altimeter = this.simAirportInfoController.altimeter;
        const elevation = this.simAirportInfoController.elevation;
        const icao = this.simAirportInfoController.icao;

        $('#wind').text(`${icao} ${wind}`);
        $('#altimeter').text(`${icao} ${altimeter}`);
        $('#elevation').text(`${icao} ${elevation}`);
    }

    /**
     * Updates the clock, called from `AppController#update_pre`
     *
     * @for AirportInfoView
     * @method update_clock
     */
    update_clock() {
        const time = this.simClockController.update();

        $('#clock').text(time);
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
        this.simAirportInfoController.calculateInitialAirportData(airport);

        this._render();
    }
}
