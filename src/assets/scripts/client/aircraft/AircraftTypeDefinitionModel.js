import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import BaseModel from '../base/BaseModel';

/**
 * Provides a definition for a specific type of aircraft.
 *
 * Encapsulates an aircraft json file into a JS class that
 * can be used to create an `AircraftInstanceModel`.
 *
 * @class AircraftTypeDefinitionModel
 * @extends BaseModel
 */
export default class AircraftTypeDefinitionModel extends BaseModel {
    /**
     *
     * @constructor
     * @for AircraftTypeDefinitionModel
     * @param aircraftTypeDefinition {object}
     */
    constructor(aircraftTypeDefinition) {
        super();

        if (!_isObject(aircraftTypeDefinition) || _isEmpty(aircraftTypeDefinition)) {
            throw new TypeError('Invalid parameter. Expected aircraftTypeDefinition to be an object');
        }

        /**
         * @property name
         * @type {string}
         * @default ''
         */
        this.name = '';

        /**
         * @property icao
         * @type {string}
         * @default ''
         */
        this.icao = '';

        /**
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
         * @property ceiling
         * @type {number}
         * @default -1
         */
        this.ceiling = -1;

        /**
         * @property rate
         * @type {object}
         * @default null
         */
        this.rate = null;

        /**
         * @property runway
         * @type {object}
         * @default null
         */
        this.runway = null;

        /**
         * @property speed
         * @type {object}
         * @default null
         */
        this.speed = null;

        /**
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
     * Initializes class properties
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
        this.engines = null;
        this.weightclass = '';
        this.category = null;
        this.ceiling = -1;
        this.rate = null;
        this.runway = null;
        this.speed = null;
        this.capability = null;
    }
}
