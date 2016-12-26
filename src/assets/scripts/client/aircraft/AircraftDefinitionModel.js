import BaseModel from '../base/BaseModel';

/**
 * @class AircraftDefinitionModel
 * @extends BaseModel
 */
export default class AircraftDefinitionModel extends BaseModel {
    /**
     *
     *
     */
    constructor(aircraftDefinition) {
        super();

        this.init(aircraftDefinition);
    }

    /**
     *
     *
     */
    init(aircraftDefinition) {
        this.name = aircraftDefinition.name;
        this.icao = aircraftDefinition.icao.toLowerCase();
        this.engines = aircraftDefinition.engines;
        this.weightclass = aircraftDefinition.weightclass;
        this.category = aircraftDefinition.category;
        this.ceiling = aircraftDefinition.ceiling;
        this.rate = aircraftDefinition.rate;
        this.runway = aircraftDefinition.runway;
        this.speed = aircraftDefinition.speed;
        this.capability = aircraftDefinition.capability;
    }
}
