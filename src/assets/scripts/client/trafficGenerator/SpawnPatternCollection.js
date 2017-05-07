import _filter from 'lodash/filter';
import _forEach from 'lodash/forEach';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _reduce from 'lodash/reduce';
import _random from 'lodash/random';
import BaseCollection from '../base/BaseCollection';
import modelSourceFactory from '../base/ModelSource/ModelSourceFactory';
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
export default class SpawnPatternCollection extends BaseCollection {
    /**
     * @constructor
     * @for SpawnPatternCollection
     * @param airportJson {object}
     * @param navigationLibrary {NavigationLibrary}
     * @param airportController {AirportController}
     */
    constructor(airportJson, navigationLibrary, airportController) {
        super(airportJson, navigationLibrary);

        if (isEmptyObject(airportJson)) {
            throw new TypeError('Invalid parameter passed to SpawnPatternCollection');
        }

        if (isEmptyObject(navigationLibrary)) {
            throw new TypeError('Invalid NavigationLibrary passed to SpawnPatternCollection');
        }

        if (isEmptyObject(airportController)) {
            throw new TypeError('Invalid AirportController passed to SpawnPatternCollection');
        }

        this.init(airportJson, navigationLibrary, airportController);
    }

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
     * @param navigationLibrary {NavigationLibrary}
     * @param airportController {AirportController}
     */
    init(airportJson, navigationLibrary, airportController) {
        this._buildspawnPatternModels(airportJson.spawnPatterns, navigationLibrary, airportController);
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

            modelSourceFactory.returnModelToPool(spawnPatternModel);
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
     * Loop through spawnPatterns, as defined in airport json, and create
     * a `SpawnPatternModel` for each. Then add it to the collection.
     *
     * @for SpawnPatternCollection
     * @method _buildspawnPatternModels
     * @param spawnPatterns {array<object>}
     * @param navigationLibrary {NavigationLibrary}
     * @param airportController {AirportController}
     * @private
     */
    _buildspawnPatternModels(spawnPatterns, navigationLibrary, airportController) {
        _forEach(spawnPatterns, (spawnPattern) => {
            const spawnPatternModel = modelSourceFactory.getModelSourceForType(
                'SpawnPatternModel',
                spawnPattern,
                navigationLibrary,
                airportController
            );

            this.addItem(spawnPatternModel);
        });
    }
}
