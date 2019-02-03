/* eslint-disable no-unused-vars */
import _has from 'lodash/has';
import _isNil from 'lodash/isNil';
import RadarTargetCollection from './RadarTargetCollection';
import EventBus from '../lib/EventBus';
import { EVENT } from '../constants/eventNames';
import { PTL_LENGTHS } from '../constants/scopeConstants';
import { THEME } from '../constants/themes';
import { DECIMAL_RADIX } from '../utilities/unitConverters';

/**
 * Scope belonging to a Player
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
        this._eventBus = null;

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
        this._theme = null;

        /**
         * Collection of all radar targets observed by this scope
         *
         * @for ScopeModel
         * @property radarTargetCollection
         * @type {RadarTargetCollection}
         */
        this.radarTargetCollection = null;

        this.init()
            .enable();
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
        this._eventBus = EventBus;
        this._theme = THEME.DEFAULT;
        this.radarTargetCollection = new RadarTargetCollection(this._theme);

        return this;
    }

    /**
     * Reset the instance to its empty state
     *
     * @for ScopeModel
     * @method _reset
     * @chainable
     */
    reset() {
        this._eventBus = null;
        this._ptlLength = 0;
        this._sectorCollection = null;
        this._theme = null;
        this.radarTargetCollection = null;

        return this;
    }

    /**
    * Disable handlers
    *
    * @for ScopeModel
    * @method enable
    */
    enable() {
        this._eventBus.on(EVENT.SET_THEME, this._setTheme);
    }

    /**
    * Enable handlers
    *
    * @for ScopeModel
    * @method disable
    */
    disable() {
        this._eventBus.off(EVENT.SET_THEME, this._setTheme);
    }

    _setupHandlers() {
        this._onPtlDecreaseLengthHandler = this.decreasePtlLength.bind(this);
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Accept a pending handoff from another sector
     *
     * @for ScopeModel
     * @method acceptHandoff
     * @param radarTargetModel {RadarTargetModel}
     * @return result {array} [success of operation, system's response]
     */
    acceptHandoff(radarTargetModel) {
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
     * Decrease the length of the PTL lines for all aircraft
     *
     * @for ScopeModel
     * @method decreasePtlLength
     */
    decreasePtlLength() {
        switch (this._ptlLength) {
            case 1:
                this._ptlLength = PTL_LENGTHS['0'];

                break;
            case 2:
                this._ptlLength = PTL_LENGTHS['1'];

                break;
            case 4:
                this._ptlLength = PTL_LENGTHS['2'];

                break;
            case 8:
                this._ptlLength = PTL_LENGTHS['4'];

                break;
            default:
                break;
        }
    }

    /**
     * Decrease the length of the PTL lines for all aircraft
     *
     * @for ScopeModel
     * @method increasePtlLength
     */
    increasePtlLength() {
        switch (this._ptlLength) {
            case 0:
                this._ptlLength = PTL_LENGTHS['1'];

                break;
            case 1:

                this._ptlLength = PTL_LENGTHS['2'];
                break;
            case 2:

                this._ptlLength = PTL_LENGTHS['4'];
                break;
            case 4:

                this._ptlLength = PTL_LENGTHS['8'];

                break;
            default:
                break;
    };

    /**
     * Initiate a handoff to another sector
     *
     * @for ScopeModel
     * @method initiateHandoff
     * @param radarTargetModel {RadarTargetModel}
     * @param sectorCode {string} the handoff code for the receiving sector
     * @return result {array} [success of operation, system's response]
     */
    initiateHandoff(radarTargetModel, sectorCode) {
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
     * @for ScopeModel
     * @method propogateDataBlock
     * @param radarTargetModel {RadarTargetModel}
     * @param sectorCode {string} handoff code for the receiving sector
     * @return result {array} [success of operation, system's response]
     */
    propogateDataBlock(radarTargetModel, sectorCode) {
        return [false, 'propogateDataBlock command not yet available'];
    }

    /**
     * Amend the route stored in the scope for a given `RadarTargetModel`
     *
     * @for ScopeModel
     * @method route
     * @param radarTargetModel {RadarTargetModel}
     * @param routeString {string}
     * @return result {array} [success of operation, system's response]
     */
    route(radarTargetModel, routeString) {
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
     * Set the length of the PTL lines for all aircraft
     *
     * @for ScopeModel
     * @method setPtlLength
     * @param {number} length - length of PTL line, in minutes
     */
    setPtlLength(length) {
        if (!_has(PTL_LENGTHS, length)) {
            return;
        }

        this._ptlLength = length;
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
