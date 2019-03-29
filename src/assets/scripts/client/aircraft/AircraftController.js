/* eslint-disable no-continue */
import _find from 'lodash/find';
import _filter from 'lodash/filter';
import _get from 'lodash/get';
import _includes from 'lodash/includes';
import _isObject from 'lodash/isObject';
import _padStart from 'lodash/padStart';
import _shuffle from 'lodash/shuffle';
import _without from 'lodash/without';
import AirportController from '../airport/AirportController';
import UiController from '../ui/UiController';
import EventBus from '../lib/EventBus';
import AircraftTypeDefinitionCollection from './AircraftTypeDefinitionCollection';
import AircraftModel from './AircraftModel';
import AircraftConflict from './AircraftConflict';
import StripViewController from './StripView/StripViewController';
import GameController, { GAME_EVENTS } from '../game/GameController';
import { airlineNameAndFleetHelper } from '../airline/airlineHelpers';
import { convertStaticPositionToDynamic } from '../base/staticPositionToDynamicPositionHelper';
import { abs } from '../math/core';
import { distance2d } from '../math/distance';
import { speech_say } from '../speech';
import { km } from '../utilities/unitConverters';
import { isEmptyOrNotArray } from '../utilities/validatorUtilities';
import { FLIGHT_CATEGORY } from '../constants/aircraftConstants';
import { EVENT, AIRCRAFT_EVENT } from '../constants/eventNames';
import { REGEX } from '../constants/globalConstants';

// Temporary const declaration here to attach to the window AND use as internal property
const aircraft = {};

/**
 *
 *
 * @class AircraftController
 */
export default class AircraftController {
    /**
     * @constructor
     * @for AircraftController
     * @param aircraftTypeDefinitionList {array<object>}
     * @param airlineController {AirlineController}
     * @param scopeModel {ScopeModel}
     */
    constructor(aircraftTypeDefinitionList, airlineController, scopeModel) {
        if (isEmptyOrNotArray(aircraftTypeDefinitionList)) {
            // eslint-disable-next-line max-len
            throw new TypeError('Invalid aircraftTypeDefinitionList passed to AircraftTypeDefinitionCollection. '
                + `Expected and array but received ${typeof aircraftTypeDefinitionList}`);
        }

        // TODO: this may need to use instanceof instead, but that may be overly defensive
        if (!_isObject(airlineController)) {
            throw new TypeError('Invalid parameters. Expected airlineCollection to be defined');
        }

        /**
         * Reference to an `AirlineController` instance
         *
         * @property _airlineController
         * @type {AirlineController}
         * @default airlineController
         * @private
         */
        this._airlineController = airlineController;

        /**
         * Array of CIDs not currently in use, and able to be assigned
         *
         * @for AircraftController
         * @property _availableCidNumbers
         * @type {array<string>} - padded three-digit number strings, eg '000', '005', '999'
         * @private
         */
        this._availableCidNumbers = [];

        /**
         * List of discrete transponder codes not currently in use, and able to be assigned
         *
         * Note: Only digits 0-7 may be used.
         * Note: "Discrete" codes must not end in "00".
         *
         * @for AircraftController
         * @property _availableTransponderCodes
         * @type {array<string>} - padded four-digit OTCAL-NUMBER strings, eg '0000', '0005', '7777'
         * @private
         */
        this._availableTransponderCodes = [];

        /**
         * Local reference to static `EventBus` class
         *
         * @property _eventBus
         * @type {EventBus}
         * @default EventBus
         * @private
         */
        this._eventBus = EventBus;

        /**
         * Reference to an `AircraftTypeDefinitionCollection` instance
         *
         * Provides definitions for all available aircraft types
         *
         * @property AircraftTypeDefinitionCollection
         * @type {AircraftTypeDefinitionCollection}
         */
        this.aircraftTypeDefinitionCollection = new AircraftTypeDefinitionCollection(aircraftTypeDefinitionList);

        /**
         * Local reference to the scope model
         *
         * @for AircraftController
         * @property _scopeModel
         * @type {ScopeModel}
         * @private
         */
        this._scopeModel = scopeModel;

        prop.aircraft = aircraft;
        this.aircraft = aircraft;

        // TODO: this should its own collection class
        this.aircraft.list = [];
        this.conflicts = [];

        /**
         * Instance of the `StripViewController`
         *
         * @property _stripViewController
         * @type {StripViewController}
         * @private
         */
        this._stripViewController = new StripViewController();

        return this.init()
            ._setupHandlers()
            .enable();
    }

