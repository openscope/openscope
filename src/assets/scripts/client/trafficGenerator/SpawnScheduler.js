import _forEach from 'lodash/forEach';
import SpawnPatternCollection from './SpawnPatternCollection';
import TimeKeeper from '../engine/TimeKeeper';
import GameController from '../game/GameController';
import { FLIGHT_CATEGORY } from '../constants/aircraftConstants';

/**
 * Used to create a game_timer for a `SpawnPatternModel` and provide
 * methods for re-creating a new timer on timer expiration.
 *
 * This is designed to be a stateless class.
 *
 * @class SpawnScheduler
 */
export default class SpawnScheduler {
    /**
     * @constructor
     * @for SpawnScheduler
     * @param spawnPatternCollection {SpawnPatternCollection}
     * @param aircraftController {AircraftController}
     */
    constructor(spawnPatternCollection, aircraftController) {
        if (!(spawnPatternCollection instanceof SpawnPatternCollection)) {
            throw new TypeError('Invalid parameter. SpawnScheduler requires an instance of a SpawnPatternCollection.');
        }

        if (typeof aircraftController === 'undefined') {
            throw new TypeError('Invalid parameter. SpawnScheduler requires aircraftController to be defined.');
        }

        // TODO: rename to createSchedulesWithTimer
        this.createSchedulesFromList(spawnPatternCollection, aircraftController);
        // TODO: create getter on collection to get all preSpawn including departures
        // TODO: create method `createPreSpawnDeparturesAndArrivals`
        this.createPreSpawnDepartures(spawnPatternCollection, aircraftController);
    }

    /**
     * Loop through each `SpawnPatternModel` and create a `game_timeout` for each
     *
     * @for SpawnScheduler
     * @method createSchedulesFromList
     * @param spawnPatternCollection {SpawnPatternCollection}
     * @param aircraftController {AircraftTypeDefinitionCollection}
     */
    createSchedulesFromList(spawnPatternCollection, aircraftController) {
        _forEach(spawnPatternCollection.spawnPatternModels, (spawnPatternModel) => {
            // set the #cycleStartTime for this `spawnPatternModel` with current game time
            spawnPatternModel.cycleStart(TimeKeeper.accumulatedDeltaTime);
            spawnPatternModel.scheduleId = this.createNextSchedule(spawnPatternModel, aircraftController);

            // TODO: abstract this to a class method on the `SpawnPatternModel`
            if (
                spawnPatternModel.category === FLIGHT_CATEGORY.ARRIVAL &&
                spawnPatternModel.preSpawnAircraftList.length > 0
            ) {
                aircraftController.createPreSpawnAircraftWithSpawnPatternModel(spawnPatternModel);
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
     * @param spawnPatternCollection {SpawnPatternCollection}
     * @param aircraftController {AircraftController}
     */
    createPreSpawnDepartures(spawnPatternCollection, aircraftController) {
        const departureModelsToPreSpawn = spawnPatternCollection.getDepartureModelsForPreSpawn();

        for (let i = 0; i < departureModelsToPreSpawn.length; i++) {
            const spawnPatternModel = departureModelsToPreSpawn[i];

            aircraftController.createAircraftWithSpawnPatternModel(spawnPatternModel);
        }
    }

    /**
     * Registers a new timeout, its callback and callback arguments with the `GameController`
     *
     * @for SpawnScheduler
     * @method createNextSchedule
     * @param spawnPatternModel {SpawnPatternModel}
     * @param aircraftController {AircraftTypeDefinitionCollection}
     * @return {function}
     */
    createNextSchedule(spawnPatternModel, aircraftController) {
        const delay = spawnPatternModel.getNextDelayValue(TimeKeeper.accumulatedDeltaTime);

        return GameController.game_timeout(
            this.createAircraftAndRegisterNextTimeout,
            // lifespan of timeout
            delay,
            // passing null only to match existing api
            null,
            // arguments sent to callback as it's first parameter. using array so multiple arg can be sent
            [spawnPatternModel, aircraftController]
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

        this.createNextSchedule(spawnPatternModel, aircraftController);
    };
}
