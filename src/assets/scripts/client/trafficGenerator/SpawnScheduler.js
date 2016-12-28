import _forEach from 'lodash/forEach';
import _without from 'lodash/without';
import SpawnPatternCollection from './SpawnPatternCollection';
// import AircraftCollection from '../aircraft/AircraftCollection';

/**
 * Create a timer for every item in the `SpawnPatternCollection`
 *
 * @class SpawnScheduler
 */
export default class SpawnScheduler {
    /**
     * @constructor
     * @for SpawnScheduler
     * @param spawnPatternCollection {SpawnPatternCollection}
     * @param aircraftCollection {AircraftCollection}
     */
    constructor(spawnPatternCollection, aircraftCollection) {
        if (!(spawnPatternCollection instanceof SpawnPatternCollection)) {
            throw new TypeError('Invalid parameter. SpawnScheduler requires an instance of a SpawnPatternCollection.');
        }

        // this may be needed but might also be too defensive
        // if (!(aircraftCollection instanceof AircraftCollection)) {
        //     throw new TypeError('Invalid parameter. SpawnScheduler requires an instance of a AircraftCollection.');
        // }

        if (typeof aircraftCollection === 'undefined') {
            throw new TypeError('Invalid parameter. SpawnScheduler requires AircraftCollection to be defined.');
        }

        /**
         * A list of the currently active timer ids
         *
         * @property schedules
         * @type {array}
         * @default []
         */
        this.schedules = [];

        this.createSchedulesFromList(spawnPatternCollection, aircraftCollection);
    }

    /**
     * Loop through each `SpawnPatternModel` and calculate timer delay, then create a new timer
     *
     * @for SpawnScheduler
     * @method createSchedulesFromList
     * @param spawnPatternCollection {SpawnPatternCollection}
     * @param aircraftCollection {AircraftCollection}
     */
    createSchedulesFromList(spawnPatternCollection, aircraftCollection) {
        _forEach(spawnPatternCollection.spawnModels, (spawnPattern) => {
            console.log(spawnPattern.delay, spawnPattern.category, spawnPattern.route);

            spawnPattern.scheduleId = setInterval(
                // callback method that will be called when this interval fires
                aircraftCollection.createAircraftWithSpawnModel,
                // milisecond lifespan of interval
                spawnPattern.delay,
                // spawnPattern send as an argument to callback used to build spawnning aircraft
                spawnPattern
            );

            this.schedules.push(spawnPattern.scheduleId);
        });
    }

    /**
     * Accept an current timer id and stop it, then remove that id from `schedules`
     *
     * @for SpawnScheduler
     * @method stopSchedule
     * @param scheduleId {number}
     */
    stopSchedule(scheduleId) {
        if (this.schedules.indexOf(scheduleId) === -1) {
            throw new Error(`Invalid scheduleId supplied to .stopSchedule(): ${scheduleId}`);
        }

        clearInterval(scheduleId);

        this.schedules = _without(this.schedules, scheduleId);
    }

    /**
     * Clear all timers
     *
     * @for SpawnScheduler
     * @method clearAllSchedules
     */
    clearAllSchedules() {
        _forEach(this.schedules, (scheduleId) => this.stopSchedule(scheduleId));
    }
}