    /**
     * @for AircraftController
     * @method init
     * @chainable
     */
    init() {
        this._initCids();
        this._initTransponderCodes();

        return this;
    }

    /**
     * Initialize possible CID values
     *
     * @for AircraftController
     * @method _initCids
     * @private
     */
    _initCids() {
        const cidList = Array.from(new Array(1000), (val, index) => _padStart(index, 3, '0'));

        this._availableCidNumbers = _shuffle(cidList);
    }

    /**
     * Initialize possible transponder code values
     *
     * @for AircraftController
     * @method _initTransponderCodes
     * @private
     */
    _initTransponderCodes() {
        let codeList = Array.from(new Array(10000), (val, index) => _padStart(index, 4, '0'));
        codeList = _filter(codeList, (code) => this.isValidDiscreteTransponderCode(code));

        this._availableTransponderCodes = _shuffle(codeList);
    }

    /**
     * Set up event handlers
     *
     * @for AircraftController
     * @method _setupHandlers
     * @private
     * @chainable
     */
    _setupHandlers() {
        this._onRemoveAircraftHandler = this.aircraft_remove.bind(this);

        return this;
    }

    /**
     * @for AircraftController
     * @method enable
     * @chainable
     */
    enable() {
        this._eventBus.on(EVENT.ADD_AIRCRAFT, this.addItem);
        this._eventBus.on(EVENT.STRIP_DOUBLE_CLICK, this._onStripDoubleClickHandler);
        this._eventBus.on(EVENT.SELECT_STRIP_VIEW_FROM_DATA_BLOCK, this.onSelectAircraftStrip);
        this._eventBus.on(EVENT.DESELECT_ACTIVE_STRIP_VIEW, this._onDeselectActiveStripView);
        this._eventBus.on(EVENT.REMOVE_AIRCRAFT, this._onRemoveAircraftHandler);
        this._eventBus.on(EVENT.REMOVE_AIRCRAFT_CONFLICT, this.removeConflict);

        return this;
    }

    /**
     * @for AircraftController
     * @method disable
     * @chainable
     */
    disable() {
        this._eventBus.off(EVENT.ADD_AIRCRAFT, this.addItem);
        this._eventBus.off(EVENT.STRIP_DOUBLE_CLICK, this._onStripDoubleClickHandler);
        this._eventBus.off(EVENT.SELECT_STRIP_VIEW_FROM_DATA_BLOCK, this._onSelectAircraftStrip);
        this._eventBus.off(EVENT.DESELECT_ACTIVE_STRIP_VIEW, this._onDeselectActiveStripView);
        this._eventBus.off(EVENT.REMOVE_AIRCRAFT, this._onRemoveAircraftHandler);
        this._eventBus.off(EVENT.REMOVE_AIRCRAFT_CONFLICT, this.removeConflict);

        return this;
    }

    /**
     * Adds an `AircraftModel` to the collection
     *
     * @for AircraftController
     * @method addItem
     * @param item {AircraftModel}
     */
    addItem = (item) => this.aircraft.list.push(item);

    /**
     * Callback method fired by an interval defined in the `SpawnScheduler`.
     *
     * This is the entry method for creating new departing and arriving aircraft.
     * This method should only be called as a callback from a `SpawnScheduler` timer.
     *
     * @for AircraftController
     * @method createAircraftWithSpawnPatternModel
     * @param spawnPatternModel {SpawnPatternModel}
     * @private
     */
    createAircraftWithSpawnPatternModel = (spawnPatternModel) => {
        const initializationProps = this._buildAircraftProps(spawnPatternModel);

        this._createAircraftWithInitializationProps(initializationProps);
    }

