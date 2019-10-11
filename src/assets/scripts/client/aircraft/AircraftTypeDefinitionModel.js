import BaseModel from '../base/BaseModel';
import { INVALID_NUMBER } from '../constants/globalConstants';
import { isEmptyObject } from '../utilities/validatorUtilities';
import { AIRPORT_CONSTANTS } from '../constants/airportConstants';

// TODO: abstract these to an appropriate constants file
const HEAVY_LETTER = 'H';
const SUPER_LETTER = 'J';

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
         * Icao identifier that includes a weightClass
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
         * @property weightClass
         * @type {string}
         * @default ''
         */
        this.weightClass = '';

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
     * Initialize instance properties
     *
     * @for AircraftDefinitionModel
     * @method init
     * @param aircraftTypeDefinition {object}
     */
    init(aircraftTypeDefinition) {
        this.name = aircraftTypeDefinition.name;
        this.icao = aircraftTypeDefinition.icao.toLowerCase();
        this.engines = aircraftTypeDefinition.engines;
        this.weightClass = aircraftTypeDefinition.weightClass;
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
        this.weightClass = '';
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
        let aircraftIcao = `${this.icao}/L`;

        switch (this.weightClass) {
            case SUPER_LETTER:
                aircraftIcao = `${SUPER_LETTER}/${this.icao}/L`;

                break;
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

    /**
     * @for AircraftTypeDefinitionModel
     * @method isHeavyOrSuper
     * @returns {Boolean}
     */
    isHeavyOrSuper() {
        return this.weightClass === HEAVY_LETTER || this.weightClass === SUPER_LETTER;
    }

    /**
     * Returns the minimal distance that is required to a previous aircraft before another aircraft is allowed to use the runway.
     *
     * @for AircraftTypeDefinitionModel
     * @method calculateSameRunwaySeparationDistanceInFeet
     * @param previousTypeModel {AircraftTypeDefinitionModel} the aircraft type that used the runway before us.
     * @returns {number} distance in feet
     */
    calculateSameRunwaySeparationDistanceInFeet(previousTypeModel) {
        if (previousTypeModel.isSameRunwaySeparationCatThree()) {
            return AIRPORT_CONSTANTS.SRS_REDUCED_MINIMA_FEET.CAT3;
        }

        switch (this.category.srs) {
            case 1:
                return AIRPORT_CONSTANTS.SRS_REDUCED_MINIMA_FEET.CAT1;
            case 2:
                return AIRPORT_CONSTANTS.SRS_REDUCED_MINIMA_FEET.CAT2;
            default:
                return AIRPORT_CONSTANTS.SRS_REDUCED_MINIMA_FEET.CAT3;
        }
    }

    /**
     * Returns true if srs cat 3 is required
     *
     * @for AircraftTypeDefinitionModel
     * @method isSameRunwaySeparationCatThree
     * @returns true if srs cat 3 is required
     */
    isSameRunwaySeparationCatThree() {
        return typeof this.category.srs === 'undefined' || this.category.srs === 3;
    }

    /**
     * Get the weight classifier for an aircraft's callsign, as spoken over the radio
     *
     * @for AircraftTypeDefinitionModel
     * @method getRadioWeightClass
     * @return {string}
     */
    getRadioWeightClass() {
        if (this.weightClass === HEAVY_LETTER) {
            return 'heavy';
        }

        if (this.weightClass === SUPER_LETTER) {
            return 'super';
        }

        return '';
    }
}
