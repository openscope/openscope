/* eslint-disable no-continue */
import _find from 'lodash/find';
import _get from 'lodash/get';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _without from 'lodash/without';
import AircraftTypeDefinitionCollection from './AircraftTypeDefinitionCollection';
import AircraftInstanceModel from './AircraftInstanceModel';
import AircraftConflict from './AircraftConflict';
import RouteModel from '../navigationLibrary/Route/RouteModel';
import { airlineNameAndFleetHelper } from '../airline/airlineHelpers';
import { convertStaticPositionToDynamic } from '../base/staticPositionToDynamicPositionHelper';
import { speech_say } from '../speech';
import { abs } from '../math/core';
import { distance2d } from '../math/distance';
import { vlen } from '../math/vector';
import { km } from '../utilities/unitConverters';
import { FLIGHT_CATEGORY } from '../constants/aircraftConstants';
import { GAME_EVENTS } from '../game/GameController';

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
     * @param navigationLibrary {NavigationLibrary}
     */
    constructor(aircraftTypeDefinitionList, airlineController, navigationLibrary) {
        if (!_isArray(aircraftTypeDefinitionList) || _isEmpty(aircraftTypeDefinitionList)) {
            // eslint-disable-next-line max-len
            throw new TypeError('Invalid aircraftTypeDefinitionList passed to AircraftTypeDefinitionCollection. ' +
                `Expected and array but received ${typeof aircraftTypeDefinitionList}`);
        }

        // TODO: this may need to use instanceof instead, but that may be overly defensive
        if (!_isObject(airlineController) || !_isObject(navigationLibrary)) {
            throw new TypeError('Invalid parameters. Expected airlineCollection and navigationLibrary to be defined');
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
         * Reference to a `NavigationLibrary` instance
         *
         * @property _navigationLibrary
         * @type NavigationLibrary
         * @default navigationLibrary
         * @private
         */
        this._navigationLibrary = navigationLibrary;

        /**
         * Reference to an `AircraftTypeDefinitionCollection` instance
         *
         * Provides definitions for all available aircraft types
         *
         * @property AircraftTypeDefinitionCollection
         * @type {AircraftTypeDefinitionCollection}
         */
        this.aircraftTypeDefinitionCollection = new AircraftTypeDefinitionCollection(aircraftTypeDefinitionList);

        this.aircraft = aircraft;

        // TODO: this should its own collection class
        this.aircraft.list = [];

        this.aircraft.auto = { enabled: false };

        this.conflicts = [];

        prop.aircraft = aircraft;
    }

    /**
     * Adds an `AircraftInstanceModel` to the collection
     *
     * @for AircraftController
     * @method addItem
     * @param item {AircraftInstanceModel}
     */
    addItem(item) {
        this.aircraft.list.push(item);
    }

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
     * Accept a pre-built object that can be used to create an `AircraftInstanceModel`
     * and then add it to the collection.
     *
     * This could be a spawning aircraft or one that already exists along a route.
     *
     * This method is the *_single place_* to create a new `AircraftInstanceModel`.
     * Any method that needs to create a new aircraft should be routed through here.
     *
     * @for AircraftController
     * @method _createAircraftWithInitializationProps
     * @param initializationProps {object}
     * @private
     */
    _createAircraftWithInitializationProps(initializationProps) {
        const aircraftModel = new AircraftInstanceModel(initializationProps, this._navigationLibrary);

        this.addItem(aircraftModel);
    }

    /**
     * @for AircraftController
     * @method aircraft_auto_toggle
     */
    aircraft_auto_toggle() {
        this.aircraft.auto.enabled = !this.aircraft.auto.enabled;
    }

    /**
     * @for AircraftController
     * @method aircraft_get_nearest
     * @param position
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
     * @for AircraftController
     * @method aircraft_visible
     * @param aircraft
     * @param factor
     */
    aircraft_visible(aircraft, factor = 1) {
        return vlen(aircraft.relativePosition) < window.airportController.airport_get().ctr_radius * factor;
    }

    /**
     * @for AircraftController
     * @method aircraft_remove_all
     */
    aircraft_remove_all() {
        for (let i = 0; i < this.aircraft.list.length; i++) {
            this.aircraft.list[i].cleanup();
        }

        this.aircraft.list = [];
    }

    /**
     * @for AircraftController
     * @method aircraft_remove
     */
    aircraft_remove(aircraft) {
        window.airportController.removeAircraftFromAllRunwayQueues(aircraft);

        this.removeFlightNumberFromList(aircraft);
        this.removeAircraftInstanceModelFromList(aircraft);
        this.removeAllAircraftConflictsForAircraft(aircraft);

        aircraft.cleanup();
    }

    /**
     * @for AircraftController
     * @method aircraft_update
     */
    aircraft_update() {
        for (let i = 0; i < this.aircraft.list.length; i++) {
            const aircraft = this.aircraft.list[i];
            aircraft.update();
            aircraft.updateWarning();

            if (aircraft.isTaxiing()) {
                continue;
            }

            // TODO: this section eats up a lot of resources when there are more than 30 aircraft and we
            //       don't check for taxiing aircraft
            for (let j = i + 1; j < this.aircraft.list.length; j++) {
                const otherAircraft = this.aircraft.list[j];

                if (aircraft.checkConflict(otherAircraft) || otherAircraft.isTaxiing()) {
                    continue;
                }

                // Fast 2D bounding box check, there are no conflicts over 8nm apart (14.816km)
                // no violation can occur in this case.
                // Variation of:
                // http://gamedev.stackexchange.com/questions/586/what-is-the-fastest-way-to-work-out-2d-bounding-box-intersection
                const dx = abs(aircraft.relativePosition[0] - otherAircraft.relativePosition[0]);
                const dy = abs(aircraft.relativePosition[1] - otherAircraft.relativePosition[1]);
                const boundingBoxLength = km(8);

                if (dx < boundingBoxLength && dy < boundingBoxLength) {
                    this.addConflict(aircraft, otherAircraft);
                }
            }
        }

        for (let i = this.aircraft.list.length - 1; i >= 0; i--) {
            const aircraft = this.aircraft.list[i];

            // TODO: these next 3 logic blocks could use some cleaning/abstraction
            if (aircraft.category === FLIGHT_CATEGORY.ARRIVAL && aircraft.isStopped()) {
                // TODO: move this to the GAME_EVENTS constant
                // TODO: move this out of the aircraft model
                aircraft.scoreWind('landed');

                window.uiController.ui_log(`${aircraft.callsign} switching to ground, good day`);
                speech_say([
                    { type: 'callsign', content: aircraft },
                    { type: 'text', content: ', switching to ground, good day' }
                ]);

                window.gameController.events_recordNew(GAME_EVENTS.ARRIVAL);
                aircraft.setIsRemovable();
                this.aircraft_remove(aircraft);

                continue;
            }

            if (aircraft.hit && aircraft.isOnGround()) {
                window.uiController.ui_log(`Lost radar contact with ${aircraft.callsign}`);
                aircraft.setIsRemovable();

                speech_say([
                    { type: 'callsign', content: aircraft },
                    { type: 'text', content: ', radar contact lost' }
                ]);
            }

            // Clean up the screen from aircraft that are too far
            if (!this.aircraft_visible(aircraft, 2) && !aircraft.inside_ctr && aircraft.isRemovable) {
                this.aircraft_remove(aircraft);
                i -= 1;
            }
        }
    }

    /**
     * @method debug
     * @param  {string} [callsign='']
     * @return {AircraftInstanceModel|null}
     */
    debug(callsign = '') {
        return this._findAircraftByCallsign(callsign);
    }

    /**
     * @method _findAircraftByCallsign
     * @param  {string} [callsign='']
     * @return {AircraftInstanceModel|null}
     * @private
     */
    _findAircraftByCallsign(callsign = '') {
        if (callsign === '') {
            return null;
        }

        return _find(this.aircraft.list, (aircraft) => aircraft.callsign.toLowerCase() === callsign.toLowerCase());
    }

    /**
     * Remove the specified aircraft from `AircraftController.aircraft`
     *
     * @for AircraftController
     * @method removeAircraftInstanceModelFromList
     * @param  {Aircraft} aircraft the aircraft to remove
     */
    removeAircraftInstanceModelFromList(aircraft) {
        this.aircraft.list = _without(this.aircraft.list, aircraft);
    }

    /**
     * Add a new `AircraftConflict` instance to the list of existing conflicts
     *
     * @for AircraftController
     * @method addConflict
     * @param  {Aircraft} aircraft      aircraft 1
     * @param  {Aircraft} otherAircraft aircraft 2
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
     * Remove an `AircraftConflict` instance from the list of existing conflicts
     *
     * @for AircraftController
     * @method removeConflict
     * @param  conflict {AircraftConflict} the conflict instance to remove
     */
    removeConflict(conflict) {
        conflict.aircraft[0].removeConflict(conflict.aircraft[1]);
        conflict.aircraft[1].removeConflict(conflict.aircraft[0]);

        this.conflicts = _without(this.conflicts, conflict);
    }

    /**
     * Remove any conflicts that involve the specified aircraft
     *
     * @for AircraftController
     * @method removeAllAircraftConflictsForAircraft
     * @param  {Aircraft} aircraft - the aircraft to remove
     */
    removeAllAircraftConflictsForAircraft(aircraft) {
        for (const otherAircraftCallsign in aircraft.conflicts) {
            aircraft.conflicts[otherAircraftCallsign].destroy();
        }
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
     * Used to build up the appropriate data needed to instantiate an `AircraftInstanceModel`
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
        const altitude = isPreSpawn && spawnPatternModel.category === FLIGHT_CATEGORY.ARRIVAL
            ? 18000
            : spawnPatternModel.altitude;
        const dynamicPositionModel = convertStaticPositionToDynamic(spawnPatternModel.positionModel);

        return {
            fleet,
            altitude,
            destination: spawnPatternModel.destination,
            callsign: flightNumber,
            category: spawnPatternModel.category,
            airline: airlineModel.icao,
            airlineCallsign: airlineModel.radioName,
            speed: spawnPatternModel.speed,
            heading: spawnPatternModel.heading,
            positionModel: dynamicPositionModel,
            icao: aircraftTypeDefinition.icao,
            model: aircraftTypeDefinition,
            route: spawnPatternModel.routeString,
            // TODO: this may not be needed anymore
            waypoints: _get(spawnPatternModel, 'waypoints', [])
        };
    }

    /**
     * Given an `airlineId`, find a random aircraft type from the airline.
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
}
