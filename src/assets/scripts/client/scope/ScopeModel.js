/* eslint-disable no-unused-vars */
import _has from 'lodash/has';
import _isNil from 'lodash/isNil';
import GameController from '../game/GameController';
import RadarTargetCollection from './RadarTargetCollection';
import EventBus from '../lib/EventBus';
import { EVENT } from '../constants/eventNames';
import { GAME_OPTION_NAMES } from '../constants/gameOptionConstants';
import { THEME } from '../constants/themes';
import { DECIMAL_RADIX } from '../utilities/unitConverters';

/**
 * Scope belonging to a Player
 *
 * NOTE: Many methods are just placeholders for future use, hence why their params are commented out
 *
 * @class ScopeModel
 */
export default class ScopeModel {
    /**
     * @for ScopeModel
     * @constructor
     */
    constructor() {
        /**
         * Local reference to the event bus
         *
         * @for ScopeModel
         * @property _eventBus
         * @type {EventBus}
         * @private
         */
        this._eventBus = EventBus;

        /**
         * Length of PTL lines (aka "vector lines") for all aircraft
         *
         * @for ScopeModel
         * @property _ptlLength
         * @type {number} length in minutes
         * @default 0
         * @private
         */
        this._ptlLength = 0;

        // TODO: Use this!
        /**
         * Collection of all sectors being controlled by this scope
         *
         * Currently set to null and not used. Is a placeholder for the
         * forthcoming class `SectorCollection`.
         *
         * @for ScopeModel
         * @property _sectorCollection
         * @type {null}
         * @private
         */
        this._sectorCollection = null;

        /**
         * Current theme
         *
         * @for ScopeModel
         * @property _theme
         * @type {object}
         * @private
         */
        this._theme = THEME.DEFAULT;

        /**
         * Collection of all radar targets observed by this scope
         *
         * @for ScopeModel
         * @property radarTargetCollection
         * @type {RadarTargetCollection}
         */
        this.radarTargetCollection = new RadarTargetCollection(this._theme);

        this.init()
            .enable();
    }

