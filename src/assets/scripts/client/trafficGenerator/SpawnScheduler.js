import _forEach from 'lodash/forEach';
import SpawnPatternCollection from './SpawnPatternCollection';

/**
 * Utility class used to create a game_timer for every item in the `SpawnPatternCollection` and provide
 * methods for re-creating a timer on timer expiration.
 *
 * @class SpawnScheduler
 */
export default class SpawnScheduler {
    /**
     * @constructor
     * @for SpawnScheduler
     * @param spawnPatternCollection {SpawnPatternCollection}
     * @param aircraftCollection {AircraftCollection}
     * @param gameController {GameController}
     */
    constructor(spawnPatternCollection, aircraftCollection, gameController) {
        if (!(spawnPatternCollection instanceof SpawnPatternCollection)) {
            throw new TypeError('Invalid parameter. SpawnScheduler requires an instance of a SpawnPatternCollection.');
        }

        if (typeof aircraftCollection === 'undefined') {
            throw new TypeError('Invalid parameter. SpawnScheduler requires aircraftCollection to be defined.');
        }

        if (typeof gameController === 'undefined') {
            throw new TypeError('Invalid parameter. SpawnScheduler requires gameController to be defined.');
        }

        /**
         * Reference to `GameController`
         *
         * @property _gameController
         * @type {GameController}
         * @default gameController
         * @private
         */
        this._gameController = gameController;

        this.createSchedulesFromList(spawnPatternCollection, aircraftCollection);
    }

    /**
     * Loop through each `SpawnPatternModel` and create a `game_timeout` for each
     *
     * @for SpawnScheduler
     * @method createSchedulesFromList
     * @param spawnPatternCollection {SpawnPatternCollection}
     * @param aircraftCollection {AircraftCollection}
     */
    createSchedulesFromList(spawnPatternCollection, aircraftCollection) {
        _forEach(spawnPatternCollection.spawnModels, (spawnPattern) => {
            spawnPattern.scheduleId = this.createNextSchedule(spawnPattern, aircraftCollection);
        });
    }

    /**
     * Registers a new timeout, its callback and callback arguments with the `_gameController`
     *
     * @for SpawnScheduler
     * @method createNextSchedule
     * @param spawnPattern {SpawnPatternModel}
     * @param aircraftCollection {AircraftCollection}
     * @return {function}
     */
    createNextSchedule(spawnPattern, aircraftCollection) {
        const delay = spawnPattern.getRandomDelayValue();
        // TODO: remove this block before merge with develop
        console.warn(delay, spawnPattern.category, spawnPattern.route);

        return this._gameController.game_timeout(
            this.createAircraftAndRegisterNextTimeout,
            // lifespan of timeout
            delay,
            // passing null only to match existing api
            null,
            // arguments sent to callback as it's first parameter. using array so multiple arg can be sent
            [spawnPattern, aircraftCollection]
        );
    }

    /**
     * Method sent to `game_timeout` as the callback
     *
     * When fired, this method will call `createAircraftWithSpawnModel` and then
     * create a new time by calling `createNextSchedule`. Doing so will also result
     * in calculating a new delay period.
     *
     * Accepts two arguments; `spawnPattern` and `aircraftCollection`.
     *
     * @for SpawnScheduler
     * @method createAircraftAndRegisterNextTimeout
     * @param args {*[]}
     */
    createAircraftAndRegisterNextTimeout = (...args) => {
        const spawnPattern = args[0][0];
        const aircraftCollection = args[0][1];

        aircraftCollection.createAircraftWithSpawnModel(spawnPattern);

        this.createNextSchedule(spawnPattern, aircraftCollection);
    };
}
