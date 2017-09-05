import _has from 'lodash/has';
import _isEmpty from 'lodash/isEmpty';
import INVALID_NUMBER from '../constants/globalConstants';
import EventBus from '../lib/EventBus';
import { EVENT } from '../constants/eventNames';
import { THEME } from '../constants/themes';

/**
 * A single radar target observed by the radar system and shown on the scope
 * Contains references to the full aircraft model, though only some of that
 * information will be made available to the controller through the scope.
 *
 * @class RadarTargetModel
 */
export default class RadarTargetModel {
    constructor(theme, aircraftModel) {
        /**
         *
         *
         * @for RadarTargetModel
         * @property _aircraftModel
         * @type {AircraftModel}
         */
        this._aircraftModel = null;

        /**
         *
         *
         * @for RadarTargetModel
         * @property _cruiseAltitude
         * @type {number}
         */
        this._cruiseAltitude = INVALID_NUMBER;

        /**
         *
         *
         * @for RadarTargetModel
         * @property _dataBlockDirection
         * @type {number}
         */
        this._dataBlockDirection = INVALID_NUMBER;

        /**
         *
         *
         * @for RadarTargetModel
         * @property _dataBlockLength
         * @type {number}
         */
        this._dataBlockLength = theme.DATA_BLOCK.LEADER_LENGTH;

        /**
         * Event Bus reference
         *
         * @for RadarTargetModel
         * @property _eventBus
         * @type {EventBus}
         */
        this._eventBus = EventBus;

        // TODO: This will later be expanded upon such that aircraft may exist in
        // the simulation without necessarily having full data blocks. An example
        // of this would be VFR traffic with a partial or altitude-only data block.
        // For now, assuming all aircraft in existence have an editable data block.
        /**
         *
         *
         * @for RadarTargetModel
         * @property _hasFullDataBlock
         * @type {boolean}
         */
        this._hasFullDataBlock = true;

        /**
         *
         *
         * @for RadarTargetModel
         * @property _hasHalo
         * @type {boolean}
         */
        this._hasHalo = false;

        /**
         *
         *
         * @for RadarTargetModel
         * @property _hasSuppressedDataBlock
         * @type {boolean}
         */
        this._hasSuppressedDataBlock = false;

        /**
         *
         *
         * @for RadarTargetModel
         * @property _interimAltitude
         * @type {number}
         */
        this._interimAltitude = INVALID_NUMBER;

        // TODO: This will be replaced with `this._sectorInControl` or something
        // when handoffs become possible. For now, just marking whether or not "we"
        // are the sector with control of the track.
        /**
         *
         *
         * @for RadarTargetModel
         * @property _isUnderOurControl
         * @type {boolean}
         */
        this._isUnderOurControl = true;

        // TODO: Store the aircraft's initial route here. Yes, we want to intentionally
        // make a copy of the route and store it here, not point to the aircraft's route.
        // When the aircraft is told to fly a new route, this property should still show
        // the old route, until the controller updates it in the scope.
        /**
         *
         *
         * @for RadarTargetModel
         * @property _routeString
         * @type {string}
         */
        this._routeString = '';

        /**
         *
         *
         * @for RadarTargetModel
         * @property _scratchPadText
         * @type {string}
         */
        this._scratchPadText = '';

        /**
         * Active theme
         *
         * @for RadarTargetModel
         * @property _theme
         * @type {object}
         */
        this._theme = theme;

        this._init(aircraftModel);
    }

    /**
     * Complete initialization tasks
     *
     * @for RadarTargetModel
     * @method _init
     * @param theme {object}
     * @param aircraftModel {AircraftModel}
     */
    _init(aircraftModel) {
        this._aircraftModel = aircraftModel;
        this._cruiseAltitude = aircraftModel.fms.flightPlanAltitude;
        this._dataBlockDirection = this._theme.DATA_BLOCK.LEADER_DIRECTION;
        this._dataBlockLength = this._theme.DATA_BLOCK.LEADER_LENGTH;
        // TODO: This getter doesn't give us what we want. Seems like one does
        // not exist actually. We want the full route string, including past legs.
        this._routeString = aircraftModel.fms.currentRoute;

        this._initializeScratchPad(aircraftModel);
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
     * Initialize the value of the scratchpad
     *
     * @for RadarTargetModel
     * @method _initializeScratchPad
     * @param  aircraftModel {AircraftModel}
     */
    _initializeScratchPad(aircraftModel) {
        let scratchPadText = aircraftModel.destination.substr(1);

        if (_isEmpty(scratchPadText)) {
            scratchPadText = 'XXX';
        }

        this._scratchPadText = scratchPadText;
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
     * @for RadarTargetModel
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
