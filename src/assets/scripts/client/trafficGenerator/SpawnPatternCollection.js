import _filter from 'lodash/filter';
import _forEach from 'lodash/forEach';
import _reduce from 'lodash/reduce';
import _random from 'lodash/random';
import BaseCollection from '../base/BaseCollection';
import SpawnPatternModel from './SpawnPatternModel';
import { FLIGHT_CATEGORY } from '../constants/aircraftConstants';
import { TIME } from '../constants/globalConstants';
import { isEmptyObject } from '../utilities/validatorUtilities';

/**
 * A collection of `SpawnPatternModel` objects
 *
 * @class SpawnPatternCollection
 * @extends BaseCollection
 */
class SpawnPatternCollection extends BaseCollection {
    /**
     * Public property that gives access to the current value of `_items`
     *
     * @property spawnPatternModels
     * @type {array<SpawnPatternModel>}
     */
    get spawnPatternModels() {
        return this._items;
    }

    /**
     * All `SpawnPatternModel` objects categorized as `departure`
     *
     * Used for assembling preSpawn departures
     *
     * @property departureModels
     * @return {array<SpawnPatternModel>}
     */
    get departureModels() {
        return _filter(this._items, { category: FLIGHT_CATEGORY.DEPARTURE });
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
        if (typeof airportJson === 'undefined' || isEmptyObject(airportJson)) {
            throw new TypeError('Invalid airportJson passed to SpawnPatternCollection');
        }

        this._buildSpawnPatternModels(airportJson.spawnPatterns);
    }

    /**
     * Loop through each item in the collection andd call `.destroy()` on that model.
     *
     * Used when resetting the collection, like onAirportChange.
     *
     * @for SpawnPatternCollection
     * @method reset
     */
    reset() {
        _forEach(this._items, (spawnPatternModel) => {
            spawnPatternModel.reset();

            // ModelSourceFactory.returnModelToPool(spawnPatternModel);
        });

        this._items = [];
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
     * Gather a randomized list of departure `SpawnPatternModel` objects
     * that will be created during the preSpawn.
     *
     * Clamps max at 5 patterns.
     * Randomly selects departure patterns from a filtered list containing only departure patterns.
     *
     * This method should be called by the `SpawnScheduler` when preSpawning new
     * aircraft on session start.
     *
     * @for SpawnPatternCollection
     * @method getDepartureModelsForPreSpawn
     * @return departureModelsForPreSpawn {array<SpawnPatternModel>}
     */
    getDepartureModelsForPreSpawn() {
        const departureModelsForPreSpawn = [];
        const departureModelsLength = this.departureModels.length;
        const minutesOfDeparturesToPreSpawn = 10;
        const hoursOfDeparturesToPreSpawn = minutesOfDeparturesToPreSpawn * TIME.ONE_MINUTE_IN_HOURS;
        const departuresPerHour = _reduce(this.departureModels, (sum, spawnPattern) => sum + spawnPattern.rate, 0);
        const departuresToPreSpawn = departuresPerHour * hoursOfDeparturesToPreSpawn;

        for (let i = 0; i < departuresToPreSpawn; i++) {
            const index = _random(0, (departureModelsLength - 1));
            const spawnPatternModel = this.departureModels[index];

            departureModelsForPreSpawn.push(spawnPatternModel);
        }

        return departureModelsForPreSpawn;
    }

    /**
     * Gather a list of `SpawnPatternModel` objects by their flight category.
     *
     * @for SpawnPatternCollection
     * @method findSpawnPatternsByCategory
     * @param flightCategory {FLIGHT_CATEGORY}
     * @return {array<SpawnPatternModel>}
     */
    findSpawnPatternsByCategory(flightCategory) {
        return _filter(this._items, { category: flightCategory });
    }

    /**
     * Loop through spawnPatterns, as defined in airport json, and create
     * a `SpawnPatternModel` for each. Then add it to the collection.
     *
     * @for SpawnPatternCollection
     * @method _buildSpawnPatternModels
     * @param spawnPatterns {array<object>}
     * @private
     */
    _buildSpawnPatternModels(spawnPatterns) {
        _forEach(spawnPatterns, (spawnPattern) => {
            const spawnPatternModel = new SpawnPatternModel(spawnPattern);
            // const spawnPatternModel = ModelSourceFactory.getModelSourceForType(
            //     'SpawnPatternModel',
            //     spawnPattern
            // );

            this.addItem(spawnPatternModel);
        });
    }
}

export default new SpawnPatternCollection();
