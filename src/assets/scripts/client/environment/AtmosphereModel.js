import _inRange from 'lodash/inRange';
import { ENVIRONMENT } from '../constants/environmentConstants';
import { vectorize2dFromDegrees, vscale } from '../math/vector';

/**
 * Manages all atmospheric properties of the air the aircraft fly through
 *
 * @class AtmosphereModel
 */
export default class AtmosphereModel {
    /**
     * @for AtmosphereModel
     * @constructor
     * @param {object} data
     */
    constructor(data) {
        /**
         * @for AtmosphereModel
         * @property _seaLevelTemperature
         * @type {Number} degrees K
         * @private
         */
        this._seaLevelTemperature = ENVIRONMENT.DEFAULT_SEA_LEVEL_TEMPERATURE_K;

        /**
         * @for AtmosphereModel
         * @property _seaLevelPressure
         * @type {Number} inHg
         * @private
         */
        this._seaLevelPressure = ENVIRONMENT.DEFAULT_SEA_LEVEL_PRESSURE_INHG;

        /**
         * @for AtmosphereModel
         * @property _seaLevelWindVector
         * @type {Array} [x component in kts, y component in kts] scaled wind vector
         * @private
         */
        // this._seaLevelWindVector = ENVIRONMENT.DEFAULT_SEA_LEVEL_WIND_VECTOR_KT;

        // https://www.digitaldutch.com/atmoscalc/index.htm
        // TODO: Combine these into a single object, eg #_atmosphere[altitude] with these as the keys
        this._densityGradient = {};
        this._pressureGradient = {};
        // this._soundSpeedGradient = {};
        this._temperatureGradient = {};
        // this._windGradient = {};

        return this._init(data);
    }

    /**
     * @for AtmosphereModel
     * @method _init
     * @param {object} data
     * @chainable
     * @private
     */
    _init(data) {
        this._seaLevelPressure = data.pressure;
        this._initTemperatureFromSurfaceTemperature(data.surface.temperature, data.surface.elevation);
        this._initSeaLevelWindFromSurfaceWind(data.surface.wind, data.surface.elevation);
        this._initPressureGradient();
        this._initTemperatureGradient(data.surface.temperature, data.surface.elevation);
        this._initWindGradient(data.windGradient);
        this._initDensityGradient();
        // this._initSoundSpeedGradient();

        // this.windsAloft = _defaultTo(data.windsAloft, {});

        return this;
    }

    _initDensityGradient() {
        this._densityGradient = {};

        for (let alt = -2000; alt <= 65617; alt++) {
            this._densityGradient[alt] = 11.796888418 * this._pressureGradient[alt] / this._temperatureGradient[alt];
        }
    }

    /**
     * Initialize the pressure gradient, calculating air pressure through all altitudes in 1ft increments
     *
     * https://www.translatorscafe.com/unit-converter/en-US/calculator/altitude/#pressure-vs-altitude
     * https://en.wikipedia.org/wiki/Barometric_formula    (variable values given in imperial units)
     * https://www.mide.com/air-pressure-at-altitude-calculator    (for comparing calculated against actual)
     *
     * @for AtmosphereModel
     * @method _initPressureGradient
     * @private
     */
    _initPressureGradient() {
        this._pressureGradient = {};
        const b0ReferencePressure = this._seaLevelPressure;
        const b0ReferenceTemperature = this._seaLevelTemperature;
        const b1ReferencePressure = this._seaLevelPressure *
            ((b0ReferenceTemperature - (0.00198121311 * 36089)) /
            b0ReferenceTemperature) ** 5.255876329;

        // for b=0 layer of atmosphere ("Troposphere")
        for (let alt = -2000; alt < 36089; alt++) {
            this._pressureGradient[alt] = b0ReferencePressure *
                ((b0ReferenceTemperature - (0.00198121311 * alt)) /
                b0ReferenceTemperature) ** 5.255876329;
        }

        // for b=1 layer of atmosphere ("Stratosphere I")
        for (let alt = 36089; alt <= 65617; alt++) {
            this._pressureGradient[alt] = b1ReferencePressure * (Math.E ** (-0.0000480634303 * (alt - 36089)));
        }
    }

