import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _map from 'lodash/map';
import _random from 'lodash/random';
import BaseModel from '../base/BaseModel';

/**
 * @class SpawnPatternModel
 * @extends BaseModel
 */
export default class SpawnPatternModel extends BaseModel {
    /**
     *
     *
     */
    constructor(category, spwanPatternJson) {
        super();

        /**
         *
         *
         */
        this.scheduleId = -1;

        /**
         *
         *
         */
        this.category = category;

        /**
         *
         *
         */
        this.type = '';

        /**
         *
         *
         */
        this.route = '';

        /**
         *
         *
         */
        this.frequency = -1;

        /**
         *
         *
         */
        this.altitude = 0;

        /**
         *
         *
         */
        this.speed = 0;

        /**
         *
         *
         */
        this.destinations = [];

        /**
         *
         *
         */
        this.airlines = [];

        /**
         *
         *
         */
        this._weightedAirlineList = [];

        this.init(spwanPatternJson);
    }

    /**
     *
     *
     */
    get airlineList() {
        return _map(this.airlines, (airline) => airline.name);
    }

    /**
     *
     *
     */
    init(json) {
        this.type = _get(json, 'type', this.type);
        this.route = _get(json, 'route', this.route);
        this.frequency = _get(json, 'frequency', this.frequency);
        this.altitude = _get(json, 'altitude', this.altitude);
        this.speed = _get(json, 'speed', this.speed);
        this.destinations = _get(json, 'destinations', this.destinations);
        this.airlines = this._buildSpwanAirlineModels(json.airlines);
        this._weightedAirlineList = this._buildWeightedAirlineList();
    }

    /**
     *
     *
     */
    getRandomAirlineForSpawn() {
        const index = this._findRandomIndexForList(this.airlines);
        const airlineId = this._weightedAirlineList[index];

        return airlineId;
    }

    /**
     *
     *
     */
    getRandomDestinationForDeparture() {
        const index = this._findRandomIndexForList(this.destinations);
        const destination = this.destinations[index];

        return destination;
    }

    /**
     *
     *
     */
    _findRandomIndexForList(list) {
        return _random(0, list.length);
    }

    /**
     *
     *
     */
    _buildSpwanAirlineModels(arrivalAirlines) {
        const arrivalAirlineModels = _map(arrivalAirlines, (arrivalAirline) => ({
            name: arrivalAirline[0],
            frequency: arrivalAirline[1]
        }));

        return arrivalAirlineModels;
    }

    /**
     *
     *
     */
    _buildWeightedAirlineList() {
        let weightedAirlineList = [];

        _forEach(this.airlines, (airline) => {
            for (let i = 0; i < airline.frequency; i++) {
                weightedAirlineList.push(airline.name);
            }
        });

        return weightedAirlineList;
    }
}
