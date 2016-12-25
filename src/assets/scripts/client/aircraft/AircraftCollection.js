import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
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
    constructor(aircraftDefinitionList, airlineCollection) {
        super();

        this._airlineCollection = airlineCollection;
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
        // TODO: handle specified fleets. ex: `ual/long`
        const airlineId = spawnModel.getRandomAirlineForSpawn();
        const aircraftDefinition = this._getAircraftDefinitionForAirlineId(airlineId);
        const initializationProps = this._assembleAircraftInitProps(airlineId, aircraftDefinition, spawnModel);

        console.log('ARRIVAL::: ', initializationProps);
        const aircraftModel = new AircraftInstanceModel(initializationProps);

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
        let definitionList = [];

        _forEach(aircraftDefinitionList, (aircraftDefinition) => {
            const aircraft = new AircraftDefinitionModel(aircraftDefinition);

            definitionList.push(aircraft);
        });

        return definitionList;
    }

    /**
     *
     *
     */
    _getAircraftDefinitionForAirlineId(airlineId) {
        const airlineModel = this._airlineCollection.findAirlineById(airlineId);
        const aircraftType = airlineModel.getRandomAircraftTypeFromFleet();
        const aircraftDefinition = _find(this.definitionList, { icao: aircraftType.toUpperCase() });

        if (typeof aircraftDefinition === 'undefined') {
            throw new Error(`undefined aircraftDefinition for ${aircraftType}`);
        }

        return aircraftDefinition;
    }

    /**
     *
     *
     */
    _assembleAircraftInitProps(airlineId, aircraftDefinition, spawnModel) {
        return {
            airline: airlineId,
            altitude: spawnModel.altitude,
            callsign: `${_random(0, 999)}`,
            category: 'arrival',
            destination: "ksfo",
            fleet: '',
            icao: aircraftDefinition.icao,
            model: aircraftDefinition,
            route: spawnModel.route,
            waypoints: []
        }
    }
}
