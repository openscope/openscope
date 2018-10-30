import { leftPad } from '../utilities/generalUtilities';
import { radiansToDegrees } from '../utilities/unitConverters';
import { INVALID_NUMBER } from '../constants/globalConstants';

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
     */
    constructor() {
        /**
         * @for AirportInfoController
         * @property airport
         * @type {AirportModel}
         */
        this.airport = null;

        /**
         * @for AirportInfoController
         * @property wind
         * @type {String}
         */
        this.wind = '';

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

        return this.init();
    }

    /**
     * Binds this.update to this
     *
     * @for AirportInfoController
     * @method _setupHandlers
     * @private
     */
    _setupHandlers() {
        this.update.bind(this);
    }

    /**
     * Method to update information when airport is changed
     *
     * @for AirportInfoController
     * @method update
     * @param {AirportModel} airport
     */
    update(airport) {
        this.airport = airport;

        return this._recalculate();
    }

    /**
     * @for AirportInfoController
     * @method reset
     * @chainable
     */
    reset() {
        this.airport = null;
        this.wind = null;
        this.altimeter = null;
        this.elevation = null;
        this.icao = null;

        return this;
    }

    /**
     * @for AirportInfoController
     * @method init
     * @chainable
     */
    init() {
        this._setupHandlers();

        return this;
    }

    /**
     * @for AirportGameInfoView
     * @method _recalculate
     * @private
     */
    _recalculate() {
        this.calculateInitialAirportData(this.airport);
    }

    /**
     * Formats the wind angle and speed from object into a string,
     * in the format `${newAngle}${newSpeed}G${gustSpeed}`.
     *
     * @for AirportGameInfoView
     * @method _buildWindAndGustReadout
     * @param {Object} wind
     * @returns {String} formatted string
     * @private
     */
    _buildWindAndGustReadout(wind) {
        const minGustStrength = 5;
        const speed = wind.speed;
        const angle = wind.angle;
        const newAngle = leftPad((angle || 360), 3);
        const newSpeed = leftPad(speed, 2);
        // Creates a fake "gusting" speed
        const gustStrength = speed * Math.random();
        const gustSpeed = leftPad(Math.round(speed + gustStrength), 2);

        if (gustStrength < minGustStrength) {
            return `${newAngle}${newSpeed}`;
        }

        return `${newAngle}${newSpeed}G${gustSpeed}`;
    }

    /**
     * Creates an 'altimeter' reading for the info view
     *
     * @for AirportInfoController
     * @method _generateAltimeterReading
     * @param {Number} windSpeed
     * @returns {Number} the new altimeter value
     * @private
     */
    _generateAltimeterReading(windSpeed) {
        const DEFAULT_ALTIMETER_VALUE = 2992;

        return DEFAULT_ALTIMETER_VALUE + Math.round(windSpeed * (Math.random() - 0.5));
    }

    /**
     * Loads the initial view.
     *
     * We need to wait until AppController#complete is called,
     * otherwise the airport will likely not be loaded, and we
     * get `undefined` everywhere.
     *
     * A seperate render function is needed because the initial airport
     * model is formatted differently than subsequently loaded models.
     *
     * @for AirportInfoController
     * @method calculateInitialAirportData
     * @param {AirportModel} airport
     */
    calculateInitialAirportData(airport) {
        const icao = airport.icao.toUpperCase();
        const windAngle = Math.round(radiansToDegrees(airport.wind.angle));

        this.wind = this._buildWindAndGustReadout({ speed: airport.wind.speed, angle: windAngle });
        this.altimeter = this._generateAltimeterReading(airport.wind.speed);
        this.elevation = `${airport.elevation}`;
        this.icao = icao;
    }
}
