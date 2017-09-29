import BaseModel from '../base/BaseModel';
import { INVALID_NUMBER } from '../constants/globalConstants';
import { isEmptyObject } from '../utilities/validatorUtilities';

/**
 * Provides a definition for a specific type of aircraft.
 *
 * Encapsulates an aircraft json file into a JS class that can be used to create an `AircraftModel`.
 *
 * It is important to note that this is not a `type` in the programming sense, this is in reference to
 * a specific aircraft type.
 *
 * @class AircraftTypeDefinitionModel
 * @extends BaseModel
 */
export default class AircraftTypeDefinitionModel extends BaseModel {
    /**
     * @constructor
     * @for AircraftTypeDefinitionModel
     * @param aircraftTypeDefinition {object}
     */
    constructor(aircraftTypeDefinition) {
        super();
        if (isEmptyObject(aircraftTypeDefinition)) {
            throw new TypeError('Invalid parameter. Expected aircraftTypeDefinition to be an object');
        }

        /**
         * Name of the aircratType
         *
         * @property name
         * @type {string}
         * @default ''
         */
        this.name = '';

        /**
         * ICAO identifier of the aircraftType
         *
         * @property icao
         * @type {string}
         * @default ''
         */
        this.icao = '';

        /**
         * Icao identifier that includes a weightclass
         * designation when `Heavy` or `Super`
         *
         * @property icaoWithWeightClass
         * @type {string}
         * @default ''
         */
        this.icaoWithWeightClass = '';

        /**
         * Describes the number and type of engines
         *
         * @property engines
         * @type {object}
         * @default null
         */
        this.engines = null;

        /**
         * @property weightclass
         * @type {string}
         * @default ''
         */
        this.weightclass = '';

        /**
         * @property category
         * @type {object}
         * @default null
         */
        this.category = null;

        /**
         * Maximum safe altitude
         *
         * @property ceiling
         * @type {number}
         * @default INVALID_NUMBER
         */
        this.ceiling = INVALID_NUMBER;

        /**
         * Decsribes rate of:
         * - climb
         * - descent
         * - acceleration
         * - deceleratation
         *
         * @property rate
         * @type {object}
         * @default null
         */
        this.rate = null;

        /**
         * Takeoff distances needed for landing and Takeoff
         *
         * @property runway
         * @type {object}
         * @default null
         */
        this.runway = null;

        /**
         * Operating speeds
         * - minimum
         * - landing
         * - cruise
         * - maximum
         *
         * @property speed
         * @type {object}
         * @default null
         */
        this.speed = null;

        /**
         * Boolean values for:
         * - ils
         * - fix
         *
         * @property capability
         * @type {object}
         * @default
         */
        this.capability = null;

        this.init(aircraftTypeDefinition);
    }

    /**
     * Lifecycle method, should be run only once on instantiation.
     *
     * Initialize class properties
     *
     * @for AircraftDefinitionModel
     * @method init
     * @param aircraftTypeDefinition {object}
     */
    init(aircraftTypeDefinition) {
        this.name = aircraftTypeDefinition.name;
        this.icao = aircraftTypeDefinition.icao.toLowerCase();
        this.engines = aircraftTypeDefinition.engines;
        this.weightclass = aircraftTypeDefinition.weightclass;
        this.category = aircraftTypeDefinition.category;
        this.ceiling = aircraftTypeDefinition.ceiling;
        this.rate = aircraftTypeDefinition.rate;
        this.runway = aircraftTypeDefinition.runway;
        this.speed = aircraftTypeDefinition.speed;
        this.capability = aircraftTypeDefinition.capability;

        this.icaoWithWeightClass = this._buildTypeForStripView();
    }

    /**
     * Destroy the current instance
     *
     * @for AircraftDefinitionModel
     * @method destroy
     */
    destroy() {
        this.name = '';
        this.icao = '';
        this.icaoWithWeightClass = '';
        this.engines = null;
        this.weightclass = '';
        this.category = null;
        this.ceiling = INVALID_NUMBER;
        this.rate = null;
        this.runway = null;
        this.speed = null;
        this.capability = null;
    }

    /**
     * Build the string used for `#icaoWithWeightClass`
     *
     * @for AircraftTypeDefinitionModel
     * @method _buildTypeForStripView
     * @return {string}
     * @private
     */
    _buildTypeForStripView() {
        const HEAVY_LETTER = 'H';
        const SUPER_LETTER = 'U';
        let aircraftIcao = `${this.icao}/L`;

        switch (this.weightclass) {
            case SUPER_LETTER:
            case HEAVY_LETTER:
                aircraftIcao = `${HEAVY_LETTER}/${this.icao}/L`;

                break;
            default:
                break;
        }

        return aircraftIcao.toUpperCase();
    }

    /**
     * @for AircraftTypeDefinitionModel
     * @method isAbleToMaintainAltitude
     * @param altitude {Number}
     * @return {Boolean}
     */
    isAbleToMaintainAltitude(altitude) {
        return altitude <= this.ceiling;
    }

    /**
     * @for AircraftTypeDefinitionModel
     * @method isAbleToMaintainSpeed
     * @param speed {Number}
     * @return {Boolean}
     */
    isAbleToMaintainSpeed(speed) {
        return speed >= this.speed.min && speed <= this.speed.max;
    }
}
