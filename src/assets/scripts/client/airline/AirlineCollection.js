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

        this.fromJson(airlineList);
    }

    /**
     * @for AirlineCollection
     * @method fromJson
     * @param json {object}
     */
    fromJson(airlineList) {
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
     * @param airlineId {string}
     * @return {AirlineModel|undefined}
     */
    findAirlineById(airlineId) {
        return _find(this._items, { id: airlineId });
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
