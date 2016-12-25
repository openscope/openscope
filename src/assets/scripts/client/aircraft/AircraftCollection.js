import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import BaseCollection from '../base/BaseCollection';
import AircraftDefinitionModel from './AircraftDefinitionModel';

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
    // createAircraftForArrival = (arrival) => {
    //     const airlineId = arrival.getRandomWeightedAirlineForArrival();
    //     const aircraftDefinition = this._getAircraftDefinitionForAirlineId(airlineId);
    //     const aircraftModel = new AircraftModel(aircraftDefinition, arrival);
    //
    //     this.addItem(aircraftModel);
    // };

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
    _buildAircraftDefinitionList(aircraftDefinitionList) {
        let definitionList = [];

        _forEach(aircraftDefinitionList, (aircraftDefinition, key) => {
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
        const aircraftDefinition = _find(this.definitionList, { icao: aircraftType });


        if (typeof aircraftDefinition === 'undefined') {
            console.error(aircraftType, airlineModel, this.definitionList);
            throw new Error('undefined definition');
        }

        return aircraftDefinition;
    }
}
