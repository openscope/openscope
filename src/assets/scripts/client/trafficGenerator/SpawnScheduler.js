import _forEach from 'lodash/forEach';
import _random from 'lodash/random';
import _without from 'lodash/without';

const calculateMsDelayFromAircraftPerHour = (frequency) => {
    const ONE_HOUR = 3600000;
    const FIVE_SECONDS = 5000;

    return Math.floor(_random(FIVE_SECONDS, ONE_HOUR / frequency));
};

/**
 * @class SpawnScheduler
 */
export default class SpawnScheduler {
    /**
     *
     *
     */
    constructor(spawnPatternCollection, aircraftCollection) {
        this.schedules = [];

        this.createSchedules(spawnPatternCollection, aircraftCollection);
    }

    /**
     *
     *
     */
    createSchedules(spawnPatternCollection, aircraftCollection) {
        _forEach(spawnPatternCollection.spawnModels, (spawnPattern) => {
            const delay = calculateMsDelayFromAircraftPerHour(spawnPattern.frequency);
            console.log(delay, spawnPattern.route);

            spawnPattern.scheduleId = setInterval(
                aircraftCollection.createAircraftWithSpawnModel,
                delay,
                spawnPattern
            );

            this.schedules.push(spawnPattern.scheduleId);
        });
    }

    /**
     *
     *
     */
    stopSchedule(scheduleId) {
        if (this.schedules.indexOf(scheduleId) === -1) {
            throw new Error(`Invalid scheduleId supplied to .stopSchedule(): ${scheduleId}`);
        }

        clearInterval(scheduleId);

        this.schedules = _without(this.schedules, scheduleId);
    }

    /**
     *
     *
     */
    clearSchedules() {
        _forEach(this.schedules, (scheduleId) => this.stopSchedule(scheduleId));
    }
}
