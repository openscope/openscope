import _forEach from 'lodash/forEach';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import BaseCollection from '../base/BaseCollection';
import SpawnPatternModel from './SpawnPatternModel';

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
        this._buildSpawnModels(airportJson.spawnPatterns);
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

    /**
     * Loop through spawnPatterns, as defined in airport json, and create
     * a `SpawnPatternModel` for each. Then add it to the collection.
     *
     * @for SpawnPatternCollection
     * @method _buildSpawnModels
     * @parameter spawnPatterns
     * @private
     */
    _buildSpawnModels(spawnPatterns) {
        _forEach(spawnPatterns, (spawnPattern) => {
            const spawnPatternModel = new SpawnPatternModel(spawnPattern);

            this.addItem(spawnPatternModel);
        });
    }
}
