import _filter from 'lodash/filter';
import _forEach from 'lodash/forEach';
import _isNaN from 'lodash/isNaN';
import _random from 'lodash/random';
import BaseCollection from '../base/BaseCollection';
import SpawnPatternModel from './SpawnPatternModel';
import { FLIGHT_CATEGORY } from '../constants/aircraftConstants';
import { isEmptyOrNotObject } from '../utilities/validatorUtilities';

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
        if (isEmptyOrNotObject(airportJson)) {
            throw new TypeError('Invalid airportJson passed to SpawnPatternCollection.init. ' +
                `Expected a non-empty object, but received ${typeof airportJson}`);
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
        const spawnPatternsByDepartureRunway = {};

        // note this DOES NOT include patterns where the route doesn't specify the runway, because we can't
        // deconflict them. Instead, we just don't prespawn those departures.
        for (const spawnPattern of this.departureModels) {
            const firstElement = spawnPattern.routeString.split('.')[0];

            // if not in shape of `KSEA16L`, mark this spawn pattern as having an unknown runway assignment
            if (firstElement.length < 5 || _isNaN(+firstElement[4])) {
                if (!('unknownRunway' in spawnPatternsByDepartureRunway)) {
                    spawnPatternsByDepartureRunway.unknownRunway = [];
                }

                spawnPatternsByDepartureRunway.unknownRunway.push(spawnPattern);

                continue;
            }

            // else, we know we do have a route string which specifies the departure runway
            const departureRunwayId = firstElement.substr(4);

            if (!(departureRunwayId in spawnPatternsByDepartureRunway)) {
                spawnPatternsByDepartureRunway[departureRunwayId] = [];
            }

            spawnPatternsByDepartureRunway[departureRunwayId].push(spawnPattern);
        }

        const spawnPatternsToPreSpawn = [];

        // randomly select (while respecting spawn weighting) ONE departure
        // pattern to pre-spawn for each departure runway detected
        for (const runway of Object.keys(spawnPatternsByDepartureRunway)) {
            if (runway === 'unknownRunway') {
                if (Object.keys(spawnPatternsByDepartureRunway).length > 1) {
                    continue; // if known AND unknown runways exist, ignore unknown
                }
                // else, NO runways are known, and all spawn patterns are via
                // 'unknownRunway', in which case we will pick a pattern below.
            }

            // randomly choose a spawn pattern for this runway to prespawn
            const spawnPatterns = spawnPatternsByDepartureRunway[runway];
            const rateMap = spawnPatterns.map((pattern) => pattern.rate);
            const rateTotal = spawnPatterns.reduce((sum, pattern) => sum + pattern.rate, 0);
            const randomPosition = _random(rateTotal, true);
            let position = 0;

            for (let i = 0; i < rateMap.length; i++) {
                const endOfThisRange = position + rateMap[i];

                if (randomPosition <= endOfThisRange) {
                    spawnPatternsToPreSpawn.push(spawnPatterns[i]);

                    break;
                }

                position += rateMap[i];
            }
        }

        return spawnPatternsToPreSpawn;
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

            this.addItem(spawnPatternModel);
        });
    }
}

export default new SpawnPatternCollection();