    /**
     * Build aircraft props for `spawnPatternModel` and add
     * preSpawn data to `baseAircraftProps`.
     *
     * Used when creating aircraft already along an arrival route on load
     * or on airport change.
     *
     * This method should be called directly and not via a timer callback
     *
     * This hooks into the same method used to build spawning aircraft
     * and simply adds another layer on top of that to build a preSpawn aircraft.
     *
     * @for AircraftController
     * @method createPreSpawnAircraftWithSpawnPatternModel
     * @param  spawnPatternModel {SpawnPatternModel}
     * @private
     */
    createPreSpawnAircraftWithSpawnPatternModel = (spawnPatternModel) => {
        const isPreSpawn = true;

        for (let i = 0; i < spawnPatternModel.preSpawnAircraftList.length; i++) {
            const preSpawnHeadingAndPosition = spawnPatternModel.preSpawnAircraftList[i];
            const baseAircraftProps = this._buildAircraftProps(spawnPatternModel, isPreSpawn);
            const initializationProps = Object.assign({}, baseAircraftProps, preSpawnHeadingAndPosition);

            this._createAircraftWithInitializationProps(initializationProps);
        }
    };

    /**
     * @for AircraftController
     * @method aircraft_get_nearest
     * @param position {StaticPositionModel}
     */
    aircraft_get_nearest(position) {
        let nearest = null;
        let distance = Infinity;

        for (let i = 0; i < this.aircraft.list.length; i++) {
            const aircraft = this.aircraft.list[i];
            const d = distance2d(aircraft.relativePosition, position);

            if (d < distance && aircraft.isVisible() && !aircraft.hit) {
                distance = d;
                nearest = i;
            }
        }

        return [this.aircraft.list[nearest], distance];
    }

    /**
     * Returns whether the specified aircraft model is in an area where they are controllable
     *
     * @for AircraftController
     * @method isAircraftVisible
     * @param aircraft {AircraftModel}
     * @param factor {number}
     * @returns {boolean}
     */
    isAircraftVisible(aircraft, factor = 1) {
        const visibleDistance = AirportController.airport_get().ctr_radius * factor;

        return aircraft.distance < visibleDistance;
    }

    /**
     * @for AircraftController
     * @method aircraft_remove_all
     */
    aircraft_remove_all() {
        // iterating backwards because each iteration removes a list item
        // iterating forward would cause skipping as the array shifts
        for (let i = this.aircraft.list.length - 1; i >= 0; i--) {
            this.aircraft_remove(this.aircraft.list[i]);
        }
    }

    /**
     * @for AircraftController
     * @method aircraft_remove
     * @param aircraftModel {AircraftModel}
     */
    aircraft_remove(aircraftModel) {
        AirportController.removeAircraftFromAllRunwayQueues(aircraftModel);
        this.removeFlightNumberFromList(aircraftModel);
        this.removeAircraftModelFromList(aircraftModel);
        this.releaseTransponderCode(aircraftModel.transponderCode);
        this._releaseCid(aircraftModel.cid);
        this.removeAllAircraftConflictsForAircraft(aircraftModel);

        if (aircraftModel.isControllable) {
            this.removeStripView(aircraftModel);
        }

        this._scopeModel.radarTargetCollection.removeRadarTargetModelForAircraftModel(aircraftModel);
    }

    /**
     * This method is part of the game loop.
     *
     * Every effort should be made to optimize this method and
     * any other methods called from within
     *
     * @for AircraftController
     * @method update
     */
    update() {
        if (this.aircraft.list.length === 0) {
            return;
        }

        // TODO: this is getting better, but still needs more simplification
        for (let i = 0; i < this.aircraft.list.length; i++) {
            const aircraftModel = this.aircraft.list[i];

            aircraftModel.update();
            aircraftModel.updateWarning();

            // TODO: conflict checking eats up a lot of resources when there are more than
            //       30 aircraft, exit early if we're still taxiing
            if (aircraftModel.isTaxiing()) {
                continue;
            }

            this._updateAircraftConflicts(aircraftModel, i);
            this._updateAircraftVisibility(aircraftModel);

            // `#isFlightStripRemovable` will be true even when there is no corresponding
            // `StripView` for and `aircraftModel`
            if (aircraftModel.isFlightStripRemovable && this._stripViewController.hasStripViewModel(aircraftModel)) {
                this._stripViewController.removeStripView(aircraftModel);
            }
        }
    }

    /**
     * Finds an aircraft by its callsign
     *
     * @method findAircraftByCallsign
     * @param  {string} callsign
     * @return {AircraftModel}
     */
    findAircraftByCallsign(callsign) {
        if (!callsign) {
            return;
        }

        const normalizedCallsign = callsign.toUpperCase();

        return _find(this.aircraft.list, (aircraft) => aircraft.callsign === normalizedCallsign);
    }

