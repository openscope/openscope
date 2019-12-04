import _filter from 'lodash/filter';
import _has from 'lodash/has';
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
    /**
     * @for RadarTargetCollection
     * @constructor
     * @param theme {object}
     */
    constructor(theme) {
        super();

        /**
         * Local reference to the event bus
         *
         * @for RadarTargetModel
         * @property _eventBus
         * @type {EventBus}
         */
        this._eventBus = EventBus;

        /**
         * Collection of stripview [cid, callsign] tuples
         * used for finding an aircraft by cid
         *
         * @for RadarTargetModel
         * @property _stripviews
         * @type {map<string, string>}
         * @private
         */
        this._stripviews = {};

        /**
         * Current theme, updated via event bus events
         *
         * @for RadarTargetCollection
         * @property _theme
         * @type {object}
         */
        this._theme = theme;

        this._init()
            .enable();
    }

    /**
     * Return a read-only reference to the collection array
     *
     * @for RadarTargetCollection
     * @property items
     * @type {array}
     */
    get items() {
        return this._items;
    }

    /**
     * Complete initialization tasks
     *
     * @for RadarTargetCollection
     * @method _init
     * @private
     * @chainable
     */
    _init() {
        return this;
    }

    /**
    * Activate event handlers
    *
    * @for RadarTargetModel
    * @method enable
    */
    enable() {
        this._eventBus.on(EVENT.ADD_AIRCRAFT, this.addRadarTargetModelForAircraftModel);
        this._eventBus.on(EVENT.SET_THEME, this._setTheme);
        this._eventBus.on(EVENT.ADD_STRIPVIEW, this._addStripViewLink);
        this._eventBus.on(EVENT.REMOVE_STRIPVIEW, this._removeStripViewLink);
    }

    /**
    * Deactivate event handlers
    *
    * @for RadarTargetModel
    * @method disable
    */
    disable() {
        this._eventBus.off(EVENT.ADD_AIRCRAFT, this.addRadarTargetModelForAircraftModel);
        this._eventBus.off(EVENT.SET_THEME, this._setTheme);
        this._eventBus.off(EVENT.ADD_STRIPVIEW, this._addStripViewLink);
        this._eventBus.off(EVENT.REMOVE_STRIPVIEW, this._removeStripViewLink);
    }

    /**
     * Add the provided `RadarTargetModel` instance to the collection
     *
     * @for RadarTargetCollection
     * @method addRadarTargetModel
     * @param radarTargetModel {RadarTargetModel}
     */
    addRadarTargetModel(radarTargetModel) {
        if (!(radarTargetModel instanceof RadarTargetModel)) {
            throw new TypeError(`Expected instance of RadarTargetModel but received '${radarTargetModel}'`);
        }

        this._items.push(radarTargetModel);
    }

    /**
     * Create `RadarTargetModel`s for the given `AircraftModel`
     *
     * @for RadarTargetCollection
     * @method addRadarTargetModelForAircraftModel
     * @param aircraftModel {AircraftModel}
     */
    addRadarTargetModelForAircraftModel = (aircraftModel) => {
        const radarTargetModel = new RadarTargetModel(this._theme, aircraftModel);

        this.addRadarTargetModel(radarTargetModel);
    };

    /**
     * Get the radar target model object for the specified aircraft
     *
     * @for RadarTargetCollection
     * @method findRadarTargetModelForAircraftModel
     * @param aircraftModel {AircraftModel}
     * @return radarTargetModel {RadarTargetModel}
     */
    findRadarTargetModelForAircraftModel(aircraftModel) {
        // Store variable because `this` within lodash `_filter` has different scope
        const radarTargetModels = this._items;
        const results = _filter(
            radarTargetModels,
            (radarTargetModel) => radarTargetModel.aircraftModel.id === aircraftModel.id
        );

        if (results.length > 1) {
            throw new Error(`Unable to get radar target because ${results.length} matching aircraft were found`);
        }

        const radarTargetModel = results[0];

        return radarTargetModel;
    }

    /**
     * Get the radar target model object for the specified aircraft
     *
     * @for RadarTargetCollection
     * @method findRadarTargetModelForAircraftReference
     * @param aircraftReference {string} the CID, squawk code, or callsign assigned to an aircraft
     * @return radarTargetModel {RadarTargetModel|undefined}
     */
    findRadarTargetModelForAircraftReference(aircraftReference) {
        // The callsign of the aircraft, from the cid
        const callsign = this._stripviews[aircraftReference];

        const radarTargets = this._items.filter(({ aircraftModel }) => {
            return aircraftModel.transponderCode === aircraftReference ||
                aircraftModel.callsign === aircraftReference ||
                aircraftModel.callsign === callsign;
        });

        // Don't allow ambiguous matches to be successful
        return radarTargets.length === 1 ? radarTargets[0] : undefined;
    }

    /**
     * Remove from the collection the radar target model associated with the specified aircraft model
     *
     * @for RadarTargetCollection
     * @method removeRadarTargetModelForAircraftModel
     * @param aircraftModel {AircraftModel}
     */
    removeRadarTargetModelForAircraftModel = (aircraftModel) => {
        const collectionWithAircraftRemoved = _filter(this._items, (radarTargetModel) => {
            return radarTargetModel.aircraftModel.id !== aircraftModel.id;
        });

        this._items = collectionWithAircraftRemoved;
    };

    /**
    * Reset all properties to their default values
    *
    * @for RadarTargetCollection
    * @method reset
    */
    reset() {
        this._items = [];
        this._stripviews = {};
    }

    /**
     * Reset all radar target models to default state
     *
     * @for RadarTargetCollection
     * @method resetAllRadarTargets
     */
    resetAllRadarTargets() {
        const radarTargetModels = this._items;

        for (let i = 0; i < radarTargetModels.length; i++) {
            radarTargetModels[i].reset();
        }
    }

    /**
     * Add a soft-link for the stripview `cid` to the `aircraftModel` id
     *
     * @for RadarTargetCollection
     * @method _addStripViewLink
     * @private
     */
    _addStripViewLink = (stripView) => {
        this._stripviews[stripView.cid] = stripView.callsign;
    }

    /**
     * Removes the soft-link for the stripview `cid`
     *
     * @for RadarTargetCollection
     * @method _removeStripViewLink
     * @private
     */
    _removeStripViewLink = (cid) => {
        delete this._stripviews[cid];
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
