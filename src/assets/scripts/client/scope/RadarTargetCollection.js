import _filter from 'lodash/filter';
import _forEach from 'lodash/forEach';
import _has from 'lodash/has';
import _isObject from 'lodash/isObject';
import RadarTargetModel from './RadarTargetModel';
import BaseCollection from '../base/BaseCollection';
import EventBus from '../lib/EventBus';
import { EVENT } from '../constants/eventNames';
import { THEME } from '../constants/themes';

/**
 * Collection of `RadarTargetModel`s
 *
 * @class RadarTargetCollection
 */
export default class RadarTargetCollection extends BaseCollection {
    constructor(theme) {
        super();

        this._eventBus = EventBus;
        this._theme = theme;

        this._init()
            .enable();
    }

    /**
     * Complete initialization tasks
     *
     * @for RadarTargetCollection
     * @method _init
     * @param theme {object}
     * @private
     * @chainable
     */
    _init() {
        return this;
    }

    /**
     * Add the provided `RadarTargetModel` instance to the collection
     *
     * @for RadarTargetCollection
     * @method addRadarTargetModel
     * @param radarTargetModel {RadarTargetModel}
     */
    addRadarTargetModel(radarTargetModel) {
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
    addRadarTargetModelFromAircraftModel = (aircraftModel) => {
        const radarTargetModel = new RadarTargetModel(this._theme, aircraftModel);

        this.addRadarTargetModel(radarTargetModel);
    };

    /**
     * Activate event handlers
     *
     * @for RadarTargetModel
     * @method disable
     */
    disable() {
        this._eventBus.off(EVENT.ADD_AIRCRAFT, this.addRadarTargetModelFromAircraftModel);
        this._eventBus.off(EVENT.REMOVE_AIRCRAFT, this.removeRadarTargetModel);
        this._eventBus.off(EVENT.SET_THEME, this._setTheme);
    }

    /**
     * Deactivate event handlers
     *
     * @for RadarTargetModel
     * @method disable
     */
    enable() {
        this._eventBus.on(EVENT.ADD_AIRCRAFT, this.addRadarTargetModelFromAircraftModel);
        this._eventBus.on(EVENT.REMOVE_AIRCRAFT, this.removeRadarTargetModel);
        this._eventBus.on(EVENT.SET_THEME, this._setTheme);
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
        const results = _filter(radarTargetModels, (radarTargetModel) =>
            radarTargetModel._aircraftModel.id === aircraftModel.id
        );

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
     * Remove from the collection the radar target model associated with the specified aircraft model
     *
     * @for RadarTargetCollection
     * @method removeRadarTargetModel
     * @param aircraftModel {AircraftModel}
     */
    removeRadarTargetModel = (aircraftModel) => {
        const idToRemove = aircraftModel.id;
        const collectionWithAircraftRemoved = _filter(this._items, (radarTargetModel) =>
            radarTargetModel._aircraftModel.id !== idToRemove
        );

        this._items = collectionWithAircraftRemoved;
    };

    /**
     * Reset all radar target models to default state
     *
     * @for RadarTargetCollection
     * @method resetAllRadarTargets
     */
    resetAllRadarTargets() {
        const radarTargetModels = this._items;

        _forEach(radarTargetModels, (radarTargetModel) => radarTargetModel.reset());
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

    /**
     * Change theme to the specified name
     *
     * This should ONLY be called through the EventBus during a `SET_THEME` event,
     * thus ensuring that the same theme is always in use by all app components.
     *
     * This method must remain an arrow function in order to preserve the scope
     * of `this`, since it is being invoked by an EventBus callback.
     *
     * @for RadarTargetCollection
     * @method _setTheme
     * @param themeName {string}
     * @private
     */
    _setTheme = (themeName) => {
        if (!_has(THEME, themeName)) {
            console.error(`Expected valid theme to change to, but received '${themeName}'`);

            return;
        }

        this._theme = THEME[themeName];
    }
}
