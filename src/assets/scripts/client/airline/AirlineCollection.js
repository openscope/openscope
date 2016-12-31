import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _isArray from 'lodash/isArray';
import BaseCollection from '../base/BaseCollection';
import AirlineModel from './AirlineModel';

/**
 * Houses an `AirlineModel` for each possible airline in the app.
 *
 * The contents of `_items` shouldn't ever need to change when an airport changes,
 * though this class does provide methods to reset each `AirlineModel`.
 *
 * @class AirlineCollection
 * @extends BaseCollection
 */
export default class AirlineCollection extends BaseCollection {
    /**
     * @constructor
     * @for AirlineCollection
     * @param airlineList {array}
     */
    /* istanbul ignore next */
    constructor(airlineList) {
        super(airlineList);

        if (!_isArray(airlineList)) {
            // eslint-disable-next-line max-len
            throw new TypeError(`Invalid parameter. AirlineCollection expected and array but found ${typeof airlineList}`);
        }

        this.init(airlineList);
    }

    /**
     * Lifecycle method. Should be run only once on instantiation
     *
     * Initialize class properties
     *
     * @for AirlineCollection
     * @method init
     * @param airlineList {array}
     */
    init(airlineList) {
        _forEach(airlineList, (airlineDefinition) => this._buildAirlineModels(airlineDefinition));
    }

    /**
     * Add and `AirlineModel` to the collection
     *
     * @for AirlineCollection
     * @method addItem
     * @param airlineToAdd {AirlineModel}
     */
    addItem(airlineToAdd) {
        this._items.push(airlineToAdd);
    }

    /**
     * Find an `AirlineModel` by `id` (also referred to as `icao`).
     *
     * This method accepts airline ids in the shape of:
     * - `aal`
     * - `aal/long`
     *
     * Where a string following the '/' is assumed to be a specific fleet designation
     *
     * @for AirlineCollection
     * @method findAirlineById
     * @param id {string}
     * @return {AirlineModel|undefined}
     */
    findAirlineById(id) {
        let airlineId = id;

        if (airlineId.indexOf('/') !== -1) {
            console.warn(`Found a specific fleet with airline id ${id}`);
            airlineId = id.split('/')[0];
        }

        return _find(this._items, { icao: airlineId });
    }

    /**
     * Reset each `AirlineModel` within the collection
     *
     * Used when an airport change has occurred.
     *
     * @for AirlineCollection
     * @method rest
     */
    reset() {
        _forEach(this._items, (airlineModel) => {
            airlineModel.reset();
        });
    }

    /**
     * Instantiate a new `AirlineModel` and add the new model to the collection
     *
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
