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
     * @param airportLoadList {array<object>}  List of airports to load
     * @param updateRun {function}
     * @param onAirportChange {function} callback to fire when an airport changes
     */
    constructor(airportLoadList, updateRun, onAirportChange) {
        this.updateRun = updateRun;
        this.onAirportChange = onAirportChange;

        this.airport = airport;
        this.airport.airports = {};
        this.airport.current = null;
        this.airlineController = null;
        this.aircraftController = null;
        this._airportListToLoad = airportLoadList;
        prop.airport = airport;
    }

    /**
     * Lifecycle method. Should run only once on App initialiazation
     *
     * Load each airport in the `airportLoadList`
     *
     * @for AirportController
     * @method init
     */
    init() {
        for (let i = 0; i < this._airportListToLoad.length; i++) {
            const airport = this._airportListToLoad[i];

            this.airport_load(airport);
        }
    }

    /**
     * Lifecycle method. Should run only once on App initialiazation
     *
     * @for AirportController
     * @method ready
     */
    ready() {
        let airportName = DEFAULT_AIRPORT_ICAO;

        if (_has(localStorage, STORAGE_KEY.ATC_LAST_AIRPORT) ||
            _has(this.airport.airports, _lowerCase(localStorage[STORAGE_KEY.ATC_LAST_AIRPORT]))
        ) {
            airportName = _lowerCase(localStorage[STORAGE_KEY.ATC_LAST_AIRPORT]);
        }

        this.airport_set(airportName);
    }

    /**
     * @function airport_load
     * @param icao {string}
     * @param level {string}
     * @param name {string}
     * @return airport {AirtportInstance}
     */
    airport_load({ icao, level, name }) {
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
                name
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
    airport_set(icao) {
        if (this.hasStoredIcao(icao)) {
            icao = localStorage[STORAGE_KEY.ATC_LAST_AIRPORT];
        }

        icao = icao.toLowerCase();

        if (!this.airport.airports[icao]) {
            console.log(`${icao}: no such airport`);

            return;
        }

        if (this.airport.current) {
            this.airport.current.unset();
            this.aircraftController.aircraft_remove_all();
        }

        const nextAirportModel = this.airport.airports[icao];

        // if lodaed is true, we wont need to load any data thus the call to `onAirportChange` within the
        // success callback will never fire so we do that here.
        if (nextAirportModel.loaded) {
            this.onAirportChange(nextAirportModel.data);
        }

        nextAirportModel.set();
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
     * @param  {aircraft} aircraft The aircraft to remove
     */
    removeAircraftFromAllRunwayQueues(aircraft) {
        const runwayPrimaryEndIndex = 0;
        const runwaySecondaryEndIndex = 1;
        const runways = this.airport_get().runways;
        for (let runwayPair = 0; runwayPair < runways.length; runwayPair++) {
            runways[runwayPair][runwayPrimaryEndIndex].removeQueue(aircraft, true);
            runways[runwayPair][runwaySecondaryEndIndex].removeQueue(aircraft, true);
        }
    }

}
