import _forEach from 'lodash/forEach';
import SpawnPatternCollection from './SpawnPatternCollection';
import TimeKeeper from '../engine/TimeKeeper';
import GameController from '../game/GameController';
import { INVALID_NUMBER } from '../constants/globalConstants';

/**
 * Used to create a game_timer for a `SpawnPatternModel` and provide
 * methods for re-creating a new timer on timer expiration.
 *
 * This is designed to be a stateless class.
 *
 * @class SpawnScheduler
 */
class SpawnScheduler {
    /**
     * @constructor
     * @for SpawnScheduler
     * @param aircraftController {AircraftController}
     */
    constructor() {
        /**
         * @property _aircraftController
         * @type {AircraftController}
         * @default null
         * @private
         */
        this._aircraftController = null;
    }

    /**
     * @for SpawnScheduler
     * @method init
     * @param aircraftController {AircraftController}
     * @chainable
     */
    init(aircraftController) {
        if (typeof aircraftController === 'undefined') {
            throw new TypeError('Invalid parameter. SpawnScheduler requires aircraftController to be defined.');
        }

        this.aircraftController = aircraftController;

        this.startScheduler();

        return this;
    }

    /**
     * Starts the scheduler and prespawns departures
     *
     * @for SpawnScheduler
     * @method startScheduler
     */
    startScheduler() {
        // TODO: rename to createSchedulesWithTimer
        this.createSchedulesFromList();
        // TODO: create getter on collection to get all preSpawn including departures
        // TODO: create method `createPreSpawnDeparturesAndArrivals`
        this.createPreSpawnDepartures();
    }

    /**
     * Loop through each `SpawnPatternModel` and create a `game_timeout` for each
     *
     * @for SpawnScheduler
     * @method createSchedulesFromList
     */
    createSchedulesFromList() {
        _forEach(SpawnPatternCollection.spawnPatternModels, (spawnPatternModel) => {
            // set the #cycleStartTime for this `spawnPatternModel` with current game time
            spawnPatternModel.cycleStart(TimeKeeper.accumulatedDeltaTime);
            spawnPatternModel.scheduleId = this.createNextSchedule(spawnPatternModel);

            // TODO: abstract this to a class method on the `SpawnPatternModel`
            if (spawnPatternModel.isAirborneAtSpawn() && spawnPatternModel.preSpawnAircraftList.length > 0) {
                this.aircraftController.createPreSpawnAircraftWithSpawnPatternModel(spawnPatternModel);
            }
        });
    }

    /**
     * Send `SpawnPatternModel` objects off the the `AircraftController` to create
     * new aircraft onLoad or onAirportChange.
     *
     * When starting a session there should always be at least one departure waiting
     * to taxi. The logic for determining _which_ patterns to use, and how many,
     * is handled within the `SpawnPatternCollection`. Here we simply get the
     * result and loop through each `SpawnPatternModel`.
     *
     * @for SpawnScheduler
     * @method createPreSpawnDepartures
     */
    createPreSpawnDepartures() {
        const departureModelsToPreSpawn = SpawnPatternCollection.getDepartureModelsForPreSpawn();

        for (let i = 0; i < departureModelsToPreSpawn.length; i++) {
            const spawnPatternModel = departureModelsToPreSpawn[i];

            this.aircraftController.createAircraftWithSpawnPatternModel(spawnPatternModel);
        }
    }

    /**
     * Registers a new timeout, its callback and callback arguments with the `GameController`
     *
     * @for SpawnScheduler
     * @method createNextSchedule
     * @param spawnPatternModel {SpawnPatternModel}
     * @return {array}
     */
    createNextSchedule(spawnPatternModel) {
        const delay = spawnPatternModel.getNextDelayValue(TimeKeeper.accumulatedDeltaTime);

        return this._createTimeout(spawnPatternModel, delay);
    }

    /**
     * Resets the timer for a specific spawn pattern
     *
     * @for SpawnScheduler
     * @method resetTimer
     * @param spawnPatternModel {SpawnPatternModel}
     */
    resetTimer(spawnPatternModel) {
        let timePassed = 0;
        const { scheduleId } = spawnPatternModel;

        if (scheduleId && scheduleId !== INVALID_NUMBER) {
            GameController.destroyTimer(spawnPatternModel.scheduleId);

            const timerStart = spawnPatternModel.scheduleId[1] - spawnPatternModel.scheduleId[3];
            timePassed = TimeKeeper.accumulatedDeltaTime - timerStart;
            spawnPatternModel.scheduleId = null;
        }

        if (spawnPatternModel.rate <= 0) {
            return;
        }

        let nextDelay = spawnPatternModel.getNextDelayValue(TimeKeeper.accumulatedDeltaTime);

        if (timePassed < nextDelay) {
            nextDelay -= timePassed;
        } else {
            this.aircraftController.createAircraftWithSpawnPatternModel(spawnPatternModel);
        }

        spawnPatternModel.scheduleId = this._createTimeout(spawnPatternModel, nextDelay);
    }

    /**
     * Registers a new timeout, its callback and callback arguments with the `GameController`
     *
     * @for SpawnScheduler
     * @method _createTimeout
     * @param spawnPatternModel {SpawnPatternModel}
     * @param delay {number} time in seconds
     * @return {array}
     */
    _createTimeout(spawnPatternModel, delay) {
        return GameController.game_timeout(
            this.createAircraftAndRegisterNextTimeout,
            // lifespan of timeout
            delay,
            // passing null only to match existing api
            null,
            // arguments sent to callback as it's first parameter. using array so multiple arg can be sent
            [spawnPatternModel, this.aircraftController]
        );
    }

    /**
     * Method sent to `game_timeout` as the callback
     *
     * When fired, this method will call `createAircraftWithSpawnPatternModel` and then
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
        const spawnPatternModel = args[0][0];
        const aircraftController = args[0][1];

        aircraftController.createAircraftWithSpawnPatternModel(spawnPatternModel);

        spawnPatternModel.scheduleId = this.createNextSchedule(spawnPatternModel);
    };
}


export default new SpawnScheduler();
