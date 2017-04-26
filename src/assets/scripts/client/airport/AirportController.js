import _has from 'lodash/has';
import _lowerCase from 'lodash/lowerCase';
import Airport from './AirportModel';
import { STORAGE_KEY } from '../constants/storageKeys';

// Temporary const declaration here to attach to the window AND use as internal property
const airport = {};

/**
 * @property DEFAULT_AIRPORT_ICAO
 * @type {string}
 * @final
 */
const DEFAULT_AIRPORT_ICAO = 'ksfo';

/**
 * @class AirportController
 */
export default class AirportController {
    /**
     * @constructor
     * @param initialAirportData {object}
     * @param airportLoadList {array<object>}  List of airports to load
     * @param updateRun {function}
     * @param onAirportChange {function} callback to fire when an airport changes
     */
    constructor(initialAirportData, airportLoadList, updateRun, onAirportChange) {
        this.updateRun = updateRun;
        this.onAirportChange = onAirportChange;

        this.airport = airport;
        this.airport.airports = {};
        this.airport.current = null;
        this._airportListToLoad = airportLoadList;
        // eslint-disable-next-line no-undef
        prop.airport = airport;
        return this.init()
                   .ready(initialAirportData);
    }

    /**
     * Provides access to the current airport, if set.
     *
     * This should only ever return null on initial load,
     * before the current airport has been set.
     *
     * @property current
     * @return {AirportModel|null}
     */
    get current() {
        return this.airport.current;
    }

    /**
     * Lifecycle method. Should run only once on App initialiazation
     *
     * Load each airport in the `airportLoadList`
     *
     * @for AirportController
     * @method init
     * @chainable
     */
    init() {
        for (let i = 0; i < this._airportListToLoad.length; i++) {
            const airport = this._airportListToLoad[i];

            this.airport_load(airport);
        }

        return this;
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
            _has(this.airport.airports, _lowerCase(localStorage[STORAGE_KEY.ATC_LAST_AIRPORT]))
        ) {
            airportName = _lowerCase(localStorage[STORAGE_KEY.ATC_LAST_AIRPORT]);
        }

        if (airportName !== initialAirportData.icao.toLowerCase()) {
            this.airport_set(airportName);
        }

        this.airport_set(airportName, initialAirportData);

        return this;
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

        // create a new Airport with a reference to this.updateRun()
        const airport = new Airport(
            {
                icao,
                level,
                name,
                wip
            },
            this.updateRun,
            this.onAirportChange
        );

        this.airport_add(airport);

        return airport;
    }

    /**
     * @function airport_add
     * @param airport
     */
    airport_add(airport) {
        this.airport.airports[airport.icao] = airport;
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

        if (!this.airport.airports[icao]) {
            console.log(`${icao}: no such airport`);

            return;
        }

        const nextAirportModel = this.airport.airports[icao];
        this.airport.current = nextAirportModel;

        // if loaded is true, we wont need to load any data thus the call to `onAirportChange` within the
        // success callback will never fire so we do that here.
        if (nextAirportModel.loaded) {
            this.onAirportChange(nextAirportModel.data);
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
            return this.airport.current;
        }

        return this.airport.airports[icao.toLowerCase()];
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
        return _has(this.airport.airports, icao);
    }

    /**
     * Remove an aircraft from the queue of any runway(s) at the AirportModel
     * @for AirportModel
     * @method removeAircraftFromAllRunwayQueues
     * @param  aircraft {AircraftInstanceModel}
     */
    removeAircraftFromAllRunwayQueues(aircraft) {
        this.airport.current.removeAircraftFromAllRunwayQueues(aircraft.id);
    }
}
