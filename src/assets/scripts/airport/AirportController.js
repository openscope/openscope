import _has from 'lodash/has';
import _forEach from 'lodash/forEach';
import Airport from './AirportModel';
import { AIRPORT_LOAD_LIST } from './airportLoadList';
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
     * @param updateRun {function}  
     */
    constructor(updateRun) {
        this.updateRun = updateRun;
        this.airport = airport;
        this.airport.airports = {};
        this.airport.current = null;
    }

    /**
     * Lifecycle method. Should run only once on App initialiazation
     *
     * @for AirportController
     * @method init_pre
     */
    init_pre() {
        prop.airport = airport;
        // prop.airport.airports = {};
        // prop.airport.current = null;
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
        _forEach(AIRPORT_LOAD_LIST, (airport) => {
            this.airport_load(airport);
        });
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
            _has(prop.airport.airports, localStorage[STORAGE_KEY.ATC_LAST_AIRPORT].toLowerCase())
        ) {
            airportName = localStorage[STORAGE_KEY.ATC_LAST_AIRPORT].toLowerCase();
        }

        this.airport_set(airportName);
    }

    /**
     * @for AirportController
     * @method airport_set
     */
    airport_set(icao) {
        if (!icao && _has(localStorage, STORAGE_KEY.ATC_LAST_AIRPORT)) {
            icao = localStorage[STORAGE_KEY.ATC_LAST_AIRPORT];
        }

        icao = icao.toLowerCase();

        if (!prop.airport.airports[icao]) {
            console.log(`${icao}: no such airport`);

            return;
        }

        if (prop.airport.current) {
            prop.airport.current.unset();
            window.aircraftController.aircraft_remove_all();
        }

        const newAirport = prop.airport.airports[icao];
        newAirport.set();
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

        if (_has(prop.airport.airports, icao)) {
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
            this.updateRun
        );

        this.airport_add(airport);

        return airport;
    }

    /**
     * @function airport_add
     * @param airport
     */
    airport_add(airport) {
        prop.airport.airports[airport.icao.toLowerCase()] = airport;
    }

    /**
     * @function airport_get
     * @param icao {string}
     * @return
     */
    airport_get(icao) {
        if (!icao) {
            return prop.airport.current;
        }

        return prop.airport.airports[icao.toLowerCase()];
    }
}
