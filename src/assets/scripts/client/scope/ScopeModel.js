import _has from 'lodash/has';
import _isNil from 'lodash/isNil';
import EventBus from '../lib/EventBus';
import NavigationLibrary from '../navigationLibrary/NavigationLibrary';
import RadarTargetCollection from './RadarTargetCollection';
import { EVENT } from '../constants/eventNames';
import { DECIMAL_RADIX } from '../constants/globalConstants';
import { THEME } from '../constants/themes';

export default class ScopeModel {
    constructor() {
        this._eventBus = EventBus;
        this._navigationLibrary = NavigationLibrary;
        // TODO: Use this!
        this._sectorCollection = [];
        this._theme = THEME.DEFAULT;

        this.radarTargetCollection = [];

        this._init();
    }

    /**
     * Complete initialization tasks
     *
     * @for ScopeModel
     * @method _init
     */
    _init() {
        this.radarTargetCollection = new RadarTargetCollection(this._theme);
    }

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
     * Enable handlers
     *
     * @for ScopeModel
     * @method disable
     */
    disable() {
        this._eventBus.off(EVENT.SET_THEME, this._setTheme);
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
     * Initiate a handoff to another sector
     *
     * @for ScopeModel
     * @method initiateHandoff
     * @param radarTargetModel {RadarTargetModel}
     * @param sectorCode {string} the handoff code for the receiving sector
     * @return result {array} [success of operation, system's response]
     */
    initiateHandoff(radarTargetModel, sectorCode) {
        return [false, 'handoff command not yet available'];
    }

    /**
     * Change direction and/or length of data block leader line
     *
     * @for ScopeModel
     * @method moveDataBlock
     * @param radarTargetModel {RadarTargetModel}
     * @param commandArguments {array}
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
     * @param sectorCode {array} handoff code for the receiving sector
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
        const radarTargetModel = this.radarTargetCollection.getRadarTargetModelFromAircraftReference(
            scopeCommandModel.aircraftReference
        );

        if (!(functionName in this)) {
            return [false, 'ERR: BAD SYNTAX'];
        }

        if (_isNil(radarTargetModel)) {
            return [false, 'ERR: UNKNOWN AIRCRAFT'];
        }

        return this[functionName](radarTargetModel, ...functionArguments);
    }

    /**
     * Amend the scratchpad for a given `RadarTargetModel`
     *
     * @for ScopeModel
     * @method setScratchpad
     * @param radarTargetModel {RadarTargetModel}
     * @param scratchPadText {array}
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
     * @method toggleHalo
     * @param radarTargetModel {RadarTargetModel}
     * @return result {array} [success of operation, system's response]
     */
    toggleHalo(radarTargetModel) {
        return radarTargetModel.toggleHalo();
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
