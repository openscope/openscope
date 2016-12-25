import _flatten from 'lodash/flatten';
import _map from 'lodash/map';
import _uniq from 'lodash/uniq';
import BaseCollection from '../base/BaseCollection';
import SpawnPatternModel from './SpawnPatternModel';

export default class SpawnPatternCollection extends BaseCollection {
    constructor(airportJson) {
        super();

        this.init(airportJson);
    }

    get arrivalAirlines() {
        const arrivalAirlines = _map(this._items, (item) => item.airlineList);

        return _uniq(_flatten(arrivalAirlines));
    }

    init(airportJson) {
        const arrivals = _map(airportJson.arrivals, (arrival) => {
            const arrivalToAdd = new SpawnPatternModel(arrival);

            return arrivalToAdd;
        });

        const departures = [];
        // _map(airportJson.departures, (arrival) => {
        //     const arrivalToAdd = new SpawnPatternModel(arrival);
        //
        //     return arrivalToAdd;
        // });

        this._items = [
            ...arrivals,
            ...departures
        ];
    }
}
