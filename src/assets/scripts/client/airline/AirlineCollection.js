import _find from 'lodash/find';
import _flatten from 'lodash/flatten';
import _forEach from 'lodash/forEach';
import _isArray from 'lodash/isArray';
import _map from 'lodash/map';
import BaseCollection from '../base/BaseCollection';
import AirlineModel from './AirlineModel';
import { AIRLINE_NAME_FLEET_SEPARATOR } from '../constants/airlineConstants';
import { INVALID_INDEX } from '../constants/globalConstants';

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
     * List of all `activeFlightNumbers`
     *
     * Used when generating new flightNumbers to verify a new
     * number isn't already in use
     *
     * @property flightNumbers
     * @return {array<string>}
     */
    get flightNumbers() {
        const flightNumberList = _map(this._items, (airline) => airline.flightNumbers);

        return _flatten(flightNumberList);
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
     * Where a string following the '/' is assumed to be a specific fleet designation.
     * Though this method supports the `name/fleet` shape, the puropse of this method
     * is to find and `AirlineModel` object and not a list of aircraft from a fleet.
     * When a fleet name is encountered it is discarded.
     *
     * If you need to find a specific fleet from an airline, you can use the AirlineModel method:
     * `airlineModel._getRandomAircraftTypeFromFleet(fleetName)`
     *
     * @for AirlineCollection
     * @method findAirlineById
     * @param id {string}
     * @return {AirlineModel|undefined}
     */
    findAirlineById(id) {
        let airlineId = id.toLowerCase();

        if (airlineId.indexOf(AIRLINE_NAME_FLEET_SEPARATOR) !== INVALID_INDEX) {
            // this should not get hit in most circumstances. The puropse of this method is to find
            // and `AirlineModel` object and not a list of aircraft from a fleet
            console.warn(
                `Found a specific fleet with airline id ${id}. This method should be used to find an ` +
                `AirlineModel instance and not a fleet within an AirlineModel. If you need to find a ` +
                `specific fleet from an airline, you can use the AirlineModel method: ` +
                `airlineModel._getRandomAircraftTypeFromFleet(fleetName)`
            );
            airlineId = id.split(AIRLINE_NAME_FLEET_SEPARATOR)[0];
        }

        return _find(this._items, { icao: airlineId });
    }

    /**
     * Reset each `AirlineModel` within the collection
     *
     * Used when an airport change has occurred.
     *
     * @for AirlineCollection
     * @method reset
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
