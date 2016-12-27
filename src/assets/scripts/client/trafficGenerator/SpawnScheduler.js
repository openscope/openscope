import _forEach from 'lodash/forEach';
import _random from 'lodash/random';
import _without from 'lodash/without';
import SpawnPatternCollection from './SpawnPatternCollection';
// import AircraftCollection from '../aircraft/AircraftCollection';

// TODO: move this logic to the `SpawnPatternModel`
/* istanbul ignore next */
const calculateMsDelayFromAircraftPerHour = (frequency) => {
    const ONE_HOUR = 3600000;
    const FIVE_SECONDS = 5000;

    return Math.floor(_random(FIVE_SECONDS, ONE_HOUR / frequency));
};

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
            // TODO: this might need to live in the model as a class property but will need to
            // be modified based on timewarp setting
            const delay = calculateMsDelayFromAircraftPerHour(spawnPattern.frequency);
            // console.log(delay, spawnPattern.route);

            spawnPattern.scheduleId = setInterval(
                aircraftCollection.createAircraftWithSpawnModel,
                delay,
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
