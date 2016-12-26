import _flatten from 'lodash/flatten';
import _map from 'lodash/map';
import _uniq from 'lodash/uniq';
import BaseCollection from '../base/BaseCollection';
import SpawnPatternModel from './SpawnPatternModel';

/**
 *
 *
 */
export default class SpawnPatternCollection extends BaseCollection {
    /**
     *
     *
     */
    constructor(airportJson) {
        super();

        this.init(airportJson);
    }

    get spawnModels() {
        return this._items;
    }

    /**
     *
     *
     */
    get arrivalAirlines() {
        const arrivalAirlines = _map(this._items, (item) => item.airlineList);

        return _uniq(_flatten(arrivalAirlines));
    }

    /**
     *
     *
     */
    init(airportJson) {
        const arrivals = _map(airportJson.arrivals, (arrival) => {
            const arrivalToAdd = new SpawnPatternModel('arrival', arrival);

            return arrivalToAdd;
        });

        // this will likely have to change to the same format a arrivals once the airport data is normalized
        const departureSpawnModel = new SpawnPatternModel('departure', airportJson.departures);

        this._items = [
            departureSpawnModel,
            ...arrivals
        ];
    }
}