    /**
     * Finds an aircraft by its internal id
     *
     * @method findAircraftById
     * @param  {string} id
     * @return {AircraftModel}
     */
    findAircraftById(id) {
        if (!id) {
            return;
        }

        return _find(this.aircraft.list, (aircraft) => aircraft.id === id);
    }

    /**
     * Finds an aircraft by its cid (NOT internal id)
     *
     * @method findAircraftByCid
     * @param {string} cid
     * @return {AircraftModel}
     */
    findAircraftByCid(cid) {
        if (!cid) {
            return;
        }

        return _find(this.aircraft.list, (aircraft) => aircraft.cid === cid);
    }

    /**
     * Finds an aircraft by its transponder (squawk) code
     *
     * @method findAircraftByTransponderCode
     * @param {Number} transponderCode
     * @return {AircraftModel}
     */
    findAircraftByTransponderCode(transponderCode) {
        if (!transponderCode) {
            return;
        }

        return _find(this.aircraft.list, (aircraft) => aircraft.transponderCode === transponderCode);
    }

    /**
     * Update all the `StripViewModel` objects with up-to-date aircraft data
     *
     * This is a **HOT** method and will run within the game loop
     *
     * @for AircraftController
     * @method updateAircraftStrips
     */
    updateAircraftStrips() {
        this._stripViewController.update(this.aircraft.list);
    }

    /**
     * Public facade for `._onSelectAircraftStrip`
     *
     * @for AircraftController
     * @method onSelectAircraftStrip
     * @param aircaftModel {AircraftModel}
     */
    onSelectAircraftStrip = (aircraftModel) => {
        this._onSelectAircraftStrip(aircraftModel);
    }

    /**
     * @method debug
     * @param  {string} [callsign='']
     * @return {AircraftModel}
     */
    debug(callsign = '') {
        return this.findAircraftByCallsign(callsign);
    }

    /**
     * Add a new `AircraftConflict` instance to the list of existing conflicts
     *
     * @for AircraftController
     * @method addConflict
     * @param aircraft {AircraftModel}       aircraft 1
     * @param otherAircraft {AircraftModel}  aircraft 2
     */
    addConflict(aircraft, otherAircraft) {
        const conflict = new AircraftConflict(aircraft, otherAircraft);

        if (conflict.shouldBeRemoved()) {
            conflict.destroy();
            return;
        }

        this.conflicts.push(conflict);
        aircraft.addConflict(conflict, otherAircraft);
        otherAircraft.addConflict(conflict, aircraft);
    }

    /**
     * Pass the call onto the `airlineController` to remove flightNumber
     * from the list of active flightNumbers
     *
     * @for AircraftController
     * @method removeFlightNumberFromList
     * @param airlineId {string}
     * @param callsign {string}
     */
    removeFlightNumberFromList({ airlineId, callsign }) {
        this._airlineController.removeFlightNumberFromList(airlineId, callsign);
    }

    /**
     * Remove the specified aircraft from `AircraftController.aircraft.list`
     *
     * @for AircraftController
     * @method removeAircraftModelFromList
     * @param  {AircraftModel} aircraft the aircraft to remove
     */
    removeAircraftModelFromList(aircraft) {
        this.aircraft.list = _without(this.aircraft.list, aircraft);
    }

    /**
     * Remove an `AircraftConflict` instance from the list of existing conflicts
     *
     * May be called via an `EventBus.trigger()`
     *
     * @for AircraftController
     * @method removeConflict
     * @param  conflict {AircraftConflict} the conflict instance to remove
     */
    removeConflict = (conflict) => {
        conflict.aircraft[0].removeConflict(conflict.aircraft[1]);
        conflict.aircraft[1].removeConflict(conflict.aircraft[0]);

        this.conflicts = _without(this.conflicts, conflict);
    };

    /**
     * Remove any conflicts that involve the specified aircraft
     *
     * @for AircraftController
     * @method removeAllAircraftConflictsForAircraft
     * @param aircraft {AircraftModel}  the aircraft to remove
     */
    removeAllAircraftConflictsForAircraft(aircraft) {
        for (const otherAircraftCallsign in aircraft.conflicts) {
            aircraft.conflicts[otherAircraftCallsign].destroy();
        }
    }

