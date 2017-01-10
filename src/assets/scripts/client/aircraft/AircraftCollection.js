import _find from 'lodash/find';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _map from 'lodash/map';
import BaseCollection from '../base/BaseCollection';
import AircraftTypeDefinitionModel from './AircraftTypeDefinitionModel';
import { airlineNameAndFleetHelper } from '../airline/airlineHelpers';

/**
 * Collection of `AircraftInstanceModel` objects
 *
 * Responsible for creating new `AircraftInstanceModel` objects when a spawnInterval
 * fires its `createAircraftWithSpawnPatternModel` callback.
 *
 * This collection also keeps a list of `AircraftTypeDefinitionModel` objects, which define each
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
     */
    constructor(aircraftTypeDefinitionList) {
        super();

        if (!_isArray(aircraftTypeDefinitionList) || _isEmpty(aircraftTypeDefinitionList)) {
            // eslint-disable-next-line max-len
            throw new TypeError('Invalid aircraftTypeDefinitionList passed to AircraftCollection. Expected and array but ' +
                `received ${typeof aircraftTypeDefinitionList}`);
        }

        /**
         *
         *
         * @property
         * @type {array}
         * @default []
         */
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
        this.definitionList = this._buildAircraftTypeDefinitionModelList(aircraftTypeDefinitionList);
    }

    /**
     * @for AircraftCollection
     * @method findAircraftTypeDefinitionModelByIcao
     * @param icao {string}
     * @return {AircraftTypeDefinitionModel}
     */
    findAircraftTypeDefinitionModelByIcao(icao) {
        return _find(this.definitionList, { icao: icao });
    }

    /**
     * Given an `airlineId`, find a random aircraft type from the airline.
     *
     * @for AircraftCollection
     * @method getAircraftDefinitionForAirlineId
     * @param airlineId {string}
     * @param airlineModel {AirlineModel}
     * @return aircraftDefinition {AircraftTypeDefinitionModel}
     */
    getAircraftDefinitionForAirlineId(airlineId, airlineModel) {
        const { fleet } = airlineNameAndFleetHelper([airlineId]);
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
     * `AircraftTypeDefinitionModel` for each.
     *
     * @for AircraftCollection
     * @method _buildAircraftTypeDefinitionModelList
     * @param aircraftTypeDefinitionList {array}
     * @return definitionList {array<AircraftTypeDefinitionModel>}
     * @private
     */
    _buildAircraftTypeDefinitionModelList(aircraftTypeDefinitionList) {
        const definitionList = _map(aircraftTypeDefinitionList, (aircraftDefinition) => {
            // this is not using a direct return simply for readability
            return new AircraftTypeDefinitionModel(aircraftDefinition);
        });

        return definitionList;
    }
}
