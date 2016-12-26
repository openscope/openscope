import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _isNil from 'lodash/isNil';
import _random from 'lodash/random';
import BaseCollection from '../base/BaseCollection';
import AircraftDefinitionModel from './AircraftDefinitionModel';
import AircraftInstanceModel from './AircraftInstanceModel';
import { bearingToPoint } from '../math/flightMath';

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
        // TODO: handle specified fleets. ex: `ual/long`
        const airlineId = spawnModel.getRandomAirlineForSpawn();
        // TODO: use `airlineNameAndFleetHelper` for this
        const [ id, fleet ] = airlineId.split('/');
        const aircraftDefinition = this._getAircraftDefinitionForAirlineId(id);
        const initializationProps = this._assembleAircraftInitProps(id, fleet, aircraftDefinition, spawnModel);

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
    _assembleAircraftInitProps(airlineId, fleet = 'Default', aircraftDefinition, spawnModel) {
        return {
            airline: airlineId,
            altitude: spawnModel.altitude,
            callsign: `${_random(0, 999)}`,
            category: 'arrival',
            destination: 'ksfo',
            fleet: fleet,
            icao: aircraftDefinition.icao,
            model: aircraftDefinition,
            route: spawnModel.route,
            waypoints: _get(spawnModel, 'fixes', [])
        };
    }
}
