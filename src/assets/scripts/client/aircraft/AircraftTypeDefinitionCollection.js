import _find from 'lodash/find';
import _map from 'lodash/map';
import BaseCollection from '../base/BaseCollection';
import AircraftTypeDefinitionModel from './AircraftTypeDefinitionModel';
import { airlineNameAndFleetHelper } from '../airline/airlineHelpers';
import { isEmptyOrNotArray } from '../utilities/validatorUtilities';

/**
 * Collection of `AircraftModel` objects
 *
 * Responsible for creating new `AircraftModel` objects when a spawnInterval
 * fires its `createAircraftWithSpawnPatternModel` callback.
 *
 * This collection also keeps a list of `AircraftTypeDefinitionModel` objects, which define each
 * aircraft type.
 *
 * @class AircraftTypeDefinitionCollection
 * @extends BaseCollection
 */
/* istanbul ignore next */
export default class AircraftTypeDefinitionCollection extends BaseCollection {
    /**
     * @constructor
     * @for AircraftTypeDefinitionCollection
     * @param aircraftTypeDefinitionList {array<object>}
     */
    constructor(aircraftTypeDefinitionList) {
        super();

        if (isEmptyOrNotArray(aircraftTypeDefinitionList)) {
            // eslint-disable-next-line max-len
            throw new TypeError('Invalid aircraftTypeDefinitionList passed to AircraftTypeDefinitionCollection. Expected and array but ' +
                `received ${typeof aircraftTypeDefinitionList}`);
        }

        /**
         * A collection of `AircraftTypeDefinitionModel` objects
         *
         * Not using the inherited `_items` property here for readability
         * and the fact that we need this property to be public.
         *
         * @property definitionList
         * @type {array}
         * @default []
         */
        this.definitionList = [];

        this.init(aircraftTypeDefinitionList);
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * Initializes instance properties.
     *
     * @for AircraftTypeDefinitionCollection
     * @method init
     * @param aircraftTypeDefinitionList {array<object>}
     */
    init(aircraftTypeDefinitionList) {
        this.definitionList = this._buildAircraftTypeDefinitionModelList(aircraftTypeDefinitionList);
    }

    /**
     * @for AircraftTypeDefinitionCollection
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
     * @for AircraftTypeDefinitionCollection
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
     * @for AircraftTypeDefinitionCollection
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