    /**
     * Remove a `StripViewModel` associated with the `aircraftModel`
     *
     * This will remove it from the DOM and properly destroy the model.
     *
     * @for AircraftController
     * @method removeStripView
     * @param aircraftModel {AircraftModel}
     */
    removeStripView(aircraftModel) {
        this._stripViewController.removeStripView(aircraftModel);
    }

    /**
     * Accept a pre-built object that can be used to create an `AircraftModel`
     * and then add it to the collection.
     *
     * This could be a spawning aircraft or one that already exists along a route.
     *
     * This method is the *_single place_* to create a new `AircraftModel`.
     * Any method that needs to create a new aircraft should be routed through here.
     *
     * @for AircraftController
     * @method _createAircraftWithInitializationProps
     * @param initializationProps {object}
     * @private
     */
    _createAircraftWithInitializationProps(initializationProps) {
        const aircraftModel = new AircraftModel(initializationProps);

        // triggering event bus rather than calling locally because multiple classes
        // are listening for the event and aircraft model
        this._eventBus.trigger(EVENT.ADD_AIRCRAFT, aircraftModel);
    }

    /**
     * Used to build up the appropriate data needed to instantiate an `AircraftModel`
     *
     * @for AircraftController
     * @method _buildAircraftProps
     * @param spawnPatternModel {SpawnPatternModel}
     * @param isPreSpawn {boolean} [default = false]
     * @return {object}
     * @private
     */
    _buildAircraftProps(spawnPatternModel, isPreSpawn = false) {
        const airlineId = spawnPatternModel.getRandomAirlineForSpawn();
        // TODO: update `airlineNameAndFleetHelper` to accept a string
        const { name, fleet } = airlineNameAndFleetHelper([airlineId]);
        const airlineModel = this._airlineController.findAirlineById(name);
        // TODO: impove the `airlineModel` logic here
        // this seems inefficient to find the model here and then pass it back to the controller but
        // since we already have it, it makes little sense to look for it again in the controller
        const flightNumber = this._airlineController.generateFlightNumberWithAirlineModel(airlineModel);
        const aircraftTypeDefinition = this._getRandomAircraftTypeDefinitionForAirlineId(airlineId, airlineModel);
        // TODO: this may need to be reworked.
        // if we are building a preSpawn aircraft, cap the altitude at 18000 so aircraft that spawn closer to
        // airspace can safely enter controlled airspace properly
        let { altitude } = spawnPatternModel;

        if (isPreSpawn && spawnPatternModel.category === FLIGHT_CATEGORY.ARRIVAL) {
            altitude = Math.min(18000, altitude);
        }

        const dynamicPositionModel = convertStaticPositionToDynamic(spawnPatternModel.positionModel);

        return {
            fleet,
            altitude,
            transponderCode: this.getAvailableTransponderCode(),
            origin: spawnPatternModel.origin,
            destination: spawnPatternModel.destination,
            callsign: flightNumber,
            cid: this._getAvailableCid(),
            category: spawnPatternModel.category,
            airline: airlineModel.icao,
            airlineCallsign: airlineModel.radioName,
            speed: spawnPatternModel.speed,
            heading: spawnPatternModel.heading,
            positionModel: dynamicPositionModel,
            icao: aircraftTypeDefinition.icao,
            model: aircraftTypeDefinition,
            routeString: spawnPatternModel.routeString,
            // TODO: this may not be needed anymore
            waypoints: _get(spawnPatternModel, 'waypoints', [])
        };
    }

    /**
     * Given an `airlineId`, find a random aircraft type from the airline.
     *
     * This is useful for when we need to create an aircraft to spawn and
     * only know the airline that it belongs to.
     *
     * @for AircraftController
     * @method _getRandomAircraftTypeDefinitionForAirlineId
     * @param airlineId {string}
     * @param airlineModel {AirlineModel}
     * @return aircraftDefinition {AircraftTypeDefinitionModel}
     * @private
     */
    _getRandomAircraftTypeDefinitionForAirlineId(airlineId, airlineModel) {
        return this.aircraftTypeDefinitionCollection.getAircraftDefinitionForAirlineId(airlineId, airlineModel);
    }

