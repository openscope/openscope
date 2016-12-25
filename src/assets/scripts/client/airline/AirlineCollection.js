import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import BaseCollection from '../base/BaseCollection';
import AirlineModel from './AirlineModel';

/**
 * @class AirlineCollection
 * @extends BaseCollection
 */
export default class AirlineCollection extends BaseCollection{
    /**
     * @constructor
     * @for AirlineCollection
     */
    constructor(airlineList) {
        super();

        this.init(airlineList);
    }

    /**
     * @for AirlineCollection
     * @method init
     * @param json {object}
     */
    init(airlineList) {
        _forEach(airlineList, (airlineDefinition) => this._buildAirlineModels(airlineDefinition));
    }

    /**
     * @for AirlineCollection
     * @method addItem
     * @param airlineToAdd {AirlineModel}
     */
    addItem(airlineToAdd) {
        this._items.push(airlineToAdd);
    }

    /**
     * @for AirlineCollection
     * @method findAirlineById
     * @param id {string}
     * @return {AirlineModel|undefined}
     */
    findAirlineById(id) {
        let airlineId = id;

        // TODO: remove this if block
        if (airlineId.indexOf('/') !== -1) {
            console.warn(`Found a specific fleet with airline id ${id}`);
            airlineId = id.split('/')[0];
        }

        return _find(this._items, { icao: airlineId });
    }

    /**
     * @for airlineCollection
     * @method _buildAirlineModels
     * @param airlineDefinition {object}
     * @private
     */
    _buildAirlineModels(airlineDefinition) {
        const airlineToAdd = new AirlineModel(airlineDefinition);

        this.addItem(airlineToAdd);
    }
}
