import _find from 'lodash/find';
import _get from 'lodash/get';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _map from 'lodash/map';
import _random from 'lodash/random';
import BaseCollection from '../base/BaseCollection';
import AircraftDefinitionModel from './AircraftDefinitionModel';
import AircraftInstanceModel from './AircraftInstanceModel';
import { airlineNameAndFleetHelper } from '../airline/airlineHelpers';

/**
 * Collection of `AircraftInstanceModel` objects
 *
 * Responsible for creating new `AircraftInstanceModel` objects when a spawnInterval
 * fires its `createAircraftWithSpawnModel` callback.
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
     * @param aircraftDefinitionList {array<object>}
     * @param airlineCollection {AirlineCollection}
     * @param fixCollection {FixCollection}
     */
    constructor(aircraftDefinitionList, airlineCollection, fixCollection) {
        super(aircraftDefinitionList, airlineCollection, fixCollection);

        if (!_isArray(aircraftDefinitionList) || _isEmpty(aircraftDefinitionList)) {
            // eslint-disable-next-line max-len
            throw new TypeError('Invalid aircraftDefinitionList passed to AircraftCollection. Expected and array but ' +
                `received ${typeof aircraftDefinitionList}`);
        }

        // TODO: this may need to use instanceof instead, but that may be overly defensive
        if (!_isObject(airlineCollection) || !_isObject(fixCollection)) {
            throw new TypeError('Invalid parameters. Expected airlineCollection and fixCollection to be defined');
        }

        this._airlineCollection = airlineCollection;
        this._fixCollection = fixCollection;
        this.definitionList = [];

        this.init(aircraftDefinitionList);
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * Initializes class properties.
     *
     * @for AircraftCollection
     * @method init
     * @param aircraftDefinitionList {array<object>}
     */
    init(aircraftDefinitionList) {
        this.definitionList = this._buildAircraftDefinitionList(aircraftDefinitionList);
    }

    /**
     * Callback method fired by an interval defined in the `SpawnScheduler`.
     *
     * This is the entry method for creating new departing and arriving aircraft.
     * This method should only be called as a callback from a `SpawnScheduler` timer.
     *
     * @for AircraftCollection
     * @method createAircraftWithSpawnModel
     * @param spawnModel {SpawnPatternModel}
     */
    createAircraftWithSpawnModel = (spawnModel) => {
        const initializationProps = this._buildAircraftProps(spawnModel);
        const aircraftModel = new AircraftInstanceModel(initializationProps);

        console.log('SPAWN :::', spawnModel.category, initializationProps);

        this.addItem(aircraftModel);
    };

    /**
     * Add an `AircraftInstanceModel` to the collection
     *
     * @for AircraftCollection
     * @method addItem
     * @param aircraftModel
     */
    addItem(aircraftModel) {
        // TODO: add instanceof check here
        this._items.push(aircraftModel);
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
     * Loop through aircraft defined in the `definitionList` and create an
     * `AircraftDefinitionModel` for each.
     *
     * @for AircraftCollection
     * @method _buildAircraftDefinitionList
     * @param aircraftDefinitionList {array}
     * @return definitionList {array<AircraftDefinitionModel>}
     * @private
     */
    _buildAircraftDefinitionList(aircraftDefinitionList) {
        const definitionList = _map(aircraftDefinitionList, (aircraftDefinition) => {
            // this is not using a direct return simply for readability
            return new AircraftDefinitionModel(aircraftDefinition);
        });

        return definitionList;
    }

    /**
     * Given an `airlineId`, find a random aircraft type from the airline.
     *
     * @for AircraftCollection
     * @method _getAircraftDefinitionForAirlineId
     * @param airlineId {string}
     * @return aircraftDefinition {AircraftDefinitionModel}
     * @private
     */
    _getAircraftDefinitionForAirlineId(airlineModel) {
        // TODO: this should be able to handle specific fleets from within an airline
        // const airlineModel = this._airlineCollection.findAirlineById(airlineId);
        const aircraftType = airlineModel.getRandomAircraftTypeFromAllFleets();
        const aircraftDefinition = _find(this.definitionList, { icao: aircraftType });

        if (typeof aircraftDefinition === 'undefined') {
            console.error(`undefined aircraftDefinition for ${aircraftType}`);

            // recurse through this method if an error is encountered
            return this._getAircraftDefinitionForAirlineId(airlineId);
        }

        return aircraftDefinition;
    }

    /**
     * Fascade method that calls a builder method based on `spawnModel.category`
     *
     * Used to build up the appropriate data needed to instantiate an `AircraftInstanceModel`
     *
     * @for AircraftCollection
     * @method _buildAircraftProps
     * @param spawnModel {SpawnPatternModel}
     * @return {object}
     * @private
     */
    _buildAircraftProps(spawnModel) {
        if (spawnModel.category === 'departure') {
            return this._buildAircraftPropsForDeparture(spawnModel);
        }

        return this._buildAircraftPropsForArrival(spawnModel);
    }

    /**
     * Build props for a departing aircraft.
     *
     * Return data is used to instantiate an `AircraftInstanceModel`
     *
     * @for AircraftCollection
     * @method _buildAircraftPropsForDeparture
     * @param spawnModel {SpawnPatternModel}
     * @return {object}
     * @private
     */
    _buildAircraftPropsForDeparture(spawnModel) {
        const destination = spawnModel.getRandomDestinationForDeparture();
        const airlineId = spawnModel.getRandomAirlineForSpawn();
        const airlineModel = this._airlineCollection.findAirlineById(airlineId);
        const aircraftDefinition = this._getAircraftDefinitionForAirlineId(airlineModel);
        const { fleet } = airlineNameAndFleetHelper([airlineId]);
        // TODO: move this to `AirlineModel`
        const callsign = `${_random(0, 999)}`;

        return {
            airline: airlineModel.icao,
            callsign: callsign,
            category: spawnModel.category,
            destination: destination,
            icao: aircraftDefinition.icao,
            model: aircraftDefinition
        };
    }

    /**
     * Build props for a arriving aircraft.
     *
     * Return data is used to instantiate an `AircraftInstanceModel
     *
     * @for AircraftCollection
     * @method _buildAircraftPropsForArrival
     * @param spawnModel {SpawnPatternModel}
     * @return {object}
     * @private
     */
    _buildAircraftPropsForArrival(spawnModel) {
        const airlineId = spawnModel.getRandomAirlineForSpawn();
        const airlineModel = this._airlineCollection.findAirlineById(airlineId);
        const aircraftDefinition = this._getAircraftDefinitionForAirlineId(airlineModel);
        const { fleet } = airlineNameAndFleetHelper([airlineId]);
        // TODO: move this to `AirlineModel`
        const callsign = `${_random(0, 999)}`;

        return {
            airline: airlineModel.icao,
            altitude: spawnModel.altitude,
            callsign: callsign,
            category: spawnModel.category,
            // TODO: this should come from logic and not inline
            destination: 'ksfo',
            fleet: fleet,
            icao: aircraftDefinition.icao,
            model: aircraftDefinition,
            route: spawnModel.route,
            waypoints: _get(spawnModel, 'fixes', [])
        };
    }
}