    get ptlLength() {
        return this._ptlLength;
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Complete initialization tasks
     *
     * @for ScopeModel
     * @method init
     * @chainable
     */
    init() {
        return this;
    }

    /**
    * Enable handlers
    *
    * @for ScopeModel
    * @method enable
    */
    enable() {
        this._eventBus.on(EVENT.SET_THEME, this._setTheme);
    }

    /**
    * Disable handlers
    *
    * @for ScopeModel
    * @method disable
    */
    disable() {
        this._eventBus.off(EVENT.SET_THEME, this._setTheme);
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Accept a pending handoff from another sector
     *
     * NOTE: This is just a placeholder for future use, hence why the params are commented out
     *
     * @for ScopeModel
     * @method acceptHandoff
     * @param radarTargetModel {RadarTargetModel}
     * @return result {array} [success of operation, system's response]
     */
    acceptHandoff(/* radarTargetModel */) {
        return [false, 'acceptHandoff command not yet available'];
    }

    /**
     * Amend the cruise altitude OR interim altitude for a given `RadarTargetModel`
     *
     * @for ScopeModel
     * @method amendAltitude
     * @param radarTargetModel {RadarTargetModel}
     * @param altitude {string}
     * @return result {array} [success of operation, system's response]
     */
    amendAltitude(radarTargetModel, altitude) {
        altitude = parseInt(altitude, DECIMAL_RADIX);

        return radarTargetModel.amendAltitude(altitude);
    }

    /**
     * Increase or decrease the PTL length by one step
     *
     * @for ScopeModel
     * @method changePtlLength
     * @param {number} direction - either -1 or 1 to indicate increment direction
     */
    changePtlLength(direction) {
        const validValues = GameController.getGameOption(GAME_OPTION_NAMES.PROJECTED_TRACK_LINE_LENGTHS)
            .split('-')
            .map((val) => parseFloat(val));
        const currentIndex = validValues.indexOf(this._ptlLength);
        const nextIndex = currentIndex + Math.sign(direction);

        if (nextIndex >= validValues.length) {
            return;
        }

        if (nextIndex < 0) {
            this._ptlLength = 0;

            this._eventBus.trigger(EVENT.MARK_SHALLOW_RENDER);

            return;
        }

        this._ptlLength = validValues[nextIndex];

        this._eventBus.trigger(EVENT.MARK_SHALLOW_RENDER);
    }

    /**
     * Decrease the length of the PTL lines for all aircraft
     *
     * @for ScopeModel
     * @method decreasePtlLength
     */
    decreasePtlLength() {
        const direction = -1;

        this.changePtlLength(direction);
    }

    /**
     * Increase the length of the PTL lines for all aircraft
     *
     * @for ScopeModel
     * @method increasePtlLength
     */
    increasePtlLength() {
        const direction = 1;

        this.changePtlLength(direction);
    }

    /**
     * Initiate a handoff to another sector
     *
     * NOTE: This is just a placeholder for future use, hence why the params are commented out
     *
     * @for ScopeModel
     * @method initiateHandoff
     * @param radarTargetModel {RadarTargetModel}
     * @param sectorCode {string} the handoff code for the receiving sector
     * @return result {array} [success of operation, system's response]
     */
    initiateHandoff(/* radarTargetModel, sectorCode */) {
        return [false, 'initiateHandoff command not yet available'];
    }

    /**
     * Change direction and/or length of data block leader line
     *
     * @for ScopeModel
     * @method moveDataBlock
     * @param radarTargetModel {RadarTargetModel}
     * @param commandArguments {string}
     * @return result {array} [success of operation, system's response]
     */
    moveDataBlock(radarTargetModel, commandArguments) {
        return radarTargetModel.moveDataBlock(commandArguments);
    }

    /**
     * Toggle visibility of the data block of a given `RadarTargetModel`, on this
     * sector's scope, or the scope of another sector
     *
     * NOTE: This is just a placeholder for future use, hence why the params are commented out
     *
     * @for ScopeModel
     * @method propogateDataBlock
     * @param radarTargetModel {RadarTargetModel}
     * @param sectorCode {string} handoff code for the receiving sector
     * @return result {array} [success of operation, system's response]
     */
    propogateDataBlock(/* radarTargetModel, sectorCode */) {
        return [false, 'propogateDataBlock command not yet available'];
    }

    /**
     * Amend the route stored in the scope for a given `RadarTargetModel`
     *
     * NOTE: This is just a placeholder for future use, hence why the params are commented out
     *
     * @for ScopeModel
     * @method route
     * @param radarTargetModel {RadarTargetModel}
     * @param routeString {string}
     * @return result {array} [success of operation, system's response]
     */
    route(/* radarTargetModel, routeString */) {
        return [false, 'route command not yet available'];
    }

    /**
     * Execute a scope command from a `ScopeCommandModel`
     * @method runScopeCommand
     * @param scopeCommandModel {ScopeCommandModel}
     * @return result {array} [success of operation, system's response]
     */
    runScopeCommand(scopeCommandModel) {
        const functionName = scopeCommandModel.commandFunction;
        const functionArguments = scopeCommandModel.commandArguments;
        const radarTargetModel = this.radarTargetCollection.findRadarTargetModelForAircraftReference(
            scopeCommandModel.aircraftReference
        );

        if (!(functionName in this)) {
            return [false, 'ERR: BAD SYNTAX'];
        }

        if (_isNil(radarTargetModel)) {
            return [false, 'ERR: UNKNOWN AIRCRAFT'];
        }

        // call the appropriate function, and explode the array of arguments
        // this allows any number of arguments to be accepted by the receiving method
        return this[functionName](radarTargetModel, ...functionArguments);
    }

    /**
     * Amend the scratchpad for a given `RadarTargetModel`
     *
     * @for ScopeModel
     * @method setScratchpad
     * @param radarTargetModel {RadarTargetModel}
     * @param scratchPadText {string}
     * @return result {array} [success of operation, system's response]
     */
    setScratchpad(radarTargetModel, scratchPadText) {
        if (scratchPadText.length > 3) {
            return [false, 'ERR: SCRATCHPAD MAX 3 CHAR'];
        }

        return radarTargetModel.setScratchpad(scratchPadText.toUpperCase());
    }

    /**
     * Toggle halo for a given `RadarTargetModel`
     *
     * @for ScopeModel
     * @method setHalo
     * @param radarTargetModel {RadarTargetModel}
     * @return result {array} [success of operation, system's response]
     */
    setHalo(radarTargetModel, radius) {
        const haloDefaultRadius = this._theme.SCOPE.HALO_DEFAULT_RADIUS_NM;
        const haloMaxRadius = this._theme.SCOPE.HALO_MAX_RADIUS_NM;

        if (radius <= 0) {
            return [false, 'ERR: HALO SIZE INVALID'];
        }

        if (radius > haloMaxRadius) {
            return [false, `ERR: HALO MAX ${haloMaxRadius} NM`];
        }

        if (!radius) {
            radius = haloDefaultRadius;
        }

        return radarTargetModel.setHalo(radius);
    }

    // ------------------------------ PRIVATE ------------------------------

    /**
     * Change theme to the specified name
     *
     * This should ONLY be called through the EventBus during a `SET_THEME` event,
     * thus ensuring that the same theme is always in use by all app components.
     *
     * This method must remain an arrow function in order to preserve the scope
     * of `this`, since it is being invoked by an EventBus callback.
     *
     * @for ScopeModel
     * @method _setTheme
     * @param themeName {string}
     */
    _setTheme = (themeName) => {
        if (!_has(THEME, themeName)) {
            console.error(`Expected valid theme to change to, but received '${themeName}'`);

            return;
        }

        this._theme = THEME[themeName];
    }
}