    /**
     * Derive the sea level temperature based on surface temperature
     * Note: The temperature gradient is calculated based on THIS outcome
     *
     * https://www.grc.nasa.gov/www/k-12/airplane/atmosmet.html
     *
     * @for AtmosphereModel
     * @method _initTemperatureFromSurfaceTemperature
     * @param {number} surfaceTemperatureCelsius - temperature at provided elevation (degrees C)
     * @param {number} surfaceElevation - elevation of the provided pressure (ft above MSL)
     * @private
     */
    _initTemperatureFromSurfaceTemperature(surfaceTemperatureCelsius, surfaceElevation) {
        const isaSeaLevelTemperatureKelvin = 288.19;
        let surfaceTemperatureKelvin = isaSeaLevelTemperatureKelvin;

        if (typeof surfaceTemperatureCelsius !== 'undefined') {
            surfaceTemperatureKelvin = surfaceTemperatureCelsius + 273.15;
        }

        // all "surface" locations are within the troposphere, so using b=0 layer...
        const lapseRateKelvinPerFoot = 0.001978152; // or 0.00649 kelvin per meter
        const isaSurfaceTemperature = isaSeaLevelTemperatureKelvin - (lapseRateKelvinPerFoot * surfaceElevation);
        const isaDifference = surfaceTemperatureKelvin - isaSurfaceTemperature;
        const actualSeaLevelTemperature = isaSeaLevelTemperatureKelvin + isaDifference;

        this._seaLevelTemperature = actualSeaLevelTemperature;
    }

    /**
     * Initialize the temperature gradient, calculating air temperature through all altitudes in 1ft increments
     *
     * https://www.translatorscafe.com/unit-converter/en-US/calculator/altitude/#temperature-vs-altitude
     *
     * @for AtmosphereModel
     * @method _initTemperatureGradient
     * @private
     */
    _initTemperatureGradient() {
        this._temperatureGradient = {};

        // for b=0 layer of atmosphere ("Troposphere")
        for (let alt = -2000; alt < 36089; alt++) {
            this._temperatureGradient[alt] = this._seaLevelTemperature - (0.00198121311 * alt);
        }

        // for b=1 layer of atmosphere ("Stratosphere I")
        for (let alt = 36089; alt <= 65617; alt++) {
            this._temperatureGradient[alt] = this._seaLevelTemperature - (0.00198121311 * 36089);
        }
    }

    /**
     * @for AtmosphereModel
     * @method _initSeaLevelWindFromSurfaceWind
     * @param {object} surfaceWind - wind at provided elevation, formatted as `{angle: 0, speed: 5}`; angle=radians, speed=kts
     * @param {number} surfaceElevation - elevation of the provided pressure (ft above MSL)
     * @private
     */
    _initSeaLevelWindFromSurfaceWind(surfaceWind, /* surfaceElevation */) {
        if (typeof surfaceWind === 'undefined') {
            this._seaLevelWindVector = ENVIRONMENT.DEFAULT_SEA_LEVEL_WIND_VECTOR;
        }

        this._seaLevelWindVector = vscale(vectorize2dFromDegrees(surfaceWind.angle), surfaceWind.speed);
    }

    _initWindGradient() {
        //
    }

    getActualAltitudeForPressureAltitude(/* pressureAltitude */) {
        //
    }

    getPressureAltitudeForActualAltitude(/* actualAltitude */) {
        //
    }

    getDensityAltitudeForActualAltitude(/* actualAltitude */) {
        //
    }

    getTemperatureAtActualAltitude(actualAltitude) {
        if (!_inRange(actualAltitude, -2000, 65617)) {
            throw new TypeError(`Expected altitude within -2000 ft to 65617 ft, but received altitude of ${actualAltitude}`);
        }

        return this._temperatureGradient[actualAltitude];
    }

    getSoundSpeedAtActualAltitude(/* actualAltitude */) {
        //
    }

    getWindAtActualAltitude(/* actualAltitude */) {
        //
    }
}
