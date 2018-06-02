import BaseCollection from '../base/BaseCollection';
import AircraftModel from './AircraftModel';

/**
 * Provides methods and logic to manage a list of `AircraftModel` objects
 *
 * @class AircraftCollection
 */
export default class AircraftCollection extends BaseCollection {
    /**
     * @for AircraftCollection
     * @constructor
     */
    constructor() {
        super();

        /**
         * Inherited from `BaseCollection`
         *
         * @property _items
         * @type {array}
         * @default []
         * @private
         */

        return this._init();
    }

    /**
     * Initialization method
     *
     * @for AircraftCollection
     * @method _init
     * @private
     * @chainable
     */
    _init() {
        return this;
    }

    /**
     * Destroys the instance
     *
     * @for AircraftCollection
     * @method destroy
     * @chainable
     */
    destroy() {
        return this;
    }

    /**
     * Add an `AircraftModel` instance to `#_items`
     *
     * @for AircraftCollection
     * @method add
     */
    add(item) {
        if (!(item instanceof AircraftModel)) {
            throw new TypeError(`Invalid parameter. Expected AircraftModel but found ${typeof item}`);
        }

        this._items.push(item);
    }

    /**
     *
     *
     * @for AircraftCollection
     * @method findAircraftByCallsign
     * @param {string} callsign
     * @returns {AircraftModel|undefined}
     * @public
     */
    findAircraftByCallsign(callsign = '') {
        const foundAircraft = this._findByCallsign(callsign);

        if (!foundAircraft) {
            return null;
        }

        return foundAircraft;
    }

    /**
     * Remove an instance from `#_items`
     *r
     * @for AircraftCollection
     * @method remove
     */
    remove(itemToRemove) {
        if (!this._hasId(itemToRemove.id)) {
            throw new TypeError(`Attempted to remove an item not in the collection. AircraftModel-${itemToRemove.id} was not found in the AircraftCollection`);
        }

        this._items = this._items.filter((aircraftModel) => itemToRemove.id !== aircraftModel.id);
    }

    /**
     *
     *
     * @for AircraftCollection
     * @method _findByCallsign
     * @param {string} callsign
     * @return {AircraftModel} aircraftModel
     * @private
     */
    _findByCallsign(callsign) {
        if (callsign === '') {
            return null;
        }

        const aircraftModel = this._items.filter((aircraftModel) => callsign.toLowerCase() === aircraftModel.callsign.toLowerCase());

        // `filter` returns an array, we only ever want a single instance
        return aircraftModel[0];
    }

    /**
     * Find a specific instance in `#_items`
     *
     * @for AircraftCollection
     * @method _findById
     * @private
     */
    _findById(id) {
        const aircraftModel = this._items.filter((aircraftModel) => id === aircraftModel.id);

        // `filter` returns an array, we only ever want a single instance
        return aircraftModel[0];
    }

    /**
     * @for AircraftCollection
     * @method _hasId
     * @private
     */
    _hasId(id) {
        return typeof this._findById(id) !== 'undefined';
    }
}
