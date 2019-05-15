import _has from 'lodash/has';
import AirportModel from './AirportModel';
import EventBus from '../lib/EventBus';
import { EVENT } from '../constants/eventNames';
import { STORAGE_KEY } from '../constants/storageKeys';

/**
 * Responsible for maintaining references to all the available airports
 *
 * @class AirportController
 */
class AirportController {
    /**
     * @constructor
     */
    constructor() {
        /**
         * @property _eventBus
         * @type {EventBus}
         */
        this._eventBus = EventBus;

        /**
         * Local reference to `window.AIRPORT_LOAD_LIST`
         *
         * This is defined in `assets/airports/airportLoadList.js`
         * This property is the only way the possible list of airports
         * makes its way into the app.
         *
         * @property _airportListToLoad
         * @type {Array<object>}
         * @default []
         */
        this._airportListToLoad = [];

        /**
         * Dictionary of available airports
         *
         * @property airports
         * @type {Object<string, AirportModel>}
         * @default {}
         */
        this.airports = {};

        /**
         * The current airport
         *
         * This is a mutable property that will change based on
         * the currently selected airport
         *
         * @property current
         * @type {AirportModel}
         * @default null
         */
        this.current = null;
    }

    /**
     * Lifecycle method. Should run only once on App initialiazation
     *
     * Load each airport in the `airportLoadList`
     *
     * @for AirportController
     * @method init
     * @param InitialAirportIcao {string}
     * @param initialAirportData {object}
     * @param airportLoadList {array<object>}  List of airports to load
     */
    init(initialAirportIcao, initialAirportData, airportLoadList) {
        this._airportListToLoad = airportLoadList;

        for (let i = 0; i < this._airportListToLoad.length; i++) {
            const airport = this._airportListToLoad[i];

            this.airport_load(airport);
        }

        this.airport_set(initialAirportIcao, initialAirportData);
    }

    /**
     * Create a new `AirportModel` flyweight
     *
     * This will create a minimal `AirportModel` with just enough data to
     * create a valid instance. When switching airports, this model will
     * be filled in with the rest of the airport data if it does
     * not exist already
     *
     * @for AirportController
     * @method airport_load
     * @param icao {string}
     * @param level {string}
     * @param name {string}
     */
    airport_load({ icao, level, name }) {
        icao = icao.toLowerCase();

        if (this.hasAirport(icao)) {
            console.log(`${icao}: already loaded`);

            return null;
        }

        const airportModel = new AirportModel({ icao, level, name });

        this.airport_add(airportModel);
    }

    /**
     * Add an airport config to the `#airports` dictionary
     *
     * @for AirportController
     * @method airport_add
     * @param airport {object}
     */
    airport_add(airport) {
        this.airports[airport.icao] = airport;
    }

    /**
     * Reset the instance
     *
     * Placeholder method, currently not in use
     *
     * @for AircraftController
     * @method reset
     */
    reset() {
        this._eventBus = EventBus;
        this._airportListToLoad = [];
        this.airports = {};
        this.current = null;
    }

    /**
     * Set a given `icao` as the `#current` airport
     *
     * @for AirportController
     * @method airport_set
     * @param icao {string}
     * @param airportJson {object} [default=null]
     */
    airport_set(icao, airportJson = null) {
        if (this.hasStoredIcao(icao)) {
            icao = localStorage[STORAGE_KEY.ATC_LAST_AIRPORT];
        }

        icao = icao.toLowerCase();

        if (!this.airports[icao]) {
            console.warn(`${icao}: no such airport`);

            return;
        }

        const nextAirportModel = this.airports[icao];
        this.current = nextAirportModel;

        // if loaded is true, we wont need to load any data thus the call to `onAirportChange` within the
        // success callback will never fire so we do that here.
        if (nextAirportModel.loaded) {
            this._eventBus.trigger(EVENT.AIRPORT_CHANGE, nextAirportModel.data);
        }

        nextAirportModel.set(airportJson);
    }

    /**
     * @for AirportController
     * @method getAiracCycle
     * @property airac
     * @return {number}
    */
    getAiracCycle() {
        return this.current.airac;
    }

    /**
     * Retrieve a specific `AirportModel` instance
     *
     * @for AirportController
     * @method airport_get
     * @param icao {string}
     * @return {AirportModel}
     */
    airport_get(icao) {
        if (!icao) {
            return this.current;
        }

        return this.airports[icao.toLowerCase()];
    }

    /**
     * Return the name of the `arrivalRunwayModel`.
     *
     * This should be used only in the `SpawnPatternModel` when determining initial
     * heading for arrival aircraft. We only need the name so we can properly select
     * an exit segment of a STAR.
     *
     * Sometimes route definitions do not contain enough waypoints in the entry and body
     * segments. This gives us a way to guess the runway and grab an exit segment.
     *
     * @for AirportController
     * @method getInitialArrivalRunwayName
     * @return {string}
     */
    getInitialArrivalRunwayName() {
        return this.current.arrivalRunwayModel.name;
    }

    /**
     * Boolean helper used to determine if a given `icao` exists within `localStorage`
     *
     * @for AirportController
     * @method hasStoredIcao
     * @param icao {string}
     * @return {boolean}
     */
    hasStoredIcao(icao) {
        return !icao && _has(localStorage, STORAGE_KEY.ATC_LAST_AIRPORT);
    }

    /**
     * Boolean helper used to determine if a given `icao` exists within `#airports`
     *
     * @for AirportController
     * @method hasAirport
     * @param icao {string}
     * @return {boolean}
     */
    hasAirport(icao) {
        return _has(this.airports, icao);
    }

    /**
     * Remove an aircraft from the queue of any `AirportModel` `RunwayModel`(s)
     *
     * @for AirportModel
     * @method removeAircraftFromAllRunwayQueues
     * @param  aircraft {AircraftModel}
     */
    removeAircraftFromAllRunwayQueues(aircraft) {
        this.current.removeAircraftFromAllRunwayQueues(aircraft.id);
    }
}

export default new AirportController();
