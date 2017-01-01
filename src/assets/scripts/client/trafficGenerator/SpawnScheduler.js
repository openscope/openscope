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
     * @param aircraftController {AircraftController}
     * @param gameController {GameController}
     */
    constructor(spawnPatternCollection, aircraftController, gameController) {
        if (!(spawnPatternCollection instanceof SpawnPatternCollection)) {
            throw new TypeError('Invalid parameter. SpawnScheduler requires an instance of a SpawnPatternCollection.');
        }

        if (typeof aircraftController === 'undefined') {
            throw new TypeError('Invalid parameter. SpawnScheduler requires aircraftController to be defined.');
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

        this.createSchedulesFromList(spawnPatternCollection, aircraftController);
    }

    /**
     * Loop through each `SpawnPatternModel` and create a `game_timeout` for each
     *
     * @for SpawnScheduler
     * @method createSchedulesFromList
     * @param spawnPatternCollection {SpawnPatternCollection}
     * @param aircraftController {AircraftCollection}
     */
    createSchedulesFromList(spawnPatternCollection, aircraftController) {
        _forEach(spawnPatternCollection.spawnPatternModels, (spawnPattern) => {
            spawnPattern.scheduleId = this.createNextSchedule(spawnPattern, aircraftController);
        });
    }

    /**
     * Registers a new timeout, its callback and callback arguments with the `_gameController`
     *
     * @for SpawnScheduler
     * @method createNextSchedule
     * @param spawnPattern {SpawnPatternModel}
     * @param aircraftController {AircraftCollection}
     * @return {function}
     */
    createNextSchedule(spawnPattern, aircraftController) {
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
            [spawnPattern, aircraftController]
        );
    }

    /**
     * Method sent to `game_timeout` as the callback
     *
     * When fired, this method will call `createAircraftWithSpawnModel` and then
     * create a new time by calling `createNextSchedule`. Doing so will also result
     * in calculating a new delay period.
     *
     * Accepts two arguments; `spawnPattern` and `aircraftController`.
     *
     * @for SpawnScheduler
     * @method createAircraftAndRegisterNextTimeout
     * @param args {*[]}
     */
    createAircraftAndRegisterNextTimeout = (...args) => {
        const spawnPattern = args[0][0];
        const aircraftController = args[0][1];

        aircraftController.createAircraftWithSpawnModel(spawnPattern);

        this.createNextSchedule(spawnPattern, aircraftController);
    };
}
