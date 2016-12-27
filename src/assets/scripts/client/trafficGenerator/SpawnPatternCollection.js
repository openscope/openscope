import _flatten from 'lodash/flatten';
import _forEach from 'lodash/forEach';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _uniq from 'lodash/uniq';
import BaseCollection from '../base/BaseCollection';
import SpawnPatternModel from './SpawnPatternModel';
import { FLIGHT_CATEGORY } from '../constants/aircraftConstants';

/**
 * A collection of `SpawnPatternModel` objects
 *
 * @class SpawnPatternCollection
 * @extends BaseCollection
 */
export default class SpawnPatternCollection extends BaseCollection {
    /**
     * @constructor
     * @for SpawnPatternCollection
     * @param airportJson {object}
     */
    constructor(airportJson) {
        super();

        if (!_isObject(airportJson) || _isEmpty(airportJson)) {
            throw new TypeError('Invalid parameter passed to SpawnPatternCollection');
        }

        this.init(airportJson);
    }

    /**
     * Public property that gives access to the current value of `_items`
     *
     * @property spawnModels
     * @type {array<SpawnPatternModel>}
     */
    get spawnModels() {
        return this._items;
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * Set up the instance properties
     *
     * @for SpawnPatternCollection
     * @method init
     * @param airportJson {object}
     */
    init(airportJson) {
        // this logic will likely move to a method once departures are normalized in airport json
        _forEach(airportJson.arrivals, (arrival) => {
            const arrivalToAdd = new SpawnPatternModel(FLIGHT_CATEGORY.ARRIVAL, arrival);

            this.addItem(arrivalToAdd);
        });

        // this will likely have to change to the same format a arrivals once the airport data is normalized
        const departureSpawnModel = new SpawnPatternModel(FLIGHT_CATEGORY.DEPARTURE, airportJson.departures);

        this.addItem(departureSpawnModel);
    }

    /**
     * @for SpawnPatternCollection
     * @method addItems
     * @param items {array}
     */
    addItems(items = []) {
        if (items.length === 0) {
            return;
        }

        for (let i = 0; i < items.length; i++) {
            const itemToAdd = items[i];

            this.addItem(itemToAdd);
        }
    }

    /**
     * @for SpawnPatternCollection
     * @method addItem
     * @param item {SpawnPatternModel}
     */
    addItem(item) {
        if (!(item instanceof SpawnPatternModel)) {
            throw new TypeError('Only SpawnPatternModel objects can be added to the SpawnPatternCollection.');
        }

        this._items.push(item);
    }
}