    /**
     * Return a transponder code, and remove it from the list of available codes
     *
     * @for AircraftController
     * @method getAvailableTransponderCode
     * @returns {string}
     * @private
     */
    getAvailableTransponderCode() {
        const code = this._availableTransponderCodes.shift();

        if (typeof code === 'undefined') {
            throw new TypeError('Attempted to retrieve a new squawk code, but all codes are currently in use!');
        }

        return code;
    }

    /**
     * Return the given transponder code to the list of available codes
     *
     * @for AircraftController
     * @method releaseTransponderCode
     * @param transponderCode {string}
     * @private
     */
    releaseTransponderCode(transponderCode) {
        if (typeof transponderCode !== 'string') {
            throw new TypeError(`Expected transponder code to be a string, but received type "${typeof transponderCode}"`);
        }

        if (transponderCode.length !== 4) {
            throw new TypeError(`Expected transponder code to be four characters, but received "${transponderCode}"`);
        }

        if (_includes(this._availableTransponderCodes, transponderCode)) {
            throw new TypeError(`Attempted to return transponder code "${transponderCode}" `
                + 'to #_availableTransponderCodes, but it was already there!');
        }

        this._availableTransponderCodes.push(transponderCode);
    }

    /**
     * Returns whether the specified value is a valid (and discrete) transponder code
     *
     * Note: Code must be octal (digits 0-7 only)
     * Note: Code must be discrete (not ending in double zeros)
     * Note: Code must not be a reserved code
     *
     * @for AircraftController
     * @method isValidDiscreteTransponderCode
     * @param transponderCode {number}
     * @return {boolean}
     */
    isValidDiscreteTransponderCode(transponderCode) {
        const RESERVED_SQUAWK_CODES = [
            '1200', // VFR
            '1202', // gliders
            '4000', // fast-maneuvering military aircraft
            '7500', // hijack
            '7600', // communication failure
            '7700', // emergency
            '7777' // military
        ];
        const isOctal = REGEX.TRANSPONDER_CODE.test(transponderCode);
        const isDiscrete = transponderCode[2] !== '0' || transponderCode[3] !== '0';
        const isNotReserved = !_includes(RESERVED_SQUAWK_CODES, transponderCode);

        return isOctal && isDiscrete && isNotReserved;
    }

    /**
     * Show a `StripViewModel` as selected
     *
     * @for AircraftController
     * @method _onSelectAircraftStrip
     * @param  aircraftModel {AircraftModel}
     * @private
     */
    _onSelectAircraftStrip = (aircraftModel) => {
        if (!aircraftModel.isControllable) {
            return;
        }

        this._stripViewController.selectStripView(aircraftModel);
    };

    /**
     * Remove the css classname used to show a `StripViewModel` as selected.
     *
     * This method is usually called when it is not known what, or if,
     * a `StripViewModel` is active.
     *
     * This method is called as the result of an event
     *
     * @for AircraftController
     * @method _onDeselectActiveStripView
     * @private
     */
    _onDeselectActiveStripView = () => {
        this._stripViewController.findAndDeselectActiveStripView();
    };

    /**
     * Triggered `EventBus` callback
     *
     * This method allows us to find an `AircraftModel` from a callsign,
     * then trigger another event for the `CanvasController`.
     *
     * @for AircraftController
     * @method _onStripDoubleClickHandler
     * @param callsign {string}
     * @private
     */
    _onStripDoubleClickHandler = (callsign) => {
        const { relativePosition } = this.findAircraftByCallsign(callsign);
        const [x, y] = relativePosition;

        this._eventBus.trigger(EVENT.REQUEST_TO_CENTER_POINT_IN_VIEW, { x, y });
    };

    /**
     * Encapsulates math and logic used to detrmine if a new `AircraftConflict` should
     * be created for two specific aircraft
     *
     * Fast 2D bounding box check, there are no conflicts over 8nm apart (14.816km)
     * no violation can occur in this case
     * Variation of:
     * http://gamedev.stackexchange.com/questions/586/what-is-the-fastest-way-to-work-out-2d-bounding-box-intersection
     *
     * @for AircraftController
     * @method _shouldAddNewConflict
     * @param {AircraftModel} aircraftModel
     * @param {AircraftModel} comparisonAircraftModel
     * @return {boolean}
     * @private
     */
    _shouldAddNewConflict(aircraftModel, comparisonAircraftModel) {
        const boundingBoxLength = km(8);
        const dx = abs(aircraftModel.relativePosition[0] - comparisonAircraftModel.relativePosition[0]);
        const dy = abs(aircraftModel.relativePosition[1] - comparisonAircraftModel.relativePosition[1]);

        return dx < boundingBoxLength && dy < boundingBoxLength;
    }

