import _filter from 'lodash/filter';
import _forEach from 'lodash/forEach';
import _isObject from 'lodash/isObject';
import RadarTargetModel from './RadarTargetModel';
import BaseCollection from '../base/BaseCollection';

/**
 * Collection of `RadarTargetModel`s
 *
 * @class RadarTargetCollection
 */
export default class RadarTargetCollection extends BaseCollection {
    constructor(theme, aircraftCollection) {
        super();

        this._init(theme, aircraftCollection);
    }

    /**
     * Complete initialization tasks
     *
     * @for RadarTargetCollection
     * @method _init
     * @param theme {object}
     * @param aircraftCollection {array}
     */
    _init(theme, aircraftCollection) {
        this.addRadarTargetModelsFromAircraftCollection(theme, aircraftCollection);
    }

    /**
     * Add the provided `RadarTargetModel` instance to the collection
     *
     * @for RadarTargetCollection
     * @method addRadarTargetModelToCollection
     * @param radarTargetModel {RadarTargetModel}
     */
    addRadarTargetModelToCollection(radarTargetModel) {
        if (!_isObject(radarTargetModel)) {
            throw new TypeError(`Expected instance of RadarTargetModel but received '${radarTargetModel}'`);
        }

        this._items.push(radarTargetModel);
    }

    /**
     * Create `RadarTargetModel`s for the given `AircraftModel`
     *
     * @for RadarTargetCollection
     * @method addRadarTargetModelFromAircraftModel
     * @param theme {object}
     * @param aircraftModel {array}
     */
    addRadarTargetModelFromAircraftModel(theme, aircraftModel) {
        const radarTargetModel = new RadarTargetModel(theme, aircraftModel);

        this.addRadarTargetModelToCollection(radarTargetModel);
    }

    /**
     * Create `RadarTargetModel`s for each aircraft in the provided aircraft collection,
     * and add them to the collection
     *
     * @for RadarTargetCollection
     * @method addRadarTargetModelsFromAircraftCollection
     * @param theme {object}
     * @param aircraftCollection {array}
     */
    addRadarTargetModelsFromAircraftCollection(theme, aircraftCollection) {
        _forEach(aircraftCollection, (aircraftModel) => {
            this.addRadarTargetModelFromAircraftModel(theme, aircraftModel);
        });
    }

    /**
     * Get the radar target model object for the specified aircraft
     *
     * @for RadarTargetCollection
     * @method getRadarTargetModelFromAircraftModel
     * @param aircraftModel {AircraftModel}
     * @return radarTargetModel {RadarTargetModel}
     */
    getRadarTargetModelFromAircraftModel(aircraftModel) {
        // Store variable because `this` within lodash `_filter` has different scope
        const radarTargetModels = this._items;
        const results = _filter(radarTargetModels, (radarTargetModel) => radarTargetModel._aircraftModel.id === aircraftModel.id);

        if (results.length > 1) {
            return;
        }

        const radarTargetModel = results[0];

        return radarTargetModel;
    }

    // TODO: Allow us to choose an aircraft by its CID
    /**
     * Get the radar target model object for the specified aircraft
     *
     * @for RadarTargetCollection
     * @method getRadarTargetModelFromAircraftReference
     * @param aircraftReference {string} the CID, squawk code, or callsign assigned to an aircraft
     * @return radarTargetModel {RadarTargetModel}
     */
    getRadarTargetModelFromAircraftReference(aircraftReference) {
        // Store variable because `this` within lodash `_filter` has different scope
        const radarTargetModels = this._items;
        const results = _filter(radarTargetModels, (radarTargetModel) =>
            radarTargetModel._aircraftModel.transponderCode === aircraftReference ||
            radarTargetModel._aircraftModel.callsign === aircraftReference
        );

        if (results.length > 1) {
            return;
        }

        const radarTargetModel = results[0];

        return radarTargetModel;
    }

    /**
     * Reset all properties to their default values
     *
     * @for RadarTargetCollection
     * @method destroy
     */
    destroy() {
        this._items = [];
    }
}
