import _has from 'lodash/has';
import _lowerCase from 'lodash/lowerCase';
import Airport from './AirportModel';
import EventBus from '../lib/EventBus';
import { EVENT } from '../constants/eventNames';
import { STORAGE_KEY } from '../constants/storageKeys';

/**
 * @property DEFAULT_AIRPORT_ICAO
 * @type {string}
 * @final
 */
const DEFAULT_AIRPORT_ICAO = 'ksfo';

/**
 * @class AirportController
 */
class AirportController {
    /**
     * @constructor
     * @param initialAirportData {object}
     * @param airportLoadList {array<object>}  List of airports to load
     */
    constructor() {
        this.eventBus = EventBus;

        this._airportListToLoad = [];
        this.airports = {};
        this.current = null;
        // eslint-disable-next-line no-undef
    }

    /**
     * Lifecycle method. Should run only once on App initialiazation
     *
     * Load each airport in the `airportLoadList`
     *
     * @for AirportController
     * @method init
     * @param initialAirportData {object}
     * @param airportLoadList {array<object>}  List of airports to load
     */
    init(initialAirportData, airportLoadList) {
        this._airportListToLoad = airportLoadList;

        for (let i = 0; i < this._airportListToLoad.length; i++) {
            const airport = this._airportListToLoad[i];

            this.airport_load(airport);
        }

        this.ready(initialAirportData);
    }

    /**
    * @function airport_load
    * @param icao {string}
    * @param level {string}
    * @param name {string}
    * @param wip {boolean}
    * @return airport {AirtportInstance}
    */
    airport_load({ icao, level, name, wip }) {
        icao = icao.toLowerCase();

        if (this.hasAirport()) {
            console.log(`${icao}: already loaded`);

            return null;
        }

        const airport = new Airport({ icao, level, name, wip });

        this.airport_add(airport);

        return airport;
    }

    /**
    * @function airport_add
    * @param airport
    */
    airport_add(airport) {
        this.airports[airport.icao] = airport;
    }

    /**
     * Lifecycle method. Should run only once on App initialiazation
     *
     * @for AirportController
     * @method ready
     * @chainable
     */
    ready(initialAirportData) {
        let airportName = DEFAULT_AIRPORT_ICAO;

        if (
            _has(localStorage, STORAGE_KEY.ATC_LAST_AIRPORT) ||
            _has(this.airports, _lowerCase(localStorage[STORAGE_KEY.ATC_LAST_AIRPORT]))
        ) {
            airportName = _lowerCase(localStorage[STORAGE_KEY.ATC_LAST_AIRPORT]);
        }

        if (airportName !== initialAirportData.icao.toLowerCase()) {
            this.airport_set(airportName);
        }

        this.airport_set(airportName, initialAirportData);
    }

    /**
    *
    *
    * @for AircraftController
    * @method reset
    */
    reset() {
        return;
    }


    /**
     * @for AirportController
     * @method airport_set
     */
    airport_set(icao, airportJson = null) {
        if (this.hasStoredIcao(icao)) {
            icao = localStorage[STORAGE_KEY.ATC_LAST_AIRPORT];
        }

        icao = icao.toLowerCase();

        if (!this.airports[icao]) {
            console.log(`${icao}: no such airport`);

            return;
        }

        const nextAirportModel = this.airports[icao];
        this.current = nextAirportModel;

        // if loaded is true, we wont need to load any data thus the call to `onAirportChange` within the
        // success callback will never fire so we do that here.
        if (nextAirportModel.loaded) {
            this.eventBus.trigger(EVENT.AIRPORT_CHANGE, nextAirportModel.data);
        }

        nextAirportModel.set(airportJson);
    }
    /**
     * @function airport_get
     * @param icao {string}
     * @return
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
     * @method hasStoredIcao
     * @return {boolean}
     */
    hasStoredIcao(icao) {
        return !icao && _has(localStorage, STORAGE_KEY.ATC_LAST_AIRPORT);
    }

    /**
     * @method hasAirport
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