    /**
     * Given an `aircraftModel` check against each other aircraft for conflicts
     * after physics (current position) have been updated
     *
     * @for AircraftController
     * @param {AircraftModel} aircraftModel
     * @param {number} currentUpdateIndex
     * @private
     */
    _updateAircraftConflicts(aircraftModel, currentUpdateIndex) {
        for (let j = currentUpdateIndex + 1; j < this.aircraft.list.length; j++) {
            const otherAircraftModel = this.aircraft.list[j];

            // TODO: though looking better, this logic still needs some work
            if (otherAircraftModel.isTaxiing()) {
                continue;
            }

            if (aircraftModel.hasConflictWithAircraftModel(otherAircraftModel)) {
                aircraftModel.conflicts[otherAircraftModel.callsign].update();

                continue;
            }

            if (this._shouldAddNewConflict(aircraftModel, otherAircraftModel)) {
                this.addConflict(aircraftModel, otherAircraftModel);
            }
        }
    }

    /**
     * Determine if an `aircraftModel` has exited controlled airspace then notify
     * user and score event
     *
     * TODO: This method needs to include some logic currently happeing in `AircraftModel`
     *       used to remove a departing aricraft
     *
     * @for AircraftController
     * @param {AircraftModel} aircraftModel
     * @private
     */
    _updateAircraftVisibility(aircraftModel) {
        // TODO: these next 3 logic blocks could use some cleaning/abstraction
        if (aircraftModel.isArrival() && aircraftModel.isStopped()) {
            EventBus.trigger(AIRCRAFT_EVENT.FULLSTOP, aircraftModel, aircraftModel.fms.arrivalRunwayModel);

            UiController.ui_log(`${aircraftModel.callsign} switching to ground, good day`);
            speech_say(
                [
                    { type: 'callsign', content: aircraftModel },
                    { type: 'text', content: ', switching to ground, good day' }
                ],
                aircraftModel.pilotVoice
            );

            GameController.events_recordNew(GAME_EVENTS.ARRIVAL);
            aircraftModel.setIsFlightStripRemovable();
            aircraftModel.setIsRemovable();
            this.aircraft_remove(aircraftModel);

            return;
        }

        if (aircraftModel.hit && aircraftModel.isOnGround()) {
            UiController.ui_log(`Lost radar contact with ${aircraftModel.callsign}`, true);
            aircraftModel.setIsFlightStripRemovable();
            aircraftModel.setIsRemovable();

            speech_say(
                [
                    { type: 'callsign', content: aircraftModel },
                    { type: 'text', content: ', radar contact lost' }
                ],
                aircraftModel.pilotVoice
            );
        }

        // Clean up the screen from aircraft that are too far
        if (!this.isAircraftVisible(aircraftModel, 2) && !aircraftModel.isControllable && aircraftModel.isRemovable) {
            this.aircraft_remove(aircraftModel);
        }
    }

    /**
     * Return a CID number, and remove it from the list of available CIDs
     *
     * @for AircraftController
     * @method _getAvailableCid
     * @return nextCid {number}
     * @private
     */
    _getAvailableCid() {
        const cid = this._availableCidNumbers.shift();

        if (typeof cid === 'undefined') {
            throw new TypeError('Attempted to retrieve a new CID, but all 1,000 CIDs are currently in use!');
        }

        return cid;
    }

    /**
     * Return the given CID number to the list of available CIDs
     *
     * @for AircraftController
     * @method _releaseCid
     * @param cid {number}
     * @private
     */
    _releaseCid(cid) {
        if (typeof cid !== 'string') {
            throw new TypeError(`Expected CID to be a string, but received type "${typeof cid}"`);
        }

        if (cid.length !== 3) {
            throw new TypeError(`Expected CID to be three characters, but received "${cid}"`);
        }

        if (_includes(this._availableCidNumbers, cid)) {
            throw new TypeError(`Attempted to return CID "${cid}" to #_availableCidNumbers, but it was already there!`);
        }

        this._availableCidNumbers.push(cid);
    }
}
