import _has from 'lodash/has';
import EventBus from '../lib/EventBus';
import NavigationLibrary from '../navigationLibrary/NavigationLibrary';
import RadarTargetCollection from './RadarTargetCollection';
import UiController from '../UiController';
import { THEME } from '../constants/themes';
import { EVENT } from '../constants/eventNames';

export default class ScopeModel {
    constructor(aircraftCollection) {
        this._aircraftCollection = [];
        this._eventBus = EventBus;
        this._navigationLibrary = NavigationLibrary;
        this._radarTargetCollection = [];
        // TODO: Use this!
        this._sectorCollection = [];
        this._theme = THEME.DEFAULT;

        this._init(aircraftCollection);
    }

    /**
     * Complete initialization tasks
     *
     * @for ScopeModel
     * @method _init
     * @param aircraftCollection {array}
     */
    _init(aircraftCollection) {
        this._aircraftCollection = aircraftCollection;
        this._radarTargetCollection = new RadarTargetCollection(this._theme, aircraftCollection);
    }

    /**
     * Accept a pending handoff from another sector
     *
     * @for ScopeModel
     * @method acceptHandoff
     * @param data
     */
    acceptHandoff = (data) => {
        // TODO: Make this do stuff!
        UiController.ui_log('acceptHandoff command not yet available', true);

        return [true, `user input received: '${data}'`];
    };

    /**
     * Amend the cruise altitude OR interim altitude for a given `RadarTargetModel`
     *
     * @for ScopeModel
     * @method amendAltitude
     * @param data
     */
    amendAltitude = (data) => {
        // TODO: Make this do stuff!
        UiController.ui_log('amendAltitude command not yet available', true);

        return [true, `user input received: '${data}'`];
    };

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
     * @method handoff
     * @param data
     */
    handoff = (data) => {
        // TODO: Make this do stuff!
        UiController.ui_log('handoff command not yet available', true);

        return [true, `user input received: '${data}'`];
    };

    /**
     * Change direction and/or length of data block leader line
     *
     * @for ScopeModel
     * @method moveDataBlock
     * @param data
     */
    moveDataBlock = (data) => {
        // TODO: Make this do stuff!
        UiController.ui_log('moveDataBlock command not yet available', true);

        return [true, `user input received: '${data}'`];
    };

    /**
     * Toggle visibility of the data block of a given `RadarTargetModel`, on this
     * sector's scope, or the scope of another sector
     *
     * @for ScopeModel
     * @method propogateDataBlock
     * @param data
     */
    propogateDataBlock = (data) => {
        // TODO: Make this do stuff!
        UiController.ui_log('propogateDataBlock command not yet available', true);

        return [true, `user input received: '${data}'`];
    };

    /**
     * Amend the route stored in the scope for a given `RadarTargetModel`
     *
     * @for ScopeModel
     * @method route
     * @param data
     */
    route = (data) => {
        // TODO: Make this do stuff!
        UiController.ui_log('route command not yet available', true);

        return [true, `user input received: '${data}'`];
    };

    /**
     * Execute a scope command from a `ScopeCommandModel`
     * @method runScopeCommand
     * @param scopeCommandModel {ScopeCommandModel}
     */
    runScopeCommand(scopeCommandModel) {
        const functionName = scopeCommandModel.commandFunction;
        const functionArguments = scopeCommandModel.commandArguments;

        if (!_has(this, functionName)) {
            throw new TypeError(`Expected known scope function name, but received '${functionName}'`);
        }

        return this[functionName](...functionArguments);
    }

    /**
     * Amend the scratchpad for a given `RadarTargetModel`
     *
     * @for ScopeModel
     * @method setScratchpad
     * @param data
     */
    setScratchpad = (data) => {
        // TODO: Make this do stuff!
        UiController.ui_log('setScratchpad command not yet available', true);

        return [true, `user input received: '${data}'`];
    };

    /**
     * Toggle halo for a given `RadarTargetModel`
     *
     * @for ScopeModel
     * @method toggleHalo
     * @param data
     */
    toggleHalo = (data) => {
        // TODO: Make this do stuff!
        UiController.ui_log('toggleHalo command not yet available', true);

        return [true, `user input received: '${data}'`];
    };

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
    };
}
