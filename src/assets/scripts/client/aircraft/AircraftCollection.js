import _find from 'lodash/find';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _map from 'lodash/map';
import BaseCollection from '../base/BaseCollection';
import AircraftDefinitionModel from './AircraftDefinitionModel';
import { airlineNameAndFleetHelper } from '../airline/airlineHelpers';

/**
 * Collection of `AircraftInstanceModel` objects
 *
 * Responsible for creating new `AircraftInstanceModel` objects when a spawnInterval
 * fires its `createAircraftWithSpawnPatternModel` callback.
 *
 * This collection also keeps a list of `AircraftDefinitionModel` objects, which define each
 * aircraft type.
 *
 * @class AircraftCollection
 * @extends BaseCollection
 */
/* istanbul ignore next */
export default class AircraftCollection extends BaseCollection {
    /**
     * @constructor
     * @for AircraftCollection
     * @param aircraftTypeDefinitionList {array<object>}
     * @param airlineCollection {AirlineCollection}
     * @param navigationLibrary {NavigationLibrary}
     */
    constructor(aircraftTypeDefinitionList, airlineCollection, navigationLibrary) {
        super(aircraftTypeDefinitionList, airlineCollection, navigationLibrary);

        if (!_isArray(aircraftTypeDefinitionList) || _isEmpty(aircraftTypeDefinitionList)) {
            // eslint-disable-next-line max-len
            throw new TypeError('Invalid aircraftTypeDefinitionList passed to AircraftCollection. Expected and array but ' +
                `received ${typeof aircraftTypeDefinitionList}`);
        }

        // TODO: this may need to use instanceof instead, but that may be overly defensive
        if (!_isObject(airlineCollection) || !_isObject(navigationLibrary)) {
            throw new TypeError('Invalid parameters. Expected airlineCollection and navigationLibrary to be defined');
        }

        this._airlineCollection = airlineCollection;
        this._navigationLibrary = navigationLibrary;
        this.definitionList = [];

        this.init(aircraftTypeDefinitionList);
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * Initializes class properties.
     *
     * @for AircraftCollection
     * @method init
     * @param aircraftTypeDefinitionList {array<object>}
     */
    init(aircraftTypeDefinitionList) {
        this.definitionList = this._buildAircraftDefinitionModelList(aircraftTypeDefinitionList);
    }

    /**
     * @for AircraftCollection
     * @method findAircraftDefinitionModelByIcao
     * @param icao {string}
     * @return {AircraftDefinitionModel}
     */
    findAircraftDefinitionModelByIcao(icao) {
        return _find(this.definitionList, { icao: icao });
    }

    /**
     * Given an `airlineId`, find a random aircraft type from the airline.
     *
     * @for AircraftCollection
     * @method getAircraftDefinitionForAirlineId
     * @param airlineId {string}
     * @param airlineModel {AirlineModel}
     * @return aircraftDefinition {AircraftDefinitionModel}
     */
    getAircraftDefinitionForAirlineId(airlineId, airlineModel) {
        const { airline, fleet } = airlineNameAndFleetHelper([airlineId]);
        const aircraftType = airlineModel.getRandomAircraftType(fleet);
        const aircraftDefinition = _find(this.definitionList, { icao: aircraftType });

        if (typeof aircraftDefinition === 'undefined') {
            console.error(`Undefined aircraftDefinition found for ${aircraftType.toUpperCase()}`);

            // recurse through this method if an error is encountered
            return this.getAircraftDefinitionForAirlineId(airlineId, airlineModel);
        }

        return aircraftDefinition;
    }


    /**
     * Loop through aircraft defined in the `definitionList` and create an
     * `AircraftDefinitionModel` for each.
     *
     * @for AircraftCollection
     * @method _buildAircraftDefinitionModelList
     * @param aircraftTypeDefinitionList {array}
     * @return definitionList {array<AircraftDefinitionModel>}
     * @private
     */
    _buildAircraftDefinitionModelList(aircraftTypeDefinitionList) {
        const definitionList = _map(aircraftTypeDefinitionList, (aircraftDefinition) => {
            // this is not using a direct return simply for readability
            return new AircraftDefinitionModel(aircraftDefinition);
        });

        return definitionList;
    }
}
