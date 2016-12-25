import _forEach from 'lodash/forEach';
import _map from 'lodash/map';
import _random from 'lodash/random';
import BaseModel from '../base/BaseModel';

/**
 * @class SpawnPatternModel
 * @extends BaseModel
 */
export default class SpawnPatternModel extends BaseModel {
    constructor(spwanPatternJson) {
        super();

        this.scheduleId = -1;

        this.init(spwanPatternJson);
    }

    get airlineList() {
        return _map(this.airlines, (airline) => airline.name);
    }

    init(json) {
        this.type = json.type;
        this.route = json.route;
        this.frequency = json.frequency;
        this.altitude = json.altitude;
        this.speed = json.speed;
        this.airlines = this._buildSpwanAirlineModels(json.airlines);
        this._weightedAirlineList = this._buildWeightedAirlineList();
    }

    getRandomWeightedAirlineForSpawn() {
        const index = _random(0, this.airlines.length);
        const airlineId = this._weightedAirlineList[index];

        return airlineId;
    }

    _buildSpwanAirlineModels(arrivalAirlines) {
        const arrivalAirlineModels = _map(arrivalAirlines, (arrivalAirline) => ({
            name: arrivalAirline[0],
            frequency: arrivalAirline[1]
        }));

        return arrivalAirlineModels;
    }

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
