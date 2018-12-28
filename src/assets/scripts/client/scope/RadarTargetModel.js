import _has from 'lodash/has';
import _isEmpty from 'lodash/isEmpty';
import _isNaN from 'lodash/isNaN';
import _padEnd from 'lodash/padEnd';
import EventBus from '../lib/EventBus';
import { round } from '../math/core';
import { vadd } from '../math/vector';
import { leftPad } from '../utilities/generalUtilities';
import { EVENT } from '../constants/eventNames';
import { INVALID_NUMBER } from '../constants/globalConstants';
import { DECIMAL_RADIX } from '../utilities/unitConverters';
import {
    DATA_BLOCK_DIRECTION_LENGTH_SEPARATOR,
    DATA_BLOCK_POSITION_MAP
} from '../constants/scopeCommandConstants';
import { THEME } from '../constants/themes';

// TODO: abstract these to an appropriate constants file
const HEAVY_LETTER = 'H';
const SUPER_LETTER = 'J';

/**
 * A single radar target observed by the radar system and shown on the scope
 * Contains references to the full aircraft model, though only some of that
 * information will be made available to the controller through the scope.
 *
 * @class RadarTargetModel
 */
export default class RadarTargetModel {
    /**
     * @for RadarTargetModel
     * @constructor
     * @param theme {object}
     * @param aircraftModel {AircraftModel}
     */
    constructor(theme, aircraftModel) {
        /**
         * The full aircraft model object that this radar target corresponds to
         *
         * @for RadarTargetModel
         * @property aircraftModel
         * @type {AircraftModel}
         */
        this.aircraftModel = null;

        /**
         * The cruise altitude (hard) assigned in the data block
         *
         * @for RadarTargetModel
         * @property _cruiseAltitude
         * @type {number}
         */
        this._cruiseAltitude = INVALID_NUMBER;

        /**
         * Direction the data block is extended away from the radar target.
         * A value of -1 means to leave at default position.
         *
         * @for RadarTargetModel
         * @property _dataBlockLeaderDirection
         * @type {number}
         */
        this._dataBlockLeaderDirection = INVALID_NUMBER;

        /**
         * Length of the leader line extending away from the radar target and
         * connecting to the data block.
         *
         * @for RadarTargetModel
         * @property _dataBlockLeaderLength
         * @type {number}
         */
        this._dataBlockLeaderLength = theme.DATA_BLOCK.LEADER_LENGTH;

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
         * Boolean value representing whether the aircraft has a full data block.
         * This is opposed to a partial (PDB), limited (LDB), or other non-full state.
         *
         * @for RadarTargetModel
         * @property _hasFullDataBlock
         * @type {boolean}
         */
        this._hasFullDataBlock = true;

        /**
         * Boolean value representing whether the radar target should have a
         * 'halo' (circle with a given radius) drawn around it.
         *
         * @for RadarTargetModel
         * @property _hasHalo
         * @type {boolean}
         */
        this._hasHalo = false;

        /**
         * Boolean value representing whether the full data block is being suppressed
         * on this particular scope.
         *
         * @for RadarTargetModel
         * @property _hasSuppressedDataBlock
         * @type {boolean}
         */
        this._hasSuppressedDataBlock = false;

        /**
         * The altitude (soft) assigned in the data block
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
         * Boolean value representing whether the track of this target is under
         * control of this particular scope.
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
         * The flight plan route for the aircraft associated with this radar target
         *
         * @for RadarTargetModel
         * @property _routeString
         * @type {string}
         */
        this._routeString = '';

        /**
         * A 3 character (or less) alphanumeric string that is shown in the data block
         * The scratchpad is used for controller shorthand notes and other purposes
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

        this._init(aircraftModel)
            ._initializeScratchPad()
            .enable();
    }

    /**
     * Angle away from the radar target to draw the leader line and data block
     *
     * @for RadarTargetModel
     * @property dataBlockLeaderDirection
     * @type {number}
     */
    get dataBlockLeaderDirection() {
        return this._dataBlockLeaderDirection;
    }

    /**
     * Length of leader line connecting radar target and data block
     *
     * @for RadarTargetModel
     * @property dataBlockLeaderLength
     * @type {number}
     */
    get dataBlockLeaderLength() {
        return this._dataBlockLeaderLength;
    }

    /**
     * Get the `PositionModel` for the aircraft associated with the radar target
     *
     * @for RadarTargetModel
     * @property positionModel
     * @type {PositionModel}
     */
    get positionModel() {
        return this.aircraftModel.positionModel;
    }

    /**
     * Get the latest known altitude for the aircraft associated with the radar target
     *
     * @for RadarTargetModel
     * @property positionModel
     * @type {PositionModel}
     */
    get indicatedAltitude() {
        return this.aircraftModel.altitude;
    }


    get scratchPadText() {
        return this._scratchPadText;
    }

    set scratchPadText(text) {
        this._scratchPadText = text.slice(0, 3).toUpperCase();
    }

    /**
     * Complete initialization tasks
     *
     * @for RadarTargetModel
     * @method _init
     * @param theme {object}
     * @param aircraftModel {AircraftModel}
     * @private
     * @chainable
     */
    _init(aircraftModel) {
        this.aircraftModel = aircraftModel;
        this._cruiseAltitude = aircraftModel.fms.flightPlanAltitude;
        this._dataBlockLeaderDirection = this._theme.DATA_BLOCK.LEADER_DIRECTION;
        this._dataBlockLeaderLength = this._theme.DATA_BLOCK.LEADER_LENGTH;
        this._routeString = aircraftModel.fms.getRouteString();

        return this;
    }

    /**
     * Initialize the value of the scratchpad
     *
     * @for RadarTargetModel
     * @method _initializeScratchPad
     * @private
     * @chainable
     */
    _initializeScratchPad() {
        if (this.aircraftModel.isDeparture()) {
            this.scratchPadText = this.aircraftModel.fms.getFlightPlanEntry();

            return this;
        }

        this.scratchPadText = this.aircraftModel.destination.substr(1, 3);

        return this;
    }

    /**
    * Disable handlers
    *
    * @for RadarTargetModel
    * @method enable
    */
    enable() {
        this._eventBus.on(EVENT.SET_THEME, this._setTheme);
    }

    /**
    * Enable handlers
    *
    * @for RadarTargetModel
    * @method disable
    */
    disable() {
        this._eventBus.off(EVENT.SET_THEME, this._setTheme);
    }

    /**
    * Reset all properties to their default state
    *
    * @for RadarTargetModel
    * @method reset
    */
    reset() {
        this.aircraftModel = null;
        this._cruiseAltitude = INVALID_NUMBER;
        this._dataBlockLeaderDirection = INVALID_NUMBER;
        this._dataBlockLeaderLength = this._theme.DATA_BLOCK.LEADER_LENGTH;
        this._hasFullDataBlock = true;
        this._hasHalo = false;
        this._hasSuppressedDataBlock = false;
        this._interimAltitude = INVALID_NUMBER;
        this._isUnderOurControl = true;
        this._routeString = '';
    }

    /**
     * Assign a new "hard" altitude
     *
     * @for RadarTargetModel
     * @param altitude {number}
     * @return {array} [success of operation, system's response]
     */
    amendAltitude(altitude) {
        this._cruiseAltitude = altitude;

        return [true, 'AMEND ALTITUDE'];
    }

    /**
     * Generate a string to be used for the first row of a datablock
     *
     * @for RadarTargetModel
     * @method buildDataBlockRowOne
     * @returns {string}
     */
    buildDataBlockRowOne() {
        let dataBlockRowOne = this.aircraftModel.callsign;

        // NOTE: using empty space before the letter on purpose so this gets rendered
        // appropriately within a canvas
        switch (this.aircraftModel.model.weightClass) {
            case SUPER_LETTER:
                dataBlockRowOne += ` ${SUPER_LETTER}`;

                break;
            case HEAVY_LETTER:
                dataBlockRowOne += ` ${HEAVY_LETTER}`;

                break;
            default:

                break;
        }

        return dataBlockRowOne;
    }

    /**
     * Generate a string to be used for the second row of a datablock
     *
     * @for RadarTargetModel
     * @method buildDataBlockRowTwoPrimaryInfo
     * @returns {string}
     */
    buildDataBlockRowTwoPrimaryInfo() {
        const aircraftAltitude = round(this.aircraftModel.altitude / 100);
        const aircraftSpeed = round(this.aircraftModel.groundSpeed / 10);

        return `${leftPad(aircraftAltitude, 3)} ${leftPad(aircraftSpeed, 2)}`;
    }

    /**
     * Generate a string to be used for the second row of a datablock
     * when the timeshare section is active
     *
     * @for RadarTargetModel
     * @method buildDataBlockRowTwoSecondaryInfo
     * @returns {string}
     */
    buildDataBlockRowTwoSecondaryInfo() {
        const paddedScratchPadText = _padEnd(
            this.scratchPadText,
            this._theme.DATA_BLOCK.SCRATCHPAD_CHARACTER_LIMIT,
            ' '
        );
        const paddedAircraftModelIcao = _padEnd(
            this.aircraftModel.model.icao.toUpperCase(),
            this._theme.DATA_BLOCK.AIRCRAFT_MODEL_ICAO_CHARACTER_LIMIT,
            ' '
        );
        const scratchPadText = paddedScratchPadText.slice(0, this._theme.DATA_BLOCK.SCRATCHPAD_CHARACTER_LIMIT);
        const aircraftModelIcao = paddedAircraftModelIcao.slice(0, this._theme.DATA_BLOCK.AIRCRAFT_MODEL_ICAO_CHARACTER_LIMIT);

        return `${scratchPadText} ${aircraftModelIcao}`;
    }

    /**
     * Abstracts the math from the `CanvasController` used to determine
     * where the center of a datablock should be located
     *
     * @param {number} leaderIntersectionWithBlock
     */
    calculateDataBlockCenter(leaderIntersectionWithBlock) {
        const blockCenterOffset = {
            ctr: [0, 0],
            360: [0, -this._theme.DATA_BLOCK.HALF_HEIGHT],
            45: [this._theme.DATA_BLOCK.HALF_WIDTH, -this._theme.DATA_BLOCK.HALF_HEIGHT],
            90: [this._theme.DATA_BLOCK.HALF_WIDTH, 0],
            135: [this._theme.DATA_BLOCK.HALF_WIDTH, this._theme.DATA_BLOCK.HALF_HEIGHT],
            180: [0, this._theme.DATA_BLOCK.HALF_HEIGHT],
            225: [-this._theme.DATA_BLOCK.HALF_WIDTH, this._theme.DATA_BLOCK.HALF_HEIGHT],
            270: [-this._theme.DATA_BLOCK.HALF_WIDTH, 0],
            315: [-this._theme.DATA_BLOCK.HALF_WIDTH, -this._theme.DATA_BLOCK.HALF_HEIGHT]
        };
        const leaderEndToBlockCenter = blockCenterOffset[this.dataBlockLeaderDirection];

        return vadd(leaderIntersectionWithBlock, leaderEndToBlockCenter);
    }

    /**
    * Mark this radar target as NOT being controlled by "our" ScopeModel
    * Note that this will eventually be reworked so we can specify which
    * scope has control, not just whether or not "we" do.
    *
    * @for RadarTargetModel
    * @method markAsNotOurControl
    */
    markAsNotOurControl() {
        this._isUnderOurControl = false;
    }

    /**
     * Mark this radar target as being controlled by "our" ScopeModel
     * Note that this will eventually be reworked so we can specify which
     * scope has control, not just whether or not "we" do.
     *
     * @for RadarTargetModel
     * @method markAsOurControl
     */
    markAsOurControl() {
        this._isUnderOurControl = true;
    }

    /**
     * Change the direction and/or length of the data block leader line
     *
     * @for RadarTargetModel
     * @method moveDataBlock
     * @param commandArguments {string}
     * @return {array} [success of operation, system's response]
     */
    moveDataBlock(commandArguments) {
        if (_isEmpty(commandArguments)) {
            return [false, 'ERR: BAD SYNTAX'];
        }

        let desiredDirection = commandArguments;
        let desiredLength = '';

        if (commandArguments.indexOf(DATA_BLOCK_DIRECTION_LENGTH_SEPARATOR) !== INVALID_NUMBER) {
            const argumentPieces = commandArguments.split(DATA_BLOCK_DIRECTION_LENGTH_SEPARATOR);
            desiredDirection = parseInt(argumentPieces[0], DECIMAL_RADIX);
            desiredLength = parseInt(argumentPieces[1], DECIMAL_RADIX);

            if (_isEmpty(argumentPieces[0])) {
                desiredDirection = '';
            }
        }

        if (desiredLength > 6 || desiredLength < 0) {
            return [false, 'ERR: LEADER LENGTH 0-6 ONLY'];
        }

        if (desiredDirection !== '' && !_isNaN(desiredDirection)) {
            if (!_has(DATA_BLOCK_POSITION_MAP, desiredDirection)) {
                return [false, 'ERR: BAD SYNTAX'];
            }

            this._dataBlockLeaderDirection = DATA_BLOCK_POSITION_MAP[desiredDirection];
        }

        if (desiredLength !== '' && !_isNaN(desiredLength)) {
            this._dataBlockLeaderLength = desiredLength;
        }

        return [true, 'ADJUST DATA BLOCK'];
    }

    /**
     * Set the value of the scratchpad
     *
     * @for RadarTargetModel
     * @method setScratchpad
     * @param scratchPadText {string}
     * @return {array} [success of operation, system's response]
     */
    setScratchpad(scratchPadText) {
        this.scratchPadText = scratchPadText;

        return [true, 'SET SCRATCHPAD'];
    }

    /**
     * Toggle halo (circle) on and off
     *
     * @for RadarTargetModel
     * @method toggleHalo
     * @return {array} [success of operation, system's response]
     */
    toggleHalo() {
        this._hasHalo = !this._hasHalo;

        return [true, 'TOGGLE HALO'];
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
