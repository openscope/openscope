import _each from 'lodash/each';
import _get from 'lodash/get';
import _includes from 'lodash/includes';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _without from 'lodash/without';
import AircraftCollection from './AircraftCollection';
import AircraftInstanceModel from './AircraftInstanceModel';
import AircraftConflict from './AircraftConflict';
import AircraftModel from './AircraftModel';
import RouteModel from '../airport/Route/RouteModel';
import { airlineNameAndFleetHelper } from '../airline/airlineHelpers';
import { speech_say } from '../speech';
import { abs } from '../math/core';
import { distance2d } from '../math/distance';
import { vlen, vradial, vsub } from '../math/vector';
import { km, kn_ms, radiansToDegrees, degreesToRadians } from '../utilities/unitConverters';
import { calcTurnInitiationDistance } from '../math/flightMath';
import { tau } from '../math/circle';
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
            throw new TypeError('Invalid aircraftTypeDefinitionList passed to AircraftCollection. Expected and array but ' +
                `received ${typeof aircraftTypeDefinitionList}`);
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

        // TODO: rename to `AircraftTypeDefinitionCollection`
        /**
         * Reference to an `AircraftCollection` instance
         *
         * Provides definitions for all available aircraft types
         *
         * @property aircraftCollection
         * @type {AircraftCollection}
         */
        this.aircraftCollection = new AircraftCollection(
            aircraftTypeDefinitionList,
            this._airlineController.airlineCollection,
            this._navigationLibrary
        );

        this.aircraft = aircraft;
        // TODO: replace with aircraftCollection
        this.aircraft.models = {};
        // TODO: update refs to use aircraftCollection
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
     * @method createPreSpawnAircraftWithSpawnPatternModel
     * @param  spawnPatternModel {SpawnPatternModel}
     * @private
     */
    createPreSpawnAircraftWithSpawnPatternModel = (spawnPatternModel) => {
        for (let i = 0; i < spawnPatternModel.preSpawnAircraftList.length; i++) {
            const preSpawnHeadingAndPosition = spawnPatternModel.preSpawnAircraftList[i];
            const baseAircraftProps = this._buildAircraftProps(spawnPatternModel);
            const initializationProps = Object.assign({}, baseAircraftProps, preSpawnHeadingAndPosition);

            this._createAircraftWithInitializationProps(initializationProps);
        }
    };

    /**
     * Accept a pre-built object that can be used to create an `AircraftInstanceModel`
     * and then add it to the collection.
     *
     * This could be a spawnning aircraft or one that already exists along a route.
     *
     * @for AircraftController
     * @method _createAircraftWithInitializationProps
     * @param initializationProps {object}
     * @private
     */
    _createAircraftWithInitializationProps(initializationProps) {
        const aircraftModel = new AircraftInstanceModel(initializationProps);

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
     * Add a new `AircraftConflict` instance to the list of existing conflicts
     *
     * @for AircraftController
     * @method addConflict
     * @param  {Aircraft} aircraft      aircraft 1
     * @param  {Aircraft} otherAircraft aircraft 2
     */
    addConflict(aircraft, otherAircraft) {
        const conflict = new AircraftConflict(aircraft, otherAircraft);

        if (conflict.isDuplicate() || conflict.shouldBeRemoved()) {
            return;
        }

        this.conflicts.push(conflict);
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
            const d = distance2d(aircraft.position, position);

            if (d < distance && aircraft.isVisible() && !aircraft.hit) {
                distance = d;
                nearest = i;
            }
        }

        return [this.aircraft.list[nearest], distance];
    }

    // DEPRECATED
    // /**
    //  * @for AircraftController
    //  * @method aircraft_add
    //  * @param model {AircraftModel|object}
    //  */
    // aircraft_add(model) {
    //     this.aircraft.models[model.icao.toLowerCase()] = model;
    // }

    /**
     * @for AircraftController
     * @method aircraft_visible
     * @param aircraft
     * @param factor
     */
    aircraft_visible(aircraft, factor = 1) {
        return vlen(aircraft.position) < window.airportController.airport_get().ctr_radius * factor;
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
        // TODO: change to _forEach()
        for (let i = 0; i < this.aircraft.list.length; i++) {
            this.aircraft.list[i].update();
            this.aircraft.list[i].updateWarning();

            // TODO: move this InnerLoop thing to a function so we can get rid of the continue InnerLoop thing.
            for (let j = i + 1; j < this.aircraft.list.length; j++) {
                // TODO: need better names here. what is `that`?  what is `other`?
                const aircraft = this.aircraft.list[i];
                const otherAircraft = this.aircraft.list[j];

                if (aircraft.checkConflict(otherAircraft)) {
                    continue;
                }

                // Fast 2D bounding box check, there are no conflicts over 8nm apart (14.816km)
                // no violation can occur in this case.
                // Variation of:
                // http://gamedev.stackexchange.com/questions/586/what-is-the-fastest-way-to-work-out-2d-bounding-box-intersection
                const dx = abs(aircraft.position[0] - otherAircraft.position[0]);
                const dy = abs(aircraft.position[1] - otherAircraft.position[1]);
                const boundingBoxLength = km(8);

                if (dx < boundingBoxLength && dy < boundingBoxLength) {
                    this.addConflict(aircraft, otherAircraft);
                }
            }
        }

        for (let i = this.aircraft.list.length - 1; i >= 0; i--) {
            let remove = false;
            const aircraft = this.aircraft.list[i];
            // let is_visible = aircraft_visible(aircraft);

            if (aircraft.isStopped() && aircraft.category === 'arrival') {
                aircraft.scoreWind('landed');

                window.uiController.ui_log(`${aircraft.getCallsign()} switching to ground, good day`);
                speech_say([
                    { type: 'callsign', content: aircraft },
                    { type: 'text', content: ', switching to ground, good day' }
                ]);

                window.gameController.events_recordNew(GAME_EVENTS.ARRIVAL);
                remove = true;
            }

            if (aircraft.hit && aircraft.isOnGround()) {
                window.uiController.ui_log(`Lost radar contact with ${aircraft.getCallsign()}`);
                speech_say([
                    { type: 'callsign', content: aircraft },
                    { type: 'text', content: ', radar contact lost' }
                ]);

                remove = true;
            }

            // Clean up the screen from aircraft that are too far
            if (
                (!this.aircraft_visible(aircraft, 2) && !aircraft.inside_ctr) &&
                aircraft.fms.currentWaypoint.navmode === 'heading'
            ) {
                if (aircraft.category === 'arrival' || aircraft.category === 'departure') {
                    remove = true;
                }
            }

            if (remove) {
                this.aircraft_remove(aircraft);
                i -= 1;
            }
        }
    }

    /**
     * Calculate the turn initiation distance for an aircraft to navigate between two fixes.
     *
     * References:
     * - http://www.ohio.edu/people/uijtdeha/ee6900_fms_00_overview.pdf, Fly-by waypoint
     * - The Avionics Handbook, ch 15
     *
     * @for AircraftController
     * @method aircraft_turn_initiation_distance
     * @param aircraft {AircraftInstanceModel}
     * @param fix
     */
    aircraft_turn_initiation_distance(aircraft, fix) {
        // TODO: this function is ripe for refactor. there is a lot of inline logic that can be abstracted and/or pulled out
        const index = aircraft.fms.indexOfCurrentWaypoint().wp;
        if (index >= aircraft.fms.waypoints().length - 1) {
            // if there are no subsequent fixes, fly over 'fix'
            return 0;
        }

        // convert knots to m/s
        const speed = kn_ms(aircraft.speed);
        // assume nominal bank angle of 25 degrees for all aircraft
        const bank_angle = degreesToRadians(25);

        // TODO: is there a getNextWaypoint() function?
        const nextfix = aircraft.fms.waypoint(aircraft.fms.indexOfCurrentWaypoint().wp + 1).location;
        if (!nextfix) {
            return 0;
        }

        let nominal_new_course = vradial(vsub(nextfix, fix));
        if (nominal_new_course < 0) {
            // TODO: what is this doing? this should go in a new method.
            nominal_new_course += tau();
        }

        let current_heading = aircraft.heading;
        if (current_heading < 0) {
            current_heading += tau();
        }

        // TODO: move to function
        let course_change = abs(radiansToDegrees(current_heading) - radiansToDegrees(nominal_new_course));
        if (course_change > 180) {
            course_change = 360 - course_change;
        }

        course_change = degreesToRadians(course_change);
        // meters, bank establishment in 1s
        const turn_initiation_distance = calcTurnInitiationDistance(speed, bank_angle, course_change);

        return turn_initiation_distance / 1000; // convert m to km
    }

    /**
     * @for AircraftController
     * @method aircraft_get
     * @param eid
     */
    aircraft_get(eid = null) {
        if (eid === null) {
            return null;
        }

        // prevent out-of-range error
        if (this.aircraft.list.length > eid && eid >= 0) {
            return this.aircraft.list[eid];
        }

        return null;
    }

    /**
     * @for AircraftController
     * @method aircraft_get_by_callsign
     * @param callsign {string}
     */
    aircraft_get_by_callsign(callsign) {
        callsign = String(callsign);

        for (let i = 0; i < this.aircraft.list.length; i++) {
            if (this.aircraft.list[i].callsign === callsign.toLowerCase()) {
                return this.aircraft.list[i];
            }
        }

        return null;
    }

    /**
     * @DEPRECATED
     * @for AircraftController
     * @method aircraft_get_eid_by_callsign
     * @param callsign {string}
     */
    aircraft_get_eid_by_callsign(callsign) {
        console.error('.aircraft_get_eid_by_callsign() will be deprecated in the next release');
        for (let i = 0; i < this.aircraft.list.length; i++) {
            const aircraft = this.aircraft.list[i];

            if (aircraft.callsign === callsign.toLowerCase()) {
                return aircraft.eid;
            }
        }

        return null;
    }


    /**
     * @for AircraftController
     * @method aircraft_model_get
     * @param icao {string}
     */
    aircraft_model_get(icao) {
        console.error('DEPRECATED');

        if (!(this.aircraft.models[icao])) {
            const model = new AircraftModel({
                icao,
                url: `assets/aircraft/${icao}.json`
            });

            this.aircraft.models[icao] = model;
        }

        return this.aircraft.models[icao];
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
     * Remove any conflicts that involve the specified aircraft
     *
     * @for AircraftController
     * @method removeAllAircraftConflictsForAircraft
     * @param  {Aircraft} aircraft - the aircraft to remove
     */
    removeAllAircraftConflictsForAircraft(aircraft) {
        _each(this.conflicts, (conflict) => {
            if (_includes(conflict.aircraft, aircraft)) {
                this.removeConflict(conflict);
            }
        });
    }

    /**
     * Remove a flight number from the list stored in `AircraftController.aircraft.callsigns`
     * @for AircraftController
     * @method removeFlightNumberFromList
     * @param aircraft {AircraftInstanceModel}
     */
    removeFlightNumberFromList({ airline, callsign }) {
        this._airlineController.removeFlightNumberFromList(airline, callsign);
        // DEPRECATED
        // this.aircraft.callsigns = _without(this.aircraft.callsigns, callsign);
    }

    /**
     * Remove an `AircraftConflict` instance from the list of existing conflicts
     *
     * @for AircraftController
     * @method removeConflict
     * @param  {AircraftConflict} conflict - the conflict instance to remove
     */
    removeConflict(conflict) {
        conflict.aircraft[0].removeConflict(conflict.aircraft[1]);
        conflict.aircraft[1].removeConflict(conflict.aircraft[0]);

        this.conflicts = _without(this.conflicts, conflict);
    }

    // TODO: what is an `eid` and why would it beed to be updated?
    /**
     * Adjust all aircraft's eid values
     *
     * @for AircraftController
     * @method update_aircraft_eids
     */
    update_aircraft_eids() {
        for (let i = 0; i < this.aircraft.list.length; i++) {
            // update eid in aircraft
            this.aircraft.list[i].eid = i;
            // update eid in aircraft's fms
            this.aircraft.list[i].fms.my_aircrafts_eid = i;
        }
    }

    /**
     * Used to build up the appropriate data needed to instantiate an `AircraftInstanceModel`
     *
     * @for AircraftController
     * @method _buildAircraftProps
     * @param spawnModel {SpawnPatternModel}
     * @return {object}
     * @private
     */
    _buildAircraftProps(spawnModel) {
        const airlineId = spawnModel.getRandomAirlineForSpawn();
        const { name, fleet } = airlineNameAndFleetHelper([airlineId]);
        const airlineModel = this._airlineController.findAirlineById(name);
        // TODO: impove the `airlineModel` logic here
        // this seems inefficient to find the model here and then passit back to the controller but
        // since we already have it, it makes little sense to look for it again in the controller
        const flightNumber = this._airlineController.generateFlightNumberWithAirlineModel(airlineModel);
        const aircraftTypeDefinition = this._getRandomAircraftTypeDefinitionForAirlineId(airlineId, airlineModel);
        const destination = this._setDestinationFromRouteOrProcedure(spawnModel);

        return {
            destination,
            fleet,
            callsign: flightNumber,
            category: spawnModel.category,
            airline: airlineModel.icao,
            altitude: spawnModel.altitude,
            speed: spawnModel.speed,
            heading: spawnModel.heading,
            position: spawnModel.position,
            icao: aircraftTypeDefinition.icao,
            model: aircraftTypeDefinition,
            route: spawnModel.routeString,
            // TODO: this may not be needed anymore
            waypoints: _get(spawnModel, 'fixes', [])
        };
    }

    /**
     * Given an `airlineId`, find a random aircraft type from the airline.
     *
     * @for AircraftController
     * @method _getRandomAircraftTypeDefinitionForAirlineId
     * @param airlineId {string}
     * @param airlineModel {AirlineModel}
     * @return aircraftDefinition {AircraftDefinitionModel}
     * @private
     */
    _getRandomAircraftTypeDefinitionForAirlineId(airlineId, airlineModel) {
        return this.aircraftCollection.getAircraftDefinitionForAirlineId(airlineId, airlineModel);
    }

    /**
     * Determines if `destination` is defined and returns route procedure name if it is not
     *
     * The reason we set destination to a procedure names is because the `AircraftStripView`
     * uses this destination property for display. So for departures, who have no true
     * destination, the procedure name is used instead
     *
     * @for AircraftController
     * @method _setDestinationFromRouteOrProcedure
     * @param destination {string}
     * @param route {string}
     * @return {string}
     * @private
     */
    _setDestinationFromRouteOrProcedure({ destination, routeString }) {
        let destinationOrProcedure = destination;

        if (!destination) {
            const routeModel = new RouteModel(routeString);
            destinationOrProcedure = routeModel.procedure;
        }

        return destinationOrProcedure;
    }
}
