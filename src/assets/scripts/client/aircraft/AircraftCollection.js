import _find from 'lodash/find';
import _get from 'lodash/get';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _map from 'lodash/map';
import BaseCollection from '../base/BaseCollection';
import AircraftDefinitionModel from './AircraftDefinitionModel';
import AircraftInstanceModel from './AircraftInstanceModel';
import RouteModel from '../airport/Route/RouteModel';
import { airlineNameAndFleetHelper } from '../airline/airlineHelpers';
import { FLIGHT_CATEGORY } from '../constants/aircraftConstants';

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
     * @param navigationLibrary {NavigationLibrary}
     */
    constructor(aircraftDefinitionList, airlineCollection, navigationLibrary) {
        super(aircraftDefinitionList, airlineCollection, navigationLibrary);

        if (!_isArray(aircraftDefinitionList) || _isEmpty(aircraftDefinitionList)) {
            // eslint-disable-next-line max-len
            throw new TypeError('Invalid aircraftDefinitionList passed to AircraftCollection. Expected and array but ' +
                `received ${typeof aircraftDefinitionList}`);
        }

        // TODO: this may need to use instanceof instead, but that may be overly defensive
        if (!_isObject(airlineCollection) || !_isObject(navigationLibrary)) {
            throw new TypeError('Invalid parameters. Expected airlineCollection and navigationLibrary to be defined');
        }

        this._airlineCollection = airlineCollection;
        this._navigationLibrary = navigationLibrary;
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
        // FIXME: TOTAL HACK!!! REMOVE ME
        prop.aircraft.list.push(aircraftModel);
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
     * Used to build up the appropriate data needed to instantiate an `AircraftInstanceModel`
     *
     * @for AircraftCollection
     * @method _buildAircraftProps
     * @param spawnModel {SpawnPatternModel}
     * @return {object}
     * @private
     */
    _buildAircraftProps(spawnModel) {
        const airlineId = spawnModel.getRandomAirlineForSpawn();
        const { name, fleet } = airlineNameAndFleetHelper([airlineId]);
        const airlineModel = this._airlineCollection.findAirlineById(name);
        const aircraftDefinition = this._getAircraftDefinitionForAirlineId(airlineId, airlineModel);
        const destination = this._setDestinationFromRouteOrProcedure(spawnModel);
        const callsign = airlineModel.generateFlightNumber();

        return {
            callsign,
            destination,
            fleet,
            category: spawnModel.category,
            airline: airlineModel.icao,
            altitude: spawnModel.altitude,
            speed: spawnModel.speed,
            heading: spawnModel.heading,
            position: spawnModel.position,
            icao: aircraftDefinition.icao,
            model: aircraftDefinition,
            route: spawnModel.route,
            // TODO: this may not be needed anymore
            waypoints: _get(spawnModel, 'fixes', [])
        };
    }

    /**
     * Given an `airlineId`, find a random aircraft type from the airline.
     *
     * @for AircraftCollection
     * @method _getAircraftDefinitionForAirlineId
     * @param airlineId {string}
     * @param airlineModel {AirlineModel}
     * @return aircraftDefinition {AircraftDefinitionModel}
     * @private
     */
    _getAircraftDefinitionForAirlineId(airlineId, airlineModel) {
        const { airline, fleet } = airlineNameAndFleetHelper([airlineId]);
        const aircraftType = airlineModel.getRandomAircraftType(fleet);
        const aircraftDefinition = _find(this.definitionList, { icao: aircraftType });

        if (typeof aircraftDefinition === 'undefined') {
            console.error(`Undefined aircraftDefinition found for ${aircraftType.toUpperCase()}`);

            // recurse through this method if an error is encountered
            return this._getAircraftDefinitionForAirlineId(airlineId, airlineModel);
        }

        return aircraftDefinition;
    }

    /**
     * Determines if `destination` is defined and returns route procedure name if it is not
     *
     * @for AircraftCollection
     * @method _setDestinationFromRouteOrProcedure
     * @param destination {string}
     * @param route {string}
     * @return {string}
     * @private
     */
    _setDestinationFromRouteOrProcedure({ destination, route }) {
        let destinationOrProcedure = destination;

        if (!destination) {
            const routeModel = new RouteModel(route);
            destinationOrProcedure = routeModel.procedure;
        }

        return destinationOrProcedure;
    }
}
