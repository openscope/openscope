import _find from 'lodash/find';
import _get from 'lodash/get';
import _map from 'lodash/map';
import _random from 'lodash/random';
import BaseCollection from '../base/BaseCollection';
import AircraftDefinitionModel from './AircraftDefinitionModel';
import AircraftInstanceModel from './AircraftInstanceModel';

/**
 *
 *
 * @class AircraftCollection
 * @extends BaseCollection
 */
export default class AircraftCollection extends BaseCollection {
    /**
     *
     *
     */
    constructor(aircraftDefinitionList, airlineCollection, fixCollection) {
        super();

        this._airlineCollection = airlineCollection;
        this._fixCollection = fixCollection;
        this.definitionList = [];

        this.init(aircraftDefinitionList);
    }

    /**
     *
     *
     */
    init(aircraftDefinitionList) {
        this.definitionList = this._buildAircraftDefinitionList(aircraftDefinitionList);
    }

    /**
     *
     *
     */
    createAircraftWithSpawnModel = (spawnModel) => {
        const initializationProps = this._buildAircraftProps(spawnModel);
        const aircraftModel = new AircraftInstanceModel(initializationProps);

        console.log('SPAWN :::', spawnModel.category, initializationProps);

        this.addItem(aircraftModel);
    };

    /**
     *
     *
     */
    addItem(aircraftModel) {
        this._items.push(aircraftModel);
    }

    /**
     *
     *
     */
    findAircraftDefinitionModelByIcao(icao) {
        return _find(this.definitionList, { icao: icao });
    }

    /**
     *
     *
     */
    _buildAircraftDefinitionList(aircraftDefinitionList) {
        const definitionList = _map(aircraftDefinitionList, (aircraftDefinition) => {
            return new AircraftDefinitionModel(aircraftDefinition);
        });

        return definitionList;
    }

    /**
     *
     *
     */
    _buildAircraftProps(spawnModel) {
        if (spawnModel.category === 'departure') {
            return this._buildAircraftPropsForDeparture(spawnModel);
        }

        return this._buildAircraftPropsForArrival(spawnModel);
    }

    /**
     *
     *
     */
    _buildAircraftPropsForDeparture(spawnModel) {
        const airlineId = spawnModel.getRandomAirlineForSpawn();
        const destination = spawnModel.getRandomDestinationForDeparture();
        // TODO: we should get the `AirlineModel` here, then get the icao (id) and fleet from there along with generating a callsign
        // TODO: use `airlineNameAndFleetHelper` for this
        const [id, fleet] = airlineId.split('/');
        const aircraftDefinition = this._getAircraftDefinitionForAirlineId(id);
        const callsign = `${_random(0, 999)}`;

        return {
            airline: airlineId,
            callsign: callsign,
            // TODO: this is a constant somewhere
            category: spawnModel.category,
            // TODO: this should come from logic and not inline
            destination: destination,
            fleet: fleet || 'Default',
            icao: aircraftDefinition.icao,
            model: aircraftDefinition
        };
    }

    /**
     *
     *
     */
    _buildAircraftPropsForArrival(spawnModel) {
        const airlineId = spawnModel.getRandomAirlineForSpawn();
        // TODO: use `airlineNameAndFleetHelper` for this
        const [id, fleet] = airlineId.split('/');
        const aircraftDefinition = this._getAircraftDefinitionForAirlineId(id);
        const callsign = `${_random(0, 999)}`;

        return {
            airline: airlineId,
            altitude: spawnModel.altitude,
            callsign: callsign,
            // TODO: this is a constant somewhere
            category: spawnModel.category,
            // TODO: this should come from logic and not inline
            destination: 'ksfo',
            fleet: fleet || 'Default',
            icao: aircraftDefinition.icao,
            model: aircraftDefinition,
            route: spawnModel.route,
            waypoints: _get(spawnModel, 'fixes', [])
        };
    }

    /**
     *
     *
     */
    _getAircraftDefinitionForAirlineId(airlineId) {
        const airlineModel = this._airlineCollection.findAirlineById(airlineId);
        const aircraftType = airlineModel.getRandomAircraftTypeFromFleet();
        const aircraftDefinition = _find(this.definitionList, { icao: aircraftType });

        if (typeof aircraftDefinition === 'undefined') {
            console.error(`undefined aircraftDefinition for ${aircraftType}`);

            return this._getAircraftDefinitionForAirlineId(airlineId);
        }

        return aircraftDefinition;
    }
}
